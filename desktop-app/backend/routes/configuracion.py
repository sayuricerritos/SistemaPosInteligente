"""
routes/configuracion.py -- Configuracion General del Sistema
"""

from flask import Blueprint, jsonify, request
from state import configuracion_sistema

configuracion_bp = Blueprint('configuracion', __name__)


@configuracion_bp.route('/api/configuracion', methods=['GET', 'POST'])
def gestionar_configuracion():
    if request.method == 'POST':
        data = request.json or {}
        configuracion_sistema["empresa"]      = data.get("empresa",      configuracion_sistema["empresa"])
        configuracion_sistema["direccion"]    = data.get("direccion",    configuracion_sistema["direccion"])
        configuracion_sistema["limite_mesas"] = int(data.get("limite_mesas", configuracion_sistema["limite_mesas"]))
        return jsonify({"mensaje": "Configuracion actualizada"}), 200
    return jsonify(configuracion_sistema), 200
