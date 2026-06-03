"""
routes/mesas.py -- Gestion de Mesas y Comandas
================================================
CORRECCION DE SEGURIDAD EN CONSULTAS:
  - obtener_mesas() solo consulta columnas garantizadas por el seed:
    id, numero_mesa, estado. NO consulta capacidad (puede no existir
    en esquemas antiguos) y la entrega con valor por defecto.
  - Alias 'id AS id_mesa' para compatibilidad con React.
  - Fusiona la sesion activa (mesas_activas) en la misma respuesta:
    estado, comensales, subtotal y mesero en una sola llamada.
  - Lectura de JSON con get_json(force=True, silent=True) -> sin 415.
"""

import json
from datetime import datetime
from flask import Blueprint, jsonify, request
from database import get_db_connection
from state import mesas_activas

mesas_bp = Blueprint('mesas', __name__)


def _precio_item(item):
    """Precio de un producto + suma de sus extras."""
    extras = item.get('extrasSeleccionados', []) or []
    costo_extras = sum(float(e.get('precio', 0) or 0) for e in extras)
    return float(item.get('precio_venta', 0) or 0) + costo_extras


@mesas_bp.route('/api/mesas', methods=['GET'])
def obtener_mesas():
    """
    Mapa del piso tolerante al esquema:
      - Solo consulta id, numero_mesa, estado (columnas garantizadas).
      - capacidad se entrega con valor por defecto (4) sin consultarla.
      - Fusiona la sesion activa para que el frontend reciba todo de una vez.
    """
    try:
        with get_db_connection() as conn:
            mesas_db = conn.execute(
                "SELECT id AS id_mesa, numero_mesa, estado "
                "FROM mesas ORDER BY CAST(numero_mesa AS INTEGER);"
            ).fetchall()

            lista_mesas = []
            for m in mesas_db:
                num    = str(m['numero_mesa'])
                activa = mesas_activas.get(num, None)

                lista_mesas.append({
                    "id_mesa":     m['id_mesa'],
                    "numero_mesa": m['numero_mesa'],
                    "estado":      "Ocupada" if activa else m['estado'],
                    "capacidad":   4,  # valor por defecto, el esquema semilla no lo garantiza
                    "comensales":  activa.get('comensales', 0) if activa else 0,
                    "subtotal":    activa.get('subtotal', 0.0) if activa else 0.0,
                    "mesero":      activa.get('mesero', '') if activa else '',
                })
            return jsonify(lista_mesas), 200
    except Exception as e:
        print(f"[MESAS ERROR GET] Fallo la base de datos: {str(e)}")
        return jsonify({"error": f"Error en el esquema de base de datos local: {str(e)}"}), 500


@mesas_bp.route('/api/mesas/activas', methods=['GET'])
def obtener_mesas_activas():
    """Comandas vivas (en memoria) por numero de mesa."""
    try:
        activas = []
        for numero, datos in mesas_activas.items():
            activas.append({
                "numero_mesa": numero,
                "comensales":  datos.get('comensales', 1),
                "mesero":      datos.get('mesero', 'General'),
                "productos":   datos.get('productos', []),
                "subtotal":    datos.get('subtotal', 0.0),
            })
        return jsonify(activas), 200
    except Exception as e:
        print(f"[MESAS ERROR activas]: {e}")
        return jsonify([]), 200


@mesas_bp.route('/api/mesas/abrir', methods=['POST'])
def abrir_mesa():
    """Marca la mesa como Ocupada y registra la sesion en memoria."""
    data        = request.get_json(force=True, silent=True) or {}
    numero_mesa = str(data.get('numero_mesa', ''))
    comensales  = int(data.get('comensales', 1))
    mesero      = data.get('mesero', 'General')

    if not numero_mesa:
        return jsonify({"error": "Numero de mesa requerido"}), 400

    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT estado FROM mesas WHERE numero_mesa = ?;",
                (numero_mesa,),
            )
            fila = cursor.fetchone()
            if fila and fila['estado'] == 'Ocupada':
                return jsonify({"error": f"La mesa {numero_mesa} ya esta ocupada"}), 400
            conn.execute(
                "UPDATE mesas SET estado = 'Ocupada' WHERE numero_mesa = ?;",
                (numero_mesa,),
            )

        mesas_activas[numero_mesa] = {
            "comensales": comensales,
            "mesero":     mesero,
            "productos":  [],
            "subtotal":   0.0,
        }
        return jsonify({"mensaje": f"Mesa {numero_mesa} abierta", "numero_mesa": numero_mesa}), 200
    except Exception as e:
        print(f"[MESAS ERROR abrir]: {e}")
        return jsonify({"error": str(e)}), 500


@mesas_bp.route('/api/mesas/comandar', methods=['POST'])
def comandar_mesa():
    """
    Agrega productos a la sesion de la mesa y crea un pedido 'En Cocina'
    para que el monitor de cocina lo despache.
    """
    data             = request.get_json(force=True, silent=True) or {}
    numero_mesa      = str(data.get('numero_mesa', ''))
    productos_nuevos = data.get('productos', []) or []

    if numero_mesa not in mesas_activas:
        mesas_activas[numero_mesa] = {
            "comensales": 1, "mesero": "General", "productos": [], "subtotal": 0.0
        }

    sesion = mesas_activas[numero_mesa]
    sesion['productos'].extend(productos_nuevos)
    sesion['subtotal'] = sum(_precio_item(p) for p in sesion['productos'])

    fecha           = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    subtotal_nuevos = sum(_precio_item(p) for p in productos_nuevos)

    try:
        with get_db_connection() as conn:
            conn.execute(
                "INSERT INTO pedidos "
                "(numero_mesa, subtotal, total, productos, estado, fecha, metodo_pago) "
                "VALUES (?, ?, ?, ?, 'En Cocina', ?, 'Pendiente');",
                (f"Mesa {numero_mesa}", subtotal_nuevos, subtotal_nuevos,
                 json.dumps(productos_nuevos), fecha),
            )
        return jsonify({
            "mensaje":  "Comanda enviada a cocina",
            "subtotal": sesion['subtotal'],
        }), 200
    except Exception as e:
        print(f"[MESAS ERROR comandar]: {e}")
        return jsonify({"error": str(e)}), 500


@mesas_bp.route('/api/mesas/cerrar', methods=['POST'])
def cerrar_mesa():
    """
    Liquida la cuenta: marca los pedidos de la mesa como Completado con su
    metodo_pago (para el corte segmentado), libera la mesa y limpia memoria.
    """
    data        = request.get_json(force=True, silent=True) or {}
    numero_mesa = str(data.get('numero_mesa', ''))
    total       = float(data.get('total', 0) or 0)
    metodo_pago = data.get('metodo_pago', 'Efectivo')

    if not numero_mesa:
        return jsonify({"error": "Numero de mesa requerido"}), 400

    try:
        with get_db_connection() as conn:
            conn.execute(
                "UPDATE pedidos SET estado = 'Completado', metodo_pago = ? "
                "WHERE numero_mesa = ? AND estado = 'En Cocina';",
                (metodo_pago, f"Mesa {numero_mesa}"),
            )
            conn.execute(
                "UPDATE mesas SET estado = 'Libre' WHERE numero_mesa = ?;",
                (numero_mesa,),
            )

        if numero_mesa in mesas_activas:
            del mesas_activas[numero_mesa]

        return jsonify({
            "mensaje":     f"Mesa {numero_mesa} liquidada y liberada",
            "total":       total,
            "metodo_pago": metodo_pago,
        }), 200
    except Exception as e:
        print(f"[MESAS ERROR cerrar]: {e}")
        return jsonify({"error": str(e)}), 500