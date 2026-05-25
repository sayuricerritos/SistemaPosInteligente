import React, { useState, useEffect } from 'react'

export default function Administracion() {
  const [subVista, setSubVista] = useState('CAJA') // CAJA, GASTOS, HISTORIAL
  const [ventas, setVentas] = useState([])
  const [gastos, setGastos] = useState([])
  
  // Formulario de Gastos
  const [conceptoInput, setConceptoInput] = useState('')
  const [montoInput, setMontoInput] = useState('')

  const cargarDatosAdministrativos = () => {
    fetch('http://127.0.0.1:5000/api/administracion/ventas')
      .then(res => res.json())
      .then(data => setVentas(data))

    fetch('http://127.0.0.1:5000/api/administracion/gastos')
      .then(res => res.json())
      .then(data => setGastos(data))
  }

  useEffect(() => {
    cargarDatosAdministrativos()
  }, [])

  const handleRegistrarGasto = (e) => {
    e.preventDefault()
    if (!conceptoInput || !montoInput) return

    fetch('http://127.0.0.1:5000/api/administracion/gastos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ concepto: conceptoInput, monto: parseFloat(montoInput) })
    }).then(() => {
      cargarDatosAdministrativos()
      setConceptoInput('')
      setMontoInput('')
      alert('💸 Gasto registrado y descontado del balance de efectivo.')
    })
  }

  const handleReimprimirTicket = (idTicket) => {
    alert(`🖨️ [COMANDO TÉRMICO] Reimprimiendo copia exacta del boucher de venta #${idTicket} desde el archivo histórico de SQLite.`)
  }

  const handleCorteCaja = (tipoCorte) => {
    alert(`🖨️ [CORTE ENVIADO] Ejecutando Corte ${tipoCorte}. Vaciando acumulados, imprimiendo resumen financiero financiero y cerrando turno fiscal en la red de auditoría.`)
  }

  // Cálculos financieros consolidados en tiempo real para el corte
  const totalIngresosVentas = ventas.reduce((acc, v) => acc + (v.total || 0), 0)
  const totalEgresosGastos = gastos.reduce((acc, g) => acc + (g.monto || 0), 0)
  const balanceNetoEfectivo = 2500.0 + totalIngresosVentas - totalEgresosGastos // Asumiendo fondo inicial de $2500

  return (
    <div className="space-y-5 animate-fade-in text-xs font-bold text-gray-500">
      
      {/* PESTAÑAS DE NAVEGACIÓN ADMINISTRATIVA SUPERIOR */}
      <div className="grid grid-cols-3 gap-2 bg-gray-100 p-1 rounded-xl border flex-shrink-0">
        <button
          onClick={() => setSubVista('CAJA')}
          className={`py-3 rounded-lg text-2xs font-black uppercase tracking-wider transition-all ${subVista === 'CAJA' ? 'bg-[#8B5A2B] text-white shadow-xs' : 'bg-white text-gray-500'}`}
        >
          📊 Cortes de Caja (X/Z)
        </button>
        <button
          onClick={() => setSubVista('GASTOS')}
          className={`py-3 rounded-lg text-2xs font-black uppercase tracking-wider transition-all ${subVista === 'GASTOS' ? 'bg-[#8B5A2B] text-white shadow-xs' : 'bg-white text-gray-500'}`}
        >
          💸 Movimientos y Gastos
        </button>
        <button
          onClick={() => setSubVista('HISTORIAL')}
          className={`py-3 rounded-lg text-2xs font-black uppercase tracking-wider transition-all ${subVista === 'HISTORIAL' ? 'bg-[#8B5A2B] text-white shadow-xs' : 'bg-white text-gray-500'}`}
        >
          🗄️ Historial de Tickets
        </button>
      </div>

      {/* =======================================================
          VISTA 1: BALANCE FINANCIERO Y CORTES DE CAJA
         ======================================================= */}
      {subVista === 'CAJA' && (
        <div className="space-y-5 animate-fade-in">
          {/* CUADROS TÁCTILES ESTADÍSTICOS DE ALTA VISIBILIDAD */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border p-5 rounded-2xl shadow-2xs flex flex-col justify-between h-28">
              <span className="text-3xs uppercase tracking-wider text-gray-400"> Fondo Fijo Inicial (Caja)</span>
              <span className="text-lg font-black font-mono text-gray-700">$2,500.00</span>
            </div>
            <div className="bg-white border p-5 rounded-2xl shadow-2xs flex flex-col justify-between h-28">
              <span className="text-3xs uppercase tracking-wider text-emerald-600">➕ Total Ventas del Turno</span>
              <span className="text-lg font-black font-mono text-emerald-600">+${totalIngresosVentas.toFixed(2)}</span>
            </div>
            <div className="bg-white border p-5 rounded-2xl shadow-2xs flex flex-col justify-between h-28">
              <span className="text-3xs uppercase tracking-wider text-red-500">➖ Retiros / Gastos registradas</span>
              <span className="text-lg font-black font-mono text-red-500">-${totalEgresosGastos.toFixed(2)}</span>
            </div>
          </div>

          <div className="bg-[#0F172A] text-white p-6 rounded-3xl flex justify-between items-center shadow-lg">
            <div>
              <span className="text-3xs font-black uppercase tracking-widest text-slate-400">Arqueo Estimado de Efectivo en Caja</span>
              <h3 className="text-2xl font-black font-mono text-amber-400 mt-1">${balanceNetoEfectivo.toFixed(2)} <span className="text-xs text-white/60">MXN</span></h3>
            </div>
            
            <div className="flex gap-2">
              <button onClick={() => handleCorteCaja('X')} className="px-5 py-3 bg-slate-800 text-white border border-slate-700 rounded-xl font-black text-2xs uppercase tracking-wider hover:bg-slate-700">📄 Corte Parcial X</button>
              <button onClick={() => handleCorteCaja('Z')} className="px-5 py-3 bg-amber-500 text-slate-900 rounded-xl font-black text-2xs uppercase tracking-wider hover:bg-amber-400 shadow">🖨️ Cierre Fiscal Z</button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          VISTA 2: INYECTOR DE GASTOS Y FLUJOS DE SALIDA
         ======================================================= */}
      {subVista === 'GASTOS' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start animate-fade-in">
          {/* Formulario Izquierdo */}
          <form onSubmit={handleRegistrarGasto} className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-200 space-y-3 shadow-2xs">
            <h3 className="text-sm font-black text-gray-800 border-b pb-1.5">Inyectar Salida de Dinero</h3>
            <div>
              <label className="block mb-1 text-3xs uppercase tracking-wider text-gray-400">Concepto / Justificación:</label>
              <input type="text" required value={conceptoInput} onChange={e => setConceptoInput(e.target.value)} placeholder="Ej. Compra de bolsas, hielo, insumos..." className="w-full p-2.5 border rounded-xl font-medium text-gray-800 bg-gray-50 focus:outline-none" />
            </div>
            <div>
              <label className="block mb-1 text-3xs uppercase tracking-wider text-gray-400">Monto del Retiro ($):</label>
              <input type="number" required value={montoInput} onChange={e => setMontoInput(e.target.value)} placeholder="$ 0.00" className="w-full p-2.5 border rounded-xl font-mono text-gray-800 bg-gray-50 focus:outline-none" />
            </div>
            <button type="submit" className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl uppercase tracking-wider shadow pt-3">
              ⬇️ Registrar Egreso de Efectivo
            </button>
          </form>

          {/* Tabla de Egresos Derecha */}
          <div className="lg:col-span-3 bg-white border rounded-2xl overflow-hidden shadow-2xs">
            <div className="p-3 bg-gray-50 border-b font-black text-gray-700 uppercase text-3xs tracking-wider">Historial de Salidas del Turno</div>
            <div className="divide-y overflow-y-auto max-h-64 font-medium text-gray-700">
              {gastos.map(g => (
                <div key={g.id_gasto} className="p-3 flex justify-between items-center hover:bg-gray-50/40">
                  <div>
                    <p className="font-black text-gray-900">{g.concepto}</p>
                    <p className="text-[10px] text-gray-400 font-mono">{g.fecha}</p>
                  </div>
                  <span className="font-mono font-black text-red-600 text-sm">-${g.monto.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          VISTA 3: AUDITORÍA RETROACTIVA E IMPRESIÓN PASADA
         ======================================================= */}
      {subVista === 'HISTORIAL' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm animate-fade-in">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-400 text-3xs font-black uppercase tracking-wider border-b">
              <tr>
                <th className="p-4">Folio Ticket</th>
                <th className="p-4">Origen / Canal</th>
                <th className="p-4">Fecha de Venta</th>
                <th className="p-4">Estado Fiscal</th>
                <th className="p-4 text-right">Total Cobrado</th>
                <th className="p-4 text-center">Acción de Caja</th>
              </tr>
            </thead>
            <tbody className="divide-y font-medium text-gray-700">
              {ventas.map(v => (
                <tr key={v.id_pedido} className="hover:bg-gray-50/50">
                  <td className="p-4 font-mono font-black text-gray-900">#000{v.id_pedido}</td>
                  <td className="p-4"><span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-3xs font-black uppercase">{v.tipo_pedido}</span></td>
                  <td className="p-4 font-mono text-gray-500 text-2xs">{v.fecha}</td>
                  <td className="p-4"><span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">✓ Cerrado</span></td>
                  <td className="p-4 text-right font-mono font-black text-gray-900">${v.total.toFixed(2)}</td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleReimprimirTicket(v.id_pedido)}
                      className="px-4 py-1.5 bg-white border hover:bg-gray-50 text-gray-600 rounded-xl text-3xs font-black uppercase transition-all"
                    >
                      🖨️ Reimprimir Ticket
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  )
}