from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import os
import json
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Permite que la app web externa y React se comuniquen sin bloqueos

configuracion_sistema = {
    "empresa": "Cafetería UAEMéx",
    "direccion": "📍 Cerro de Coatepec S/N, Toluca",
    "moneda": "MXN ($)",
    "iva": "16%",
    "limite_mesas": 5, 
    "version": "v1.3.0-Stable"
}

def get_db_connection():
    """Establece una conexión segura con el archivo consolidado de SQLite"""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(base_dir, 'pos_inteligente.db')
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

# ==========================================
# 1. ENDPOINTS DE PRODUCTOS / MENÚ
# ==========================================
@app.route('/api/productos', methods=['GET', 'POST'])
def gestionar_productos_menu():
    if request.method == 'POST':
        data = request.json or {}
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO Productos (nombre_producto, precio_venta, categoria, insumos_receta)
            VALUES (?, ?, ?, ?);
        ''', (data['nombre_producto'], float(data['precio_venta']), data['categoria'], str(data.get('insumos_receta', '[]'))))
        conn.commit()
        conn.close()
        return jsonify({"mensaje": "Producto guardado"}), 200

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id_producto, nombre_producto, precio_venta, categoria, insumos_receta FROM Productos;")
    rows = cursor.fetchall()
    conn.close()
    
    productos = []
    for row in rows:
        d = dict(row)
        try:
            import ast
            d['insumos_receta'] = ast.literal_eval(d['insumos_receta'])
        except:
            d['insumos_receta'] = []
        productos.append(d)
    return jsonify(productos), 200

# ==========================================
# 2. ENDPOINTS DE MESAS (CORREGIDO IDIOMA)
# ==========================================
@app.route('/api/mesas', methods=['GET'])
def obtener_mesas():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # CORREGIDO: Se cambia capacity por capacidad para alinearse con React
        cursor.execute("SELECT id_mesa, numero_mesa, estado, capacidad FROM Mesas;")
        mesas = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return jsonify(mesas), 200
    except Exception:
        fallback_mesas = [
            {"id_mesa": 1, "numero_mesa": "1", "estado": "Libre", "capacidad": 2},
            {"id_mesa": 2, "numero_mesa": "2", "estado": "Libre", "capacidad": 2},
            {"id_mesa": 3, "numero_mesa": "3", "estado": "Ocupada", "capacidad": 4},
            {"id_mesa": 4, "numero_mesa": "4", "estado": "Libre", "capacidad": 4},
            {"id_mesa": 5, "numero_mesa": "5", "estado": "Libre", "capacidad": 6}
        ]
        return jsonify(fallback_mesas), 200

@app.route('/api/mesas/<int:id_mesa>/estado', methods=['PUT'])
def actualizar_estado_mesa(id_mesa):
    data = request.json or {}
    nuevo_estado = data.get('estado', 'Libre')
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE Mesas SET estado = ? WHERE id_mesa = ?;", (nuevo_estado, id_mesa))
        conn.commit()
        conn.close()
        return jsonify({"mensaje": "Mesa actualizada"}), 200
    except Exception:
        return jsonify({"mensaje": "Simulado"}), 200

# ==========================================
# 3. CONTROL DE MESAS ACTIVAS LOCALES
# ==========================================
mesas_activas = {}

@app.route('/api/mesas/activas', methods=['GET'])
def obtener_mesas_activas():
    return jsonify(list(mesas_activas.values())), 200

@app.route('/api/mesas/abrir', methods=['POST'])
def abrir_mesa():
    data = request.json or {}
    num_mesa = str(data.get('numero_mesa'))
    mesas_activas[num_mesa] = {
        "numero_mesa": num_mesa,
        "comensales": data.get('comensales', 1),
        "mesero": data.get('mesero', 'General'),
        "productos": [],
        "subtotal": 0.0,
        "estado": "Abierta"
    }
    return jsonify({"mensaje": "Mesa abierta"}), 200

@app.route('/api/mesas/comandar', methods=['POST'])
def comandar_mesa():
    data = request.json or {}
    num_mesa = str(data.get('numero_mesa'))
    nuevos_productos = data.get('productos', [])
    
    if num_mesa in mesas_activas:
        mesas_activas[num_mesa]['productos'].extend(nuevos_productos)
        subtotal = 0.0
        for p in mesas_activas[num_mesa]['productos']:
            costo_extras = sum([float(e['precio']) for e in p.get('extrasSeleccionados', [])])
            subtotal += (float(p['precio_venta']) + costo_extras) * int(p.get('cantidad', 1))
        mesas_activas[num_mesa]['subtotal'] = subtotal
    return jsonify({"mensaje": "Comanda enviada"}), 200

# ==========================================
# 4. RECEPCIÓN DE PEDIDOS REMOTOS (PÁGINA WEB) Y LOCALES
# ==========================================
@app.route('/api/mesas/cerrar', methods=['POST'])
def cerrar_y_guardar_comanda():
    """Cierra la cuenta local e inserta la transacción real en SQLite"""
    data = request.json or {}
    num_mesa = str(data.get('numero_mesa', 'MOSTRADOR'))
    total_final = float(data.get('total', 0.0))
    productos_lista = data.get('productos', [])
    fecha_hoy = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO Pedidos (numero_mesa, subtotal, total, productos, estado, fecha) 
            VALUES (?, ?, ?, ?, 'Completado', ?);
        """, (f"Mesa {num_mesa}" if num_mesa.isdigit() else num_mesa, total_final, total_final, json.dumps(productos_lista), fecha_hoy))
        conn.commit()
        conn.close()
        
        if num_mesa in mesas_activas:
            del mesas_activas[num_mesa]
        return jsonify({"mensaje": "Venta guardada"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/pedidos/remotos/nuevo', methods=['POST'])
def recibir_pedido_pagina_web():
    """
    ENDPOINT CLAVE IA/WEB: Recibe órdenes directamente desde tu menú digital web,
    las inserta en la cola de cocina y las deja listas en el monitor de Pedidos.
    """
    data = request.json or {}
    total_pedido = float(data.get('total', 0.0))
    productos_pedido = data.get('productos', [])
    fecha_hoy = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # Se guarda con estado 'En Cocina' y origen 'Página Web'
        cursor.execute("""
            INSERT INTO Pedidos (numero_mesa, subtotal, total, productos, estado, fecha) 
            VALUES ('Página Web 🌐', ?, ?, ?, 'En Cocina', ?);
        """, (total_pedido, total_pedido, json.dumps(productos_pedido), fecha_hoy))
        conn.commit()
        conn.close()
        return jsonify({"mensaje": "¡Orden web remota recibida con éxito en la cocina!"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# COPIADO COMPATIBLE: Enrutador dual para que Pedidos.jsx no se quede colgado
@app.route('/api/pedidos/activos', methods=['GET'])
def obtener_pedidos_activos_monitor():
    """Escanea la base de datos buscando comandas locales o remotas en preparación"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT numero_mesa, subtotal, total, productos FROM Pedidos WHERE estado = 'En Cocina';")
        rows = cursor.fetchall()
        conn.close()
        
        comandas = []
        for row in rows:
            d = dict(row)
            d['numero_mesa'] = d['numero_mesa']
            try:
                d['productos'] = json.loads(d['productos'])
            except:
                d['productos'] = []
            comandas.append(d)
            
        # Unificamos lo que esté en memoria local de las mesas abiertas de piso
        for m in mesas_activas.values():
            if len(m['productos']) > 0:
                comandas.append({
                    "numero_mesa": m['numero_mesa'],
                    "subtotal": m['subtotal'],
                    "total": m['subtotal'],
                    "productos": m['productos']
                })
        return jsonify(comandas), 200
    except Exception:
        return jsonify([]), 200

# ==========================================
# 5. ENDPOINTS DE INVENTARIO Y USUARIOS
# ==========================================
@app.route('/api/inventario', methods=['GET'])
def obtener_inventario():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id_insumo, nombre_insumo, cantidad_actual, unidad_medida, stock_minimo FROM Insumos;")
        insumos = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return jsonify(insumos), 200
    except Exception:
        return jsonify([]), 200

@app.route('/api/inventario/ajustar', methods=['POST'])
def ajustar_inventario():
    data = request.json or {}
    id_insumo = data.get('id_insumo')
    cantidad = float(data.get('cantidad', 0))
    operador = 1 if data.get('tipo') == 'ENTRADA' else -1
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE Insumos SET cantidad_actual = cantidad_actual + ? WHERE id_insumo = ?;", (cantidad * operador, id_insumo))
        conn.commit()
        conn.close()
        return jsonify({"mensaje": "Ajustado"}), 200
    except Exception:
        return jsonify({"mensaje": "Error"}), 500

@app.route('/api/usuarios', methods=['GET'])
def obtener_usuarios():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id_usuario, nombre, puesto, permisos, horas_trabajadas, pago_hora, horario FROM Usuarios;")
        usuarios = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return jsonify(usuarios), 200
    except Exception:
        return jsonify([]), 200

@app.route('/api/usuarios/guardar', methods=['POST'])
def guardar_usuario():
    data = request.json or {}
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        if data.get('id_usuario'):
            cursor.execute("UPDATE Usuarios SET nombre=?, puesto=?, permisos=?, horas_trabajadas=?, pago_hora=?, horario=? WHERE id_usuario=?;", (data['nombre'], data['puesto'], data['permisos'], int(data['horas_trabajadas']), float(data['pago_hora']), data['horario'], data['id_usuario']))
        else:
            cursor.execute("INSERT INTO Usuarios (nombre, puesto, permisos, horas_trabajadas, pago_hora, horario) VALUES (?,?,?,?,?,?);", (data['nombre'], data['puesto'], data['permisos'], int(data['horas_trabajadas']), float(data['pago_hora']), data['horario']))
        conn.commit()
        conn.close()
        return jsonify({"mensaje": "Guardado"}), 200
    except Exception:
        return jsonify({"mensaje": "Error"}), 500

@app.route('/api/configuracion', methods=['GET', 'POST'])
def gestionar_configuracion():
    global configuracion_sistema
    if request.method == 'POST':
        data = request.json or {}
        configuracion_sistema["empresa"] = data.get("empresa", configuracion_sistema["empresa"])
        configuracion_sistema["direccion"] = data.get("direccion", configuracion_sistema["direccion"])
        configuracion_sistema["limite_mesas"] = int(data.get("limite_mesas", configuracion_sistema["limite_mesas"]))
        return jsonify({"mensaje": "Ok"}), 200
    return jsonify(configuracion_sistema), 200

# ==========================================
# 6. HISTORIAL GERENCIAL / AUDITORÍA (MESA -> TIPO_PEDIDO ACUMULADO)
# ==========================================
gastos_locales = []

@app.route('/api/administracion/ventas', methods=['GET'])
def obtener_historial_ventas():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # Buscamos la columna de la base de datos real y mapeamos el alias para el frontend
        cursor.execute("SELECT id_pedido, numero_mesa AS tipo_pedido, total, estado, fecha FROM Pedidos ORDER BY id_pedido DESC;")
        ventas = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return jsonify(ventas), 200
    except Exception:
        return jsonify([]), 200

@app.route('/api/administracion/gastos', methods=['GET', 'POST'])
def gestionar_gastos():
    global gastos_locales
    if request.method == 'POST':
        data = request.json or {}
        gastos_locales.insert(0, {
            "id_gasto": len(gastos_locales) + 1,
            "concepto": data.get('concepto'),
            "monto": float(data.get('monto', 0.0)),
            "fecha": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })
        return jsonify({"mensaje": "Ok"}), 200
    return jsonify(gastos_locales), 200

# ==========================================
# 7. MOTOR IA PREDICTIVO
# ==========================================
@app.route('/api/ia/prediccion-stock', methods=['GET'])
def predecir_quiebre_stock():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id_insumo, nombre_insumo, cantidad_actual, stock_minimo FROM Insumos;")
        insumos = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        analisis_ia = []
        tasas = {1: 1.2, 2: 4.5, 3: 0.4}
        for insumo in insumos:
            id_i = insumo['id_insumo']
            actual = insumo['cantidad_actual']
            minimo = insumo['stock_minimo']
            tasa = tasas.get(id_i, 1.0)
            dias = round((actual - minimo) / tasa, 1) if actual > minimo else 0.0
            analisis_ia.append({
                "id_insumo": id_i,
                "nombre": insumo['nombre_insumo'],
                "dias_estimados": max(0, dias),
                "estado_ia": "CRÍTICO" if dias <= 0 else ("ALTO" if dias <= 3 else "ESTABLE"),
                "tasa_consumo": f"{tasa} uds/día"
            })
        return jsonify(analisis_ia), 200
    except Exception:
        return jsonify([]), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)