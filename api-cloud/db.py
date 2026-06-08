import os
import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_URL = os.environ.get("DATABASE_URL")


def get_connection():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)


def init_db():
    """Crea las tablas si no existen. Idempotente — seguro llamar en cada arranque."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS productos (
                    id                  SERIAL PRIMARY KEY,
                    nombre_producto     TEXT NOT NULL,
                    precio_venta        NUMERIC(10,2) NOT NULL,
                    categoria           TEXT,
                    insumos_receta      JSONB NOT NULL DEFAULT '[]',
                    extras_disponibles  JSONB NOT NULL DEFAULT '[]',
                    disponible          BOOLEAN NOT NULL DEFAULT TRUE
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS pedidos (
                    id           SERIAL PRIMARY KEY,
                    numero_mesa  TEXT NOT NULL,
                    subtotal     NUMERIC(10,2) NOT NULL DEFAULT 0,
                    total        NUMERIC(10,2) NOT NULL DEFAULT 0,
                    productos    JSONB NOT NULL DEFAULT '[]',
                    estado       TEXT NOT NULL DEFAULT 'En Cocina',
                    fecha        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    metodo_pago  TEXT NOT NULL DEFAULT 'Web',
                    tipo         TEXT NOT NULL DEFAULT 'comanda'
                )
            """)
        conn.commit()