import React, { useState, useEffect } from 'react';

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Función para obtener las comandas locales y remotas
  const obtenerPedidos = () => {
    fetch('http://127.0.0.1:5000/api/pedidos/activos')
      .then((res) => {
        if (!res.ok) throw new Error('Error en la respuesta del servidor');
        return res.json();
      })
      .then((data) => {
        // Forzamos a que si la API no manda un arreglo, no rompa el .map()
        setPedidos(Array.isArray(data) ? data : []);
        setCargando(false);
      })
      .catch((err) => {
        console.error("Error cargando pedidos:", err);
        setError(err.message);
        setCargando(false);
      });
  };

  useEffect(() => {
    obtenerPedidos();
    // Polling automático cada 5 segundos para recibir órdenes de la web en tiempo real
    const intervalo = setInterval(obtenerPedidos, 5000);
    return () => clearInterval(intervalo);
  }, []);

  if (cargando) {
    return <div className="p-6 text-gray-600">Cargando monitor de cocina...</div>;
  }

  if (error) {
    return (
      <div className="p-6 text-red-500 font-bold">
        ⚠️ No se pudo conectar al monitor de pedidos: {error}
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-gray-800">
          📺 Monitor de Cocina y Pedidos Activos
        </h1>
        <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full animate-pulse">
          Sincronizado vía Remota (Página Web)
        </span>
      </div>

      {pedidos.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm text-center border text-gray-500">
          🍲 No hay pedidos ni comandas en preparación en este momento.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pedidos.map((pedido, index) => {
            // Aseguramos variables seguras para evitar colapsos por datos nulos
            const origen = pedido.numero_mesa || "Mostrador";
            const totalStr = pedido.total ? `$${parseFloat(pedido.total).toFixed(2)}` : "$0.00";
            const listaProductos = Array.isArray(pedido.productos) ? pedido.productos : [];

            return (
              <div key={index} className="bg-white rounded-xl shadow-md border-t-4 border-amber-500 p-5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-gray-700">
                      📍 {origen.startsWith('Mesa') || origen.includes('🌐') ? origen : `Mesa ${origen}`}
                    </h3>
                    <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded font-mono font-bold">
                      EN COLA
                    </span>
                  </div>

                  <div className="border-b pb-2 mb-3">
                    <p className="text-xs text-gray-400">Detalle de producción:</p>
                    <ul className="mt-1 space-y-1">
                      {listaProductos.map((prod, pIdx) => (
                        <li key={pIdx} className="text-sm text-gray-600 flex justify-between">
                          <span>
                            {prod.nombre_producto || prod.nombre || "Artículo"} <b className="text-amber-600">x{prod.cantidad || 1}</b>
                          </span>
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
                      // Simulación rápida de despacho/completado
                      alert(`Pedido de ${origen} marcado como listo para entrega.`);
                    }}
                    className="bg-gray-800 hover:bg-emerald-600 text-white text-xs px-3 py-2 rounded-lg font-bold transition-colors"
                  >
                    Despachar ➔
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