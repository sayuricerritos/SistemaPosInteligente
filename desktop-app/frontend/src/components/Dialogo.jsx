import React, { useState, useCallback } from 'react'

/**
 * Sistema unificado de notificaciones y confirmaciones.
 * ====================================================
 * Reemplaza window.alert() y window.confirm() por un estilo consistente
 * con la paleta de la marca (cafe #8B5A2B, azul #2E5A88), sin emojis.
 *
 * USO en cualquier vista:
 *   const { notificar, confirmar, DialogoUI } = useDialogo()
 *
 *   // Notificacion (reemplaza alert):
 *   notificar('Producto guardado', 'exito')
 *   notificar('Faltan datos', 'error')
 *
 *   // Confirmacion (reemplaza confirm), es asincrona:
 *   const ok = await confirmar('Eliminar este registro?')
 *   if (ok) { ... }
 *
 *   // Y al final del JSX de la vista, monta el componente una sola vez:
 *   return (<div> ... <DialogoUI /> </div>)
 */

// Iconos por tipo de notificacion
const IconoExito = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)
const IconoError = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
)
const IconoInfo = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
)
const IconoPregunta = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)

const ESTILOS_TOAST = {
  exito: { barra: 'bg-emerald-500', texto: 'text-emerald-700', icono: 'text-emerald-500', Icono: IconoExito },
  error: { barra: 'bg-red-500',     texto: 'text-red-700',     icono: 'text-red-500',     Icono: IconoError },
  info:  { barra: 'bg-[#2E5A88]',   texto: 'text-[#2E5A88]',   icono: 'text-[#2E5A88]',   Icono: IconoInfo },
}

export function useDialogo() {
  const [toast, setToast]     = useState(null)   // { mensaje, tipo }
  const [confirm, setConfirm] = useState(null)   // { mensaje, resolve }

  const notificar = useCallback((mensaje, tipo = 'info') => {
    setToast({ mensaje, tipo })
    setTimeout(() => setToast(null), 3500)
  }, [])

  const confirmar = useCallback((mensaje) => {
    return new Promise(resolve => setConfirm({ mensaje, resolve }))
  }, [])

  const responder = (valor) => {
    if (confirm) confirm.resolve(valor)
    setConfirm(null)
  }

  const DialogoUI = () => {
    const est = toast ? (ESTILOS_TOAST[toast.tipo] || ESTILOS_TOAST.info) : null
    return (
      <>
        {/* NOTIFICACION (toast) */}
        {toast && est && (
          <div className="fixed top-5 right-5 z-[100] animate-fade-in">
            <div className="flex items-center bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden min-w-[280px] max-w-sm">
              <div className={`w-1.5 self-stretch ${est.barra}`}></div>
              <div className={`pl-3 ${est.icono}`}>
                <est.Icono />
              </div>
              <p className={`px-3 py-3.5 text-xs font-bold ${est.texto}`}>{toast.mensaje}</p>
            </div>
          </div>
        )}

        {/* CONFIRMACION (modal) */}
        {confirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-[100] p-4 animate-fade-in">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-[#8B5A2B]">
                <IconoPregunta />
                <h3 className="text-base font-black text-gray-800">Confirmar accion</h3>
              </div>
              <p className="text-xs font-bold text-gray-500 leading-relaxed">{confirm.mensaje}</p>
              <div className="flex gap-2 pt-2 border-t">
                <button
                  onClick={() => responder(false)}
                  className="w-1/3 py-2.5 border rounded-xl text-gray-400 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => responder(true)}
                  className="flex-1 py-2.5 bg-[#8B5A2B] hover:bg-[#7A4F25] text-white rounded-xl font-black text-xs uppercase tracking-wide shadow"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  return { notificar, confirmar, DialogoUI }
}
