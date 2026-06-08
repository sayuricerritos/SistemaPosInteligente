# API Cloud — SmartPOS Pedidos Web

**Rama:** `feature/cloud-api-postgres`
**Fecha:** 2026-06-07
**Estado:** Diagnóstico completado, implementación en progreso
**Objetivo:** Eliminar ngrok exponiendo la API de pedidos web en Render + Neon PostgreSQL

---

## Decisión técnica: Opción A — Microservicio separado

Se optó por crear `api-cloud/` como microservicio Flask independiente
en lugar de migrar `desktop-app/backend` a PostgreSQL.

### Razones:

1. `desktop-app/backend` tiene ~60 queries con placeholders `?` (SQLite),
   `datetime('now')`, `PRAGMA`, `sqlite3.Row`, `strftime` — migrar todo
   implicaría 2-3 días y riesgo alto de regresión en el sistema estable.

2. El sistema local (Mesas, Inventario, Administración) sigue en SQLite
   y no necesita nube — es un sistema de punto de venta desktop.

3. La rama es experimental. Si no queda lista antes de entrega,
   `main` conserva la versión estable con ngrok.

### Reglas de la rama:

- NO modificar `desktop-app/backend/` ni `desktop-app/frontend/`
  salvo aprobación explícita.
- NO migrar database.py actual a PostgreSQL.
- `main` siempre debe estar deployable con ngrok como fallback.
- Si la rama falla, se abandona sin merge.

---

## Arquitectura objetivo

```
Cliente (web)
    |
    v
Vercel (web-site)
    |  VITE_API_URL = https://smartpos-api.onrender.com
    v
Render (api-cloud/ Flask)
    |
    v
Neon (PostgreSQL)
    |  tablas: productos, pedidos, insumos
    v
Monitor Cocina (desktop-app Pedidos.jsx)
    |  apunta a Render para endpoints de pedidos web
    |  sigue apuntando a localhost para el resto
    v
Cobro -> ticket -> Administracion
```

---

## Inventario de incompatibilidades SQLite -> PostgreSQL

Documentadas para referencia. El microservicio `api-cloud/` usa
`psycopg2` directamente (sin intentar compatibilidad con SQLite):

| Sintaxis SQLite | En api-cloud/ | Notas |
|---|---|---|
| `?` placeholders | `%s` (psycopg2) | Cambio sistematico |
| `datetime('now')` | `NOW()` | SQL estandar |
| `PRAGMA foreign_keys` | No necesaria | PG siempre activa |
| `PRAGMA journal_mode=WAL` | No aplica | Solo SQLite |
| `PRAGMA table_info()` | `information_schema` | Solo en migraciones |
| `INSERT OR IGNORE` | `INSERT ... ON CONFLICT DO NOTHING` | PG 9.5+ |
| `ON CONFLICT(col) DO UPDATE` | Igual | PG 9.5+ OK |
| `CAST(strftime('%w', fecha))` | `EXTRACT(DOW FROM fecha)` | Solo en IA prediccion |
| `AUTOINCREMENT` | `SERIAL` o `GENERATED ALWAYS AS IDENTITY` | En CREATE TABLE |
| `sqlite3.Row` | `RealDictCursor` (psycopg2) | Acceso por nombre de columna |

---

## Tablas minimas en Neon

```sql
-- Solo lo necesario para el flujo web de pedidos:
productos  -- catalogo visible en web-site
pedidos    -- comandas y tickets web
insumos    -- descuento de inventario al despachar (opcional para demo)
```

No se migran:
- `mesas`, `snapshots_mesa` — solo desktop
- `usuarios`, `sesiones` — endpoints web son publicos
- `gastos`, `cortes_historicos`, `auditoria` — solo desktop/administracion

---

## Endpoints a implementar en api-cloud/

| Metodo | Endpoint | Descripcion |
|---|---|---|
| GET | `/api/productos` | Catalogo para web-site |
| POST | `/api/pedidos/web` | Recibir pedido desde web-site |
| GET | `/api/pedidos/activos` | Monitor de Cocina desktop |
| POST | `/api/pedidos/despachar` | Cocina despacha -> descuenta insumos |
| POST | `/api/pedidos/web/cobrar` | Cajero cobra -> genera ticket |

---

## Archivos a crear en api-cloud/

```
api-cloud/
├── app.py              # Flask app + endpoints
├── db.py               # Conexion psycopg2 con DATABASE_URL
├── requirements.txt    # Flask, gunicorn, psycopg2-binary
├── Procfile            # web: gunicorn app:app
├── schema.sql          # CREATE TABLE para Neon
├── seed.py             # Poblar productos e insumos desde SQLite o JSON
└── PLAN.md             # Este archivo
```

---

## Variables de entorno necesarias

### En Render:
```
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/smartpos?sslmode=require
FLASK_ENV=production
```

### En Vercel:
```
VITE_API_URL=https://smartpos-api.onrender.com
```

### En desktop Pedidos.jsx (si apunta a Render para pedidos web):
```javascript
const API_COCINA = import.meta.env.VITE_API_COCINA_URL || 'http://127.0.0.1:5000'
```

---

## Consideraciones de deploy en Render (free tier)

- **Cold start:** primer request despues de inactividad tarda 30-60s
- **Mitigacion:** usar UptimeRobot o similar para hacer ping cada 10 min
- **SSL:** Neon requiere `sslmode=require` en la connection string
- **Gunicorn:** comando de arranque `gunicorn app:app --bind 0.0.0.0:$PORT`
- **CORS:** permitir `https://sistema-pos-inteligente.vercel.app` y `http://localhost:5173`

---

## Estado de commits

- [x] Commit 1: rama + diagnostico (este archivo)
- [ ] Commit 2: `api-cloud/app.py` con endpoints minimos
- [ ] Commit 3: `schema.sql` + `seed.py` para Neon
- [ ] Commit 4: `Pedidos.jsx` usa `VITE_API_COCINA_URL` para pedidos web
- [ ] Commit 5: deploy Render + Vercel apunta a Render
- [ ] Commit 6: validacion + documentacion final

---

## Criterio de exito

La demo funciona sin ngrok:
1. Cliente ordena en web (Vercel)
2. Pedido aparece en Monitor Cocina (desktop apuntando a Render)
3. Cocina despacha -> inventario online descontado
4. Pedido queda "Listo"
5. Cajero cobra -> ticket generado en BD online

---

## Doble fuente de verdad — riesgo documentado

Los pedidos de Mesas y Para Llevar iran a SQLite local.
Los pedidos web iran a PostgreSQL online.
El corte diario del desktop solo incluira los pedidos locales.
Esto es aceptable para la demo pero no para produccion real.
