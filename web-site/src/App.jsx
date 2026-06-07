import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

// Headers comunes — ngrok-skip-browser-warning evita la página de advertencia de ngrok
const FETCH_HEADERS = {
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true',
};

export default function App() {
  const [productos, setProductos]         = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState('Bebidas Calientes');
  const [carrito, setCarrito]             = useState([]);
  const [errorMenu, setErrorMenu]         = useState(null);
  const [nombreCliente, setNombreCliente] = useState('');
  const [horaRecogida, setHoraRecogida]   = useState('');
  const [pedidoEnviado, setPedidoEnviado] = useState(false);

  const categories = ['Bebidas Calientes', 'Bebidas Frias', 'Panaderia', 'Alimentos'];

  useEffect(() => {
    fetch(`${API_URL}/api/productos`, { headers: FETCH_HEADERS })
      .then(res => {
        if (!res.ok) throw new Error(`Error ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) setProductos(data);
        else throw new Error('Respuesta inesperada del servidor');
      })
      .catch(err => {
        console.error('Error al sincronizar menu web:', err);
        setErrorMenu('No se pudo conectar con la cafeteria. Intenta de nuevo en un momento.');
      });

    const ahora = new Date();
    ahora.setMinutes(ahora.getMinutes() + 20);
    const hh = String(ahora.getHours()).padStart(2, '0');
    const mm = String(ahora.getMinutes()).padStart(2, '0');
    setHoraRecogida(`${hh}:${mm}`);
  }, []);

  const agregarAlCarrito = (prod) => {
    const existe = carrito.find(item => item.id_producto === prod.id_producto);
    if (existe) {
      setCarrito(carrito.map(item =>
        item.id_producto === prod.id_producto ? { ...item, cantidad: item.cantidad + 1 } : item
      ));
    } else {
      setCarrito([...carrito, { ...prod, cantidad: 1 }]);
    }
  };

  const modificarCantidad = (id, cambio) => {
    setCarrito(carrito.map(item => {
      if (item.id_producto === id) {
        const nuevaCant = item.cantidad + cambio;
        return nuevaCant > 0 ? { ...item, cantidad: nuevaCant } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const calcularTotal = () =>
    carrito.reduce((acc, item) => acc + item.precio_venta * item.cantidad, 0);

  const gestionarEnvioPedido = (e) => {
    e.preventDefault();
    if (carrito.length === 0) return;

    const datosPedido = {
      cliente:       nombreCliente,
      hora_recogida: horaRecogida,
      items: carrito.map(item => ({
        id_producto:     item.id_producto,
        nombre_producto: item.nombre_producto,
        cantidad:        item.cantidad,
        precio_venta:    item.precio_venta,
      })),
      total: calcularTotal(),
    };

    fetch(`${API_URL}/api/pedidos/web`, {
      method:  'POST',
      headers: FETCH_HEADERS,
      body:    JSON.stringify(datosPedido),
    })
    .then(res => {
      if (res.ok) {
        setPedidoEnviado(true);
        setCarrito([]);
        setNombreCliente('');
      } else {
        alert('Error en el servidor al procesar tu orden.');
      }
    })
    .catch(err => {
      console.error('Error de red:', err);
      alert('No se pudo conectar con el servidor. Verifica tu conexion.');
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 antialiased font-sans">

      {/* HEADER */}
      <header className="bg-[#2D2A26] shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#8B5A2B] flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
              <line x1="6" y1="2" x2="6" y2="4" />
              <line x1="10" y1="2" x2="10" y2="4" />
              <line x1="14" y1="2" x2="14" y2="4" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-black text-white tracking-wide uppercase">Cafetería UAEMex</h1>
            <p className="text-[10px] text-gray-400 font-medium">Ordena en linea — recoge en mostrador</p>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* COLUMNA IZQUIERDA: CATEGORIAS Y PRODUCTOS */}
        <div className="lg:col-span-2 space-y-4">

          {/* Tabs de categorias */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoriaActiva(cat)}
                className={`py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all border ${
                  categoriaActiva === cat
                    ? 'bg-[#8B5A2B] text-white border-[#8B5A2B] shadow-sm'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-[#8B5A2B] hover:text-[#8B5A2B]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid de productos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {errorMenu ? (
              <div className="col-span-2 text-center py-10 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700">
                {errorMenu}
              </div>
            ) : productos.filter(p => p.categoria === categoriaActiva).length === 0 ? (
              <div className="col-span-2 text-center py-10 bg-white border border-dashed border-gray-300 rounded-xl text-xs font-bold text-gray-400">
                Cargando productos...
              </div>
            ) : (
              productos.filter(p => p.categoria === categoriaActiva).map(prod => (
                <div
                  key={prod.id_producto}
                  onClick={() => agregarAlCarrito(prod)}
                  className="bg-white border border-gray-200 p-4 rounded-xl flex justify-between items-center cursor-pointer hover:border-[#8B5A2B] hover:shadow-sm transition-all active:scale-97"
                >
                  <div>
                    <p className="font-black text-gray-800 text-xs">{prod.nombre_producto}</p>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">Toca para agregar</p>
                  </div>
                  <span className="text-[#8B5A2B] font-black font-mono text-sm flex-shrink-0 ml-3">
                    ${prod.precio_venta.toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: CARRITO */}
        <div className="w-full">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

            {/* Titulo carrito */}
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
              <h2 className="font-black text-gray-800 text-xs uppercase tracking-wider">Tu pedido</h2>
            </div>

            {pedidoEnviado ? (
              <div className="p-5 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <p className="font-black text-gray-800 text-sm">Pedido enviado</p>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                  Tu orden fue recibida en barra. Presentate en mostrador a la hora acordada.
                </p>
                <button
                  onClick={() => setPedidoEnviado(false)}
                  className="mt-2 text-xs font-bold text-[#8B5A2B] underline"
                >
                  Hacer otro pedido
                </button>
              </div>
            ) : (
              <form onSubmit={gestionarEnvioPedido} className="p-4 space-y-4">

                {/* Lista del carrito */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {carrito.length === 0 ? (
                    <div className="text-center py-8 text-xs font-bold text-gray-300 uppercase tracking-widest">
                      Carrito vacio
                    </div>
                  ) : (
                    carrito.map(item => (
                      <div key={item.id_producto} className="flex justify-between items-center bg-gray-50 border border-gray-100 p-2.5 rounded-lg">
                        <div>
                          <p className="font-black text-gray-800 text-xs">{item.nombre_producto}</p>
                          <p className="font-mono text-gray-400 text-[10px]">${item.precio_venta.toFixed(2)} c/u</p>
                        </div>
                        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 flex-shrink-0">
                          <button type="button" onClick={() => modificarCantidad(item.id_producto, -1)} className="w-5 h-5 flex items-center justify-center font-black text-gray-500 hover:text-red-600 text-sm">-</button>
                          <span className="font-black text-gray-800 text-xs w-4 text-center">{item.cantidad}</span>
                          <button type="button" onClick={() => modificarCantidad(item.id_producto, 1)} className="w-5 h-5 flex items-center justify-center font-black text-gray-500 hover:text-emerald-600 text-sm">+</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Formulario */}
                <div className="space-y-3 pt-3 border-t border-gray-100">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Tu nombre</label>
                    <input
                      type="text"
                      required
                      value={nombreCliente}
                      onChange={e => setNombreCliente(e.target.value)}
                      placeholder="Nombre para el pedido"
                      className="w-full p-2.5 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 bg-gray-50 focus:outline-none focus:border-[#8B5A2B] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Hora de recogida</label>
                    <input
                      type="time"
                      required
                      value={horaRecogida}
                      onChange={e => setHoraRecogida(e.target.value)}
                      className="w-full p-2.5 border border-gray-200 rounded-xl text-xs font-mono text-gray-800 bg-gray-50 focus:outline-none focus:border-[#8B5A2B] transition-colors"
                    />
                  </div>
                </div>

                {/* Total y boton */}
                <div className="pt-3 border-t border-gray-100 space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-black text-gray-500 uppercase">Total</span>
                    <span className="font-black font-mono text-lg text-[#8B5A2B]">${calcularTotal().toFixed(2)}</span>
                  </div>
                  <button
                    type="submit"
                    disabled={carrito.length === 0}
                    className="w-full py-3 rounded-xl font-black text-sm text-white uppercase tracking-wider transition-all bg-[#8B5A2B] hover:bg-[#7A4F25] disabled:bg-gray-200 disabled:text-gray-400 shadow-sm active:scale-97"
                  >
                    Confirmar Pedido
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

    </div>
  );
}
