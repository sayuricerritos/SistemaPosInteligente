import React, { useState, useEffect } from 'react';
import { useDialogo } from './components/Dialogo'
const IconoMonitor = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
  </svg>
)
const IconoAlerta = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)
const IconoMesa = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12h16" /><path d="M4 12v8" /><path d="M20 12v8" /><path d="M7 12V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v6" />
  </svg>
)
const IconoVacio = ({ className = "w-10 h-10" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 11l19-9-9 19-2-8-8-2z" />
  </svg>
)
const IconoFlecha = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
)
const IconoCerrar = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)
const IconoBillete = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" />
  </svg>
)
const IconoTarjeta = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
  </svg>
)

export default function Pedidos() {
  const [pedidos, setPedidos]   = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError]       = useState(null);
  const [despachando, setDespachando]         = useState({});
  const [pedidoWebACobrar, setPedidoWebACobrar] = useState(null);
  const [metodoPagoWeb, setMetodoPagoWeb]       = useState('Efectivo');
  const [efectivoWeb, setEfectivoWeb]           = useState('');
  const [procesandoCobroWeb, setProcesandoCobroWeb] = useState(false);
  const { notificar, DialogoUI } = useDialogo()

  const cerrarModalCobro = () => {
    setPedidoWebACobrar(null)
    setMetodoPagoWeb('Efectivo')
    setEfectivoWeb('')
  }

  const confirmarCobroWeb = () => {
    if (procesandoCobroWeb) return
    setProcesandoCobroWeb(true)
    fetch('http://127.0.0.1:5000/api/pedidos/web/cobrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_pedido: pedidoWebACobrar.id_pedido, metodo_pago: metodoPagoWeb })
    })
    .then(async res => {
      const data = await res.json()
      if (res.status === 409) {
        notificar('Este pedido ya fue cobrado o no está listo para cobrar.', 'error')
        cerrarModalCobro()
        return
      }
      if (!res.ok) throw new Error(data.error || 'No se pudo cobrar el pedido.')
      notificar(`Pedido cobrado con exito (${metodoPagoWeb}).`, 'exito')
      cerrarModalCobro()
      obtenerPedidos()
    })
    .catch(err => notificar(`Error: ${err.message}`, 'error'))
    .finally(() => setProcesandoCobroWeb(false))
  }

  const obtenerPedidos = () => {
    fetch('http://127.0.0.1:5000/api/pedidos/activos')
      .then(res => {
        if (!res.ok) throw new Error('Error en la respuesta del servidor');
        return res.json();
      })
      .then(data => { setPedidos(Array.isArray(data) ? data : []); setCargando(false); })
      .catch(err => { console.error("Error cargando pedidos:", err); setError(err.message); setCargando(false); });
  };

  useEffect(() => {
    obtenerPedidos();
    const intervalo = setInterval(obtenerPedidos, 5000);
    return () => clearInterval(intervalo);
  }, []);

  if (cargando) return <div className="p-6 text-gray-500 text-xs font-bold">Cargando monitor de cocina...</div>;

  if (error) return (
    <div className="p-6 text-red-500 font-bold flex items-center gap-2 text-xs">
      <IconoAlerta className="w-4 h-4 flex-shrink-0" />
      No se pudo conectar al monitor de pedidos: {error}
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-extrabold text-gray-800 flex items-center gap-3">
          <IconoMonitor />
          Monitor de Cocina y Pedidos Activos
        </h1>
        <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full animate-pulse">
          Sincronizado en tiempo real
        </span>
      </div>

      {pedidos.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm text-center border text-gray-400 flex flex-col items-center gap-3">
          <IconoVacio className="text-gray-300" />
          <p className="text-sm font-bold">No hay pedidos ni comandas en preparacion en este momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pedidos.map((pedido, index) => {
            const origen         = pedido.numero_mesa || "Mostrador";
            const totalStr       = pedido.total ? `$${parseFloat(pedido.total).toFixed(2)}` : "$0.00";
            const listaProductos = Array.isArray(pedido.productos) ? pedido.productos : [];
            const esWeb   = pedido.metodo_pago === 'Web';
            const esListo = pedido.estado === 'Listo';

            return (
              <div
                key={index}
                className={`bg-white rounded-xl shadow-md border-t-4 p-5 flex flex-col justify-between ${
                  esListo ? 'border-emerald-500' : 'border-amber-500'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                      <IconoMesa className="text-gray-400" />
                      {origen.startsWith('Mesa') || origen.includes('Web') ? origen : `Mesa ${origen}`}
                    </h3>
                    {esListo ? (
                      <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded font-mono font-bold">LISTO</span>
                    ) : (
                      <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded font-mono font-bold">EN COLA</span>
                    )}
                  </div>
                  <div className="border-b pb-2 mb-3">
                    <p className="text-xs text-gray-400">Detalle de produccion:</p>
                    <ul className="mt-1 space-y-1">
                      {listaProductos.map((prod, pIdx) => (
                        <li key={pIdx} className="text-sm text-gray-600 flex justify-between">
                          <span>{prod.nombre_producto || prod.nombre || "Articulo"} <b className="text-amber-600">x{prod.cantidad || 1}</b></span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-4 pt-2 border-t border-dashed">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-400">Total a liquidar:</p>
                      <p className="text-xl font-black text-gray-800">{totalStr}</p>
                    </div>

                    {/* Pedido web LISTO: selector de metodo + botón Cobrar */}
                    {esWeb && esListo ? (
                      <button
                        onClick={() => {
                          setMetodoPagoWeb('Efectivo')
                          setEfectivoWeb('')
                          setPedidoWebACobrar(pedido)
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 text-xs"
                      >
                        Cobrar pedido <IconoFlecha />
                      </button>
                    ) : (
                      /* Pedido normal o web en cocina: botón Despachar */
                      <button
                        onClick={() => {
                          if (despachando[pedido.id_pedido]) return
                          setDespachando(prev => ({ ...prev, [pedido.id_pedido]: true }))
                          fetch('http://127.0.0.1:5000/api/pedidos/despachar', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id_pedido: pedido.id_pedido, numero_mesa: origen })
                          })
                          .then(res => { if (!res.ok) throw new Error('Error al despachar'); return res.json(); })
                          .then(() => { notificar(`Orden de ${origen} despachada con exito.`, 'exito'); obtenerPedidos(); })
                          .catch(err => notificar(`Error: ${err.message}`, 'error'))
                          .finally(() => setDespachando(prev => ({ ...prev, [pedido.id_pedido]: false })))
                        }}
                        disabled={despachando[pedido.id_pedido]}
                        className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 disabled:bg-amber-300 disabled:cursor-not-allowed"
                      >
                        {despachando[pedido.id_pedido] ? 'Despachando...' : 'Despachar'} <IconoFlecha />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* MODAL: COBRO DE PEDIDO WEB — solo para metodo_pago='Web' y estado='Listo' */}
      {pedidoWebACobrar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-sm font-black text-gray-800">Cobro de Pedido Web</h3>
                <p className="text-3xs text-gray-400 font-medium mt-0.5">{pedidoWebACobrar.numero_mesa}</p>
              </div>
              <button onClick={cerrarModalCobro} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <IconoCerrar />
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-5 gap-5 text-2xs font-extrabold uppercase text-gray-400">
              {/* PANEL IZQUIERDO: METODO + EFECTIVO */}
              <div className="md:col-span-3 space-y-3">
                <span>Metodo de Pago</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { setMetodoPagoWeb('Efectivo'); setEfectivoWeb('') }}
                    className={`p-3 border rounded-xl font-black flex items-center justify-center gap-2 ${metodoPagoWeb === 'Efectivo' ? 'bg-[#8B5A2B]/10 border-[#8B5A2B] text-[#8B5A2B]' : 'bg-white text-gray-500'}`}
                  >
                    <IconoBillete /> Efectivo
                  </button>
                  <button
                    onClick={() => { setMetodoPagoWeb('Tarjeta'); setEfectivoWeb('') }}
                    className={`p-3 border rounded-xl font-black flex items-center justify-center gap-2 ${metodoPagoWeb === 'Tarjeta' ? 'bg-[#8B5A2B]/10 border-[#8B5A2B] text-[#8B5A2B]' : 'bg-white text-gray-500'}`}
                  >
                    <IconoTarjeta /> Tarjeta
                  </button>
                </div>

                {metodoPagoWeb === 'Efectivo' && (
                  <div className="space-y-1">
                    <span>Efectivo Recibido ($)</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={efectivoWeb}
                      onChange={e => setEfectivoWeb(e.target.value)}
                      placeholder="$ 0.00"
                      className="w-full p-2.5 border rounded-xl font-mono text-gray-800 text-sm focus:outline-none focus:border-[#8B5A2B]"
                      autoFocus
                    />
                    {efectivoWeb && parseFloat(efectivoWeb) >= parseFloat(pedidoWebACobrar.total) && (
                      <div className="bg-emerald-50 text-emerald-700 p-2 rounded-lg text-3xs font-bold border border-emerald-200">
                        Cambio a entregar: ${(parseFloat(efectivoWeb) - parseFloat(pedidoWebACobrar.total)).toFixed(2)} MXN
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* PANEL DERECHO: RESUMEN */}
              <div className="md:col-span-2 bg-gray-50 border border-gray-200 p-4 rounded-xl flex flex-col justify-between">
                <div className="space-y-2 text-3xs font-medium text-gray-500">
                  <span className="border-b border-gray-200 pb-1 block font-black text-gray-700">Resumen del Pedido</span>
                  <div className="flex justify-between">
                    <span>Cliente:</span>
                    <span className="text-gray-800 font-black normal-case">{pedidoWebACobrar.numero_mesa.replace('Web: ', '')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="text-gray-800 font-black">${parseFloat(pedidoWebACobrar.total).toFixed(2)}</span>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <span className="text-3xs text-gray-500 block font-bold">Total a Cobrar</span>
                  <div className="flex justify-between items-baseline text-[#8B5A2B] font-black">
                    <span className="text-3xs">MXN</span>
                    <span className="text-xl font-mono">${parseFloat(pedidoWebACobrar.total).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t flex gap-3">
              <button
                onClick={cerrarModalCobro}
                className="w-1/3 py-2.5 border border-gray-200 bg-white text-gray-500 font-bold rounded-xl text-xs uppercase tracking-wider"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarCobroWeb}
                disabled={
                  procesandoCobroWeb ||
                  (metodoPagoWeb === 'Efectivo' && (!efectivoWeb || parseFloat(efectivoWeb) < parseFloat(pedidoWebACobrar.total)))
                }
                className="flex-1 py-2.5 bg-[#8B5A2B] hover:bg-[#7A4F25] text-white font-black rounded-xl text-xs uppercase tracking-wider disabled:bg-gray-200 disabled:text-gray-400 transition-colors flex items-center justify-center gap-2"
              >
                <IconoFlecha />
                {procesandoCobroWeb ? 'Procesando...' : 'Confirmar Cobro'}
              </button>
            </div>
          </div>
        </div>
      )}

      <DialogoUI />
    </div>
  );
}
