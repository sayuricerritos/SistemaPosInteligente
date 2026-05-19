import sqlite3
import os
from datetime import datetime, timedelta

def insert_seed_data():
    db_path = os.path.join('database', 'pos_inteligente.db')
    
    if not os.path.exists(db_path):
        print("[Error] La base de datos no existe. Ejecuta primero init_db.py")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    print("[SQLite] Insertando datos de prueba para la demo...")

    # 1. Insertar Empleados (Pines de acceso ficticios)
    empleados = [
        ('Sayuri Perez', 'Administrador', '1234', 'Activo'),
        ('Francisco Martinez', 'Ingeniero IA', '5678', 'Activo'),
        ('Alexis Castro', 'Cajero', '0000', 'Activo')
    ]
    cursor.executemany("INSERT INTO Empleados (nombre, rol, pin_acceso, estado) VALUES (?, ?, ?, ?);", empleados)

    # 2. Insertar Mesas
    mesas = [(1, 4, 'Disponible'), (2, 2, 'Disponible'), (3, 6, 'Ocupada')]
    cursor.executemany("INSERT INTO Mesas (numero_mesa, capacidad, estado) VALUES (?, ?, ?);", mesas)

    # 3. Insertar Productos (Menú de la Demo)
    productos = [
        ('Platillo Especial Tipo A', 'Alimentos', 150.00, 1),
        ('Bebida Artesanal Grande', 'Bebidas', 45.00, 1),
        ('Postre de la Casa', 'Postres', 65.00, 1)
    ]
    cursor.executemany("INSERT INTO Productos (nombre_producto, categoria, precio_venta, disponible) VALUES (?, ?, ?, ?);", productos)

    # 4. Insertar Insumos (Inventario Base)
    insumos = [
        ('Insumo Base Proteína', 50.0, 'Kg', 10.0),
        ('Insumo Base Grano', 100.0, 'Kg', 20.0),
        ('Jarabe Endulzante', 20.0, 'Litros', 5.0)
    ]
    cursor.executemany("INSERT INTO Insumos (nombre_insumo, stock_actual, unidad_medida, nivel_minimo) VALUES (?, ?, ?, ?);", insumos)

    # 5. Insertar Recetas (Relación Producto e Insumo)
    # Platillo A (id_producto=1) usa 0.250 kg de Proteína (id_insumo=1) y 0.100 kg de Grano (id_insumo=2)
    recetas = [
        (1, 1, 0.250),
        (1, 2, 0.100),
        (2, 3, 0.050)  # Bebida usa 0.050L de Jarabe
    ]
    cursor.executemany("INSERT INTO Recetas (id_producto, id_insumo, cantidad_requerida) VALUES (?, ?, ?);", recetas)

    # 6. Insertar Alerta Predictiva Simulada (Para probar la UI del módulo IA)
    fecha_hoy = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    fecha_alerta = (datetime.now() + timedelta(days=3)).strftime('%Y-%m-%d')
    
    cursor.execute("""
        INSERT INTO Alertas_IA (id_insumo, fecha_prediccion, fecha_agotamiento_estimada, mensaje)
        VALUES (1, ?, ?, 'Alerta IA: Se estima desabasto de Insumo Base Proteína en los próximos 3 días debido a alta demanda proyectada.');
    """, (fecha_hoy, fecha_alerta))

    conn.commit()
    conn.close()
    print("[SQLite] ¡Datos de prueba insertados con éxito!")

if __name__ == '__main__':
    insert_seed_data()