"""
main.py -- Punto de entrada del sistema POS local
==================================================
Registra los blueprints de Flask, inicializa la base de datos SQLite
y abre la ventana nativa con pywebview (o fallback al navegador).
"""

import os
import sys
import threading
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from database import init_database

# ---- Crear app Flask ----
app = Flask(__name__, static_folder='../frontend/dist', static_url_path='/')
CORS(app)

# ---- Registrar Blueprints (solo los que existen) ----
from routes.productos import productos_bp
from routes.inventario import inventario_bp
from routes.pedidos import pedidos_bp
from routes.mesas import mesas_bp
from routes.usuarios import usuarios_bp
from routes.administracion import administracion_bp

app.register_blueprint(productos_bp)
app.register_blueprint(inventario_bp)
app.register_blueprint(pedidos_bp)
app.register_blueprint(mesas_bp)
app.register_blueprint(usuarios_bp)
app.register_blueprint(administracion_bp)

# Configuracion es opcional: solo se registra si el archivo existe
try:
    from routes.configuracion import configuracion_bp
    app.register_blueprint(configuracion_bp)
    print("[MAIN] Blueprint: configuracion registrado.")
except ImportError:
    print("[MAIN] Blueprint: configuracion no encontrado, omitido.")


# ---- Ruta de prueba ----
@app.route('/api/test', methods=['GET'])
def test_endpoint():
    return jsonify({
        "status": "ok",
        "database": "SQLite3 (local)",
        "mensaje": "Backend SmartPOS activo"
    }), 200


# ---- Servir frontend (React build) ----
@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')


@app.errorhandler(404)
def not_found(e):
    # SPA fallback: cualquier ruta no-API devuelve index.html
    index_path = os.path.join(app.static_folder, 'index.html')
    if os.path.exists(index_path):
        return send_from_directory(app.static_folder, 'index.html')
    return jsonify({"error": "Recurso no encontrado"}), 404


# ---- Arranque ----
def start_flask():
    app.run(host='127.0.0.1', port=5000, debug=False)


if __name__ == '__main__':
    # Inicializar base de datos (crea tablas, seeds, migrations)
    init_database()

    # Intentar abrir ventana nativa con pywebview
    try:
        import webview
        print("[MAIN] Abriendo ventana nativa con pywebview...")
        flask_thread = threading.Thread(target=start_flask, daemon=True)
        flask_thread.start()
        webview.create_window(
            'SmartPOS Inteligente',
            'http://127.0.0.1:5000',
            width=1280,
            height=800,
            resizable=True,
        )
        webview.start()
    except ImportError:
        print("[MAIN] pywebview no instalado. Abriendo en modo navegador...")
        print("[MAIN] Accede a http://127.0.0.1:5000 en tu navegador.")
        start_flask()