# Auditoría Interna - SmartPOS Sistema de Ventas

**Última actualización:** 2026-06-07  
**Estado General:** En Progreso - Sesión Simple Completada, Persistencia de Mesas Completada

---

## ✅ COMPLETADO: Prevención de Doble Click / Loading

Todos los formularios y acciones críticas están protegidos contra ejecuciones duplicadas:

### Frontend - Protecciones por componente:

| Componente | Acción Protegida | Mecanismo | Estado |
|---|---|---|---|
| **Pedidos.jsx** | Despachar | Estado por `id_pedido` | ✅ |
| **Inventario.jsx** | Confirmar Carga | Loading flag | ✅ |
| **Inventario.jsx** | Registrar Merma | Loading flag | ✅ |
| **Inventario.jsx** | Registrar Insumo | Loading flag | ✅ |
| **Llevar.jsx** | Emitir Ticket | Protección contra doble click | ✅ |
| **Llevar.jsx** | Venta Directa | Protección contra doble click | ✅ |
| **Mesas.jsx** | Mandar Cocina | Estado protegido | ✅ |
| **Mesas.jsx** | Pagar/Cerrar Cuenta | Estado protegido | ✅ |
| **Menu.jsx** | Guardar Producto | Estado `guardando` | ✅ |
| **Menu.jsx** | Guardar Receta | Estado `guardando` | ✅ |
| **Menu.jsx** | Guardar Extras | Estado `guardando` | ✅ |
| **Usuarios.jsx** | Guardar Registro | Estado `guardandoUsuario` | ✅ |
| **Usuarios.jsx** | Eliminar Usuario | `await confirmar()` + `notificar()` | ✅ |
| **Administracion.jsx** | Ejecutar Corte | Loading flag | ✅ |

### Dialogo UI Replacements:

- `Usuarios.jsx`: ✅ `window.confirm()` → `await confirmar()`
- `Usuarios.jsx`: ✅ `alert()` → `notificar()` (líneas 94, 104)
- Hook `useDialogo` instanciado correctamente en todos los componentes que lo requieren

---

## ✅ COMPLETADO: Sesión Simple (Token + Validación)

### Implementación:

**Base de Datos:**
- ✅ Tabla `sesiones` con: token (UNIQUE), id_usuario, permisos, puesto, nombre_usuario, created_at, expires_at, last_activity, ip_address, user_agent
- ✅ 3 índices idiopotentes: idx_sesiones_token, idx_sesiones_id_usuario, idx_sesiones_expires_at
- ✅ FOREIGN KEY hacia usuarios(id) ON DELETE CASCADE

**Backend - Login:**
- ✅ `POST /api/auth/login` → genera token con `secrets.token_urlsafe(32)`
- ✅ Token expira en 8 horas (expires_at = now + 8h)
- ✅ Token se devuelve en JSON: `{ "status": "Authenticated", "token": "...", ... }`
- ✅ Login sin protección, cualquiera puede loginear

**Backend - Decoradores:**
- ✅ `@validar_sesion` - Valida token, devuelve 401 si inválido/expirado, inyecta usuario_sesion
- ✅ `@requiere_admin` - Valida token + permisos == 'Total', devuelve 403 si sin permisos
- ✅ `@requiere_permiso(permiso)` - Parametrizado para validar permisos específicos
- ✅ Ubicación: `routes/decoradores.py` (220 líneas)

**Backend - Endpoints Protegidos:**
- ✅ `GET /api/usuarios` → @requiere_admin
- ✅ `POST /api/usuarios/guardar` → @requiere_admin
- ✅ `DELETE /api/usuarios/<id>` → @requiere_admin
- ✅ `POST /api/administracion/ejecutar-corte` → @requiere_admin
- ✅ `GET/POST /api/administracion/gastos` → @requiere_admin

**Backend - Endpoints Públicos (Sin Protección):**
- ✅ `POST /api/auth/login` - Sin protección
- ✅ `GET /api/administracion/corte-diario` - Sin protección
- ✅ `GET /api/administracion/tickets` - Sin protección
- ✅ `GET /api/administracion/cortes-historicos` - Sin protección
- ✅ `GET /api/administracion/cortes-historicos/fecha/<fecha>` - Sin protección

**Frontend - Helper apiFetch:**
- ✅ Archivo: `helpers/apiFetch.js` (29 líneas)
- ✅ Función: `apiFetch(url, options = {}, usuario = null)`
- ✅ Agrega header automáticamente: `X-Session-Token: usuario.token`
- ✅ Mantiene headers existentes, agrega Content-Type por defecto
- ✅ Retorna fetch normal sin cambios en comportamiento

**Frontend - Integración:**
- ✅ `App.jsx` → pasa usuario prop a `<Usuarios usuario={usuario} />`
- ✅ `App.jsx` → pasa usuario prop a `<Administracion usuario={usuario} />`
- ✅ `App.jsx` → pasa usuario prop a `<Menu usuario={usuario} />`
- ✅ `App.jsx` → pasa usuario prop a `<Inventario usuario={usuario} />`
- ✅ `App.jsx` → pasa usuario prop a `<Configuracion usuario={usuario} />`
- ✅ `Usuarios.jsx` → recibe usuario en firma, usa apiFetch en 3 requests
- ✅ `Administracion.jsx` → recibe usuario en firma, usa apiFetch en 6 requests
- ✅ `Menu.jsx` → recibe usuario en firma, usa apiFetch en 7 requests
- ✅ `Inventario.jsx` → recibe usuario en firma, usa apiFetch en 3 requests
- ✅ `Configuracion.jsx` → recibe usuario en firma, usa apiFetch en 2 requests

**Validación Manual:**
- ✅ Cajero: solo ve Mesas, Llevar, Monitor (sin acceso Admin)
- ✅ Cajero: botones de admin ocultos en UI
- ✅ Cajero: intenta API directa → recibe 403 Forbidden
- ✅ Admin: puede acceder a Usuarios, Administración, Menu, Inventario, Configuración
- ✅ Admin: puede crear/editar/eliminar usuarios, productos, insumos, parámetros
- ✅ Admin: puede registrar gastos, ejecutar corte, vincular recetas y extras
- ✅ Requests incluyen header X-Session-Token automáticamente en todas las operaciones
- ✅ Headers validados en Network tab del navegador
- ✅ Responses 403 Forbidden correctos para intentos sin permisos
- ✅ Pruebas manuales exitosas sin modificar código

---

## ✅ COMPLETADO: Inventario/Menu/Configuración Protegidos

### Backend - Endpoints Protegidos (Inventario):
- ✅ `POST /api/inventario/nuevo` → @requiere_admin (crear insumo)
- ✅ `POST /api/inventario/ajustar` → @requiere_admin (ajustar stock)
- ✅ `GET /api/inventario` → Público (Menu y Mesas lo consultan)

### Backend - Endpoints Protegidos (Productos/Menu):
- ✅ `POST /api/productos` → @requiere_admin (crear producto)
- ✅ `PUT /api/productos/<id>` → @requiere_admin (editar producto)
- ✅ `DELETE /api/productos/<id>` → @requiere_admin (eliminar producto)
- ✅ `POST /api/productos/guardar-receta` → @requiere_admin (vincular insumos)
- ✅ `POST /api/productos/guardar-extras` → @requiere_admin (asignar extras)
- ✅ `GET /api/productos` → Público (Menu, Mesas, Para Llevar lo consultan)

### Backend - Endpoints Protegidos (Configuración):
- ✅ `POST /api/configuracion` → @requiere_admin (modificar parámetros)
- ✅ `GET /api/configuracion` → Público (cualquier pantalla puede leer config)

### Frontend - apiFetch Integrado:
- ✅ `Menu.jsx` → 7 requests con X-Session-Token automático
- ✅ `Inventario.jsx` → 3 requests con X-Session-Token automático
- ✅ `Configuracion.jsx` → 2 requests con X-Session-Token automático

### Resultados de Pruebas Manuales:
- ✅ Admin: acceso completo a Inventario, Menu, Configuración
- ✅ Admin: puede crear/editar/eliminar en todos los módulos
- ✅ Cajero: no ve módulos administrativos (botones ocultos en UI)
- ✅ Cajero: intentos API directo devuelven 403 Forbidden
- ✅ Requests incluyen X-Session-Token en Network tab
- ✅ Respuestas 401/403 correctas para usuarios sin permisos

---

## ✅ COMPLETADO: Persistencia de Mesas Activas (snapshots_mesa)

### Contexto del Problema:
`mesas_activas` vivía exclusivamente en memoria (`state.py`). Al reiniciar Flask con mesas abiertas, se perdían: mesero, comensales, lista de productos y subtotal. La tabla `mesas` SQLite conservaba el estado `Ocupada`, pero sin los datos de la sesión.

### Solución Implementada (Opción C: Snapshot JSON):

**Base de Datos:**
- ✅ Tabla `snapshots_mesa` con: `numero_mesa TEXT PRIMARY KEY`, `snapshot_json TEXT NOT NULL`, `updated_at TEXT DEFAULT CURRENT_TIMESTAMP`
- ✅ Idempotente con `CREATE TABLE IF NOT EXISTS`

**Backend - Helpers (`routes/mesas.py`):**
- ✅ `_guardar_snapshot_mesa(numero_mesa)` — UPSERT con `ON CONFLICT` después de serializar `mesas_activas[num]`
- ✅ `_borrar_snapshot_mesa(numero_mesa)` — DELETE al cerrar mesa exitosamente
- ✅ `restaurar_mesas_desde_snapshots()` — Lee tabla, json.loads, puebla mesas_activas; JSON corrupto → skip + log

**Integración en flujo normal (`routes/mesas.py`):**
- ✅ `abrir_mesa()` → llama `_guardar_snapshot_mesa()` después de poblar dict
- ✅ `comandar_mesa()` → llama `_guardar_snapshot_mesa()` después de extender productos y recalcular subtotal
- ✅ `cerrar_mesa()` → llama `_borrar_snapshot_mesa()` después de crear ticket y liberar mesa

**Startup (`main.py`):**
- ✅ `restaurar_mesas_desde_snapshots()` llamada una sola vez después de `init_database()`
- ✅ Solo en bloque `__main__`, no por cada request

**Garantías:**
- ✅ Sin doble ticket: snapshot solo guarda estado en memoria, ticket se crea en `cerrar_mesa()` como siempre
- ✅ Sin doble descuento de inventario: inventario se descuenta en `despachar()`, snapshot no toca insumos
- ✅ Restauración no crea tickets ni modifica inventario

### Commits:
1. ✅ `database: crear tabla snapshots de mesas` (fa9785a)
2. ✅ `backend: agregar helpers de snapshot de mesas` (17a795d)
3. ✅ `backend: guardar snapshot al abrir y comandar mesa` (b7ef906)
4. ✅ `backend: borrar snapshot al cerrar mesa` (5c9a5bc)
5. ✅ `backend: restaurar mesas activas al iniciar` (13b8f78)

### Validación Manual:
- ✅ Prueba 1: mesa abierta se restaura después de reiniciar Flask
- ✅ Prueba 2: mesa con varias comandas conserva productos y subtotal
- ✅ Prueba 3: cerrar mesa después de restaurar genera un solo ticket
- ✅ Prueba 4: mesa cerrada no reaparece después de reiniciar
- ✅ Prueba 5: varias mesas abiertas se restauran correctamente

---

## ✅ COMPLETADO: Inconsistencia de Comensales en Mesas

### Problema original:
El badge en las tarjetas de mesa mostraba "Capacidad: 4 asientos" (hardcodeado en backend), pero el input del modal de apertura aceptaba hasta 5 comensales (`max="5"`). La columna `capacidad` existía en SQLite con `DEFAULT 4` pero nunca se leía.

### Solución:
**Backend (`mesas.py`):**
- ✅ `obtener_mesas()`: SELECT ahora incluye `capacidad` desde SQLite
- ✅ Eliminado hardcode `"capacidad": 4`
- ✅ Fallback `4` si la columna viene NULL (compatibilidad con BDs antiguas)
- ✅ Commit: `backend: leer capacidad real de mesas` (67900fd)

**Frontend (`Mesas.jsx`):**
- ✅ Nuevo estado `capacidadMesaSeleccionada` (default `4`)
- ✅ `handleMesaClick()`: guarda `m.capacidad || 4` al abrir modal
- ✅ Input comensales: `max={capacidadMesaSeleccionada}` en lugar de `max="5"`
- ✅ Label: `"Comensales (máx. N):"` — texto visual y límite del input coinciden
- ✅ Commit: `frontend: usar capacidad como limite de comensales` (bfc7c19)

### Resultado:
- Badge (tarjeta): "Capacidad: 4 asientos" ← leído de SQLite
- Label (modal): "Comensales (máx. 4):" ← sincronizado
- Input máximo: 4 ← sincronizado
- Si en el futuro se cambia `capacidad` en SQLite, las tres capas se actualizan solas

---

## ✅ COMPLETADO: Botón Atrás en Vista de Comanda

### Problema original:
El botón "Regresar" llamaba directamente `setMesaSeleccionada(null)` sin verificar si había productos en el carrito local sin mandar a cocina. Salir accidentalmente descartaba ítems sin aviso. El panel "Comandas Vivas" tampoco limpiaba el carrito al cambiar de mesa, lo que podía mezclar ítems de diferentes sesiones.

### Solución (`Mesas.jsx`):
- ✅ Función `handleVolverAGrid()` async agregada:
  - Si `mostrarModalPersonalizar` está abierto → lo cierra primero
  - Si `comandaSesion.length > 0` → `await confirmar(...)` antes de salir
  - Si el usuario cancela → `return` (se queda en la vista)
  - Si confirma o carrito vacío → limpia `mesaSeleccionada`, `comandaSesion`, `productoAEditar`, `indiceAEditar`, `mostrarModalPago`
- ✅ Botón "Regresar": `onClick` cambiado a `handleVolverAGrid`
- ✅ Panel "Comandas Vivas": al hacer click en una mesa limpia `comandaSesion`, `productoAEditar`, `indiceAEditar` — evita mezcla de carritos
- ✅ Las comandas ya enviadas a cocina no se pierden — viven en backend
- ✅ Sin cambios en tickets, inventario, snapshots ni backend
- ✅ Commit: `frontend: confirmar salida de vista de comanda` (2e98e19)

### Corrección posterior (bug):
- ✅ `confirmar` no estaba desestructurado en `useDialogo()` → ReferenceError al usar Regresar
- ✅ Fix: `const { notificar, confirmar, DialogoUI } = useDialogo()`
- ✅ `handleVolverAGrid()` ahora funciona correctamente con confirmación real
- ✅ Commit: `frontend: corregir regreso y eliminar productos pendientes` (7906a4d)

---

## ✅ COMPLETADO: Eliminación de Productos Pendientes en Carrito

### Problema original:
No había forma de quitar un producto del carrito local (`comandaSesion`) antes de mandarlo a cocina. Si el mesero añadía un ítem por error, tenía que mandar todo a cocina o salir descartando el carrito completo.

### Solución (`Mesas.jsx`):
- ✅ Función `handleEliminarProductoPendiente(index)`:
  ```js
  setComandaSesion(prev => prev.filter((_, i) => i !== index))
  ```
- ✅ Botón `×` en cada ítem de `comandaSesion`:
  - Estilo discreto: `text-red-400 hover:text-red-600`
  - `e.stopPropagation()` para no abrir personalización al hacer clic en `×`
  - El nombre del producto sigue siendo clickable para personalizar
- ✅ Solo afecta productos **no enviados** (`comandaSesion`) — los ya comandados (`mesaSeleccionada.productos`) no tienen botón ×
- ✅ Sin llamadas al backend
- ✅ Sin cambios en inventario, tickets ni snapshots
- ✅ Commit: `frontend: corregir regreso y eliminar productos pendientes` (7906a4d)

---

## ✅ COMPLETADO: Configuración de Número de Mesas

### Diagnóstico:
`limite_mesas` en `configuracion_sistema` (RAM) nunca estuvo vinculado a la tabla `mesas` en SQLite. El panel Mesas siempre usó las filas reales de la tabla. El campo en Configuración mostraba un valor distinto (6 por defecto en state.py) mientras que el panel mostraba 8 mesas reales, generando confusión operativa.

### Decisión técnica (Opción B — menor riesgo):
No se implementó sincronización automática porque:
- Sincronizar `limite_mesas` → tabla `mesas` requiere lógica de guards para mesas ocupadas y snapshots activos
- El número de mesas de una cafetería raramente cambia
- La sincronización automática presentaba riesgo de borrar mesas con sesiones activas

### Solución implementada:
- ✅ Auditoría técnica confirmó que `Mesas.jsx` y `mesas.py` **no leen** `limite_mesas` en ningún punto
- ✅ La tabla `mesas` en SQLite es la fuente de verdad exclusiva del panel Mesas
- ✅ `Configuracion.jsx`: campo `limite_mesas` eliminado de la UI (commit `021494d`)
- ✅ `Configuracion.jsx`: campo y nota referencial también eliminados (commit `fac485b`)
- ✅ El estado `config.limite_mesas` sigue cargándose en el frontend pero sin renderizarse
- ✅ Nombre del Establecimiento pasa a ancho completo sin hueco vacío

### Garantías:
- ✅ No se crean ni eliminan mesas desde Configuración
- ✅ Snapshots, mesas activas, comandas y tickets no afectados
- ✅ Backend, configuracion.py, state.py, mesas.py: sin cambios funcionales

---

## ✅ COMPLETADO: Corrección Visual de Grillas de Productos

### Problema:
Las tarjetas de productos en **Llevar** y en **Mesas → vista de comanda** mostraban huecos verticales grandes entre filas. El catálogo se veía desordenado con pocos productos en pantalla.

### Causa:
Los contenedores `grid` estaban dentro de un flex con `flex-1`, lo que les hacía ocupar toda la altura disponible del contenedor padre. CSS Grid usa `align-content: stretch` por defecto, distribuyendo las filas para llenar esa altura — produciendo tarjetas o espacios estirados visualmente.

### Solución:
Agregar `content-start` (`align-content: start`) al contenedor de la grilla en los dos archivos afectados:

- ✅ `Llevar.jsx` línea 196: `grid grid-cols-2 sm:grid-cols-3 gap-3 pr-1 content-start`
- ✅ `Mesas.jsx` línea 347: `grid grid-cols-2 sm:grid-cols-3 gap-3 pr-1 content-start`
- ✅ Commit: `frontend: compactar grillas de productos` (3b38b6d)

### Resultado:
- ✅ Productos alineados desde la parte superior, con `gap-3` uniforme
- ✅ Sin huecos ni filas estiradas
- ✅ Responsive (`grid-cols-2 sm:grid-cols-3`) intacto
- ✅ Tabs de categorías, panel lateral de Llevar y panel de comanda de Mesas: sin cambios
- ✅ Lógica funcional, backend, tickets, inventario, snapshots, auditoría y seguridad: sin cambios

---

## 📊 Resumen Estado General

| Aspecto | Estado | Prioridad |
|---|---|---|
| Prevención doble-click | ✅ Completado | - |
| Dialogo UI (window.confirm → confirmar) | ✅ Completado | - |
| Sesión Simple (Token + Validación) | ✅ Completado | - |
| Usuarios - Backend protegido | ✅ Completado | - |
| Administración - Backend protegido | ✅ Completado | - |
| Menu/Inventario/Config - Backend protegido | ✅ Completado | - |
| Menu/Inventario/Config - Frontend integración | ✅ Completado | - |
| Pruebas manuales Admin/Cajero | ✅ Completado | - |
| Persistencia de mesas activas | ✅ Completado | - |
| Inconsistencia comensales (4 vs 5) | ✅ Completado | - |
| Botón Atrás en vista de comanda | ✅ Completado | - |
| Configuración de número de mesas | ✅ Completado | - |
| Manejo global 401/403 - Implementado | ⚠️ Pendiente validación visual | 🟡 Media |
| Auditoría de operaciones | ⚠️ Implementado, validación parcial | 🟡 Media |
| Corrección visual grillas de productos | ✅ Completado | - |
| Web de pedidos (Vercel + ngrok) | ✅ Completado | - |
| Flujo completo pedidos web (Cocina → Listo → Cobro) | ✅ Completado | - |
| Persistencia de sesión (localStorage) | ❌ Futuro | 🟡 Media |
| API/base online (PostgreSQL/Render) | ❌ Fase futura | 🟡 Media |

---

## 🔄 Commits Completados

### Paso 1: Preparación Frontend
1. ✅ `frontend: pasar usuario a modulos administrativos` (f341328)

### Paso 2: Integración apiFetch
2. ✅ `frontend: usar apiFetch en inventario` (5f46095)
3. ✅ `frontend: usar apiFetch en menu` (abc77be)
4. ✅ `frontend: usar apiFetch en configuracion` (d77e075)

### Paso 3: Protección Backend
5. ✅ `backend: proteger endpoints de inventario` (d4c75aa)
6. ✅ `backend: proteger endpoints de productos` (433a2e0)
7. ✅ `backend: proteger endpoints de configuracion` (9ff3874)

### Paso 4: Validación
8. ✅ Pruebas manuales: Admin/Cajero exitosas

---

## ✅ COMPLETADO: Web de Pedidos (Vercel + ngrok + Flask local)

### Arquitectura de la demo:
```
Cliente (web) → Vercel (web-site)
                    ↓ VITE_API_URL
              ngrok (HTTPS público)
                    ↓
              Flask local (http://localhost:5000)
                    ↓
              SQLite local (pos_inteligente.db)
                    ↓
              Monitor de Cocina (desktop)
```

### Componentes implementados:

**web-site (Vercel):**
- ✅ `App.jsx`: catálogo de productos, carrito, formulario de cliente y hora de recogida
- ✅ `VITE_API_URL` configurable por variable de entorno en Vercel
- ✅ `ngrok-skip-browser-warning: true` en todos los fetch — evita interceptación de ngrok
- ✅ Categorías sincronizadas con la BD: `Bebidas Calientes`, `Bebidas Frias`, `Panaderia`, `Alimentos`
- ✅ Nombre del sistema: **Cafetería UAEMex**
- ✅ Diseño responsive: móvil (1 col, scroll tabs), tablet, escritorio (2+1 col, carrito sticky)
- ✅ Sin emojis, sin ubicación ni horario
- ✅ `.env.example` incluido, `.gitignore` protege `.env`
- ✅ Desplegada en: `https://sistema-pos-inteligente.vercel.app/`

**Backend (`pedidos.py`):**
- ✅ `POST /api/pedidos/web` — existente, crea comanda `tipo='comanda'`, `estado='En Cocina'`, `metodo_pago='Web'`
- ✅ `GET /api/pedidos/activos` — modificado para incluir `estado IN ('En Cocina', 'Listo') AND tipo='comanda'`; devuelve `estado` y `metodo_pago`
- ✅ `POST /api/pedidos/despachar` — si `metodo_pago='Web'` → `estado='Listo'` (inventario descontado); otros canales → `'Completado'` sin cambio
- ✅ `POST /api/pedidos/web/cobrar` — nuevo endpoint:
  - Guard: `estado='Listo'` requerido (anti-doble-cobro 409)
  - Guard: `metodo_pago='Web'` (no aplica a pedidos de mesa)
  - Crea `tipo='ticket'` con `metodo_pago` real (Efectivo/Tarjeta)
  - Cierra comanda a `'Completado'`
  - **No descuenta inventario** (ya ocurrió al despachar)

**Frontend Monitor de Cocina (`Pedidos.jsx`):**
- ✅ Badge "EN COLA" (ámbar) para `estado='En Cocina'`, badge "LISTO" (verde) para `estado='Listo'`
- ✅ Borde del card: ámbar para En Cocina, verde para Listo
- ✅ Botón "Cobrar pedido" abre modal de pago — solo para `esWeb && esListo`
- ✅ Modal de pago con layout idéntico a Mesas/Llevar (grid 3+2):
  - Selector Efectivo / Tarjeta
  - Si Efectivo: input de monto, cálculo de cambio, botón bloqueado si recibido < total
  - Si Tarjeta: sin campo de efectivo
  - Sin propina (backend no la registra todavía — pendiente futuro)
- ✅ Al cobrar: `POST /api/pedidos/web/cobrar` → cerrar modal → refrescar monitor
- ✅ Pedidos normales (Mesas, Llevar): botón Despachar sin cambios

### Flujo completo validado:
```
1. Cliente ordena en web          → comanda 'En Cocina' [Monitor: badge AMBAR]
2. Cocina despacha                → inventario descontado, 'Listo' [Monitor: badge VERDE]
3. Cajero presiona Cobrar pedido  → modal de pago
4. Selecciona Efectivo o Tarjeta  → confirma cobro
5. Backend crea ticket 'ticket'   → aparece en corte diario de Administración
6. Comanda → 'Completado'         → desaparece del Monitor
```

### Garantías:
- ✅ Sin doble descuento de inventario: cobro no toca insumos
- ✅ Sin doble ticket: guard 409 si `estado != 'Listo'`
- ✅ Mesas y Para Llevar: sin cambios
- ✅ La app de escritorio sigue siendo el sistema principal
- ✅ La web es canal adicional de captación de pedidos (solo recepción)

### Commits:
- ✅ `web-site: usar VITE_API_URL para API de pedidos` (7e3ff17)
- ✅ `web-site: corregir Tailwind v4 y header ngrok` (f2437e3)
- ✅ `web-site: rediseñar pagina de pedidos para demo` (5c902d8)
- ✅ `web-site: mejorar responsive de pagina de pedidos` (99f1e2a)
- ✅ `backend: agregar cobro de pedidos web listos` (14bcc75)
- ✅ `frontend: cobrar pedidos web listos` (e258ada)
- ✅ `frontend: agregar modal de pago a pedidos web` (1c9e344)

### Pendiente futuro:
- ⏳ Propina en pedidos web (el backend no la registra todavía)
- ⏳ API en línea con base de datos cloud (PostgreSQL/Render) — fase futura si se requiere antes de entrega

---

## ⚠️ IMPLEMENTADO, VALIDACIÓN PARCIAL: Auditoría de Operaciones Sensibles

### Infraestructura:

**Base de Datos (`database.py`):**
- ✅ Tabla `auditoria` con 9 columnas: `id`, `fecha` (DEFAULT datetime('now')), `id_usuario`, `nombre_usuario`, `accion`, `modulo`, `detalle_json`, `ip_address`, `resultado` (DEFAULT 'OK')
- ✅ 3 índices idempotentes: `idx_auditoria_fecha`, `idx_auditoria_id_usuario`, `idx_auditoria_modulo`
- ✅ Commit: `database: crear tabla auditoria` (8a9e5d3)

**Helper (`database.py`):**
- ✅ `registrar_auditoria(usuario_sesion, accion, modulo, detalle=None, resultado='OK')`
- ✅ `json.dumps(detalle or {}, ensure_ascii=False)` — nunca falla con `None`
- ✅ IP leída desde `flask_request.remote_addr` con `try/except` aislado
- ✅ `try/except` externo — falla silenciosa con `print("[AUDITORIA ERROR]...")`, nunca interrumpe flujo principal
- ✅ No guarda `password_hash` ni `contrasena` — responsabilidad del llamador
- ✅ Commit: `backend: agregar helper registrar auditoria` (d0822c0)

### Módulos con auditoría conectada:

**Usuarios (`usuarios.py`)** — Commit `5cc7ce1`:
- ✅ `CREAR` — `guardar_usuario()` sin `id_usuario`
- ✅ `EDITAR` — `guardar_usuario()` con `id_usuario`
- ✅ `ELIMINAR` — `eliminar_usuario()` captura datos antes del DELETE

**Inventario (`inventario.py`)** — Commit `32781d8`:
- ✅ `CREAR` — `crear_insumo()` con nombre, unidad, cantidad_inicial, stock_minimo
- ✅ `AJUSTAR` — `ajustar_inventario()` con tipo (ENTRADA/MERMA), cantidad_anterior, cantidad_nueva

**Productos (`productos.py`)** — Commit `8197310`:
- ✅ `CREAR` — `crear_producto()`
- ✅ `EDITAR` — `actualizar_producto()`
- ✅ `ELIMINAR` — `eliminar_producto()` captura datos antes del DELETE
- ✅ `MODIFICAR_RECETA` — `guardar_receta_producto()` con total_insumos e ids
- ✅ `MODIFICAR_EXTRAS` — `guardar_extras_producto()` con total_extras y nombres

**Administración (`administracion.py`)** — Commit `40d0ba9`:
- ✅ `EJECUTAR_CORTE` — `ejecutar_corte_caja()` con fecha, totales financieros
- ✅ `REGISTRAR_GASTO` — `gestionar_gastos()` POST con concepto, monto, fecha

**Configuración (`configuracion.py`)** — Commit `40d0ba9`:
- ✅ `MODIFICAR` — `actualizar_configuracion()` con empresa, dirección, IVA

### Validación manual:
- ✅ **Prueba mínima exitosa**: Inventario → Merma → fila en `auditoria` con:
  - `nombre_usuario: Admin`
  - `accion: AJUSTAR`
  - `modulo: INVENTARIO`
  - `detalle_json` con `id_insumo`, `nombre`, `tipo: MERMA`, `cantidad_anterior`, `cantidad_nueva`
  - `resultado: OK`
  - `ip_address: 127.0.0.1`

### Pendiente validación completa:
- ⏳ CREAR / EDITAR / ELIMINAR usuarios
- ⏳ CREAR insumo / AJUSTAR ENTRADA
- ⏳ CREAR / EDITAR / ELIMINAR / MODIFICAR_RECETA / MODIFICAR_EXTRAS productos
- ⏳ REGISTRAR_GASTO / EJECUTAR_CORTE administración
- ⏳ MODIFICAR configuración

---

## ⚠️ IMPLEMENTADO, PENDIENTE VALIDACIÓN VISUAL: Manejo Global 401/403

### Estado de implementación:

**Backend (ya existente desde sesión simple):**
- ✅ `@validar_sesion` devuelve 401 con `code: MISSING_TOKEN / INVALID_TOKEN / EXPIRED_SESSION`
- ✅ `@requiere_admin` devuelve 403 con `code: FORBIDDEN` cuando token es válido pero sin permisos

**Frontend — Capa de intercepción (`apiFetch.js`):**
- ✅ Cuarto argumento: `onSessionError = null`
- ✅ `res.status === 401` → llama `onSessionError('unauthorized', res)`
- ✅ `res.status === 403` → llama `onSessionError('forbidden', res)`
- ✅ La `Response` original siempre se propaga al `.then()` del componente — sin breaking change
- ✅ Commit: `frontend: agregar callback de sesion a apiFetch` (01afdab)

**Frontend — Manejador global (`App.jsx`):**
- ✅ `useDialogo()` instanciado: `notificar`, `DialogoUI`
- ✅ `sessionErrorDispatched = useRef(false)` — flag para evitar múltiples toasts/logout
- ✅ `handleSessionError('unauthorized')`: toast "Tu sesión ha expirado..." + logout a 1500ms
- ✅ `handleSessionError('forbidden')`: toast "No tienes permisos..." sin logout
- ✅ `<DialogoUI />` dentro de fragment en el return
- ✅ `onSessionError={handleSessionError}` pasado como prop a los 5 módulos protegidos
- ✅ Commit: `frontend: manejar errores de sesion en app` (a9a2044)
- ✅ Commit: `fix: corregir render de DialogoUI en App` (4b0fad7)

**Frontend — Integración en módulos (`Usuarios, Administracion, Menu, Inventario, Configuracion`):**
- ✅ Los 5 componentes reciben `onSessionError` como prop en su firma
- ✅ 21 llamadas `apiFetch` pasan `onSessionError` como cuarto argumento
- ✅ Commit: `frontend: conectar errores de sesion en modulos protegidos` (842e753)

### Pruebas realizadas:
- ✅ Flujo normal Admin: todos los módulos cargan sin toasts falsos de sesión
- ✅ Cajero no ve módulos administrativos en UI
- ✅ Backend devuelve 401/403 correctamente según decoradores (validado en sesión simple)

### Pendiente validación visual:
- ⏳ Toast "Tu sesión ha expirada..." visible en pantalla al expirar token (401)
- ⏳ Logout automático después de 1.5 segundos post-401
- ⏳ Toast "No tienes permisos..." visible al recibir 403 desde componente real
- ⏳ Validar que múltiples requests fallando a la vez producen un solo toast (flag `sessionErrorDispatched`)

**Nota:** La validación manual requiere forzar un 401 (token inválido) o un 403 (Cajero en módulo admin). El método más seguro sin tocar SQLite directamente es usar React DevTools para cambiar `vistaActual` mientras se tiene una sesión de Cajero activa.

---

## 📋 Siguiente Bloque Recomendado

### Opción A — Mejoras de Sesión (Prioridad Baja)
- localStorage para persistir sesión entre recargas del frontend
- Renovación de token por actividad

### Opción B — Auditoría de Operaciones (Prioridad Baja)
- Tabla `auditoria` con usuario, acción, entidad, timestamp
- Registrar: crear/editar/eliminar usuarios, productos, cortes, ajustes de inventario

### Opción C — Gestión dinámica de mesas (Prioridad Baja, Opción D anterior)
- Endpoint `POST /api/mesas/sincronizar` que solo agrega mesas nuevas
- Nunca borra mesas ocupadas ni con snapshots
- Requiere auditoría de guards antes de implementar

---

## 📋 Futuras Mejoras Opcionales

1. **Auditoría de operaciones** - Registrar quién qué cuándo en cambios críticos
2. **Persistencia de sesión** - localStorage para mantener sesión entre recargas
3. **Manejo global de errores** - Interceptar 401/403 centralmente en frontend
4. **Renovación de token** - Extender duración de sesión con actividad
5. **Rate limiting** - Protección contra fuerza bruta en login

---

**Último bloque completado:** Persistencia de mesas activas  
**Validación:** 5 pruebas manuales exitosas  
**Seguridad:** Todos los endpoints críticos protegidos con @requiere_admin
