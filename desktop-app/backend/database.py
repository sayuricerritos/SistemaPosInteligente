"""
Gestor de conexiones PostgreSQL con pooling
Migración desde SQLite a Neon.tech
"""

import psycopg2
from psycopg2 import pool, extras, Error
from contextlib import contextmanager
from config import Config

# Pool de conexiones global
connection_pool = None

def init_db_pool():
    """
    Inicializa el pool de conexiones a PostgreSQL
    Se ejecuta al arrancar la aplicación
    """
    global connection_pool
    
    try:
        connection_pool = psycopg2.pool.SimpleConnectionPool(
            Config.DB_POOL_MIN_CONN,
            Config.DB_POOL_MAX_CONN,
            Config.DATABASE_URL,
            cursor_factory=extras.RealDictCursor  # Retorna dicts en vez de tuplas
        )
        
        if connection_pool:
            print("Pool de conexiones PostgreSQL inicializado")
            print(f"  Conexiones: {Config.DB_POOL_MIN_CONN} mín / {Config.DB_POOL_MAX_CONN} máx")
            
            # Test de conexión
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT version();")
                version = cursor.fetchone()
                print(f"   PostgreSQL: {version['version'].split(',')[0]}")
            
            return connection_pool
        else:
            raise Exception("No se pudo crear el pool de conexiones")
            
    except Error as e:
        print(f" Error inicializando pool de PostgreSQL: {e}")
        print(f"    Verifica tu DATABASE_URL en .env")
        raise

@contextmanager
def get_db_connection():
    """
    Context manager para obtener conexión del pool
    
    Uso:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM productos")
            productos = cursor.fetchall()
    
    Maneja automáticamente:
    - Obtener conexión del pool
    - Commit si no hay errores
    - Rollback si hay excepciones
    - Devolver conexión al pool
    """
    if not connection_pool:
        raise Exception("Pool no inicializado. Ejecuta init_db_pool() primero")
    
    conn = connection_pool.getconn()
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        print(f" Error en transacción: {e}")
        raise
    finally:
        connection_pool.putconn(conn)

def execute_query(query, params=None, fetch=True):
    """
    Ejecuta query con manejo automático de conexiones
    
    Args:
        query (str): SQL query con placeholders %s
        params (tuple): Parámetros para el query
        fetch (bool): Si True, retorna resultados. Si False, solo ejecuta.
    
    Returns:
        list[dict]: Resultados si fetch=True
        int: Número de filas afectadas si fetch=False
    
    Ejemplo SELECT:
        productos = execute_query(
            "SELECT * FROM productos WHERE categoria = %s",
            ('Bebidas',)
        )
    
    Ejemplo INSERT:
        execute_query(
            "INSERT INTO productos (nombre, precio) VALUES (%s, %s)",
            ('Café Latte', 45.00),
            fetch=False
        )
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(query, params or ())
        
        if fetch:
            results = cursor.fetchall()
            # Convertir RealDictRow a dict estándar para JSON
            return [dict(row) for row in results]
        else:
            return cursor.rowcount

def init_database():
    """
    Crea el esquema de base de datos si no existe
    Se ejecuta al arrancar la aplicación
    """
    
    schema = """
    -- ================================================
    -- TABLA: productos
    -- ================================================
    CREATE TABLE IF NOT EXISTS productos (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        precio DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
        categoria VARCHAR(50),
        stock INTEGER DEFAULT 0 CHECK (stock >= 0),
        imagen_url TEXT,
        activo BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- ================================================
    -- TABLA: pedidos
    -- ================================================
    CREATE TABLE IF NOT EXISTS pedidos (
        id SERIAL PRIMARY KEY,
        cliente_nombre VARCHAR(100),
        cliente_mesa VARCHAR(20),
        cliente_telefono VARCHAR(15),
        total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
        estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'preparando', 'listo', 'entregado', 'cancelado')),
        notas TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- ================================================
    -- TABLA: pedido_items
    -- ================================================
    CREATE TABLE IF NOT EXISTS pedido_items (
        id SERIAL PRIMARY KEY,
        pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
        producto_id INTEGER NOT NULL REFERENCES productos(id),
        cantidad INTEGER NOT NULL CHECK (cantidad > 0),
        precio_unitario DECIMAL(10,2) NOT NULL CHECK (precio_unitario >= 0),
        subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0)
    );
    
    -- ================================================
    -- ÍNDICES para mejorar performance
    -- ================================================
    CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado);
    CREATE INDEX IF NOT EXISTS idx_pedidos_fecha ON pedidos(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);
    CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo);
    CREATE INDEX IF NOT EXISTS idx_pedido_items_pedido ON pedido_items(pedido_id);
    
    -- ================================================
    -- TRIGGER para actualizar updated_at automáticamente
    -- ================================================
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    DROP TRIGGER IF EXISTS update_productos_updated_at ON productos;
    CREATE TRIGGER update_productos_updated_at
        BEFORE UPDATE ON productos
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    
    DROP TRIGGER IF EXISTS update_pedidos_updated_at ON pedidos;
    CREATE TRIGGER update_pedidos_updated_at
        BEFORE UPDATE ON pedidos
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    """
    
    try:
        execute_query(schema, fetch=False)
        print(" Esquema de base de datos verificado/creado")
        
        # Insertar datos de prueba si la tabla está vacía
        count = execute_query("SELECT COUNT(*) as count FROM productos")[0]['count']
        
        if count == 0:
            print("📦 Insertando productos de ejemplo...")
            productos_ejemplo = [
                ('Café Americano', 35.00, 'Bebidas Calientes', 100),
                ('Café Latte', 45.00, 'Bebidas Calientes', 100),
                ('Cappuccino', 45.00, 'Bebidas Calientes', 100),
                ('Frappé de Vainilla', 55.00, 'Bebidas Frías', 80),
                ('Croissant', 40.00, 'Panadería', 50),
                ('Muffin de Arándanos', 38.00, 'Panadería', 50),
            ]
            
            for nombre, precio, cat, stock in productos_ejemplo:
                execute_query(
                    "INSERT INTO productos (nombre, precio, categoria, stock) VALUES (%s, %s, %s, %s)",
                    (nombre, precio, cat, stock),
                    fetch=False
                )
            print(f" {len(productos_ejemplo)} productos insertados")
        
    except Exception as e:
        print(f"❌ Error creando esquema: {e}")
        raise

def close_db_pool():
    """
    Cierra todas las conexiones del pool
    Se ejecuta al cerrar la aplicación
    """
    if connection_pool:
        connection_pool.closeall()
        print("✅ Pool de conexiones cerrado correctamente")