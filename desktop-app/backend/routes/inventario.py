"""
routes/inventario.py
====================
CORRECCIONES:
  - Tabla insumos: PK real es 'id'. Todas las SELECTs usan alias
    'id AS id_insumo' para que React reciba el campo esperado.
  - WHERE y UPDATE usan 'id = ?' en lugar de 'id_insumo = ?'.
  - cantidad_actual es REAL: acepta valores con decimales (g, ml).
  - POST /api/inventario/nuevo: nuevo insumo; 'id' es autoincrement,
    no se especifica en el INSERT.
  - La operacion de ajuste acepta fracciones (step 0.001 en el frontend).
"""

from flask import Blueprint, jsonify, request
from database import get_db_connection

inventario_bp = Blueprint('inventario', __name__)

UNIDADES_VALIDAS = {'unidad', 'KG', 'Litros', 'ML', 'g', 'Pieza'}


@inventario_bp.route('/api/inventario', methods=['GET'])
def obtener_inventario():
    """
    Retorna lista de insumos.
    Alias 'id AS id_insumo': el frontend usa id_insumo como identificador
    pero la columna real en SQLite es 'id'.
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT id AS id_insumo, nombre_insumo, "
                "cantidad_actual, unidad_medida, stock_minimo "
                "FROM insumos ORDER BY id ASC;"
            )
            insumos = [dict(row) for row in cursor.fetchall()]
        return jsonify(insumos), 200
    except Exception as e:
        print(f"[INVENTARIO ERROR GET]: {e}")
        return jsonify([]), 200


@inventario_bp.route('/api/inventario/nuevo', methods=['POST'])
def crear_insumo():
    """
    Alta de nuevo insumo. La columna 'id' es AUTOINCREMENT: no se especifica
    en el INSERT. Se retorna el nuevo registro con 'id AS id_insumo'.
    """
    data     = request.json or {}
    nombre   = data.get('nombre_insumo', '').strip()
    cantidad = data.get('cantidad_actual')
    unidad   = data.get('unidad_medida', 'unidad').strip()
    minimo   = float(data.get('stock_minimo', 5))

    if not nombre:
        return jsonify({"error": "El nombre del insumo es obligatorio"}), 400
    if cantidad is None:
        return jsonify({"error": "La cantidad inicial es obligatoria"}), 400
    if unidad not in UNIDADES_VALIDAS:
        unidad = 'unidad'

    try:
        with get_db_connection() as conn:
            conn.execute(
                "INSERT INTO insumos (nombre_insumo, cantidad_actual, unidad_medida, stock_minimo) "
                "VALUES (?, ?, ?, ?);",
                (nombre, float(cantidad), unidad, minimo),
            )
        print(f"[INVENTARIO] Insumo creado: {nombre} ({unidad})")
        return jsonify({"mensaje": f"Insumo '{nombre}' creado con exito"}), 200
    except Exception as e:
        print(f"[INVENTARIO ERROR nuevo]: {e}")
        return jsonify({"error": str(e)}), 500


@inventario_bp.route('/api/inventario/ajustar', methods=['POST'])
def ajustar_inventario():
    """
    Ajuste manual de stock. Acepta fracciones (ENTRADA o MERMA).
    El campo id_insumo del body corresponde al alias; WHERE usa 'id = ?'.
    Para MERMA: rechaza si la cantidad solicitada supera el stock actual.
    """
    data      = request.json or {}
    id_insumo = data.get('id_insumo')
    cantidad  = float(data.get('cantidad', 0))
    tipo      = data.get('tipo', 'ENTRADA')

    if not id_insumo or cantidad <= 0:
        return jsonify({"error": "Datos invalidos"}), 400

    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()

            cursor.execute(
                "SELECT nombre_insumo, cantidad_actual FROM insumos WHERE id = ?;",
                (id_insumo,),
            )
            fila = cursor.fetchone()

            if not fila:
                return jsonify({"error": "Insumo no encontrado"}), 404

            stock_actual = float(fila['cantidad_actual'])

            if tipo == 'MERMA':
                if cantidad > stock_actual:
                    return jsonify({
                        "error": (
                            f"Stock insuficiente. "
                            f"Disponible: {stock_actual} — "
                            f"Solicitado: {cantidad}"
                        )
                    }), 400
                cursor.execute(
                    "UPDATE insumos SET cantidad_actual = cantidad_actual - ? WHERE id = ?;",
                    (cantidad, id_insumo),
                )
            else:
                cursor.execute(
                    "UPDATE insumos SET cantidad_actual = cantidad_actual + ? WHERE id = ?;",
                    (cantidad, id_insumo),
                )

        return jsonify({"mensaje": "Ajuste aplicado con exito"}), 200
    except Exception as e:
        print(f"[INVENTARIO ERROR ajustar]: {e}")
        return jsonify({"error": "Error al ajustar stock"}), 500