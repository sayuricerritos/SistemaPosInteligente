# Auditoría Interna - SmartPOS Sistema de Ventas

**Última actualización:** 2026-06-06  
**Estado General:** En Progreso - Mejoras de Seguridad y UX

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

## ⏳ PENDIENTE IMPORTANTE: Roles y Permisos

### Inconsistencia Detectada:

**Problema:**
- Frontend usa indistintamente:
  - `rolUsuarioLogueado === 'Admin'` (línea 53, Usuarios.jsx)
  - `permisos === 'Total'` (línea 198, Usuarios.jsx)
  
**Impacto:**
- Criterios de autorización inconsistentes
- Posible brecha de seguridad si no se valida en backend
- Difícil de auditar y mantener

### Acciones Requeridas:

#### 1. **Unificar Criterio de Permisos**
   - [ ] Definir roles oficiales del sistema:
     - `Admin` - Acceso total (crear, editar, eliminar usuarios)
     - `Supervisor` o `Total` - Supervisión (reportes, ajustes)
     - `Mesero` - Ventas y pedidos básicos
     - `Barista` - Operaciones en cocina
   - [ ] Mapear campos: `rolUsuarioLogueado` vs `permisos`
   - [ ] Eliminar redundancia

#### 2. **Validación en Backend (CRÍTICO)**
   - [ ] Revisar `flask_api.py` - Endpoints sin validación de permisos
   - [ ] Implementar decorador `@requiere_admin` en endpoints:
     - `DELETE /api/usuarios/<id>`
     - `POST /api/usuarios/guardar`
     - `POST /api/menu/guardar`
     - `DELETE /api/menu/<id>`
     - etc.
   - [ ] Validar token JWT incluye `rol` o `permisos`

#### 3. **Auditoría de Endpoints**
   - [ ] `/api/usuarios` - GET sin auth?
   - [ ] `/api/usuarios/guardar` - POST sin validación
   - [ ] `/api/menu/*` - Operaciones CRUD
   - [ ] `/api/pedidos/*` - Creación y actualización
   - [ ] `/api/inventario/*` - Ajustes y mermas

#### 4. **Frontend - Sincronización**
   - [ ] Cargar permisos desde JWT al login
   - [ ] Refrescar permisos en intervalo regular
   - [ ] Mostrar UI basada en permisos reales (no en botones de test)

---

## 📋 Recomendación: Siguiente Bloque Técnico

### **Validación de Permisos en Backend + Implementar RBAC (Role-Based Access Control)**

**Alcance:**
1. Crear tabla/modelo `Permisos` con roles estandarizados
2. Validar JWT en cada endpoint crítico
3. Implementar decorador `@requiere_permiso('nombre_permiso')`
4. Auditoría: Registrar quién qué cuándo en operaciones críticas (DELETE, UPDATE usuarios/menu)
5. Tests: Validar que usuario sin permisos obtiene 403 Forbidden

**Archivos a revisar:**
- `desktop-app/backend/flask_api.py` - Endpoints
- `desktop-app/frontend/src/auth.js` o similar - Manejo de JWT
- `desktop-app/backend/models.py` o equivalente - Esquemas de BD

**Estimación:** 2-3 horas (implementación + testing)

---

## 📊 Resumen Estado General

| Aspecto | Estado | Prioridad |
|---|---|---|
| Prevención doble-click | ✅ Completado | - |
| Dialogo UI (window.confirm → confirmar) | ✅ Completado | - |
| Validación permisos Frontend | ⚠️ Parcial | 🔴 Alta |
| Validación permisos Backend | ❌ Pendiente | 🔴 CRÍTICA |
| Auditoría de operaciones | ❌ No implementada | 🟡 Media |
| Tests de seguridad | ❌ No implementados | 🟡 Media |

---

**Próximo checkpoint:** Validación de backend + RBAC  
**Estimado:** 2026-06-09 (3 días)
