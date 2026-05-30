import React, { useState, useEffect } from 'react'

export default function Inventario() {
  const [insumos, setInsumos] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Estados para controlar el modal flotante de ajuste rápido
  const [mostrarModal, setMostrarModal] = useState(false)
  const [insumoSeleccionado, setInsumoSeleccionado] = useState(null)
  const [tipoAjuste, setTipoAjuste] = useState('ENTRADA') // ENTRADA o MERMA
  const [cantidadInput, setCantidadInput] = useState('')

  const cargarInsumos = () => {
    setLoading(true)
    fetch('http://127.0.0.1:5000/api/inventario')
      .then(res => res.json())
      .then(data => {
        setInsumos(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    cargarInsumos()
  }, [])

  const abrirAjuste = (insumo, tipo) => {
    setInsumoSeleccionado(insumo)
    setTipoAjuste(tipo)
    setCantidadInput('')
    setMostrarModal(true)
  }

  const handleProcesarAjuste = (e) => {
    e.preventDefault()
    if (!cantidadInput || parseFloat(cantidadInput) <= 0) return

    fetch('http://127.0.0.1:5000/api/inventario/ajustar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_insumo: insumoSeleccionado.id_insumo,
        cantidad: parseFloat(cantidadInput),
        tipo: tipoAjuste
      })
    })
    .then(() => {
      cargarInsumos()
      setMostrarModal(false)
      setInsumoSeleccionado(null)
    })
  }

  if (loading) return <div className="text-center py-12 text-gray-400 text-xs font-bold">Abriendo almacén de materias primas...</div>

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HEADER DE MÓDULO */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Control de Insumos y Materias Primas</h2>
          <p className="text-xs text-gray-400 mt-0.5">Monitoreo crítico de stock base y mermas operativas en tiempo real.</p>
        </div>
        <button onClick={cargarInsumos} className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-2xs py-2 px-4 rounded-xl transition-colors">
           Recargar Almacén
        </button>
      </div>

      {/* CUADRÍCULA DE INSUMOS TÁCTIL INDUSTRIAL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insumos.map((i) => {
          const esAlertaBajo = i.cantidad_actual <= i.stock_minimo
          return (
            <div 
              key={i.id_insumo} 
              className={`bg-white rounded-2xl p-5 border flex justify-between items-center transition-all ${
                esAlertaBajo ? 'border-red-300 bg-red-50/20 shadow-xs' : 'border-gray-200 shadow-2xs'
              }`}
            >
              {/* Información del Insumo */}
              <div className="space-y-1 pr-4">
                <span className="text-3xs font-black uppercase text-gray-400 tracking-wider">Materia Prima #{i.id_insumo}</span>
                <h3 className="text-sm font-black text-gray-800 line-clamp-1">{i.nombre_insumo}</h3>
                
                <div className="flex items-baseline gap-1.5 pt-1">
                  <span className={`text-xl font-black font-mono ${esAlertaBajo ? 'text-red-600' : 'text-gray-800'}`}>
                    {i.cantidad_actual.toFixed(1)}
                  </span>
                  <span className="text-2xs font-bold text-gray-400">{i.unidad_medida}</span>
                </div>

                {esAlertaBajo && (
                  <span className="inline-block text-[10px] font-black text-red-700 bg-red-100 px-2 py-0.5 rounded-md mt-1">
                    ⚠️ STOCK CRÍTICO (Mín: {i.stock_minimo})
                  </span>
                )}
              </div>

              {/* BOTONERA MASIVA PARA DEDOS */}
              <div className="flex gap-2 flex-shrink-0">
                <button 
                  type="button"
                  onClick={() => abrirAjuste(i, 'MERMA')}
                  className="w-14 h-14 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl flex flex-col items-center justify-center text-red-600 active:scale-95 transition-all"
                >
                  <span className="text-lg font-black">-</span>
                  <span className="text-[8px] font-black uppercase tracking-tighter">Merma</span>
                </button>

                <button 
                  type="button"
                  onClick={() => abrirAjuste(i, 'ENTRADA')}
                  className="w-14 h-14 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl flex flex-col items-center justify-center text-emerald-600 active:scale-95 transition-all"
                >
                  <span className="text-lg font-black">+</span>
                  <span className="text-[8px] font-black uppercase tracking-tighter">Stock</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* MODAL INTERACTIVO DE AJUSTE DE VOLUMEN */}
      {mostrarModal && insumoSeleccionado && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form onSubmit={handleProcesarAjuste} className="bg-white rounded-3xl p-6 w-full max-w-xs space-y-4 text-xs font-bold text-gray-500 shadow-2xl animate-scale-up">
            <div className="border-b pb-2">
              <span className={`text-3xs font-black uppercase px-2 py-0.5 rounded ${
                tipoAjuste === 'ENTRADA' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
              }`}>
                {tipoAjuste === 'ENTRADA' ? '+ Registrar Entrada Stock' : ' - Reportar Merma'}
              </span>
              <h3 className="text-sm font-black text-gray-800 mt-1.5">{insumoSeleccionado.nombre_insumo}</h3>
            </div>

            <div>
              <label className="block mb-1 text-gray-400 uppercase text-3xs">Cantidad a procesar ({insumoSeleccionado.unidad_medida}):</label>
              <input 
                type="number" 
                step="0.1" 
                required 
                autoFocus={true}
                value={cantidadInput} 
                onChange={e => setCantidadInput(e.target.value)} 
                placeholder={`0.0 ${insumoSeleccionado.unidad_medida}`}
                className="w-full p-3 border rounded-xl font-mono text-center font-black text-gray-800 text-base bg-gray-50 focus:outline-none" 
              />
            </div>

            <div className="flex gap-2 pt-2 border-t font-black uppercase text-2xs">
              <button type="button" onClick={() => setMostrarModal(false)} className="w-1/3 py-2.5 border rounded-xl text-gray-400 normal-case font-bold">Cerrar</button>
              <button 
                type="submit" 
                className={`flex-1 py-2.5 text-white rounded-xl shadow transition-colors ${
                  tipoAjuste === 'ENTRADA' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {tipoAjuste === 'ENTRADA' ? 'Confirmar Carga' : 'Registrar Merma'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}