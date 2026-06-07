"""
routes/configuracion.py -- Configuracion General del Sistema
"""

from flask import Blueprint, jsonify, request
from state import configuracion_sistema
from routes.decoradores import requiere_admin
from database import registrar_auditoria

configuracion_bp = Blueprint('configuracion', __name__)


@configuracion_bp.route('/api/configuracion', methods=['GET'])
def obtener_configuracion():
    """GET: obtener configuración actual (público)."""
    return jsonify(configuracion_sistema), 200


@configuracion_bp.route('/api/configuracion', methods=['POST'])
@requiere_admin
def actualizar_configuracion(usuario_sesion):
    """POST: actualizar configuración (solo admin)."""
    data = request.json or {}
    configuracion_sistema["empresa"]      = data.get("empresa",      configuracion_sistema["empresa"])
    configuracion_sistema["direccion"]    = data.get("direccion",    configuracion_sistema["direccion"])
    configuracion_sistema["limite_mesas"] = int(data.get("limite_mesas", configuracion_sistema["limite_mesas"]))
    registrar_auditoria(
        usuario_sesion,
        accion  = 'MODIFICAR',
        modulo  = 'CONFIGURACION',
        detalle = {
            'empresa':   configuracion_sistema["empresa"],
            'direccion': configuracion_sistema["direccion"],
            'iva':       configuracion_sistema.get("iva", ""),
        }
    )
    return jsonify({"mensaje": "Configuracion actualizada"}), 200
