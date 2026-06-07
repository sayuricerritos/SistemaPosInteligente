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
| Auditoría de operaciones | ❌ Futuro | 🟡 Media |
| Persistencia de sesión (localStorage) | ❌ Futuro | 🟡 Media |
| Manejo global 401/403 | ❌ Futuro | 🟡 Media |

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

## 📋 Siguiente Bloque Recomendado

### Opción A — Mejoras de Sesión (Prioridad Baja)
- localStorage para persistir sesión entre recargas del frontend
- Manejo global 401/403 (interceptor centralizado)
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
