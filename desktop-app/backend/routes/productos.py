"""
routes/productos.py
===================
CORRECCIONES:
  - Tabla productos: PK real es 'id'. SELECT usa 'id AS id_producto'.
  - DELETE y UPDATE usan 'WHERE id = ?'.
  - guardar-receta y guardar-extras usan 'WHERE id = ?'.
  - _parse_field: JSON primero, ast.literal_eval como fallback legacy.
"""

import ast
import json
from flask import Blueprint, jsonify, request
from database import get_db_connection
from routes.decoradores import requiere_admin

productos_bp = Blueprint('productos', __name__)


def _parse_field(value):
    if not value or value in ('[]', '{}'):
        return []
    try:
        return json.loads(value)
    except Exception:
        try:
            return ast.literal_eval(value)
        except Exception:
            return []


@productos_bp.route('/api/productos', methods=['GET'])
def obtener_productos():
    """GET: listar todos los productos (público)."""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            # 'id AS id_producto': la PK real es 'id', React espera 'id_producto'
            cursor.execute(
                "SELECT id AS id_producto, nombre_producto, precio_venta, "
                "categoria, insumos_receta, extras_disponibles "
                "FROM productos ORDER BY id ASC;"
            )
            rows = cursor.fetchall()

        productos = []
        for row in rows:
            d = dict(row)
            d['insumos_receta']     = _parse_field(d.get('insumos_receta'))
            d['extras_disponibles'] = _parse_field(d.get('extras_disponibles'))
            productos.append(d)

        return jsonify(productos), 200
    except Exception as e:
        print(f"[PRODUCTOS ERROR GET]: {e}")
        return jsonify({"error": str(e)}), 500


@productos_bp.route('/api/productos', methods=['POST'])
@requiere_admin
def crear_producto(usuario_sesion):
    """POST: crear nuevo producto (solo admin)."""
    data = request.json or {}
    try:
        with get_db_connection() as conn:
            conn.execute(
                "INSERT INTO productos "
                "(nombre_producto, precio_venta, categoria, insumos_receta, extras_disponibles) "
                "VALUES (?, ?, ?, '[]', '[]');",
                (data['nombre_producto'], float(data['precio_venta']),
                 data.get('categoria', '')),
            )
        return jsonify({"mensaje": "Producto guardado"}), 200
    except Exception as e:
        print(f"[PRODUCTOS ERROR POST]: {e}")
        return jsonify({"error": str(e)}), 500


@productos_bp.route('/api/productos/<int:id_producto>', methods=['PUT'])
@requiere_admin
def actualizar_producto(id_producto, usuario_sesion):
    """PUT: actualizar producto existente (solo admin)."""
    data      = request.json or {}
    nombre    = data.get('nombre_producto')
    precio    = data.get('precio_venta')
    categoria = data.get('categoria')
    if not nombre or precio is None:
        return jsonify({"error": "Datos incompletos"}), 400
    try:
        with get_db_connection() as conn:
            conn.execute(
                "UPDATE productos SET nombre_producto=?, precio_venta=?, categoria=? "
                "WHERE id=?;",
                (nombre, float(precio), categoria, id_producto),
            )
        return jsonify({"mensaje": "Producto actualizado"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@productos_bp.route('/api/productos/<int:id_producto>', methods=['DELETE'])
@requiere_admin
def eliminar_producto(id_producto, usuario_sesion):
    """DELETE: eliminar producto (solo admin)."""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM productos WHERE id = ?;", (id_producto,))
            if not cursor.fetchone():
                return jsonify({"error": "Producto no encontrado"}), 404
            conn.execute("DELETE FROM productos WHERE id = ?;", (id_producto,))
        print(f"[PRODUCTOS] ID {id_producto} eliminado del catalogo.")
        return jsonify({"mensaje": "Producto eliminado del catalogo"}), 200
    except Exception as e:
        print(f"[PRODUCTOS ERROR DELETE]: {e}")
        return jsonify({"error": str(e)}), 500


@productos_bp.route('/api/productos/guardar-receta', methods=['POST'])
@requiere_admin
def guardar_receta_producto(usuario_sesion):
    """POST: vincular receta a producto (solo admin)."""
    data        = request.json or {}
    id_producto = data.get('id_producto')
    insumos     = data.get('insumos', [])
    try:
        with get_db_connection() as conn:
            conn.execute(
                "UPDATE productos SET insumos_receta=? WHERE id=?;",
                (json.dumps(insumos), id_producto),
            )
        return jsonify({"mensaje": "Receta guardada"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@productos_bp.route('/api/productos/guardar-extras', methods=['POST'])
@requiere_admin
def guardar_extras_producto(usuario_sesion):
    """
    POST: asignar extras a producto (solo admin).
    Extras en formato completo con id_insumo y cantidad_descuento.
    WHERE usa la columna real 'id'.
    """
    data        = request.json or {}
    id_producto = data.get('id_producto')
    extras      = data.get('extras', [])
    try:
        with get_db_connection() as conn:
            conn.execute(
                "UPDATE productos SET extras_disponibles=? WHERE id=?;",
                (json.dumps(extras), id_producto),
            )
        return jsonify({"mensaje": "Extras asignados"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500