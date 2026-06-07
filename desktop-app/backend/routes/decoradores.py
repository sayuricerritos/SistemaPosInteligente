"""
routes/decoradores.py -- Decoradores de validación de sesión
==============================================================
Validación de token de sesión y permisos.
Sin dependencias externas, usa sqlite3 nativo.
"""

from functools import wraps
from flask import request, jsonify
from database import get_db_connection
from datetime import datetime


def validar_sesion(f):
    """
    Decorador que valida el token X-Session-Token en el header.
    Si es válido, agrega el usuario_sesion a kwargs del endpoint.
    Si no es válido, devuelve 401.
    Actualiza last_activity en tabla sesiones si válido.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Leer token del header
        token = request.headers.get('X-Session-Token')

        if not token:
            return jsonify({
                "error": "No session token provided. Header X-Session-Token requerido.",
                "code": "MISSING_TOKEN"
            }), 401

        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT id, id_usuario, permisos, puesto, nombre_usuario, expires_at "
                    "FROM sesiones WHERE token = ? LIMIT 1;",
                    (token,)
                )
                sesion = cursor.fetchone()

                if not sesion:
                    return jsonify({
                        "error": "Token invalido o expirado.",
                        "code": "INVALID_TOKEN"
                    }), 401

                # Convertir a dict
                sesion_dict = dict(sesion)

                # Validar expiración
                expires_at = datetime.fromisoformat(sesion_dict['expires_at'])
                if datetime.now() > expires_at:
                    return jsonify({
                        "error": "Sesión expirada. Por favor, inicie sesión nuevamente.",
                        "code": "EXPIRED_SESSION"
                    }), 401

                # Actualizar last_activity
                conn.execute(
                    "UPDATE sesiones SET last_activity = datetime('now') WHERE token = ?;",
                    (token,)
                )

                # Pasar usuario al endpoint
                kwargs['usuario_sesion'] = sesion_dict

        except Exception as e:
            print(f"[DECORADOR ERROR validar_sesion]: {e}")
            return jsonify({
                "error": "Error validando sesión.",
                "code": "VALIDATION_ERROR"
            }), 500

        return f(*args, **kwargs)

    return decorated_function


def requiere_admin(f):
    """
    Decorador que combina validar_sesion + verificar que permisos === 'Total'.
    Si el usuario no tiene permisos de admin, devuelve 403.
    Actualiza last_activity si válido.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Leer token del header
        token = request.headers.get('X-Session-Token')

        if not token:
            return jsonify({
                "error": "No session token provided. Header X-Session-Token requerido.",
                "code": "MISSING_TOKEN"
            }), 401

        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT id, id_usuario, permisos, puesto, nombre_usuario, expires_at "
                    "FROM sesiones WHERE token = ? LIMIT 1;",
                    (token,)
                )
                sesion = cursor.fetchone()

                if not sesion:
                    return jsonify({
                        "error": "Token invalido o expirado.",
                        "code": "INVALID_TOKEN"
                    }), 401

                sesion_dict = dict(sesion)

                # Validar expiración
                expires_at = datetime.fromisoformat(sesion_dict['expires_at'])
                if datetime.now() > expires_at:
                    return jsonify({
                        "error": "Sesión expirada.",
                        "code": "EXPIRED_SESSION"
                    }), 401

                # Validar permisos
                if sesion_dict['permisos'] != 'Total':
                    print(f"[SEGURIDAD] Usuario {sesion_dict['nombre_usuario']} intentó acceso admin sin permisos.")
                    return jsonify({
                        "error": "Acceso denegado. Se requieren permisos de Administrador.",
                        "code": "FORBIDDEN"
                    }), 403

                # Actualizar last_activity
                conn.execute(
                    "UPDATE sesiones SET last_activity = datetime('now') WHERE token = ?;",
                    (token,)
                )

                # Pasar usuario al endpoint
                kwargs['usuario_sesion'] = sesion_dict

        except Exception as e:
            print(f"[DECORADOR ERROR requiere_admin]: {e}")
            return jsonify({
                "error": "Error validando permisos.",
                "code": "VALIDATION_ERROR"
            }), 500

        return f(*args, **kwargs)

    return decorated_function


def requiere_permiso(permiso_requerido):
    """
    Decorador parametrizado que valida permisos específicos.
    Uso: @requiere_permiso('Total') o @requiere_permiso('Basico')
    Actualiza last_activity si válido.
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            token = request.headers.get('X-Session-Token')

            if not token:
                return jsonify({
                    "error": "No session token provided.",
                    "code": "MISSING_TOKEN"
                }), 401

            try:
                with get_db_connection() as conn:
                    cursor = conn.cursor()
                    cursor.execute(
                        "SELECT id, id_usuario, permisos, puesto, nombre_usuario, expires_at "
                        "FROM sesiones WHERE token = ? LIMIT 1;",
                        (token,)
                    )
                    sesion = cursor.fetchone()

                    if not sesion:
                        return jsonify({
                            "error": "Token invalido o expirado.",
                            "code": "INVALID_TOKEN"
                        }), 401

                    sesion_dict = dict(sesion)

                    # Validar expiración
                    expires_at = datetime.fromisoformat(sesion_dict['expires_at'])
                    if datetime.now() > expires_at:
                        return jsonify({
                            "error": "Sesión expirada.",
                            "code": "EXPIRED_SESSION"
                        }), 401

                    # Validar permiso específico
                    if sesion_dict['permisos'] != permiso_requerido:
                        return jsonify({
                            "error": f"Se requiere permiso '{permiso_requerido}'.",
                            "code": "FORBIDDEN"
                        }), 403

                    # Actualizar last_activity
                    conn.execute(
                        "UPDATE sesiones SET last_activity = datetime('now') WHERE token = ?;",
                        (token,)
                    )

                    kwargs['usuario_sesion'] = sesion_dict

            except Exception as e:
                print(f"[DECORADOR ERROR requiere_permiso]: {e}")
                return jsonify({
                    "error": "Error validando permisos.",
                    "code": "VALIDATION_ERROR"
                }), 500

            return f(*args, **kwargs)

        return decorated_function
    return decorator
