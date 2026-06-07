# Auditoría Interna - SmartPOS Sistema de Ventas

**Última actualización:** 2026-06-07  
**Estado General:** En Progreso - Sesión Simple Implementada, Pendiente Completar Módulos Administrativos

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
- ✅ `Usuarios.jsx` → recibe usuario en firma, usa apiFetch en 3 requests
- ✅ `Administracion.jsx` → recibe usuario en firma, usa apiFetch en 6 requests

**Validación Manual:**
- ✅ Cajero: solo ve Mesas, Llevar, Pedidos (sin acceso Admin)
- ✅ Cajero: intenta API → recibe 401 (sin token) o 403 (con token sin permisos)
- ✅ Admin: puede acceder a Usuarios y Administración
- ✅ Admin: puede crear/editar/eliminar usuarios, ejecutar corte, registrar gastos
- ✅ Requests incluyen header X-Session-Token automáticamente
- ✅ Sin modificar código entre pruebas

---

## ⏳ PENDIENTE IMPORTANTE: Inventario/Menu/Configuración Sin Protección

### Riesgo Real (No Nulo):

**Problema:**
- Frontend oculta botones a Cajero (no ve botones en UI)
- Backend NO valida permisos en estos módulos
- Cajero puede acceder directamente por API

**Endpoints Sin Protección:**
- ✅ `GET/POST /api/menu` - Lista, crea, edita, borra productos
- ✅ `GET/POST /api/inventario` - Consulta, ajusta, registra mermas, insumos
- ✅ `GET/POST /api/configuracion` - Modifica parámetros del sistema

**Impacto:**
- 🔴 RIESGO: Cajero puede crear/editar/borrar productos (manipular precios, ofertas)
- 🔴 RIESGO: Cajero puede registrar mermas falsas (robar inventario)
- 🔴 RIESGO: Cajero puede modificar parámetros del sistema (límite de mesas, etc)

**Mitigación Parcial:**
- Frontend UI oculta botones, pero no es seguridad real
- Necesita protección en backend antes de escalabilidad

### Acciones Requeridas:

#### 1. **Proteger Menu/Productos**
   - [ ] Aplicar `@requiere_admin` a:
     - `POST /api/menu/guardar` - Crear/editar productos
     - `DELETE /api/menu/<id>` - Eliminar productos
   - [ ] Mantener GET /api/menu sin protección (público)

#### 2. **Proteger Inventario**
   - [ ] Aplicar `@requiere_admin` a:
     - `POST /api/inventario/confirmar-carga` - Confirmar llegada de insumos
     - `POST /api/inventario/registrar-merma` - Registrar pérdidas/derrames
     - `POST /api/inventario/registrar-insumo` - Crear insumo nuevo (si no está protegido)
   - [ ] Mantener GETs sin protección (públicos)

#### 3. **Proteger Configuración**
   - [ ] Aplicar `@requiere_admin` a:
     - `POST /api/configuracion` - Modificar parámetros
   - [ ] Mantener GET sin protección (público)

#### 4. **Frontend - Integración**
   - [ ] Pasar usuario prop a Menu.jsx
   - [ ] Pasar usuario prop a Inventario.jsx
   - [ ] Pasar usuario prop a Configuracion.jsx
   - [ ] Usar apiFetch en lugar de fetch directo en estos módulos

---

## 📋 Siguiente Bloque Técnico

### **Proteger Inventario/Menu/Configuración (Completar Sesión Simple)**

**Alcance:**
1. Pasar usuario prop a Menu, Inventario, Configuracion
2. Usar apiFetch en lugar de fetch en estos módulos
3. Aplicar @requiere_admin a endpoints POST/DELETE sensibles:
   - `/api/menu/guardar` - Crear/editar productos
   - `/api/menu/<id>` - Eliminar productos
   - `/api/inventario/confirmar-carga` - Confirmar insumos
   - `/api/inventario/registrar-merma` - Registrar pérdidas
   - `/api/configuracion` - Modificar parámetros
4. Mantener GETs públicos sin protección

**Archivos a modificar:**
- Frontend: Menu.jsx, Inventario.jsx, Configuracion.jsx
- Backend: productos.py, inventario.py, configuracion.py

**Estimación:** 1-2 horas (copiar patrón de usuarios/administracion)

---

## 📊 Resumen Estado General

| Aspecto | Estado | Prioridad |
|---|---|---|
| Prevención doble-click | ✅ Completado | - |
| Dialogo UI (window.confirm → confirmar) | ✅ Completado | - |
| Sesión Simple (Token + Validación) | ✅ Completado | - |
| Usuarios - Backend protegido | ✅ Completado | - |
| Administración - Backend protegido | ✅ Completado | - |
| Menu/Inventario/Config - Backend protegido | ⏳ Pendiente | 🔴 Alta |
| Menu/Inventario/Config - Frontend integración | ⏳ Pendiente | 🔴 Alta |
| Auditoría de operaciones | ❌ No implementada | 🟡 Media |
| Persistencia de sesión (localStorage) | ❌ No implementada | 🟡 Media |
| Manejo global 401/403 | ❌ No implementada | 🟡 Media |

---

## 🔄 Commits Completados

1. ✅ `database: crear tabla sesiones e índices` (f168469)
2. ✅ `backend: generar token en login` (f4ff230)
3. ✅ `backend: crear decoradores de validación de sesión` (42b6dea)
4. ✅ `frontend: pasar usuario a usuarios y administracion` (fa7f928)
5. ✅ `frontend: crear helper apiFetch` (44c7421)
6. ✅ `frontend: usar apiFetch en usuarios y administracion` (75fda91)
7. ✅ `backend: proteger usuarios y administracion` (dc6e0af)

---

**Próximo checkpoint:** Proteger Menu/Inventario/Configuración  
**Estimado:** 2026-06-08 (1-2 horas)  
**Validación:** Pruebas manuales con Cajero y Admin
