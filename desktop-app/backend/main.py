from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Habilita el pase de seguridad para React

DB_PATH = os.path.join('database', 'pos_inteligente.db')

def get_db_connection():
    """Establece la conexión física con SQLite"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# ==========================================
# 1. ENDPOINTS DE PRODUCTOS
# ==========================================
@app.route('/api/productos', methods=['GET'])
def obtener_productos():
    """Ruta para cargar el menú en las cuadrículas táctiles"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id_producto, nombre_producto, categoria, precio_venta FROM Productos WHERE disponible = 1;")
        productos = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return jsonify(productos), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==========================================
# 2. ENDPOINTS DE MESAS
# ==========================================
@app.route('/api/mesas', methods=['GET'])
def obtener_mesas():
    """Devuelve la lista de mesas locales y su estado actual"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id_mesa, numero_mesa, estado, capacidad FROM Mesas WHERE id_mesa > 0;")
        mesas = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return jsonify(mesas), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/mesas/<int:id_mesa>/estado', methods=['PUT'])
def actualizar_estado_mesa(id_mesa):
    """Cambia el estado de una mesa (Libre/Ocupada) en la base de datos"""
    data = request.json or {}
    nuevo_estado = data.get('estado')
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE Mesas SET estado = ? WHERE id_mesa = ?;", (nuevo_estado, id_mesa))
        conn.commit()
        conn.close()
        return jsonify({"mensaje": f"Mesa {id_mesa} actualizada a {nuevo_estado}"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==========================================
# 3. ENDPOINTS DE TRANSACCIONES / PEDIDOS
# ==========================================
@app.route('/api/pago-inmediato', methods=['POST'])
def crear_pedido():
    """Guarda físicamente la comanda/pedido en SQLite"""
    data = request.json or {}
    id_empleado = data.get('id_empleado', 1)
    id_mesa = data.get('id_mesa', 0)
    items = data.get('items', [])

    if not items:
        return jsonify({"error": "El carrito está vacío"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Calcular total
        total_pedido = 0
        for item in items:
            precio = item.get('precio_venta') or item.get('precio', 0)
            cantidad = item.get('cantidad', 1)
            total_pedido += float(precio) * int(cantidad)
        
        fecha_actual = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        # Insertar cabecera
        cursor.execute("""
            INSERT INTO Pedidos (id_empleado, id_mesa, total, estado, fecha_hora) 
            VALUES (?, ?, ?, 'Pagado', ?);
        """, (id_empleado, id_mesa, total_pedido, fecha_actual))
        
        id_pedido = cursor.lastrowid

        # Insertar detalles
        for item in items:
            id_prod = item.get('id_producto')
            precio = item.get('precio_venta') or item.get('precio', 0)
            cantidad = item.get('cantidad', 1)
            subtotal = float(precio) * int(cantidad)
            
            cursor.execute("""
                INSERT INTO Detalles_Pedido (id_pedido, id_producto, cantidad, subtotal) 
                VALUES (?, ?, ?, ?);
            """, (id_pedido, id_prod, cantidad, subtotal))

        conn.commit()
        conn.close()
        return jsonify({"mensaje": "Pedido guardado con éxito", "id_pedido": id_pedido}), 201

    except Exception as e:
        print(f"\n[ERROR CRÍTICO SQLITE]: {str(e)}\n")
        return jsonify({"error": str(e)}), 500

# ==========================================
# ARRANQUE DEL SERVIDOR LOCAL
# ==========================================
if __name__ == '__main__':
    if not os.path.exists(DB_PATH):
        print("[Alerta] Base de datos no encontrada.")
    app.run(debug=True, port=5000)