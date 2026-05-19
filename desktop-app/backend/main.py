from flask import Flask, jsonify

# 1. Inicializar la aplicación Flask
app = Flask(__name__)

# 2. Definir la ruta raíz (Ruta de prueba)
@app.route('/', methods=['GET'])
def index():
    return jsonify({
        "status": "online",
        "message": "Servidor del SmartPOS de Kazoku Roll funcionando correctamente localmente.",
        "version": "1.0.0"
    })

# 3. Definir una ruta de prueba para la Base de Datos (Simulada por ahora)
@app.route('/api/status-db', methods=['GET'])
def status_db():
    # Esto servirá para que Francisco verifique la conexión con SQLite más adelante
    return jsonify({
        "database": "SQLite",
        "status": "connected",
        "path": "desktop-app/backend/database/pos_kazoku.db"
    })

# 4. Arrancar el servidor local
if __name__ == '__main__':
    # Ejecuta en el puerto 5000 de forma local
    app.run(debug=True, port=5000)