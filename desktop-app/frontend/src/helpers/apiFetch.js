/**
 * apiFetch - Helper para agregar X-Session-Token a los fetch
 *
 * Uso:
 *   apiFetch('/api/usuarios', {}, usuario)
 *   apiFetch('/api/usuarios/guardar', { method: 'POST', body: JSON.stringify({...}) }, usuario)
 *
 * Devuelve un fetch normal, sin cambios en comportamiento actual.
 */

export function apiFetch(url, options = {}, usuario = null) {
  // Inicializar headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  // Si existe usuario y token, agregar header de sesión
  if (usuario?.token) {
    headers['X-Session-Token'] = usuario.token
  }

  // Retornar fetch con headers actualizados
  return fetch(url, {
    ...options,
    headers,
  })
}
