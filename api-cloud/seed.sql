-- seed.sql
-- Productos de ejemplo para pruebas en Neon.
-- Ejecutar una sola vez después de schema.sql.
-- Nombres y precios son ilustrativos; ajustar según menú real.

INSERT INTO productos (nombre_producto, precio_venta, categoria, insumos_receta, extras_disponibles)
VALUES
    ('Cafe Americano',    40.00, 'Bebidas Calientes', '[]', '[]'),
    ('Cafe Latte',        50.00, 'Bebidas Calientes', '[]', '[]'),
    ('Capuchino',         50.00, 'Bebidas Calientes', '[]', '[]'),
    ('Te Verde',          35.00, 'Bebidas Calientes', '[]', '[]'),
    ('Jugo de Naranja',   45.00, 'Bebidas Frias',     '[]', '[]'),
    ('Sandwich Jamon',    65.00, 'Alimentos',         '[]', '[]'),
    ('Sandwich Atun',     65.00, 'Alimentos',         '[]', '[]'),
    ('Ensalada Mixta',    70.00, 'Alimentos',         '[]', '[]'),
    ('Croissant',         40.00, 'Panaderia',         '[]', '[]'),
    ('Muffin Chocolate',  38.00, 'Panaderia',         '[]', '[]')
ON CONFLICT DO NOTHING;