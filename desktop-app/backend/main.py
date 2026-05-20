from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Permite que React (puerto 5173) se conecte sin bloqueos de seguridad

DB_PATH = os.path.join('database', 'pos_inteligente.db')

def get_db_connection():
    """Establece una conexión limpia con la base de datos local"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Permite acceder a las columnas por su nombre
    return conn

@app.route('/api/productos', methods=['GET'])
def obtener_productos():
    """Ruta para cargar el menú en el Panel de Ventas"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id_producto, nombre_producto, categoria, precio_venta FROM Productos WHERE disponible = 1;")
        productos = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return jsonify(productos), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/pago-inmediato', methods=['POST'])
def crear_pedido():
    """Ruta transaccional unificada para guardar una venta inmediata"""
    data = request.json
    if not data:
        return jsonify({"error": "No se recibieron datos"}), 400

    id_empleado = data.get('id_empleado', 1)
    id_mesa = data.get('id_mesa', 0)  # 0 indica 'Para Llevar' según el diagrama de estados
    items = data.get('items', [])

    if not items:
        return jsonify({"error": "El carrito está vacío"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Calcular el total de forma segura verificando las claves del JSON
        total_pedido = 0
        for item in items:
            precio = item.get('precio_venta') or item.get('precio', 0)
            cantidad = item.get('cantidad', 1)
            total_pedido += float(precio) * int(cantidad)
        
        # Obtener la fecha y hora actual del sistema en formato estándar YYYY-MM-DD HH:MM:SS
        fecha_actual = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        # Insertar la cabecera del pedido (Mesa 0 = Llevar)
        cursor.execute("""
         INSERT INTO Pedidos (id_empleado, id_mesa, total, estado, fecha_hora) 
         VALUES (?, ?, ?, 'Pagado', ?);
         """, (id_empleado, id_mesa, total_pedido, fecha_actual))
        
        id_pedido = cursor.lastrowid

        # Insertar los detalles del pedido
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
        return jsonify({"mensaje": "Pedido guardado localmente con éxito", "id_pedido": id_pedido}), 201

    except Exception as e:
        # Esto imprimirá el error real en tu terminal negra para que podamos verlo
        print(f"\n[ERROR CRÍTICO SQLITE]: {str(e)}\n")
        return jsonify({"error": str(e)}), 500
if __name__ == '__main__':
    # Validar que la base de datos exista antes de encender
    if not os.path.exists(DB_PATH):
        print("[Alerta] Base de datos no encontrada. Recuerda ejecutar init_db.py primero.")
    app.run(debug=True, port=5000)