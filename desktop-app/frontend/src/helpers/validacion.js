/**
 * validacion.js -- Utilidades para entradas numericas
 * =====================================================
 * Evita que campos como precio, salario, comensales, horas o cantidades
 * acepten valores negativos.
 */

/**
 * Devuelve un manejador onChange que rechaza numeros negativos.
 * Permite el campo vacio (para que el usuario pueda borrar y reescribir).
 *
 * USO:
 *   <input type="number" min="0"
 *          value={precio}
 *          onChange={soloNoNegativo(setPrecio)} />
 */
export function soloNoNegativo(setter) {
  return (e) => {
    const v = e.target.value
    // Permitir vacio o cualquier valor >= 0
    if (v === '' || parseFloat(v) >= 0) {
      setter(v)
    }
    // Si es negativo, simplemente se ignora (no actualiza el estado)
  }
}

/**
 * Variante para inputs dentro de objetos de formulario (setFormStaff, etc.)
 *
 * USO:
 *   <input type="number" min="0"
 *          value={form.pago_hora}
 *          onChange={e => setForm({...form, pago_hora: noNeg(e.target.value, form.pago_hora)})} />
 */
export function noNeg(nuevo, anterior) {
  if (nuevo === '' || parseFloat(nuevo) >= 0) return nuevo
  return anterior
}

/**
 * Sanea un numero antes de enviarlo al backend: nunca negativo.
 * USO: cantidad: aMin0(cantidadInput)
 */
export function aMin0(valor) {
  const n = parseFloat(valor)
  return isNaN(n) || n < 0 ? 0 : n
}

/**
 * Valida que un conjunto de campos sean numeros positivos.
 * Devuelve el primer mensaje de error encontrado, o null si todo esta bien.
 *
 * USO:
 *   const err = validarPositivos({ Precio: precio, Salario: salario })
 *   if (err) { notificar(err, 'error'); return }
 */
export function validarPositivos(campos) {
  for (const [nombre, valor] of Object.entries(campos)) {
    const n = parseFloat(valor)
    if (isNaN(n)) return `El campo ${nombre} debe ser un numero.`
    if (n < 0)    return `El campo ${nombre} no puede ser negativo.`
  }
  return null
}
