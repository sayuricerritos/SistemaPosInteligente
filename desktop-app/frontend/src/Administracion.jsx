import React, { useState, useEffect } from 'react';
import IAPredictiva from './IAPredictiva';
import { useDialogo } from './components/Dialogo'

// Iconos SVG inline
const IconoTendenciaBaja = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" />
  </svg>
)
const IconoEfectivo = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" />
  </svg>
)
const IconoTarjeta = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
  </svg>
)
const IconoCorte = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 11 12 14 22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
)
const IconoTicket = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" />
    <line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
    <line x1="9" y1="15" x2="9.01" y2="15" /><line x1="15" y1="15" x2="15.01" y2="15" />
  </svg>
)

export default function Administracion({ usuario }) {
  // Estado base con ceros explicitos garantiza que .toFixed(2) nunca
  // actue sobre undefined durante el primer ciclo de renderizado.
  const CORTE_VACIO = {
    efectivo:     0,
    tarjeta:      0,
    total_ventas: 0,
    total_gastos: 0,
    balance_neto: 0,
    tickets:      0,
    fecha:        '',
  };

  const [gastos,                  setGastos]                  = useState([]);
  const [corte,                   setCorte]                   = useState(CORTE_VACIO);
  const [tickets,                 setTickets]                 = useState([]);
  const [fechaFiltro,             setFechaFiltro]             = useState(new Date().toISOString().split('T')[0]);
  const [seccionActiva,           setSeccionActiva]           = useState('Finanzas');
  const [concepto,                setConcepto]                = useState('');
  const [montoGasto,              setMontoGasto]              = useState('');
  const [ejecutando,              setEjecutando]              = useState(false);
  const [mensajeCorte,            setMensajeCorte]            = useState(null);
  const [corteHistorico,          setCorteHistorico]          = useState(null);
  const [cargandoCorteHistorico,  setCargandoCorteHistorico]  = useState(false);
  const { notificar, confirmar, DialogoUI } = useDialogo()

  const cargarDatosAdministrativos = () => {
    fetch(`http://127.0.0.1:5000/api/administracion/gastos`)
      .then(r => r.json())
      .then(d => setGastos(Array.isArray(d) ? d : []))
      .catch(e => console.error("Error gastos:", e));

    fetch(`http://127.0.0.1:5000/api/administracion/corte-diario?fecha=${fechaFiltro}`)
      .then(r => r.json())
      .then(d => { if (!d.error) setCorte({ ...CORTE_VACIO, ...d }) })
      .catch(e => console.error("Error corte:", e));

    fetch(`http://127.0.0.1:5000/api/administracion/tickets?fecha=${fechaFiltro}`)
      .then(r => r.json())
      .then(d => setTickets(Array.isArray(d) ? d : []))
      .catch(e => console.error("Error tickets:", e));

    setCargandoCorteHistorico(true)
    fetch(`http://127.0.0.1:5000/api/administracion/cortes-historicos/fecha/${fechaFiltro}`)
      .then(r => r.json())
      .then(d => {
        if (d.existe && d.corte) {
          setCorteHistorico(d.corte)
        } else {
          setCorteHistorico(null)
        }
      })
      .catch(e => {
        console.error("Error corte historico:", e)
        setCorteHistorico(null)
      })
      .finally(() => setCargandoCorteHistorico(false))
  };

  useEffect(() => {
    if (seccionActiva === 'Finanzas') cargarDatosAdministrativos();
  }, [fechaFiltro, seccionActiva]);

  const registrarGastoManual = (e) => {
    e.preventDefault();
    if (!concepto || !montoGasto) return;
    fetch('http://127.0.0.1:5000/api/administracion/gastos', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ concepto, monto: parseFloat(montoGasto) }),
    })
    .then(() => {
      setConcepto('');
      setMontoGasto('');
      cargarDatosAdministrativos();
    });
  };

  const handleEjecutarCorte = async () => {
    const ok = await confirmar(`Ejecutar y persistir el corte de caja para ${fechaFiltro}?`)
    if (!ok) return
    setEjecutando(true)
    setMensajeCorte(null)
    try {
      const r = await fetch('http://127.0.0.1:5000/api/administracion/ejecutar-corte', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ fecha: fechaFiltro }),
      })
      const d = await r.json()
      if (r.status === 409) {
        notificar('Ya existe un corte de caja para esta fecha.', 'error')
        return
      }
      if (d.error) {
        notificar(`Error al ejecutar corte: ${d.error}`, 'error')
        return
      }
      setMensajeCorte({
        tipo:   'exito',
        texto:  `Corte del ${d.fecha} persistido. Balance: $${d.balance_neto.toFixed(2)} | Tickets: ${d.tickets}`,
        tiempo: d.ejecutado_at,
      })
      cargarDatosAdministrativos()
    } catch {
      notificar('Error de conexion al ejecutar corte.', 'error')
    } finally {
      setEjecutando(false)
    }
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen text-xs font-bold text-gray-500 space-y-5">

      {/* BARRA SUPERIOR */}
      <div className="bg-white p-4 rounded-xl border flex justify-between items-center shadow-2xs">
        <div>
          <h2 className="text-xl font-black text-gray-800">Panel de Control Gerencial y Analitico</h2>
          <p className="text-3xs text-gray-400 font-medium uppercase">
            Auditoria financiera, cortes de caja e indicadores predictivos
          </p>
        </div>
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl border">
          {[['Finanzas', 'Flujo de Caja'], ['IA', 'Reporte IA']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSeccionActiva(key)}
              className={`px-4 py-2 rounded-lg text-3xs font-black uppercase transition-all ${
                seccionActiva === key
                  ? (key === 'IA' ? 'bg-purple-700 text-white shadow-sm' : 'bg-[#8B5A2B] text-white shadow-sm')
                  : 'bg-white text-gray-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ---- VISTA DE FINANZAS ---- */}
      {seccionActiva === 'Finanzas' && (
        <div className="space-y-6 animate-fade-in">

          {/* Selector de fecha y boton de corte */}
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-3xs uppercase text-gray-400">Fecha de Arqueo:</span>
              <input
                type="date"
                value={fechaFiltro}
                onChange={e => setFechaFiltro(e.target.value)}
                className="p-2 border rounded-xl bg-white font-bold text-gray-700 focus:outline-none cursor-pointer text-xs"
              />
            </div>
            <button
              onClick={handleEjecutarCorte}
              disabled={ejecutando || corteHistorico !== null}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#8B5A2B] hover:bg-[#7A4F25] text-white font-black text-3xs uppercase rounded-xl shadow transition-colors disabled:bg-gray-300 disabled:text-gray-400"
            >
              <IconoCorte />
              {corteHistorico ? 'Corte ya ejecutado' : (ejecutando ? 'Ejecutando...' : 'Ejecutar Corte de Caja')}
            </button>
          </div>

          {/* Mensaje de confirmacion de corte */}
          {mensajeCorte && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-3xs font-bold flex justify-between items-center">
              <span>{mensajeCorte.texto}</span>
              <span className="font-mono font-medium text-emerald-600 ml-4">{mensajeCorte.tiempo}</span>
            </div>
          )}

          {/* SECCIÓN: CORTE HISTÓRICO */}
          <div className="bg-white border rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b">
              <span className="text-sm font-black text-gray-800 uppercase">
                {corteHistorico ? '✓ Corte Guardado para esta Fecha' : 'Sin Corte Registrado'}
              </span>
              {cargandoCorteHistorico && <span className="text-3xs text-gray-400 animate-pulse">Cargando...</span>}
            </div>
            {!cargandoCorteHistorico && corteHistorico === null && (
              <p className="text-center text-gray-400 py-4 font-medium text-3xs">No hay corte registrado para esta fecha.</p>
            )}
            {corteHistorico && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="text-3xs text-gray-400 uppercase font-bold block mb-1">Efectivo</span>
                  <span className="text-lg font-black font-mono text-gray-800">${(corteHistorico.efectivo ?? 0).toFixed(2)}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="text-3xs text-gray-400 uppercase font-bold block mb-1">Tarjeta</span>
                  <span className="text-lg font-black font-mono text-gray-800">${(corteHistorico.tarjeta ?? 0).toFixed(2)}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="text-3xs text-gray-400 uppercase font-bold block mb-1">Total Ventas</span>
                  <span className="text-lg font-black font-mono text-gray-800">${(corteHistorico.total_ventas ?? 0).toFixed(2)}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="text-3xs text-gray-400 uppercase font-bold block mb-1">Tickets</span>
                  <span className="text-lg font-black font-mono text-gray-800">{corteHistorico.tickets ?? 0}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="text-3xs text-gray-400 uppercase font-bold block mb-1">Gastos</span>
                  <span className="text-lg font-black font-mono text-red-600">-${(corteHistorico.total_gastos ?? 0).toFixed(2)}</span>
                </div>
                <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                  <span className="text-3xs text-emerald-700 uppercase font-bold block mb-1">Balance Neto</span>
                  <span className="text-lg font-black font-mono text-emerald-700">${(corteHistorico.balance_neto ?? 0).toFixed(2)}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg md:col-span-2">
                  <span className="text-3xs text-gray-400 uppercase font-bold block mb-1">Hora de Ejecución</span>
                  <span className="text-sm font-mono text-gray-700">{corteHistorico.ejecutado_at || '--'}</span>
                </div>
              </div>
            )}
          </div>

          {/* TARJETAS KPI SEGMENTADAS: CÁLCULO EN TIEMPO REAL (no persistido) */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4">
            <span className="text-3xs text-blue-700 font-black uppercase">ℹ️ Resumen en Tiempo Real</span>
            <p className="text-3xs text-blue-600 font-medium">Estos valores se calculan dinámicamente basados en transacciones del día. Compara con el corte guardado arriba.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Efectivo */}
            <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between h-24">
              <div className="flex justify-between items-start">
                <span className="text-3xs text-emerald-700 uppercase font-black">Efectivo</span>
                <IconoEfectivo />
              </div>
              <span className="text-xl font-black font-mono text-gray-800">${(corte?.efectivo ?? 0).toFixed(2)}</span>
            </div>
            {/* Tarjeta */}
            <div className="bg-white border border-blue-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between h-24">
              <div className="flex justify-between items-start">
                <span className="text-3xs text-blue-700 uppercase font-black">Tarjeta</span>
                <IconoTarjeta />
              </div>
              <span className="text-xl font-black font-mono text-gray-800">${(corte?.tarjeta ?? 0).toFixed(2)}</span>
            </div>
            {/* Total ventas */}
            <div className="bg-white border rounded-2xl p-4 shadow-2xs flex flex-col justify-between h-24">
              <span className="text-3xs text-gray-500 uppercase font-black">Total Ventas</span>
              <div>
                <span className="text-xl font-black font-mono text-gray-800">${(corte?.total_ventas ?? 0).toFixed(2)}</span>
                <span className="block text-3xs text-gray-400 font-medium">{corte?.tickets ?? 0} tickets</span>
              </div>
            </div>
            {/* Gastos */}
            <div className="bg-white border border-red-100 rounded-2xl p-4 shadow-2xs flex flex-col justify-between h-24">
              <span className="text-3xs text-red-500 uppercase font-black">Gastos Operativos</span>
              <span className="text-xl font-black font-mono text-gray-800">${(corte?.total_gastos ?? 0).toFixed(2)}</span>
            </div>
            {/* Balance neto */}
            <div className={`border rounded-2xl p-4 shadow-2xs flex flex-col justify-between h-24 ${
              (corte?.balance_neto ?? 0) >= 0
                ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800'
                : 'bg-red-50/50 border-red-200 text-red-800'
            }`}>
              <span className="text-3xs uppercase font-black">Balance Neto</span>
              <span className="text-xl font-black font-mono">${(corte?.balance_neto ?? 0).toFixed(2)}</span>
            </div>
          </div>

          {/* HISTORIAL DE TICKETS */}
          <div className="bg-white border rounded-2xl p-5 shadow-2xs space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-sm font-black text-gray-800 uppercase flex items-center gap-2">
                <IconoTicket />Historial de Tickets del Dia
              </span>
              <span className="text-3xs text-gray-400 font-mono">{Array.isArray(tickets) ? tickets.length : 0} ordenes</span>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {!Array.isArray(tickets) || tickets.length === 0 ? (
                <p className="text-center text-gray-400 py-6 font-medium">Sin pedidos completados en esta fecha.</p>
              ) : (
                <table className="w-full text-left text-3xs font-bold text-gray-600">
                  <thead className="bg-gray-50 text-gray-400 uppercase tracking-wider sticky top-0">
                    <tr>
                      <th className="p-2">#</th>
                      <th className="p-2">Mesa / Canal</th>
                      <th className="p-2">Total</th>
                      <th className="p-2">Metodo</th>
                      <th className="p-2">Hora</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {tickets.map(t => (
                      <tr key={t.id_pedido} className="hover:bg-gray-50/50">
                        <td className="p-2 font-mono text-gray-400">#{t.id_pedido}</td>
                        <td className="p-2 text-gray-700 font-black">{t.numero_mesa}</td>
                        <td className="p-2 font-mono font-black text-gray-800">${parseFloat(t.total).toFixed(2)}</td>
                        <td className="p-2">
                          <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            t.metodo_pago === 'Tarjeta'
                              ? 'bg-blue-50 text-blue-700 border border-blue-100'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          }`}>
                            {t.metodo_pago || 'Efectivo'}
                          </span>
                        </td>
                        <td className="p-2 font-mono text-gray-400">
                          {t.fecha ? t.fecha.split(' ')[1]?.slice(0, 5) : '--'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* GASTOS OPERATIVOS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <form onSubmit={registrarGastoManual} className="bg-white border rounded-2xl p-5 shadow-2xs h-fit space-y-4">
              <div className="border-b pb-2">
                <h3 className="text-sm font-black text-gray-800 uppercase">Registrar Salida de Efectivo</h3>
                <p className="text-3xs text-gray-400">Afecta el arqueo del dia seleccionado</p>
              </div>
              <div className="space-y-1">
                <label className="text-3xs text-gray-400 uppercase">Concepto de Gasto</label>
                <input
                  type="text"
                  value={concepto}
                  onChange={e => setConcepto(e.target.value)}
                  placeholder="Ej. Compra de insumos"
                  className="w-full p-2.5 border rounded-xl bg-gray-50 text-gray-800 font-medium focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-3xs text-gray-400 uppercase">Monto ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={montoGasto}
                  onChange={e => setMontoGasto(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-2.5 border rounded-xl bg-gray-50 text-gray-800 font-mono focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-gray-800 hover:bg-gray-900 text-white font-black rounded-xl uppercase tracking-wider shadow transition-colors flex items-center justify-center gap-2"
              >
                <IconoTendenciaBaja />
                Registrar Egreso
              </button>
            </form>

            <div className="lg:col-span-2 bg-white border rounded-2xl p-5 shadow-2xs space-y-3">
              <span className="block text-3xs font-black text-gray-400 uppercase tracking-wider border-b pb-2">
                Historial de Egresos Registrados:
              </span>
              <div className="space-y-2 max-h-[35vh] overflow-y-auto pr-1">
                {gastos.length === 0 ? (
                  <p className="text-center text-gray-400 py-6 font-medium">No se registran egresos en el historial.</p>
                ) : (
                  gastos.map(g => (
                    <div key={g.id_gasto} className="p-3 bg-gray-50 border rounded-xl flex justify-between items-center shadow-3xs">
                      <div>
                        <h4 className="font-black text-gray-700 text-xs">{g.concepto}</h4>
                        <p className="text-3xs text-gray-400 font-mono mt-0.5">{g.fecha}</p>
                      </div>
                      <span className="font-mono text-red-600 font-black text-sm">
                        -${parseFloat(g.monto).toFixed(2)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---- VISTA IA ---- */}
      {seccionActiva === 'IA' && (
        <div className="animate-fade-in">
          <IAPredictiva />
        </div>
      )}
      <DialogoUI />
    </div>
  );
}