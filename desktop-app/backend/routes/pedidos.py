"""
routes/pedidos.py
=================
CORRECCIONES:
  - Tabla pedidos: PK real es 'id'. SELECT usa 'id AS id_pedido'.
  - Descuento fraccional exacto: _parsear_receta devuelve cantidad decimal
    y el UPDATE resta 'cantidad_receta * cantidad_vendida' con REAL.
  - _procesar_extras: jerarquia de 3 niveles; descuenta la fraccion exacta
    configurada (no un entero fijo).
  - Tabla insumos: WHERE usa 'id = ?' (no 'id_insumo = ?').
  - metodo_pago se guarda en pedidos desde el body de la peticion.
"""

import ast
import json
from datetime import datetime
from flask import Blueprint, jsonify, request
from database import get_db_connection

pedidos_bp = Blueprint('pedidos', __name__)


# ============================================================
# HELPERS: parseo de receta y descuento de extras
# ============================================================

def _parsear_receta(receta_str):
    """
    Formato legacy: [1, 2, 3] -> [{'id_insumo': 1, 'cantidad': 1}, ...]
    Formato nuevo:  [{'id_insumo': 1, 'cantidad': 0.250, 'unidad': 'ML'}, ...]
    Siempre devuelve lista de dicts con id_insumo y cantidad decimal.
    """
    if not receta_str:
        return []
    try:
        parsed = json.loads(receta_str)
    except Exception:
        try:
            parsed = ast.literal_eval(receta_str)
        except Exception:
            return []
    if not parsed or not isinstance(parsed, list):
        return []
    if isinstance(parsed[0], dict):
        return parsed
    return [{'id_insumo': id_in, 'cantidad': 1} for id_in in parsed]


def _cargar_extras_config(cursor, nombre_producto):
    """Lee extras_disponibles del producto para buscar fracciones configuradas."""
    cursor.execute(
        "SELECT extras_disponibles FROM productos WHERE nombre_producto = ?;",
        (nombre_producto,),
    )
    row = cursor.fetchone()
    if not row or not row['extras_disponibles']:
        return []
    try:
        parsed = json.loads(row['extras_disponibles'])
        if isinstance(parsed, list) and parsed and isinstance(parsed[0], dict):
            return parsed
    except Exception:
        pass
    return []


def _descontar_por_nombre(cursor, nombre_extra):
    """Fallback LIKE: descuenta 1 unidad. Tabla insumos usa 'id'."""
    if not nombre_extra:
        return False
    cursor.execute(
        "SELECT id FROM insumos WHERE LOWER(nombre_insumo) LIKE LOWER(?) LIMIT 1;",
        (f"%{nombre_extra}%",),
    )
    row = cursor.fetchone()
    if row:
        cursor.execute(
            "UPDATE insumos SET cantidad_actual = MAX(0, cantidad_actual - 1) "
            "WHERE id = ?;",
            (row['id'],),
        )
        return True
    return False


def _procesar_extras(cursor, extras_lista, extras_config):
    """
    Jerarquia de descuento para extrasSeleccionados:
      1. El extra trae id_insumo + cantidad_descuento directamente.
      2. El nombre coincide en extras_config del producto.
      3. Fallback LIKE en tabla insumos (1 unidad).
    """
    for extra in extras_lista:
        nombre_extra     = extra.get('nombre', '')
        id_insumo_dir    = extra.get('id_insumo')
        cantidad_dir     = float(extra.get('cantidad_descuento', 0) or 0)

        if id_insumo_dir and cantidad_dir > 0:
            cursor.execute(
                "UPDATE insumos SET cantidad_actual = MAX(0, cantidad_actual - ?) "
                "WHERE id = ?;",
                (cantidad_dir, id_insumo_dir),
            )
            print(f"[EXTRAS] '{nombre_extra}' -> -{cantidad_dir} (directo, id={id_insumo_dir})")
            continue

        config = next(
            (e for e in extras_config
             if e.get('nombre') == nombre_extra or e.get('id') == extra.get('id')),
            None,
        )
        if config:
            id_cfg  = config.get('id_insumo')
            qty_cfg = float(config.get('cantidad_descuento', 0) or 0)
            if id_cfg and qty_cfg > 0:
                cursor.execute(
                    "UPDATE insumos SET cantidad_actual = MAX(0, cantidad_actual - ?) "
                    "WHERE id = ?;",
                    (qty_cfg, id_cfg),
                )
                print(f"[EXTRAS] '{nombre_extra}' -> -{qty_cfg} (config, id={id_cfg})")
                continue

        if _descontar_por_nombre(cursor, nombre_extra):
            print(f"[EXTRAS] '{nombre_extra}' -> -1 (fallback LIKE)")


# ============================================================
# ENDPOINTS
# ============================================================

@pedidos_bp.route('/api/pedidos/activos', methods=['GET'])
def obtener_pedidos_activos_monitor():
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            # 'id AS id_pedido': PK real es 'id'
            # Incluye 'Listo': pedidos web despachados pendientes de cobro
            cursor.execute(
                "SELECT id AS id_pedido, numero_mesa, subtotal, total, productos, estado, metodo_pago "
                "FROM pedidos WHERE estado IN ('En Cocina', 'Listo') AND tipo = 'comanda';"
            )
            rows = cursor.fetchall()

        comandas = []
        for row in rows:
            d = dict(row)
            try:
                d['productos'] = json.loads(d['productos'])
            except Exception:
                d['productos'] = []
            comandas.append(d)
        return jsonify(comandas), 200
    except Exception as e:
        print(f"[PEDIDOS ERROR activos]: {e}")
        return jsonify([]), 200


@pedidos_bp.route('/api/pedidos/despachar', methods=['POST'])
def despachar_pedido_cocina():
    """
    Descuento fraccional de inventario:
      - Receta base: cantidad_receta * cantidad_vendida (REAL).
      - Extras: jerarquia de 3 niveles con fraccion exacta.
    """
    data        = request.json or {}
    id_pedido   = data.get('id_pedido')
    numero_mesa = data.get('numero_mesa')

    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()

            if id_pedido:
                cursor.execute(
                    "SELECT productos FROM pedidos WHERE id = ? AND estado = 'En Cocina';",
                    (id_pedido,),
                )
            else:
                cursor.execute(
                    "SELECT productos FROM pedidos WHERE numero_mesa = ? AND estado = 'En Cocina';",
                    (numero_mesa,),
                )
            pedido_row = cursor.fetchone()

            if pedido_row:
                prods_vendidos = json.loads(pedido_row['productos'])

                for prod in prods_vendidos:
                    nombre_p   = prod.get('nombre_producto') or prod.get('nombre')
                    cantidad_v = int(prod.get('cantidad', 1))

                    # --- Receta base: descuento fraccional ---
                    cursor.execute(
                        "SELECT insumos_receta FROM productos WHERE nombre_producto = ?;",
                        (nombre_p,),
                    )
                    receta_row = cursor.fetchone()
                    if receta_row and receta_row['insumos_receta']:
                        for item in _parsear_receta(receta_row['insumos_receta']):
                            id_ins       = item.get('id_insumo')
                            qty_base     = float(item.get('cantidad', 1))
                            qty_total    = qty_base * cantidad_v
                            # WHERE usa 'id' (PK real de insumos)
                            cursor.execute(
                                "UPDATE insumos "
                                "SET cantidad_actual = MAX(0, cantidad_actual - ?) "
                                "WHERE id = ?;",
                                (qty_total, id_ins),
                            )

                    # --- Extras: jerarquia fraccional ---
                    extras_lista  = prod.get('extrasSeleccionados', [])
                    extras_config = _cargar_extras_config(cursor, nombre_p)
                    if extras_lista:
                        _procesar_extras(cursor, extras_lista, extras_config)

            # Determinar estado final según canal del pedido
            # Pedidos web (metodo_pago='Web') → 'Listo' (pendiente de cobro en mostrador)
            # Todos los demás → 'Completado' (comportamiento sin cambios)
            if id_pedido:
                cursor.execute(
                    "SELECT metodo_pago FROM pedidos WHERE id = ?;",
                    (id_pedido,),
                )
                fila_canal = cursor.fetchone()
                es_web = fila_canal and fila_canal['metodo_pago'] == 'Web'
                estado_final = 'Listo' if es_web else 'Completado'
                cursor.execute(
                    "UPDATE pedidos SET estado = ? WHERE id = ?;",
                    (estado_final, id_pedido),
                )
            elif numero_mesa:
                # Por numero_mesa no aplica canal web (los pedidos web usan id_pedido)
                cursor.execute(
                    "UPDATE pedidos SET estado = 'Completado' "
                    "WHERE numero_mesa = ? AND estado = 'En Cocina';",
                    (numero_mesa,),
                )

        return jsonify({"mensaje": "Pedido despachado y almacen actualizado"}), 200
    except Exception as e:
        print(f"[PEDIDOS ERROR despachar]: {e}")
        return jsonify({"error": str(e)}), 500


@pedidos_bp.route('/api/pedidos/web/cobrar', methods=['POST'])
def cobrar_pedido_web():
    """
    Cobra un pedido web que ya fue despachado (estado='Listo').
    Genera el ticket financiero y cierra la comanda.

    Flujo completo del pedido web:
      1. Cliente pide desde web     → comanda 'En Cocina'
      2. Cocina despacha            → inventario descontado, estado='Listo'
      3. Cajero cobra aquí          → ticket 'Completado' + comanda 'Completado'

    Garantías:
      - No descuenta inventario (ya ocurrió en despachar).
      - No crea ticket si el pedido no está en estado 'Listo' (guard anti-doble-cobro).
    """
    data        = request.json or {}
    id_pedido   = data.get('id_pedido')
    metodo_pago = data.get('metodo_pago', 'Efectivo')

    if not id_pedido:
        return jsonify({"error": "id_pedido requerido"}), 400
    if metodo_pago not in ('Efectivo', 'Tarjeta'):
        return jsonify({"error": "metodo_pago debe ser Efectivo o Tarjeta"}), 400

    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()

            # Buscar la comanda web
            cursor.execute(
                "SELECT id, numero_mesa, total, productos, estado, metodo_pago "
                "FROM pedidos WHERE id = ? AND tipo = 'comanda';",
                (id_pedido,),
            )
            pedido = cursor.fetchone()

            if not pedido:
                return jsonify({"error": "Pedido no encontrado"}), 404

            pedido_dict = dict(pedido)

            # Validar que sea canal web
            if pedido_dict['metodo_pago'] != 'Web':
                return jsonify({"error": "Este endpoint es solo para pedidos web"}), 400

            # Guard anti-doble-cobro: solo se puede cobrar si está en 'Listo'
            if pedido_dict['estado'] != 'Listo':
                return jsonify({
                    "error": f"El pedido no está listo para cobrar (estado actual: {pedido_dict['estado']})"
                }), 409

            fecha_cobro = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            # Crear ticket financiero (fuente de verdad del cobro para Administración)
            cursor.execute(
                "INSERT INTO pedidos "
                "(numero_mesa, subtotal, total, productos, estado, fecha, metodo_pago, tipo) "
                "VALUES (?, ?, ?, ?, 'Completado', ?, ?, 'ticket');",
                (
                    pedido_dict['numero_mesa'],
                    pedido_dict['total'],
                    pedido_dict['total'],
                    pedido_dict['productos'],
                    fecha_cobro,
                    metodo_pago,
                ),
            )

            # Cerrar la comanda original
            cursor.execute(
                "UPDATE pedidos SET estado = 'Completado' WHERE id = ?;",
                (id_pedido,),
            )

        print(f"[PEDIDOS WEB] Pedido #{id_pedido} cobrado — {metodo_pago} — {pedido_dict['numero_mesa']}")
        return jsonify({
            "status":       "success",
            "mensaje":      "Pedido cobrado y ticket registrado",
            "id_pedido":    id_pedido,
            "numero_mesa":  pedido_dict['numero_mesa'],
            "total":        pedido_dict['total'],
            "metodo_pago":  metodo_pago,
            "fecha_cobro":  fecha_cobro,
        }), 200

    except Exception as e:
        print(f"[PEDIDOS WEB ERROR cobrar]: {e}")
        return jsonify({"error": str(e)}), 500


@pedidos_bp.route('/api/pedidos/venta-directa', methods=['POST'])
def registrar_venta_directa():
    """
    Venta de mostrador (Para Llevar) con flujo dividido:
      1. Inserta comanda tipo='comanda' en estado='En Cocina' para que
         el monitor de cocina la muestre y el barista la prepare.
      2. Inserta ticket tipo='ticket' en estado='Completado' para que
         Administracion registre el cobro inmediatamente.
      3. NO toca la tabla insumos: el descuento de inventario ocurre
         cuando cocina despacha la comanda via /api/pedidos/despachar.
    Esto garantiza que el inventario se descuente una sola vez.
    """
    data        = request.get_json(force=True, silent=True) or {}
    productos   = data.get('productos', []) or []
    total       = float(data.get('total', 0) or 0)
    metodo_pago = data.get('metodo_pago', 'Efectivo')

    if not productos:
        return jsonify({"error": "La venta no tiene productos"}), 400
    if total <= 0:
        return jsonify({"error": "El total debe ser mayor a cero"}), 400

    fecha_hoy      = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    productos_json = json.dumps(productos)

    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()

            # 1. Comanda para cocina
            cursor.execute(
                "INSERT INTO pedidos "
                "(numero_mesa, subtotal, total, productos, estado, fecha, metodo_pago, tipo) "
                "VALUES (?, ?, ?, ?, 'En Cocina', ?, 'Pendiente', 'comanda');",
                ("LLEVAR / MOSTRADOR", total, total, productos_json, fecha_hoy),
            )

            # 2. Ticket financiero (cobro ya registrado)
            cursor.execute(
                "INSERT INTO pedidos "
                "(numero_mesa, subtotal, total, productos, estado, fecha, metodo_pago, tipo) "
                "VALUES (?, ?, ?, ?, 'Completado', ?, ?, 'ticket');",
                ("LLEVAR / MOSTRADOR", total, total, productos_json, fecha_hoy, metodo_pago),
            )

        print(f"[VENTA DIRECTA] {len(productos)} productos, total ${total}, pago: {metodo_pago} — comanda en cocina")
        return jsonify({"mensaje": "Venta registrada. Pedido enviado a cocina."}), 200
    except Exception as e:
        print(f"[VENTA DIRECTA ERROR]: {e}")
        return jsonify({"error": str(e)}), 500


@pedidos_bp.route('/api/pedidos/web', methods=['POST'])
def recibir_pedido_web():
    try:
        datos         = request.get_json()
        cliente       = datos.get('cliente')
        hora_recogida = datos.get('hora_recogida')
        total_orden   = float(datos.get('total', 0.0))
        items         = datos.get('items', [])
        fecha_hoy     = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        prods = [
            {
                "nombre_producto":     item.get('nombre_producto'),
                "precio_venta":        float(item.get('precio_venta', 0.0)),
                "cantidad":            int(item.get('cantidad', 1)),
                "extrasSeleccionados": [],
                "notas":               f"Pedido Web - Recoge: {hora_recogida}",
            }
            for item in items
        ]

        with get_db_connection() as conn:
            conn.execute(
                "INSERT INTO pedidos "
                "(numero_mesa, subtotal, total, productos, estado, fecha, metodo_pago, tipo) "
                "VALUES (?,?,?,?,'En Cocina',?,'Web','comanda');",
                (f"Web: {cliente}", total_orden, total_orden,
                 json.dumps(prods), fecha_hoy),
            )

        print(f"[PEDIDOS WEB] Pedido de {cliente} encolado.")
        return jsonify({"status": "success", "message": "Pedido encolado en cocina"}), 200
    except Exception as e:
        print(f"[PEDIDOS WEB ERROR]: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500