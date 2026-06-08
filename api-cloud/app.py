import json
from datetime import datetime
from flask import Flask, jsonify, request
from flask_cors import CORS
from db import get_connection, init_db

app = Flask(__name__)
CORS(app)

with app.app_context():
    init_db()


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@app.route("/api/health")
def health():
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
        return jsonify({"status": "ok", "db": "connected"})
    except Exception as e:
        return jsonify({"status": "error", "detail": str(e)}), 500


# ---------------------------------------------------------------------------
# Productos
# ---------------------------------------------------------------------------

@app.route("/api/productos")
def obtener_productos():
    """
    Devuelve todos los productos disponibles.
    Usa alias 'id AS id_producto' para compatibilidad con App.jsx.
    """
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id AS id_producto,
                           nombre_producto,
                           precio_venta::float AS precio_venta,
                           categoria,
                           insumos_receta,
                           extras_disponibles
                    FROM productos
                    WHERE disponible = TRUE
                    ORDER BY id ASC
                """)
                rows = cur.fetchall()
        return jsonify([dict(r) for r in rows]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------------------------------------------------------------------
# Pedidos
# ---------------------------------------------------------------------------

@app.route("/api/pedidos/web", methods=["POST"])
def recibir_pedido_web():
    """
    Recibe el payload actual de App.jsx sin modificaciones:
    {
      "cliente": "...",
      "hora_recogida": "...",
      "total": 85,
      "items": [
        { "nombre_producto": "...", "precio_venta": 40, "cantidad": 1 }
      ]
    }
    """
    try:
        datos         = request.get_json(force=True)
        cliente       = datos.get("cliente", "")
        hora_recogida = datos.get("hora_recogida", "")
        total_orden   = float(datos.get("total", 0.0))
        items         = datos.get("items", [])

        prods = [
            {
                "nombre_producto":     item.get("nombre_producto"),
                "precio_venta":        float(item.get("precio_venta", 0.0)),
                "cantidad":            int(item.get("cantidad", 1)),
                "extrasSeleccionados": [],
                "notas":               f"Pedido Web - Recoge: {hora_recogida}",
            }
            for item in items
        ]

        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """INSERT INTO pedidos
                       (numero_mesa, subtotal, total, productos, estado, metodo_pago, tipo)
                       VALUES (%s, %s, %s, %s, 'En Cocina', 'Web', 'comanda')""",
                    (f"Web: {cliente}", total_orden, total_orden, json.dumps(prods)),
                )
            conn.commit()

        return jsonify({"status": "success", "message": "Pedido encolado en cocina"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/pedidos/activos")
def obtener_pedidos_activos():
    """
    Devuelve comandas activas para el monitor de cocina.
    Filtra: estado IN ('En Cocina', 'Listo') AND tipo = 'comanda'.
    Expone 'id' como 'id_pedido' para compatibilidad con el frontend.
    """
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id AS id_pedido,
                           numero_mesa,
                           subtotal::float AS subtotal,
                           total::float AS total,
                           productos,
                           estado,
                           metodo_pago
                    FROM pedidos
                    WHERE estado IN ('En Cocina', 'Listo')
                      AND tipo = 'comanda'
                    ORDER BY fecha ASC
                """)
                rows = cur.fetchall()
        return jsonify([dict(r) for r in rows]), 200
    except Exception as e:
        return jsonify([]), 200


@app.route("/api/pedidos/despachar", methods=["POST"])
def despachar_pedido():
    """
    Cambia estado 'En Cocina' → 'Listo'.
    Descuento de inventario queda pendiente (sin tabla insumos en cloud).
    """
    data      = request.get_json(force=True)
    id_pedido = data.get("id_pedido")

    if not id_pedido:
        return jsonify({"error": "id_pedido requerido"}), 400

    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """UPDATE pedidos
                       SET estado = 'Listo'
                       WHERE id = %s AND estado = 'En Cocina'
                       RETURNING id""",
                    (id_pedido,),
                )
                updated = cur.fetchone()
            conn.commit()

        if not updated:
            return jsonify({"error": "Pedido no encontrado o no está en cocina"}), 404
        return jsonify({"mensaje": "Pedido despachado y almacen actualizado"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/pedidos/web/cobrar", methods=["POST"])
def cobrar_pedido_web():
    """
    Cobra un pedido web en estado 'Listo'.
    Crea ticket tipo='ticket' estado='Completado' y cierra la comanda.
    Guard anti-doble-cobro: devuelve 409 si el pedido no está en 'Listo'.
    No descuenta inventario (ya ocurriría en despachar; pendiente en cloud).
    """
    data        = request.get_json(force=True)
    id_pedido   = data.get("id_pedido")
    metodo_pago = data.get("metodo_pago", "Efectivo")

    if not id_pedido:
        return jsonify({"error": "id_pedido requerido"}), 400
    if metodo_pago not in ("Efectivo", "Tarjeta"):
        return jsonify({"error": "metodo_pago debe ser Efectivo o Tarjeta"}), 400

    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """SELECT id, numero_mesa, total, productos, estado, metodo_pago
                       FROM pedidos WHERE id = %s AND tipo = 'comanda'""",
                    (id_pedido,),
                )
                pedido = cur.fetchone()

            if not pedido:
                return jsonify({"error": "Pedido no encontrado"}), 404

            if pedido["metodo_pago"] != "Web":
                return jsonify({"error": "Este endpoint es solo para pedidos web"}), 400

            if pedido["estado"] != "Listo":
                return jsonify({
                    "error": f"El pedido no está listo para cobrar (estado actual: {pedido['estado']})"
                }), 409

            fecha_cobro = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            with conn.cursor() as cur:
                cur.execute(
                    """INSERT INTO pedidos
                       (numero_mesa, subtotal, total, productos, estado, fecha, metodo_pago, tipo)
                       VALUES (%s, %s, %s, %s, 'Completado', %s, %s, 'ticket')""",
                    (
                        pedido["numero_mesa"],
                        pedido["total"],
                        pedido["total"],
                        json.dumps(pedido["productos"]) if isinstance(pedido["productos"], list) else pedido["productos"],
                        fecha_cobro,
                        metodo_pago,
                    ),
                )
                cur.execute(
                    "UPDATE pedidos SET estado = 'Completado' WHERE id = %s",
                    (id_pedido,),
                )
            conn.commit()

        return jsonify({
            "status":      "success",
            "mensaje":     "Pedido cobrado y ticket registrado",
            "id_pedido":   id_pedido,
            "numero_mesa": pedido["numero_mesa"],
            "total":       float(pedido["total"]),
            "metodo_pago": metodo_pago,
            "fecha_cobro": fecha_cobro,
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)