import sqlite3
import os

def create_database():
    # Definir la ruta del archivo de la base de datos
    db_path = os.path.join('database', 'pos_inteligente.db')
    
    # Asegurar que la carpeta 'database' exista
    os.makedirs('database', exist_ok=True)
    
    # Conectar (o crear) la base de datos
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("[SQLite] Inicializando la creación de tablas...")

    # 1. Módulo Administrativo y de Personal
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS Empleados (
        id_empleado INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        rol TEXT NOT NULL,
        pin_acceso TEXT NOT NULL,
        estado TEXT NOT NULL
    );
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS Registro_Horas (
        id_registro INTEGER PRIMARY KEY AUTOINCREMENT,
        id_empleado INTEGER NOT NULL,
        hora_entrada TEXT NOT NULL,
        hora_salida TEXT,
        horas_totales REAL,
        FOREIGN KEY (id_empleado) REFERENCES Empleados(id_empleado)
    );
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS Cortes_Caja (
        id_corte INTEGER PRIMARY KEY AUTOINCREMENT,
        id_empleado INTEGER NOT NULL,
        fecha_hora TEXT NOT NULL,
        total_sistema REAL NOT NULL,
        total_fisico REAL NOT NULL,
        diferencia REAL NOT NULL,
        FOREIGN KEY (id_empleado) REFERENCES Empleados(id_empleado)
    );
    ''')

    # 2. Módulo de Pedidos Presenciales
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS Mesas (
        id_mesa INTEGER PRIMARY KEY AUTOINCREMENT,
        numero_mesa INTEGER NOT NULL UNIQUE,
        capacidad INTEGER NOT NULL,
        estado TEXT NOT NULL
    );
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS Pedidos (
        id_pedido INTEGER PRIMARY KEY AUTOINCREMENT,
        id_empleado INTEGER NOT NULL,
        id_mesa INTEGER,
        fecha_hora TEXT NOT NULL,
        total REAL NOT NULL,
        estado TEXT NOT NULL,
        FOREIGN KEY (id_empleado) REFERENCES Empleados(id_empleado),
        FOREIGN KEY (id_mesa) REFERENCES Mesas(id_mesa)
    );
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS Detalles_Pedido (
        id_detalle INTEGER PRIMARY KEY AUTOINCREMENT,
        id_pedido INTEGER NOT NULL,
        id_producto INTEGER NOT NULL,
        cantidad INTEGER NOT NULL,
        subtotal REAL NOT NULL,
        FOREIGN KEY (id_pedido) REFERENCES Pedidos(id_pedido),
        FOREIGN KEY (id_producto) REFERENCES Productos(id_producto)
    );
    ''')

    # 3. Módulo de Menú e Inventario
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS Productos (
        id_producto INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre_producto TEXT NOT NULL,
        categoria TEXT NOT NULL,
        precio_venta REAL NOT NULL,
        disponible INTEGER NOT NULL -- Usamos 1 para True, 0 para False en SQLite
    );
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS Insumos (
        id_insumo INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre_insumo TEXT NOT NULL,
        stock_actual REAL NOT NULL,
        unidad_medida TEXT NOT NULL,
        nivel_minimo REAL NOT NULL
    );
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS Recetas (
        id_producto INTEGER NOT NULL,
        id_insumo INTEGER NOT NULL,
        cantidad_requerida REAL NOT NULL,
        PRIMARY KEY (id_producto, id_insumo),
        FOREIGN KEY (id_producto) REFERENCES Productos(id_producto),
        FOREIGN KEY (id_insumo) REFERENCES Insumos(id_insumo)
    );
    ''')

    # 4. Módulo de IA Predictiva
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS Alertas_IA (
        id_alerta INTEGER PRIMARY KEY AUTOINCREMENT,
        id_insumo INTEGER NOT NULL,
        fecha_prediccion TEXT NOT NULL,
        fecha_agotamiento_estimada TEXT NOT NULL,
        mensaje TEXT NOT NULL,
        FOREIGN KEY (id_insumo) REFERENCES Insumos(id_insumo)
    );
    ''')

    # Guardar cambios y cerrar conexión
    conn.commit()
    conn.close()
    print("[SQLite] ¡Base de datos y tablas creadas exitosamente en 'database/pos_inteligente.db'!")

if __name__ == '__main__':
    create_database()