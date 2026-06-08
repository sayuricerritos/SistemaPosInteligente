# api-cloud

Microservicio Flask + PostgreSQL para pedidos web de SmartPOS.

Reemplaza ngrok para la conexión web-site (Vercel) → backend.

## Stack

- **API:** Flask + gunicorn → Render
- **BD:** PostgreSQL → Neon
- **Web:** React/Vite → Vercel

## Configuración

1. Copiar `.env.example` a `.env` y completar `DATABASE_URL` con la cadena de Neon.
2. Ejecutar `schema.sql` en Neon para crear tablas.
3. Ejecutar `seed.sql` para cargar productos de ejemplo (opcional).

## Variables de entorno

| Variable       | Descripción                        |
|----------------|------------------------------------|
| `DATABASE_URL` | Connection string de Neon (psycopg2) |

## Endpoints

| Método | Ruta                       | Descripción                        |
|--------|----------------------------|------------------------------------|
| GET    | `/api/health`              | Estado de la API y BD              |
| GET    | `/api/productos`           | Catálogo de productos disponibles  |
| POST   | `/api/pedidos/web`         | Recibir pedido desde la web        |
| GET    | `/api/pedidos/activos`     | Comandas activas (monitor cocina)  |
| POST   | `/api/pedidos/despachar`   | Despachar comanda → estado Listo   |
| POST   | `/api/pedidos/web/cobrar`  | Cobrar pedido → ticket Completado  |

## Deploy en Render

1. Conectar repositorio en Render → New Web Service.
2. Build command: `pip install -r requirements.txt`
3. Start command: `gunicorn app:app`
4. Agregar variable de entorno `DATABASE_URL`.

## Rollback

Cambiar `VITE_API_URL` en Vercel de vuelta a la URL de ngrok.
La app local con SQLite no se ve afectada.

## Pendiente (fase posterior)

- Descuento de inventario en `/api/pedidos/despachar` (requiere tabla insumos).
- Panel de administración cloud.
- Sincronización local ↔ cloud.