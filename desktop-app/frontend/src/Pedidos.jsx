import React, { useState, useEffect } from 'react';

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

export default function Pedidos() {
  const [pedidos, setPedidos]   = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError]       = useState(null);

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
            return (
              <div key={index} className="bg-white rounded-xl shadow-md border-t-4 border-amber-500 p-5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                      <IconoMesa className="text-gray-400" />
                      {origen.startsWith('Mesa') || origen.includes('Web') ? origen : `Mesa ${origen}`}
                    </h3>
                    <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded font-mono font-bold">EN COLA</span>
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
                <div className="mt-4 flex justify-between items-center pt-2 border-t border-dashed">
                  <div>
                    <p className="text-xs text-gray-400">Total a liquidar:</p>
                    <p className="text-xl font-black text-gray-800">{totalStr}</p>
                  </div>
                  <button
                    onClick={() => {
                      fetch('http://127.0.0.1:5000/api/pedidos/despachar', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ numero_mesa: origen })
                      })
                      .then(res => { if (!res.ok) throw new Error('Error al despachar'); return res.json(); })
                      .then(() => { alert(`Orden de ${origen} despachada con exito.`); obtenerPedidos(); })
                      .catch(err => alert(`Error: ${err.message}`));
                    }}
                    className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2"
                  >
                    Despachar <IconoFlecha />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
