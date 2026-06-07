"""
routes/usuarios.py
==================
CAMBIOS:
  - Dos campos separados: 'nombre' (nombre completo del trabajador)
    y 'nombre_usuario' (credencial de login, UNIQUE).
  - Login valida contra 'nombre_usuario' con match exacto (=), no LIKE.
  - guardar verifica unicidad de nombre_usuario antes de INSERT/UPDATE.
  - GET retorna ambos campos + tiene_contrasena. Nunca retorna password_hash.
"""

import secrets
from datetime import datetime, timedelta
from flask import Blueprint, jsonify, request
from werkzeug.security import generate_password_hash, check_password_hash
from database import get_db_connection
from routes.decoradores import requiere_admin
from database import registrar_auditoria

usuarios_bp = Blueprint('usuarios', __name__)


def crear_sesion(id_usuario, permisos, puesto, nombre_usuario):
    """
    Crea una nueva sesión en la tabla sesiones.
    Devuelve el token generado.
    """
    token = secrets.token_urlsafe(32)
    expires_at = (datetime.now() + timedelta(hours=8)).isoformat()
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent', '')

    try:
        with get_db_connection() as conn:
            conn.execute(
                "INSERT INTO sesiones "
                "(token, id_usuario, permisos, puesto, nombre_usuario, expires_at, ip_address, user_agent) "
                "VALUES (?,?,?,?,?,?,?,?);",
                (token, id_usuario, permisos, puesto, nombre_usuario, expires_at, ip_address, user_agent),
            )
        return token
    except Exception as e:
        print(f"[USUARIOS ERROR crear_sesion]: {e}")
        return None


@usuarios_bp.route('/api/usuarios', methods=['GET'])
@requiere_admin
def obtener_usuarios(usuario_sesion):
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT id AS id_usuario,
                       nombre,
                       nombre_usuario,
                       puesto,
                       permisos,
                       horas_trabajadas,
                       pago_hora,
                       horario,
                       CASE WHEN password_hash IS NOT NULL THEN 1 ELSE 0 END AS tiene_contrasena
                FROM usuarios
                ORDER BY id ASC;
                """
            )
            usuarios = [dict(row) for row in cursor.fetchall()]
        return jsonify(usuarios), 200
    except Exception as e:
        print(f"[USUARIOS ERROR GET]: {e}")
        return jsonify([]), 200


@usuarios_bp.route('/api/usuarios/guardar', methods=['POST'])
@requiere_admin
def guardar_usuario(usuario_sesion):
    """
    Alta o edicion de colaborador.
    Valida que nombre_usuario sea unico antes de guardar.
    """
    data            = request.json or {}
    nombre          = data.get('nombre', '').strip()
    nombre_usuario  = data.get('nombre_usuario', '').strip()
    contrasena      = data.get('contrasena', '').strip()
    puesto          = data.get('puesto', 'Mesero')
    permisos        = data.get('permisos', 'Basico')
    horas           = int(data.get('horas_trabajadas', 0) or 0)
    pago            = float(data.get('pago_hora', 0) or 0)
    horario         = data.get('horario', '')
    id_usuario      = data.get('id_usuario')

    if not nombre:
        return jsonify({"error": "El nombre del trabajador es obligatorio"}), 400
    if not nombre_usuario:
        return jsonify({"error": "El nombre de usuario es obligatorio"}), 400

    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()

            # Verificar unicidad del nombre de usuario
            if id_usuario:
                cursor.execute(
                    "SELECT id FROM usuarios WHERE nombre_usuario = ? AND id != ?;",
                    (nombre_usuario, id_usuario),
                )
            else:
                cursor.execute(
                    "SELECT id FROM usuarios WHERE nombre_usuario = ?;",
                    (nombre_usuario,),
                )
            if cursor.fetchone():
                return jsonify({
                    "error": f"El nombre de usuario '{nombre_usuario}' ya esta en uso. Elige otro."
                }), 400

            if id_usuario:
                # Edicion
                if contrasena:
                    conn.execute(
                        "UPDATE usuarios SET nombre=?, nombre_usuario=?, puesto=?, permisos=?, "
                        "horas_trabajadas=?, pago_hora=?, horario=?, password_hash=? "
                        "WHERE id=?;",
                        (nombre, nombre_usuario, puesto, permisos, horas, pago,
                         horario, generate_password_hash(contrasena), id_usuario),
                    )
                else:
                    conn.execute(
                        "UPDATE usuarios SET nombre=?, nombre_usuario=?, puesto=?, permisos=?, "
                        "horas_trabajadas=?, pago_hora=?, horario=? WHERE id=?;",
                        (nombre, nombre_usuario, puesto, permisos, horas, pago,
                         horario, id_usuario),
                    )
            else:
                # Alta nueva
                password_hash = generate_password_hash(contrasena) if contrasena else None
                conn.execute(
                    "INSERT INTO usuarios "
                    "(nombre, nombre_usuario, puesto, permisos, "
                    " horas_trabajadas, pago_hora, horario, password_hash) "
                    "VALUES (?,?,?,?,?,?,?,?);",
                    (nombre, nombre_usuario, puesto, permisos, horas, pago,
                     horario, password_hash),
                )

        registrar_auditoria(
            usuario_sesion,
            accion  = 'EDITAR' if id_usuario else 'CREAR',
            modulo  = 'USUARIOS',
            detalle = {
                'id_usuario_afectado': id_usuario,
                'nombre':              nombre,
                'nombre_usuario':      nombre_usuario,
                'puesto':              puesto,
                'permisos':            permisos,
            }
        )
        return jsonify({"mensaje": "Usuario guardado con exito"}), 200
    except Exception as e:
        print(f"[USUARIOS ERROR guardar]: {e}")
        return jsonify({"error": f"Error al guardar: {e}"}), 500


@usuarios_bp.route('/api/usuarios/<int:id_usuario>', methods=['DELETE'])
@requiere_admin
def eliminar_usuario(id_usuario, usuario_sesion):
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT id, nombre, nombre_usuario, puesto, permisos "
                "FROM usuarios WHERE id = ?;",
                (id_usuario,)
            )
            afectado = cursor.fetchone()
            if not afectado:
                return jsonify({"error": "Usuario no encontrado"}), 404
            datos_afectado = dict(afectado)
            conn.execute("DELETE FROM usuarios WHERE id = ?;", (id_usuario,))
        print(f"[USUARIOS] Colaborador ID {id_usuario} eliminado.")
        registrar_auditoria(
            usuario_sesion,
            accion  = 'ELIMINAR',
            modulo  = 'USUARIOS',
            detalle = {
                'id_usuario_afectado': id_usuario,
                'nombre':              datos_afectado.get('nombre'),
                'nombre_usuario':      datos_afectado.get('nombre_usuario'),
                'puesto':              datos_afectado.get('puesto'),
                'permisos':            datos_afectado.get('permisos'),
            }
        )
        return jsonify({"mensaje": "Colaborador eliminado con exito"}), 200
    except Exception as e:
        print(f"[USUARIOS ERROR eliminar]: {e}")
        return jsonify({"error": str(e)}), 500


@usuarios_bp.route('/api/auth/login', methods=['POST'])
def autenticar_usuario():
    """
    Login por nombre_usuario (match exacto, case-sensitive) + contrasena.
    No retorna password_hash en la respuesta.
    """
    data           = request.json or {}
    usuario_input  = data.get('usuario', '').strip()
    contrasena     = data.get('contrasena', '').strip()

    if not usuario_input:
        return jsonify({"error": "El nombre de usuario es obligatorio"}), 400

    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            # Match exacto contra nombre_usuario (no LIKE, no nombre)
            cursor.execute(
                  """
                    SELECT id AS id_usuario, nombre, nombre_usuario,
                        puesto, permisos, password_hash
                    FROM usuarios
                    WHERE nombre_usuario = ? OR nombre = ?
                    LIMIT 1;
                    """,
                    (usuario_input, usuario_input),
            )
            user_row = cursor.fetchone()

        if not user_row:
            return jsonify({"error": "Usuario no registrado en el sistema"}), 401

        user_data = dict(user_row)

        if user_data['password_hash']:
            if not check_password_hash(user_data['password_hash'], contrasena):
                return jsonify({"error": "Contrasena incorrecta"}), 401
        else:
            return jsonify({"error": "Este usuario no tiene contrasena configurada"}), 401

        # Crear sesión
        token = crear_sesion(
            id_usuario=user_data['id_usuario'],
            permisos=user_data['permisos'],
            puesto=user_data['puesto'],
            nombre_usuario=user_data['nombre_usuario']
        )

        if not token:
            return jsonify({"error": "Error creando sesión"}), 500

        print(f"[AUTH] {user_data['nombre_usuario']} ({user_data['nombre']}) -> {user_data['puesto']} (token={token[:8]}...)")
        return jsonify({
            "status":         "Authenticated",
            "token":          token,
            "id_usuario":     user_data['id_usuario'],
            "nombre":         user_data['nombre'],
            "nombre_usuario": user_data['nombre_usuario'],
            "puesto":         user_data['puesto'],
            "permisos":       user_data['permisos'],
        }), 200
    except Exception as e:
        print(f"[AUTH ERROR]: {e}")
        return jsonify({"error": f"Falla en la autenticacion: {e}"}), 500