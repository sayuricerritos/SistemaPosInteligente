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
            cursor.execute(
                "SELECT id AS id_pedido, numero_mesa, subtotal, total, productos "
                "FROM pedidos WHERE estado = 'En Cocina';"
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

            # Marcar como Completado
            if id_pedido:
                cursor.execute(
                    "UPDATE pedidos SET estado = 'Completado' WHERE id = ?;",
                    (id_pedido,),
                )
            elif numero_mesa:
                cursor.execute(
                    "UPDATE pedidos SET estado = 'Completado' "
                    "WHERE numero_mesa = ? AND estado = 'En Cocina';",
                    (numero_mesa,),
                )

        return jsonify({"mensaje": "Pedido despachado y almacen actualizado"}), 200
    except Exception as e:
        print(f"[PEDIDOS ERROR despachar]: {e}")
        return jsonify({"error": str(e)}), 500


@pedidos_bp.route('/api/pedidos/venta-directa', methods=['POST'])
def registrar_venta_directa():
    """
    Registra una venta de mostrador (Para Llevar) en un solo paso:
      1. Inserta el pedido como Completado con metodo_pago correcto.
      2. Descuenta inventario (receta + extras) igual que despachar.
    Llamado por Llevar.jsx en lugar de /api/mesas/cerrar.
    """
    data        = request.get_json(force=True, silent=True) or {}
    productos   = data.get('productos', []) or []
    total       = float(data.get('total', 0) or 0)
    metodo_pago = data.get('metodo_pago', 'Efectivo')
    fecha_hoy   = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    if not productos:
        return jsonify({"error": "La venta no tiene productos"}), 400

    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()

            cursor.execute(
                "INSERT INTO pedidos "
                "(numero_mesa, subtotal, total, productos, estado, fecha, metodo_pago, tipo) "
                "VALUES (?, ?, ?, ?, 'Completado', ?, ?, 'ticket');",
                ("LLEVAR / MOSTRADOR", total, total,
                 json.dumps(productos), fecha_hoy, metodo_pago),
            )

            for prod in productos:
                nombre_p   = prod.get('nombre_producto') or prod.get('nombre', '')
                cantidad_v = int(prod.get('cantidad', 1))

                cursor.execute(
                    "SELECT insumos_receta FROM productos WHERE nombre_producto = ?;",
                    (nombre_p,),
                )
                receta_row = cursor.fetchone()
                if receta_row and receta_row['insumos_receta']:
                    for item in _parsear_receta(receta_row['insumos_receta']):
                        id_ins    = item.get('id_insumo')
                        qty_base  = float(item.get('cantidad', 1))
                        qty_total = qty_base * cantidad_v
                        cursor.execute(
                            "UPDATE insumos "
                            "SET cantidad_actual = MAX(0, cantidad_actual - ?) "
                            "WHERE id = ?;",
                            (qty_total, id_ins),
                        )

                extras_lista  = prod.get('extrasSeleccionados', [])
                extras_config = _cargar_extras_config(cursor, nombre_p)
                if extras_lista:
                    _procesar_extras(cursor, extras_lista, extras_config)

        print(f"[VENTA DIRECTA] {len(productos)} productos, total ${total}, pago: {metodo_pago}")
        return jsonify({"mensaje": "Venta registrada e inventario actualizado"}), 200
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