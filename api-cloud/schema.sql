-- schema.sql
-- PostgreSQL schema para api-cloud (Neon)
-- Solo tablas necesarias para pedidos web. Sin usuarios, sesiones,
-- insumos, mesas ni auditoría — esos siguen en el backend local.

CREATE TABLE IF NOT EXISTS productos (
    id                  SERIAL PRIMARY KEY,
    nombre_producto     TEXT NOT NULL,
    precio_venta        NUMERIC(10,2) NOT NULL,
    categoria           TEXT,
    insumos_receta      JSONB NOT NULL DEFAULT '[]',
    extras_disponibles  JSONB NOT NULL DEFAULT '[]',
    disponible          BOOLEAN NOT NULL DEFAULT TRUE
);

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
);

-- estados válidos de pedidos:
--   'En Cocina'  → comanda recibida, pendiente de despacho
--   'Listo'      → despachada, pendiente de cobro
--   'Completado' → cobrada / cerrada

-- tipos válidos:
--   'comanda' → orden de cocina
--   'ticket'  → registro financiero (creado al cobrar)