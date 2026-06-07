"""
database.py -- SQLite3 local
=============================
CAMBIOS:
  - Seed de 8 mesas al arrancar si la tabla esta vacia.
  - usuarios: nueva columna 'nombre_usuario TEXT UNIQUE' separada de 'nombre'.
    'nombre' = nombre completo del trabajador (Alexis Castro).
    'nombre_usuario' = credencial de login unica (alexis.castro).
  - Migration defensiva: agrega nombre_usuario a BD existentes.
  - Seed Admin usa nombre_usuario='Admin'.
"""

import os
import sys
import sqlite3
from contextlib import contextmanager

if getattr(sys, 'frozen', False):
    _BASE_DIR = os.path.dirname(sys.executable)
else:
    _BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DB_PATH = os.path.join(_BASE_DIR, 'pos_inteligente.db')


@contextmanager
def get_db_connection():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def execute_query(query, params=None):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(query, params or ())
        return [dict(row) for row in cursor.fetchall()]


def execute_write(query, params=None):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(query, params or ())


_PRODUCTOS_SEED = [
    ('Cafe Americano',     35.0, 'Bebidas Calientes'),
    ('Cafe Latte',         45.0, 'Bebidas Calientes'),
    ('Cappuccino',         45.0, 'Bebidas Calientes'),
    ('Chocolate Caliente', 40.0, 'Bebidas Calientes'),
    ('Te de Manzanilla',   30.0, 'Bebidas Calientes'),
    ('Frappe de Cafe',     55.0, 'Bebidas Frias'),
    ('Limonada Fresca',    35.0, 'Bebidas Frias'),
    ('Agua de Jamaica',    30.0, 'Bebidas Frias'),
    ('Jugo de Naranja',    40.0, 'Bebidas Frias'),
    ('Smoothie Mixto',     50.0, 'Bebidas Frias'),
    ('Cuernito',           18.0, 'Panaderia'),
    ('Pan de Chocolate',   22.0, 'Panaderia'),
    ('Muffin de Arandano', 25.0, 'Panaderia'),
    ('Croissant',          28.0, 'Panaderia'),
    ('Dona Glaseada',      20.0, 'Panaderia'),
    ('Sandwich de Jamon',  65.0, 'Alimentos'),
    ('Avena con Fruta',    45.0, 'Alimentos'),
    ('Ensalada Cesar',     75.0, 'Alimentos'),
    ('Molletes',           55.0, 'Alimentos'),
    ('Quesadilla',         60.0, 'Alimentos'),
]


def _migration_add_column(cursor, table, column_def):
    cursor.execute(f"PRAGMA table_info({table})")
    cols = [row['name'] for row in cursor.fetchall()]
    col_name = column_def.split()[0]
    if col_name not in cols:
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column_def};")
        print(f"[DB] Migration: {table}.{col_name} agregada.")


def limpiar_sesiones_expiradas():
    """
    Elimina sesiones expiradas de la tabla sesiones.
    No se llama automáticamente; debe ser llamada explícitamente.
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "DELETE FROM sesiones WHERE expires_at < datetime('now');"
            )
            filas_eliminadas = cursor.rowcount
            if filas_eliminadas > 0:
                print(f"[DB] Limpieza: {filas_eliminadas} sesiones expiradas eliminadas.")
    except Exception as e:
        print(f"[DB] Error limpiando sesiones: {e}")


def init_database():
    from werkzeug.security import generate_password_hash

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("PRAGMA journal_mode=WAL;")

        # ---- Tablas ------------------------------------------------
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS productos (
                id                 INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre_producto    TEXT    NOT NULL,
                precio_venta       REAL    NOT NULL,
                categoria          TEXT,
                insumos_receta     TEXT    DEFAULT '[]',
                extras_disponibles TEXT    DEFAULT '[]'
            );
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS insumos (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre_insumo   TEXT    NOT NULL,
                cantidad_actual REAL    DEFAULT 0,
                unidad_medida   TEXT    DEFAULT 'unidad',
                stock_minimo    REAL    DEFAULT 5
            );
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS pedidos (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                numero_mesa TEXT,
                subtotal    REAL    DEFAULT 0,
                total       REAL    DEFAULT 0,
                productos   TEXT    DEFAULT '[]',
                estado      TEXT    DEFAULT 'En Cocina',
                fecha       TEXT,
                metodo_pago TEXT    DEFAULT 'Efectivo'
            );
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS mesas (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                numero_mesa TEXT    UNIQUE NOT NULL,
                estado      TEXT    NOT NULL DEFAULT 'Libre',
                capacidad   INTEGER DEFAULT 4
            );
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS usuarios (
                id               INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre           TEXT    NOT NULL,
                nombre_usuario   TEXT    UNIQUE,
                puesto           TEXT,
                permisos         TEXT,
                horas_trabajadas INTEGER DEFAULT 0,
                pago_hora        REAL    DEFAULT 0,
                horario          TEXT,
                password_hash    TEXT    DEFAULT NULL
            );
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS gastos (
                id             INTEGER PRIMARY KEY AUTOINCREMENT,
                concepto       TEXT    NOT NULL,
                monto          REAL    NOT NULL,
                fecha          TEXT    NOT NULL,
                fecha_completa TEXT
            );
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS cortes_historicos (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                fecha         TEXT    NOT NULL,
                efectivo      REAL    DEFAULT 0,
                tarjeta       REAL    DEFAULT 0,
                total_ventas  REAL    DEFAULT 0,
                total_gastos  REAL    DEFAULT 0,
                balance_neto  REAL    DEFAULT 0,
                tickets       INTEGER DEFAULT 0,
                observaciones TEXT    DEFAULT '',
                ejecutado_at  TEXT    NOT NULL
            );
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sesiones (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                token           TEXT UNIQUE NOT NULL,
                id_usuario      INTEGER NOT NULL,
                permisos        TEXT NOT NULL,
                puesto          TEXT NOT NULL,
                nombre_usuario  TEXT NOT NULL,
                created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at      TIMESTAMP NOT NULL,
                last_activity   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ip_address      TEXT,
                user_agent      TEXT,
                FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
            );
        """)

        # ---- Indices para optimización ----------------------------
        cursor.execute(
            "CREATE INDEX IF NOT EXISTS idx_sesiones_token "
            "ON sesiones(token);"
        )
        cursor.execute(
            "CREATE INDEX IF NOT EXISTS idx_sesiones_id_usuario "
            "ON sesiones(id_usuario);"
        )
        cursor.execute(
            "CREATE INDEX IF NOT EXISTS idx_sesiones_expires_at "
            "ON sesiones(expires_at);"
        )

        # ---- Migrations defensivas ---------------------------------
        _migration_add_column(cursor, 'pedidos',  'metodo_pago TEXT DEFAULT "Efectivo"')
        _migration_add_column(cursor, 'pedidos',  'tipo TEXT DEFAULT "comanda"')
        _migration_add_column(cursor, 'usuarios', 'password_hash TEXT DEFAULT NULL')
        _migration_add_column(cursor, 'usuarios', 'nombre_usuario TEXT')

        # Fix: si hay usuarios con nombre_usuario NULL (BD preexistente),
        # copiar el campo 'nombre' como nombre_usuario para que el login funcione.
        cursor.execute(
            "UPDATE usuarios SET nombre_usuario = nombre "
            "WHERE nombre_usuario IS NULL;"
        )
        filas_arregladas = cursor.rowcount
        if filas_arregladas > 0:
            print(f"[DB] Migration: {filas_arregladas} usuario(s) sin nombre_usuario corregidos.")

        # ---- Seed: mesas (8 mesas si la tabla esta vacia) ----------
        cursor.execute("SELECT COUNT(*) AS cnt FROM mesas;")
        if cursor.fetchone()['cnt'] == 0:
            for num in range(1, 9):
                cursor.execute(
                    "INSERT OR IGNORE INTO mesas (numero_mesa, estado, capacidad) "
                    "VALUES (?, 'Libre', 4);",
                    (str(num),),
                )
            print("[DB] Seed: 8 mesas creadas.")

        # ---- Seed: admin -------------------------------------------
        cursor.execute("SELECT COUNT(*) AS cnt FROM usuarios;")
        if cursor.fetchone()['cnt'] == 0:
            cursor.execute(
                """
                INSERT INTO usuarios
                    (nombre, nombre_usuario, puesto, permisos,
                     horas_trabajadas, pago_hora, horario, password_hash)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?);
                """,
                (
                    'Administrador General',
                    'Admin',
                    'Administrador',
                    'Total',
                    0, 0.0, '09:00 - 17:00',
                    generate_password_hash('admin123'),
                ),
            )
            print("[DB] Seed: usuario Admin / admin123.")

        # ---- Seed: catalogo ----------------------------------------
        cursor.execute("SELECT COUNT(*) AS cnt FROM productos;")
        if cursor.fetchone()['cnt'] == 0:
            cursor.executemany(
                "INSERT INTO productos "
                "(nombre_producto, precio_venta, categoria, insumos_receta, extras_disponibles) "
                "VALUES (?, ?, ?, '[]', '[]');",
                _PRODUCTOS_SEED,
            )
            print(f"[DB] Seed: {len(_PRODUCTOS_SEED)} productos.")

    print(f"[DB] SQLite inicializado: {DB_PATH}")