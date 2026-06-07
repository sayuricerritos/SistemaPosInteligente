import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

export default function App() {
  const [productos, setProductos] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState('Bebidas Calientes');
  const [carrito, setCarrito] = useState([]);
  
  // Formulario de Pedido para Recogida
  const [nombreCliente, setNombreCliente] = useState('');
  const [horaRecogida, setHoraRecogida] = useState('');
  const [pedidoEnviado, setPedidoEnviado] = useState(false);

  const categories = ['Bebidas Calientes', 'Bebidas Frias', 'Panaderia', 'Alimentos'];

  useEffect(() => {
    fetch(`${API_URL}/api/productos`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setProductos(data);
      })
      .catch(err => console.error("Error al sincronizar menú web:", err));
    
    const ahora = new Date();
    ahora.setMinutes(ahora.getMinutes() + 20);
    const horas = String(ahora.getHours()).padStart(2, '0');
    const minutos = String(ahora.getMinutes()).padStart(2, '0');
    setHoraRecogida(`${horas}:${minutos}`);
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

  const calcularTotal = () => {
    return carrito.reduce((acc, item) => acc + (item.precio_venta * item.cantidad), 0);
  };

  const gestionarEnvioPedido = (e) => {
    e.preventDefault();
    if (carrito.length === 0) {
      alert("🛒 Tu bolsa está vacía");
      return;
    }

    // Estructurar los datos tal como los espera recibir el backend
    const datosPedido = {
      cliente: nombreCliente,
      hora_recogida: horaRecogida,
      items: carrito.map(item => ({
        id_producto: item.id_producto,
        nombre_producto: item.nombre_producto,
        cantidad: item.cantidad,
        precio_venta: item.precio_venta
      })),
      total: calcularTotal()
    };

    // DISPARO REAL: Mandar el pedido al servidor Flask
    fetch(`${API_URL}/api/pedidos/web`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datosPedido)
    })
    .then(res => {
      if (res.ok) {
        setPedidoEnviado(true);
        setCarrito([]);
        setNombreCliente('');
      } else {
        alert("❌ Error en el servidor al procesar tu orden.");
      }
    })
    .catch(err => {
      console.error("Error de red al mandar la comanda:", err);
      alert("🔌 No se pudo conectar con el servidor de la cafetería. Asegúrate de que Flask esté encendido.");
    });
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-800 antialiased font-sans p-4 md:p-6">
      
      {/* HEADER COMPACTO CAFETERÍA (Diseño optimizado para no robar espacio) */}
      <header className="max-w-5xl mx-auto bg-[#2D2A26] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-black/10 shadow-md mb-6">
        <div className="flex items-center gap-3">
          {/* SVG Redimensionado e Inmune a Deformaciones */}
          <div className="w-10 h-10 rounded-xl bg-[#8B5A2B] flex items-center justify-center shadow-md border border-white/10 flex-shrink-0">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
              <line x1="6" y1="2" x2="6" y2="4" />
              <line x1="10" y1="2" x2="10" y2="4" />
              <line x1="14" y1="2" x2="14" y2="4" />
            </svg>
          </div>
          <div className="text-left">
            <h1 className="text-sm font-black text-white tracking-wider uppercase">KAZOKU CAFÉ</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Ordena en línea y recoge en tienda</p>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-center sm:text-right flex-shrink-0">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Tiempo estimado de barra:</span>
          <span className="text-xs font-black text-[#8B5A2B] uppercase">⏱️ listo en 20 minutos</span>
        </div>
      </header>

      {/* DETALLES DE SUCURSAL COMPACTOS */}
      <section className="max-w-5xl mx-auto mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 shadow-2xs text-center text-xs font-bold text-gray-600">
          <p className="flex items-center justify-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> 📍 Zinacantepec, Centro</p>
          <p className="flex items-center justify-center gap-1.5 border-y sm:border-y-0 sm:border-x border-gray-100 py-1 sm:py-0"><span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> ☕ Café de Especialidad</p>
          <p className="col-span-1 sm:col-span-2 lg:col-span-1 flex items-center justify-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> 🗓️ Mié a Lun — 1:00 PM a 10:00 PM</p>
        </div>
      </section>

      {/* CONTENEDOR DE CONTENIDO */}
      <main className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMNA IZQUIERDA: MENÚ Y CATEGORÍAS */}
        <div className="lg:col-span-2 space-y-4">
          {/* Barra de pestañas compacta */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-gray-200/70 p-1 rounded-xl border border-gray-300/60 shadow-inner">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoriaActiva(cat)}
                className={`py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                  categoriaActiva === cat 
                    ? 'bg-[#8B5A2B] text-white shadow-sm' 
                    : 'bg-white text-gray-500 hover:text-gray-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid de Productos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {productos.filter(p => p.categoria === categoriaActiva).length === 0 ? (
              <div className="col-span-2 text-center py-10 bg-white border border-dashed rounded-xl text-3xs font-black text-gray-400 uppercase tracking-widest">
                🔄 Sincronizando menú con la barra central...
              </div>
            ) : (
              productos.filter(p => p.categoria === categoriaActiva).map(prod => (
                <div 
                  key={prod.id_producto}
                  onClick={() => agregarAlCarrito(prod)}
                  className="bg-white border border-gray-200 p-3.5 rounded-xl flex justify-between items-center cursor-pointer hover:border-[#8B5A2B] transition-all hover:shadow-2xs active:scale-97"
                >
                  <div className="space-y-0.5 pr-2">
                    <p className="font-black text-gray-800 text-xs uppercase tracking-tight">{prod.nombre_producto}</p>
                    <p className="text-3xs text-gray-400 font-bold normal-case">Presiona para añadir</p>
                  </div>
                  <span className="text-[#8B5A2B] font-black font-mono text-xs bg-gray-50 border px-2 py-0.5 rounded-lg flex-shrink-0">
                    ${prod.precio_venta.toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: CARRITO Y VALIDACIÓN */}
        <div className="w-full">
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs space-y-4">
            <div className="border-b pb-1.5 flex items-center gap-1.5 text-gray-400">
              <span className="w-2 h-2 rounded-full bg-amber-500 block"></span>
              <h3 className="font-black text-gray-800 text-3xs uppercase tracking-wider">Tu Bolsa de Pedido</h3>
            </div>

            {pedidoEnviado ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-xl space-y-2 text-center normal-case font-bold">
                <span className="text-xl block">☕</span>
                <p className="font-black text-2xs uppercase tracking-tight">¡Orden Mandada a Barra!</p>
                <p className="text-3xs text-emerald-700 leading-relaxed font-semibold">
                  Tu pedido ya se está preparando de forma artesanal. Preséntate en mostrador a la hora acordada. ¡Te esperamos!
                </p>
                <button onClick={() => setPedidoEnviado(false)} className="text-3xs font-black uppercase underline mt-2 block mx-auto text-emerald-900">Hacer otra orden</button>
              </div>
            ) : (
              <form onSubmit={gestionarEnvioPedido} className="space-y-4">
                
                {/* Lista del carrito */}
                <div className="space-y-2 max-h-40 overflow-y-auto pr-0.5">
                  {carrito.length === 0 ? (
                    <div className="text-center py-6 text-gray-300 text-3xs font-black uppercase tracking-widest">
                      Bolsa Vacía 🛒
                    </div>
                  ) : (
                    carrito.map(item => (
                      <div key={item.id_producto} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border text-3xs font-bold">
                        <div className="pr-2">
                          <p className="font-black text-gray-800 uppercase tracking-tight">{item.nombre_producto}</p>
                          <p className="font-mono text-gray-400 font-extrabold">${item.precio_venta.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center space-x-1.5 bg-white border rounded-md p-1 flex-shrink-0">
                          <button type="button" onClick={() => modificarCantidad(item.id_producto, -1)} className="px-1 font-black text-gray-400 hover:text-red-600">-</button>
                          <span className="font-black text-gray-800 w-2 text-center">{item.cantidad}</span>
                          <button type="button" onClick={() => modificarCantidad(item.id_producto, 1)} className="px-1 font-black text-gray-400 hover:text-emerald-600">+</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Formulario */}
                <div className="space-y-3 pt-2 border-t text-3xs font-black uppercase text-gray-400">
                  <div className="space-y-1">
                    <label className="block tracking-wider">👤 Tu Nombre:</label>
                    <input 
                      type="text" 
                      required 
                      value={nombreCliente}
                      onChange={e => setNombreCliente(e.target.value)}
                      placeholder="Ej. Sayuri Pérez" 
                      className="w-full p-2.5 border rounded-xl font-bold text-gray-800 bg-gray-50 focus:outline-none focus:border-[#8B5A2B] transition-colors text-xs normal-case"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block tracking-wider">⏰ Hora de recogida:</label>
                    <input 
                      type="time" 
                      required 
                      value={horaRecogida}
                      onChange={e => setHoraRecogida(e.target.value)}
                      className="w-full p-2.5 border rounded-xl font-mono text-gray-800 text-xs bg-gray-50 focus:outline-none focus:border-[#8B5A2B] transition-colors"
                    />
                  </div>
                </div>

                {/* Botón de envío */}
                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between font-black text-gray-800 text-3xs uppercase items-baseline">
                    <span>Total Orden:</span>
                    <span className="font-mono text-sm text-[#8B5A2B]">${calcularTotal().toFixed(2)}</span>
                  </div>
                  <button 
                    type="submit"
                    disabled={carrito.length === 0}
                    className="w-full py-2.5 rounded-xl font-black text-3xs uppercase tracking-wider text-white transition-all bg-[#8B5A2B] hover:bg-[#7A4F25] disabled:bg-gray-200 disabled:text-gray-400 shadow-sm active:scale-97"
                  >
                    🚀 Confirmar Pedido
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