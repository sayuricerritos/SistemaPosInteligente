/**
 * apiFetch - Helper para agregar X-Session-Token a los fetch
 *
 * Uso:
 *   apiFetch('/api/usuarios', {}, usuario)
 *   apiFetch('/api/usuarios/guardar', { method: 'POST', body: JSON.stringify({...}) }, usuario)
 *   apiFetch('/api/usuarios', {}, usuario, (tipo, res) => { ... })
 *
 * onSessionError(tipo, res):
 *   tipo === 'unauthorized' → status 401 (sesión expirada o token inválido)
 *   tipo === 'forbidden'    → status 403 (sin permisos suficientes)
 *
 * La respuesta original siempre se propaga al .then() del componente.
 * No se lanza throw. No se hace res.json() aquí.
 */

export function apiFetch(url, options = {}, usuario = null, onSessionError = null) {
  // Inicializar headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  // Si existe usuario y token, agregar header de sesión
  if (usuario?.token) {
    headers['X-Session-Token'] = usuario.token
  }

  // Ejecutar fetch e interceptar 401/403 sin romper la cadena de promesas
  return fetch(url, {
    ...options,
    headers,
  }).then(res => {
    if (onSessionError) {
      if (res.status === 401) onSessionError('unauthorized', res)
      if (res.status === 403) onSessionError('forbidden', res)
    }
    return res
  })
}
