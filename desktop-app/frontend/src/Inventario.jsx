import React, { useState, useEffect } from 'react'
import { useDialogo } from './components/Dialogo'
import { noNeg } from './helpers/validacion'
const IconoAlerta = ({ className = 'w-3 h-3' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)
const IconoRecargar = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
)
const IconoMas = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
  </svg>
)
const IconoCerrar = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const UNIDADES = ['unidad', 'KG', 'Litros', 'ML', 'g', 'Pieza']

const FORM_NUEVO_INSUMO = {
  nombre_insumo: '',
  cantidad_actual: '',
  unidad_medida: 'unidad',
  stock_minimo: '5',
}

export default function Inventario({ usuario }) {
  const [insumos,       setInsumos]       = useState([])
  const [loading,       setLoading]       = useState(true)
  const [mostrarAjuste, setMostrarAjuste] = useState(false)
  const [mostrarNuevo,  setMostrarNuevo]  = useState(false)
  const [insumoSel,     setInsumoSel]     = useState(null)
  const [tipoAjuste,    setTipoAjuste]    = useState('ENTRADA')
  const [cantidadInput, setCantidadInput] = useState('')
  const [formNuevo,     setFormNuevo]     = useState(FORM_NUEVO_INSUMO)
  const [guardandoNuevo, setGuardandoNuevo] = useState(false)
  const [ajustando,     setAjustando]     = useState(false)
  const { notificar, confirmar, DialogoUI } = useDialogo()

const cargarInsumos = () => {
  setLoading(true)
  fetch('http://127.0.0.1:5000/api/inventario')
    .then(res => {
      if (!res.ok) throw new Error(`Error del servidor: ${res.status}`)
      return res.json()
    })
    .then(data => {
      setInsumos(Array.isArray(data) ? data : [])
      setLoading(false)
    })
    .catch(err => {
      console.error('[INVENTARIO] Error al cargar insumos:', err)
      setInsumos([])
      setLoading(false)
    })
}

  useEffect(() => { cargarInsumos() }, [])

  const abrirAjuste = (insumo, tipo) => {
    setInsumoSel(insumo)
    setTipoAjuste(tipo)
    setCantidadInput('')
    setMostrarAjuste(true)
  }

const handleProcesarAjuste = (e) => {
  e.preventDefault()
  if (ajustando) return
  if (!cantidadInput || parseFloat(cantidadInput) <= 0) return
  setAjustando(true)
  fetch('http://127.0.0.1:5000/api/inventario/ajustar', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      id_insumo: insumoSel.id_insumo,
      cantidad:  parseFloat(cantidadInput),
      tipo:      tipoAjuste,
    }),
  })
  .then(res => {
    if (!res.ok) throw new Error(`Error del servidor: ${res.status}`)
    return res.json()
  })
  .then(() => {
    cargarInsumos()
    setMostrarAjuste(false)
    setInsumoSel(null)
  })
  .catch(err => notificar(`Error al ajustar inventario: ${err.message}`))
  .finally(() => setAjustando(false))
}

const handleCrearInsumo = (e) => {
  e.preventDefault()
  setGuardandoNuevo(true)
  fetch('http://127.0.0.1:5000/api/inventario/nuevo', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      nombre_insumo:   formNuevo.nombre_insumo.trim(),
      cantidad_actual: parseFloat(formNuevo.cantidad_actual) || 0,
      unidad_medida:   formNuevo.unidad_medida,
      stock_minimo:    parseFloat(formNuevo.stock_minimo) || 5,
    }),
  })
  .then(res => {
    if (!res.ok) throw new Error(`Error del servidor: ${res.status}`)
    return res.json()
  })
  .then(d => {
    if (d.error) { notificar(`Error: ${d.error}`); return }
    cargarInsumos()
    setMostrarNuevo(false)
    setFormNuevo(FORM_NUEVO_INSUMO)
  })
  .catch(err => notificar(`Error al crear insumo: ${err.message}`))
  .finally(() => setGuardandoNuevo(false))
}

  if (loading) return (
    <div className="text-center py-12 text-gray-400 text-xs font-bold">
      Abriendo almacen de materias primas...
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ENCABEZADO */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Control de Insumos y Materias Primas</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Monitoreo de stock, fracciones (KG, ML, Pieza) y mermas operativas.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMostrarNuevo(true)}
            className="bg-[#8B5A2B] hover:bg-[#7A4F25] text-white font-black text-2xs py-2 px-4 rounded-xl transition-colors flex items-center gap-2"
          >
            <IconoMas className="w-3.5 h-3.5" />
            Nuevo Insumo
          </button>
          <button
            onClick={cargarInsumos}
            className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-2xs py-2 px-4 rounded-xl transition-colors flex items-center gap-2"
          >
            <IconoRecargar />
            Recargar
          </button>
        </div>
      </div>

      {/* CUADRICULA DE INSUMOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insumos.length === 0 ? (
          <div className="md:col-span-2 bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-400 text-xs font-bold">
            No hay insumos registrados. Usa el boton "Nuevo Insumo" para agregar materias primas.
          </div>
        ) : (
          insumos.map(i => {
            const esAlertaBajo = i.cantidad_actual <= i.stock_minimo
            return (
              <div
                key={i.id_insumo}
                className={`bg-white rounded-2xl p-5 border flex justify-between items-center transition-all ${
                  esAlertaBajo
                    ? 'border-red-300 bg-red-50/20'
                    : 'border-gray-200 shadow-2xs'
                }`}
              >
                <div className="space-y-1 pr-4">
                  <span className="text-3xs font-black uppercase text-gray-400 tracking-wider">
                    Insumo #{i.id_insumo}
                  </span>
                  <h3 className="text-sm font-black text-gray-800 line-clamp-1">{i.nombre_insumo}</h3>

                  <div className="flex items-baseline gap-1.5 pt-1">
                    <span className={`text-xl font-black font-mono ${esAlertaBajo ? 'text-red-600' : 'text-gray-800'}`}>
                      {typeof i.cantidad_actual === 'number'
                        ? i.cantidad_actual % 1 === 0
                          ? i.cantidad_actual.toFixed(0)
                          : i.cantidad_actual.toFixed(3)
                        : i.cantidad_actual}
                    </span>
                    <span className="text-2xs font-bold text-gray-400">{i.unidad_medida}</span>
                  </div>

                  {esAlertaBajo && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-red-700 bg-red-100 px-2 py-0.5 rounded-md">
                      <IconoAlerta />
                      STOCK CRITICO (Min: {i.stock_minimo} {i.unidad_medida})
                    </span>
                  )}
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => abrirAjuste(i, 'MERMA')}
                    className="w-14 h-14 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl flex flex-col items-center justify-center text-red-600 active:scale-95 transition-all"
                  >
                    <span className="text-lg font-black leading-none">-</span>
                    <span className="text-[8px] font-black uppercase tracking-tighter">Merma</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => abrirAjuste(i, 'ENTRADA')}
                    className="w-14 h-14 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl flex flex-col items-center justify-center text-emerald-600 active:scale-95 transition-all"
                  >
                    <span className="text-lg font-black leading-none">+</span>
                    <span className="text-[8px] font-black uppercase tracking-tighter">Stock</span>
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* MODAL: AJUSTE DE STOCK */}
      {mostrarAjuste && insumoSel && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleProcesarAjuste}
            className="bg-white rounded-3xl p-6 w-full max-w-xs space-y-4 text-xs font-bold text-gray-500 shadow-2xl"
          >
            <div className="border-b pb-2">
              <span className={`text-3xs font-black uppercase px-2 py-0.5 rounded ${
                tipoAjuste === 'ENTRADA' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
              }`}>
                {tipoAjuste === 'ENTRADA' ? '+ Registrar Entrada' : '- Reportar Merma'}
              </span>
              <h3 className="text-sm font-black text-gray-800 mt-1.5">{insumoSel.nombre_insumo}</h3>
              <p className="text-3xs text-gray-400 font-medium mt-0.5">
                Stock actual: {insumoSel.cantidad_actual} {insumoSel.unidad_medida}
              </p>
            </div>
            <div>
              <label className="block mb-1 text-gray-400 uppercase text-3xs">
                Cantidad ({insumoSel.unidad_medida}):
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                required
                autoFocus
                value={cantidadInput}
                onChange={e => setCantidadInput(noNeg(e.target.value, cantidadInput))}
                placeholder={`0.000 ${insumoSel.unidad_medida}`}
                className="w-full p-3 border rounded-xl font-mono text-center font-black text-gray-800 text-base bg-gray-50 focus:outline-none"
              />
            </div>
            <div className="flex gap-2 pt-2 border-t font-black uppercase text-2xs">
              <button
                type="button"
                onClick={() => setMostrarAjuste(false)}
                className="w-1/3 py-2.5 border rounded-xl text-gray-400 normal-case font-bold"
              >
                Cerrar
              </button>
              <button
                type="submit"
                disabled={ajustando}
                className={`flex-1 py-2.5 text-white rounded-xl shadow transition-colors ${
                  tipoAjuste === 'ENTRADA'
                    ? ajustando ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'
                    : ajustando ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {ajustando ? 'Procesando...' : (tipoAjuste === 'ENTRADA' ? 'Confirmar Carga' : 'Registrar Merma')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: NUEVO INSUMO */}
      {mostrarNuevo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleCrearInsumo}
            className="bg-white rounded-3xl p-6 w-full max-w-sm space-y-4 text-xs font-bold text-gray-500 shadow-2xl"
          >
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-black text-gray-800">Alta de Nuevo Insumo</h3>
              <button
                type="button"
                onClick={() => { setMostrarNuevo(false); setFormNuevo(FORM_NUEVO_INSUMO) }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
              >
                <IconoCerrar />
              </button>
            </div>

            <div>
              <label className="block mb-1 text-3xs uppercase text-gray-400">Nombre del Insumo *</label>
              <input
                type="text"
                required
                autoFocus
                value={formNuevo.nombre_insumo}
                onChange={e => setFormNuevo({ ...formNuevo, nombre_insumo: e.target.value })}
                placeholder="Ej. Cafe en grano, Leche entera, Dona base"
                className="w-full p-2.5 border rounded-xl font-medium text-gray-800 bg-gray-50 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-3xs uppercase text-gray-400">Cantidad Inicial *</label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  required
                  value={formNuevo.cantidad_actual}
                  onChange={e => setFormNuevo({ ...formNuevo, cantidad_actual: noNeg(e.target.value, formNuevo.cantidad_actual) })}
                  placeholder="0.000"
                  className="w-full p-2.5 border rounded-xl font-mono text-gray-800 bg-gray-50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block mb-1 text-3xs uppercase text-gray-400">Unidad de Medida</label>
                <select
                  value={formNuevo.unidad_medida}
                  onChange={e => setFormNuevo({ ...formNuevo, unidad_medida: e.target.value })}
                  className="w-full p-2.5 border rounded-xl font-medium text-gray-800 bg-gray-50 focus:outline-none"
                >
                  {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block mb-1 text-3xs uppercase text-gray-400">
                Stock Minimo (alerta cuando baje de este valor)
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={formNuevo.stock_minimo}
                onChange={e => setFormNuevo({ ...formNuevo, stock_minimo: noNeg(e.target.value, formNuevo.stock_minimo) })}
                placeholder="5"
                className="w-full p-2.5 border rounded-xl font-mono text-gray-800 bg-gray-50 focus:outline-none"
              />
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
              <p className="text-3xs text-blue-700 font-medium normal-case leading-relaxed">
                Una vez creado, este insumo aparecera en el selector de recetas (Menu) y en el
                vinculador de extras. Podras ajustar su stock desde esta pantalla con los botones
                + y - de cada tarjeta.
              </p>
            </div>

            <div className="flex gap-2 pt-2 border-t font-black uppercase text-2xs">
              <button
                type="button"
                onClick={() => { setMostrarNuevo(false); setFormNuevo(FORM_NUEVO_INSUMO) }}
                className="w-1/3 py-2.5 border rounded-xl text-gray-400 normal-case font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardandoNuevo}
                className="flex-1 py-2.5 bg-[#8B5A2B] hover:bg-[#7A4F25] text-white rounded-xl shadow disabled:bg-gray-300 disabled:text-gray-400 transition-colors"
              >
                {guardandoNuevo ? 'Guardando...' : 'Registrar Insumo'}
              </button>
            </div>
          </form>
        </div>
      )}
      <DialogoUI />
    </div>
  )
}