import React, { useState, useEffect } from 'react'

export default function Llevar() {
  const [productos, setProductos] = useState([])
  const [categoriaActiva, setCategoriaActiva] = useState('Bebidas Calientes')
  
  // Modales táctiles
  const [mostrarModalPago, setMostrarModalPago] = useState(false)
  const [mostrarModalPersonalizar, setMostrarModalPersonalizar] = useState(false)

  // Carrito de compras inmediato para llevar
  const [carritoLlevar, setCarritoLlevar] = useState([])
  const [productoAEditar, setProductoAEditar] = useState(null)
  const [indiceAEditar, setIndiceAEditar] = useState(null)

  // Variables financieras del cobro
  const [metodoPago, setMetodoPago] = useState('Efectivo')
  const [efectivoRecibido, setEfectivoRecibido] = useState('')
  const [propina, setPropina] = useState(0)

  const categorias = ['Bebidas Calientes', 'Bebidas Frías', 'Panadería', 'Alimentos']

  // REGLA DE NEGOCIO UNIVERSAL: Matriz de extras estrictamente individuales por categoría
  const obtenerOpcionesDePersonalizacion = (categoria) => {
    if (categoria === 'Bebidas Calientes') {
      return {
        modificadores: [
          { id: 'leche_entera', nombre: 'Leche Entera' },
          { id: 'leche_des', nombre: 'Leche Deslactosada' },
          { id: 'leche_alm', nombre: 'Leche de Almendra' }
        ],
        extras: [
          { id: 'ex_shot', nombre: 'Shot Extra Espresso', precio: 15.0 },
          { id: 'ex_vai', nombre: 'Jarabe de Vainilla', precio: 8.0 }
        ]
      }
    } else if (categoria === 'Bebidas Frías') {
      return {
        modificadores: [
          { id: 'hielo_normal', nombre: 'Hielo Normal' },
          { id: 'frappe', nombre: 'Estilo Frappé' }
        ],
        extras: [
          { id: 'ex_crema', nombre: 'Crema Batida', precio: 12.0 },
          { id: 'ex_tapioca', nombre: 'Tapioca', precio: 10.0 }
        ]
      }
    }
    // Panadería y Alimentos quedan limpios, listos solo para especificaciones en texto plano
    return { modificadores: [], extras: [] }
  }

  useEffect(() => {
    // Carga de catálogo de productos directo desde Flask
    fetch('http://127.0.0.1:5000/api/productos')
      .then(res => res.json())
      .then(data => setProductos(data))
      .catch(err => console.error("Error al conectar con la API de productos:", err))
  }, [])

  const agregarAlCarrito = (prod) => {
    const configInicial = obtenerOpcionesDePersonalizacion(prod.categoria)
    setCarritoLlevar([...carritoLlevar, {
      ...prod,
      uniqueId: Date.now() + Math.random(),
      cantidad: 1,
      modificadores: configInicial.modificadores.length > 0 ? { base: configInicial.modificadores[0].nombre } : {},
      extrasSeleccionados: [],
      notas: '' // Restauradas las notas individuales para llevar
    }])
  }

  const abrirPersonalizacion = (item, index) => {
    setProductoAEditar({ ...item })
    setIndiceAEditar(index)
    setMostrarModalPersonalizar(true)
  }

  const guardarPersonalizacion = () => {
    const nuevoCarrito = [...carritoLlevar]
    nuevoCarrito[indiceAEditar] = productoAEditar
    setCarritoLlevar(nuevoCarrito)
    setMostrarModalPersonalizar(false)
  }

  const calcularPrecioItem = (item) => {
    const costoExtras = item.extrasSeleccionados?.reduce((acc, e) => acc + e.precio, 0) || 0
    return item.precio_venta + costoExtras
  }

  const calcularTotalCarrito = () => {
    return carritoLlevar.reduce((acc, i) => acc + calcularPrecioItem(i), 0)
  }
const procesarVentaInmediata = async () => {
    const totalFinal = calcularTotalCarrito() + parseFloat(propina || 0);
    
    try {
      // Disparamos la petición al servidor Flask de forma limpia y directa
      const respuesta = await fetch('http://127.0.0.1:5000/api/mesas/cerrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          numero_mesa: "LLEVAR / MOSTRADOR", 
          total: totalFinal, 
          metodo_pago: metodoPago,
          productos: carritoLlevar // Detalle completo para la cocina
        })
      });

      if (!respuesta.ok) {
        throw new Error('El servidor local rechazó la operación.');
      }

      // Si todo sale bien, ejecutamos la limpieza y reseteo del módulo
      alert(`💰 Venta Rápida Completada. ¡Boucher enviado a la cola de producción!`);
      setCarritoLlevar([]);
      setMostrarModalPago(false);
      setPropina(0);
      setEfectivoRecibido('');
      
    } catch (err) {
      console.error("Error en flujo de caja:", err);
      alert(`❌ Error al procesar la venta: ${err.message}`);
    }
  };

  const opcionesMesaConfig = productoAEditar ? obtenerOpcionesDePersonalizacion(productoAEditar.categoria) : { modificadores: [], extras: [] }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col space-y-4">
      
      {/* RUTA HEADER */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 flex justify-between items-center flex-shrink-0">
        <div>
          <h2 className="text-lg font-black text-gray-800">Módulo Venta Inmediata (Para Llevar)</h2>
          <span className="text-3xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Canal de Despacho en Mostrador Rápido
          </span>
        </div>
      </div>

      {/* INTERFAZ CENTRAL */}
      <div className="flex-1 flex flex-col lg:flex-row gap-5 overflow-hidden">
        
        {/* PANEL IZQUIERDO: SELECCIÓN RÁPIDA */}
        <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
          <div className="grid grid-cols-4 gap-2 bg-gray-100 p-1 rounded-xl border">
            {categorias.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoriaActiva(cat)}
                className={`py-2.5 rounded-lg text-2xs font-black transition-all ${categoriaActiva === cat ? 'bg-[#8B5A2B] text-white shadow-sm' : 'bg-white text-gray-500'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3 pr-1">
            {productos.filter(p => p.categoria === categoriaActiva).map(prod => (
              <button
                key={prod.id_producto}
                onClick={() => agregarAlCarrito(prod)}
                className="bg-white border p-4 rounded-xl flex flex-col justify-between items-center text-center h-24 hover:border-[#8B5A2B] transition-all active:scale-95"
              >
                <span className="font-bold text-gray-700 text-xs line-clamp-2">{prod.nombre_producto}</span>
                <span className="text-[#8B5A2B] font-black text-xs">${prod.precio_venta.toFixed(2)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* PANEL DERECHO: MONITOR DE NOTA INMEDIATA */}
        <div className="w-full lg:w-85 bg-white border rounded-2xl p-4 flex flex-col justify-between h-full overflow-hidden shadow-2xs">
          <div className="flex-1 flex flex-col overflow-hidden space-y-3">
            <div className="border-b pb-2">
              <h3 className="font-black text-gray-800 text-xs uppercase tracking-wider">Ticket de Venta Mostrador</h3>
              <p className="text-3xs text-gray-400 font-bold">Despacho sin asignación de mesa</p>
            </div>

            {/* LISTADO DINÁMICO EN CARRITO */}
            <div className="flex-1 overflow-y-auto space-y-2 text-xs pr-1">
              {carritoLlevar.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-12">
                  <span className="text-2xl mb-1">☕</span>
                  <p className="text-3xs font-black uppercase tracking-wide">Carrito vacío</p>
                </div>
              ) : (
                carritoLlevar.map((item, index) => (
                  <div 
                    key={item.uniqueId} 
                    onClick={() => abrirPersonalizacion(item, index)} 
                    className="bg-amber-50/40 p-2.5 rounded-xl border border-dashed border-amber-200 cursor-pointer hover:border-amber-500 transition-colors"
                  >
                    <div className="flex justify-between font-black text-gray-800">
                      <span>+ {item.nombre_producto}</span>
                      <span>${calcularPrecioItem(item).toFixed(2)}</span>
                    </div>
                    {item.modificadores?.base && <span className="text-3xs text-gray-400 block">🥛 Base: {item.modificadores.base}</span>}
                    {item.extrasSeleccionados?.length > 0 && (
                      <div className="text-3xs text-[#8B5A2B] font-extrabold mt-1">
                        {item.extrasSeleccionados.map(e => `+ ${e.nombre} `)}
                      </div>
                    )}
                    {item.notas && <p className="text-3xs text-emerald-600 font-bold italic mt-1 bg-white p-1 rounded border border-emerald-100">📝 "{item.notas}"</p>}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ACCIONES FINALES DE COBRO */}
          <div className="border-t pt-3 space-y-2 mt-2">
            <div className="flex justify-between font-black text-gray-800 text-sm">
              <span>Total a Liquidar:</span>
              <span>${calcularTotalCarrito().toFixed(2)}</span>
            </div>
            <button 
              onClick={() => setMostrarModalPago(true)}
              disabled={carritoLlevar.length === 0}
              className={`w-full py-2.5 rounded-xl font-black text-2xs uppercase tracking-wider shadow-xs transition-colors ${
                carritoLlevar.length === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#8B5A2B] text-white hover:bg-[#7A4F25]'
              }`}
            >
              💳 Proceder al Cobro
            </button>
          </div>
        </div>
      </div>

      {/* =======================================================
          MODAL A: SELECCIÓN DE EXTRAS SEGMENTADOS + CANCELAR
         ======================================================= */}
      {mostrarModalPersonalizar && productoAEditar && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
              <span className="font-black text-gray-800 text-xs">{productoAEditar.nombre_producto}</span>
              <span className="text-xs font-black text-[#8B5A2B]">${productoAEditar.precio_venta.toFixed(2)}</span>
            </div>
            
            <div className="p-5 space-y-4 text-3xs font-black uppercase text-gray-400 overflow-y-auto max-h-[50vh]">
              {opcionesMesaConfig.modificadores.length === 0 && opcionesMesaConfig.extras.length === 0 ? (
                <div className="text-center py-6 text-gray-400 border border-dashed rounded-xl bg-gray-50 font-bold p-4 normal-case">
                  Este artículo no cuenta con modificadores ni adiciones de receta especiales.
                </div>
              ) : (
                <>
                  {opcionesMesaConfig.modificadores.length > 0 && (
                    <div className="space-y-1">
                      <span>🥛 Configuración de Receta Base ({productoAEditar.categoria})</span>
                      <div className="grid grid-cols-3 gap-2">
                        {opcionesMesaConfig.modificadores.map(m => (
                          <button 
                            key={m.id} 
                            type="button"
                            onClick={() => setProductoAEditar({...productoAEditar, modificadores: {base: m.nombre}})}
                            className={`p-2 border rounded-xl text-center font-bold transition-all ${productoAEditar.modificadores?.base === m.nombre ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600'}`}
                          >
                            {m.nombre}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {opcionesMesaConfig.extras.length > 0 && (
                    <div className="space-y-1 pt-2">
                      <span>➕ Extras Permitidos</span>
                      <div className="grid grid-cols-1 gap-2">
                        {opcionesMesaConfig.extras.map(e => {
                          const sel = productoAEditar.extrasSeleccionados?.some(x => x.id === e.id)
                          return (
                            <button 
                              key={e.id} 
                              type="button"
                              onClick={() => {
                                const n = sel ? productoAEditar.extrasSeleccionados.filter(x => x.id !== e.id) : [...(productoAEditar.extrasSeleccionados || []), e]
                                setProductoAEditar({ ...productoAEditar, extrasSeleccionados: n })
                              }}
                              className={`p-2.5 border rounded-xl flex justify-between font-bold transition-all ${sel ? 'bg-[#8B5A2B]/10 border-[#8B5A2B] text-[#8B5A2B]' : 'bg-white text-gray-600'}`}
                            >
                              <span>{e.nombre}</span>
                              <span className="font-black">+${e.precio.toFixed(2)}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* CAMPO DE NOTAS RE-HABILITADO PARA MOSTREO */}
              <div className="space-y-1 pt-2 border-t">
                <span>📝 Especificaciones de Preparación</span>
                <textarea
                  rows="2"
                  value={productoAEditar.notas || ''}
                  onChange={e => setProductoAEditar({ ...productoAEditar, notas: e.target.value })}
                  placeholder="Ej. Con endulzante, popote de papel, aderezo extra..."
                  className="w-full p-2 border rounded-xl bg-gray-50 font-medium normal-case text-gray-700 focus:outline-none text-xs"
                />
              </div>
            </div>

            {/* BOTONERA CON CANCELAR INTEGRADO SOLICITADO */}
            <div className="p-4 bg-gray-50 border-t flex gap-2.5">
              <button
                type="button"
                onClick={() => setMostrarModalPersonalizar(false)}
                className="w-1/3 py-2.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 font-bold rounded-xl text-2xs uppercase tracking-wider transition-colors"
              >
                Cancelar
              </button>
              <button onClick={guardarPersonalizacion} className="flex-1 py-2.5 bg-[#8B5A2B] text-white font-black rounded-xl text-2xs uppercase tracking-wider shadow">
                Aplicar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          MODAL B: ENTORNO OSCURO DE COBRO SUCURSAL
         ======================================================= */}
      {mostrarModalPago && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-sm font-black text-gray-800">Cierre de Ticket Rápido (Para Llevar)</h3>
              <button onClick={() => setMostrarModalPago(false)} className="text-gray-400 font-bold">✕</button>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-5 gap-5 text-2xs font-extrabold uppercase text-gray-400">
              <div className="md:col-span-3 space-y-3">
                <span>Método de Liquidación</span>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setMetodoPago('Efectivo')} className={`p-3 border rounded-xl font-black ${metodoPago === 'Efectivo' ? 'bg-[#8B5A2B]/10 border-[#8B5A2B] text-[#8B5A2B]' : 'bg-white text-gray-500'}`}>💵 Efectivo</button>
                  <button onClick={() => setMetodoPago('Tarjeta')} className={`p-3 border rounded-xl font-black ${metodoPago === 'Tarjeta' ? 'bg-[#8B5A2B]/10 border-[#8B5A2B] text-[#8B5A2B]' : 'bg-white text-gray-500'}`}>💳 Tarjeta</button>
                </div>
                {metodoPago === 'Efectivo' && (
                  <div className="space-y-1">
                    <span>Monto Recibido en Ventanilla ($)</span>
                    <input type="number" value={efectivoRecibido} onChange={e => setEfectivoRecibido(e.target.value)} placeholder="$ 0.00" className="w-full p-2.5 border rounded-xl font-mono text-gray-800 text-sm focus:outline-none" />
                    {efectivoRecibido && parseFloat(efectivoRecibido) >= (calcularTotalCarrito() + parseFloat(propina || 0)) && (
                      <div className="bg-emerald-50 text-emerald-700 p-2 rounded-lg text-3xs font-bold border border-emerald-100 mt-1">Cambio de caja: ${(parseFloat(efectivoRecibido) - (calcularTotalCarrito() + parseFloat(propina || 0))).toFixed(2)} MXN</div>
                    )}
                  </div>
                )}
                <div className="space-y-1">
                  <span>Añadir Propina ($)</span>
                  <input type="number" value={propina} onChange={e => setPropina(e.target.value)} placeholder="Opcional" className="w-full p-2.5 border rounded-xl text-gray-800 text-xs" />
                </div>
              </div>
              <div className="md:col-span-2 bg-[#0F172A] text-white p-4 rounded-xl flex flex-col justify-between">
                <div className="space-y-2 text-3xs font-medium text-slate-400">
                  <span className="border-b border-slate-700 pb-1 block font-bold text-slate-300">Resumen de Venta Inmediata</span>
                  <div className="flex justify-between"><span>Consumo Base:</span><span>${calcularTotalCarrito().toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Propina:</span><span>${parseFloat(propina || 0).toFixed(2)}</span></div>
                </div>
                <div className="border-t border-slate-700 pt-2 mt-2">
                  <span className="text-3xs text-slate-400 block font-bold">Total Facturado</span>
                  <div className="flex justify-between items-baseline text-amber-400 font-black"><span className="text-3xs">MXN</span><span className="text-xl font-mono">${(calcularTotalCarrito() + parseFloat(propina || 0)).toFixed(2)}</span></div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t">
              <button onClick={procesarVentaInmediata} disabled={metodoPago === 'Efectivo' && (!efectivoRecibido || parseFloat(efectivoRecibido) < (calcularTotalCarrito() + parseFloat(propina || 0)))} className="w-full py-3 bg-[#8B5A2B] text-white font-black rounded-xl text-xs uppercase disabled:bg-gray-200 disabled:text-gray-400 transition-colors">🖨️ EMITIR TICKET DE VENTA DIRECTA</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}