import sqlite3
import os

base_dir = os.path.dirname(os.path.abspath(__file__))
DATABASE_PATH = os.path.join(base_dir, 'pos_inteligente.db')

def inicializar_base_de_datos():
    print(f"[SQLITE] Reestructurando base de datos en: {DATABASE_PATH}")
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # ==========================================
    # 1. LIMPIEZA DE TABLAS EXISTENTES
    # ==========================================
    cursor.execute("DROP TABLE IF EXISTS Usuarios;")
    cursor.execute("DROP TABLE IF EXISTS Insumos;")
    cursor.execute("DROP TABLE IF EXISTS Productos;")
    cursor.execute("DROP TABLE IF EXISTS Pedidos;")
    cursor.execute("DROP TABLE IF EXISTS Mesas;")
    
    # ==========================================
    # 2. CREACIÓN DE LAS NUEVAS TABLAS EN PRODUCCIÓN
    # ==========================================
    
    # Tabla de Personal y Nómina
    cursor.execute('''
        CREATE TABLE Usuarios (
            id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            puesto TEXT NOT NULL,
            permisos TEXT NOT NULL,
            horas_trabajadas REAL DEFAULT 0,
            pago_hora REAL NOT NULL,
            horario TEXT
        );
    ''')
    
    # Tabla de Mesas del Local
    cursor.execute('''
        CREATE TABLE Mesas (
            id_mesa INTEGER PRIMARY KEY AUTOINCREMENT,
            numero_mesa TEXT NOT NULL,
            estado TEXT NOT NULL DEFAULT 'Libre',
            capacidad INTEGER DEFAULT 4
        );
    ''')
    
    # Tabla de Almacén e Insumos base
    cursor.execute('''
        CREATE TABLE Insumos (
            id_insumo INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre_insumo TEXT NOT NULL,
            cantidad_actual REAL NOT NULL,
            unidad_medida TEXT NOT NULL,
            stock_minimo REAL NOT NULL
        );
    ''')
    
    # Tabla del Menú de Ventas
    cursor.execute('''
        CREATE TABLE Productos (
            id_producto INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre_producto TEXT NOT NULL,
            precio_venta REAL NOT NULL,
            categoria TEXT NOT NULL,
            insumos_receta TEXT DEFAULT '[]',
            extras_disponibles TEXT DEFAULT '[]' -- <-- COLUMNA INTEGRADA CON ÉXITO       
        );
    ''')

    # Tabla de Pedidos y Comandas
    cursor.execute('''
        CREATE TABLE Pedidos (
            id_pedido INTEGER PRIMARY KEY AUTOINCREMENT,
            numero_mesa TEXT NOT NULL,
            comensales INTEGER DEFAULT 1,
            mesero TEXT,
            subtotal REAL DEFAULT 0.0,
            total REAL DEFAULT 0.0,
            productos TEXT DEFAULT '[]',
            estado TEXT DEFAULT 'En Cocina',
            fecha TEXT
        );
    ''')
    
    # ==========================================
    # 3. POBLADO DE DATOS REALES DE CAFETERÍA
    # ==========================================
    
    print("[SQLITE] Insertando Colaboradores...")
    usuarios = [
        ("Juan Pérez", "Mesero", "Basico", 40.0, 45.0, "07:00 - 15:00"),
        ("María López", "Cajero", "Basico", 42.5, 50.0, "15:00 - 23:00"),
        ("Keren Santana", "Project Manager", "Admin", 48.0, 95.0, "Flexible"),
        ("Sayuri Pérez", "Administrador", "Admin", 48.0, 110.0, "Flexible")
    ]
    cursor.executemany("INSERT INTO Usuarios (nombre, puesto, permisos, horas_trabajadas, pago_hora, horario) VALUES (?,?,?,?,?,?);", usuarios)
    
    print("[SQLITE] Insertando Mapa de Mesas Locales...")
    mesas_iniciales = [
        ("1", "Libre", 2),
        ("2", "Libre", 2),
        ("3", "Ocupada", 4),
        ("4", "Libre", 4),
        ("5", "Libre", 6)
    ]
    cursor.executemany("INSERT INTO Mesas (numero_mesa, estado, capacidad) VALUES (?,?,?);", mesas_iniciales)

    print("[SQLITE] Insertando Almacén de Materias Primas...")
    insumos = [
        ("Café de Grano Espresso Arábica", 10.0, "kg", 3.0),
        ("Leche Entera Santa Clara", 30.0, "L", 8.0),
        ("Leche de Almendra Silk", 12.0, "L", 4.0),
        ("Jarabe de Vainilla Francesa", 5.0, "Pzas", 1.0),
        ("Jarabe de Caramelo", 4.0, "Pzas", 1.0),
        ("Chocolate Líquido Hershey", 6.0, "kg", 1.5),
        ("Vasos Térmicos 12oz", 300.0, "Pzas", 50.0),
        ("Harina Preparada Repostería", 15.0, "kg", 4.0)
    ]
    cursor.executemany("INSERT INTO Insumos (nombre_insumo, cantidad_actual, unidad_medida, stock_minimo) VALUES (?,?,?,?);", insumos)
    
    # Arreglado e para que case con la tabla de arriba
    print("[SQLITE] Insertando Menú Base de la Cafetería...")
    productos_base = [
        ("Espresso Americano", 35.0, "Bebidas Calientes", "[1, 7]"),
        ("Capuccino Tradicional", 45.0, "Bebidas Calientes", "[1, 2, 7]"),
        ("Latte Vainilla", 50.0, "Bebidas Calientes", "[1, 2, 4, 7]"),
        ("Moka Frío Express", 55.0, "Bebidas Frías", "[1, 2, 6, 7]"),
        ("Croissant Mantequilla", 30.0, "Panadería", "[8]"),
        ("Cheesecake de Frambuesa", 45.0, "Panadería", "[]")
    ]
    cursor.executemany("INSERT INTO Productos (nombre_producto, precio_venta, categoria, insumos_receta) VALUES (?,?,?,?);", productos_base)
    
    print("[SQLITE] Inyectando Comanda Activa de Prueba...")
    import datetime
    ahora = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute('''
        INSERT INTO Pedidos (numero_mesa, comensales, mesero, subtotal, total, productos, estado, fecha)
        VALUES ('3', 2, 'Juan Pérez', 80.0, 80.0, 
        '[{"nombre_producto": "Capuccino Tradicional", "precio_venta": 45.0, "cantidad": 1, "modificadores": {"base": "Leche Entera"}}, {"nombre_producto": "Espresso Americano", "precio_venta": 35.0, "cantidad": 1, "modificadores": {}}]', 
        'En Cocina', ?);
    ''', (ahora,))

    # ==========================================
    # 4. COMMITEAR Y CERRAR AL FINAL DE TODO
    # ==========================================
    conn.commit()
    conn.close()
    print("¡[ÉXITO TOTAL] Base de datos de cafetería sincronizada y guardada de forma perfecta!")

if __name__ == '__main__':
    inicializar_base_de_datos()