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

from flask import Blueprint, jsonify, request
from werkzeug.security import generate_password_hash, check_password_hash
from database import get_db_connection

usuarios_bp = Blueprint('usuarios', __name__)


@usuarios_bp.route('/api/usuarios', methods=['GET'])
def obtener_usuarios():
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
def guardar_usuario():
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

        return jsonify({"mensaje": "Usuario guardado con exito"}), 200
    except Exception as e:
        print(f"[USUARIOS ERROR guardar]: {e}")
        return jsonify({"error": f"Error al guardar: {e}"}), 500


@usuarios_bp.route('/api/usuarios/<int:id_usuario>', methods=['DELETE'])
def eliminar_usuario(id_usuario):
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM usuarios WHERE id = ?;", (id_usuario,))
            if not cursor.fetchone():
                return jsonify({"error": "Usuario no encontrado"}), 404
            conn.execute("DELETE FROM usuarios WHERE id = ?;", (id_usuario,))
        print(f"[USUARIOS] Colaborador ID {id_usuario} eliminado.")
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

        print(f"[AUTH] {user_data['nombre_usuario']} ({user_data['nombre']}) -> {user_data['puesto']}")
        return jsonify({
            "status":         "Authenticated",
            "id_usuario":     user_data['id_usuario'],
            "nombre":         user_data['nombre'],
            "nombre_usuario": user_data['nombre_usuario'],
            "puesto":         user_data['puesto'],
            "permisos":       user_data['permisos'],
        }), 200
    except Exception as e:
        print(f"[AUTH ERROR]: {e}")
        return jsonify({"error": f"Falla en la autenticacion: {e}"}), 500