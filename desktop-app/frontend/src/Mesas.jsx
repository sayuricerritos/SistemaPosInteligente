import React, { useState, useEffect } from 'react'

export default function Mesas() {
  const [mesasActivas, setMesasActivas] = useState([])
  const [productos, setProductos] = useState([])
  const [meseros, setMeseros] = useState([]) // Estado dinámico para cargar staff de la BD
  const [categoriaActiva, setCategoriaActiva] = useState('Bebidas Calientes')
  
  // Modales
  const [mostrarModalApertura, setMostrarModalApertura] = useState(false)
  const [mostrarModalPago, setMostrarModalPago] = useState(false)
  const [mostrarModalPersonalizar, setMostrarModalPersonalizar] = useState(false)
  
  // Mesa operativa
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null)
  const [maxMesas, setMaxMesas] = useState(5)
  
  // Formulario Apertura
  const [numMesaSeleccionada, setNumMesaSeleccionada] = useState('')
  const [comensalesInput, setComensalesInput] = useState('1')
  const [meseroInput, setMeseroInput] = useState('')

  // Carrito de sesión con extras e instrucciones
  const [comandaSesion, setComandaSesion] = useState([])
  const [productoAEditar, setProductoAEditar] = useState(null)
  const [indiceAEditar, setIndiceAEditar] = useState(null)

  // Cobro
  const [metodoPago, setMetodoPago] = useState('Efectivo')
  const [efectivoRecibido, setEfectivoRecibido] = useState('')
  const [propina, setPropina] = useState(0)

  const categories = ['Bebidas Calientes', 'Bebidas Frías', 'Panadería', 'Alimentos']

  // Base de datos local de modificadores y extras condicionales estrictamente por categoría
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
    // Panadería y Alimentos regresan vacíos (sin extras ni lácteos por receta)
    return { modificadores: [], extras: [] }
  }

  const fetchMesas = () => {
    fetch('http://127.0.0.1:5000/api/mesas/activas')
      .then(res => res.json())
      .then(data => setMesasActivas(data))
  }

  useEffect(() => {
    fetchMesas()
    
    // Cargar catálogo de productos
    fetch('http://127.0.0.1:5000/api/productos')
      .then(res => res.json())
      .then(data => setProductos(data))

    // Leer límite de mesas dinámico desde Configuración
    fetch('http://127.0.0.1:5000/api/configuracion')
      .then(res => res.json())
      .then(data => setMaxMesas(data.limite_mesas || 5))

    // NUEVO: Cargar los meseros reales desde la base de datos de Usuarios
    fetch('http://127.0.0.1:5000/api/usuarios')
      .then(res => res.json())
      .then(data => {
        // Filtramos para obtener los puestos operativos (Meseros) o asignamos por defecto
        const listaMeseros = data.filter(u => u.puesto.toLowerCase() === 'mesero' || u.permisos === 'Basico')
        setMeseros(listaMeseros.length > 0 ? listaMeseros : [{ nombre: 'Juan Pérez' }, { nombre: 'María López' }])
        if (listaMeseros.length > 0) setMeseroInput(listaMeseros[0].nombre)
        else setMeseroInput('Juan Pérez')
      })
      .catch(() => {
        setMeseros([{ nombre: 'Juan Pérez' }, { nombre: 'María López' }])
        setMeseroInput('Juan Pérez')
      })
  }, [])

  const handleAbrirMesa = (e) => {
    e.preventDefault()
    if (!numMesaSeleccionada) {
      alert("Por favor selecciona un número de mesa.")
      return
    }

    fetch('http://127.0.0.1:5000/api/mesas/abrir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numero_mesa: numMesaSeleccionada, comensales: comensalesInput, mesero: meseroInput })
    }).then(() => {
      fetchMesas()
      setMostrarModalApertura(false)
      setNumMesaSeleccionada('')
    })
  }

  const seleccionarMesaParaOperar = (mesa) => {
    setMesaSeleccionada(mesa)
    setComandaSesion([])
  }

  const agregarAComandaSesion = (prod) => {
    const configInicial = obtenerOpcionesDePersonalizacion(prod.categoria)
    setComandaSesion([...comandaSesion, {
      ...prod,
      uniqueId: Date.now() + Math.random(),
      cantidad: 1,
      modificadores: configInicial.modificadores.length > 0 ? { base: configInicial.modificadores[0].nombre } : {},
      extrasSeleccionados: [],
      notas: ''
    }])
  }

  const abrirPersonalizacion = (item, index) => {
    setProductoAEditar({ ...item })
    setIndiceAEditar(index)
    setMostrarModalPersonalizar(true)
  }

  const guardarPersonalizacion = () => {
    const nuevaComanda = [...comandaSesion]
    nuevaComanda[indiceAEditar] = productoAEditar
    setComandaSesion(nuevaComanda)
    setMostrarModalPersonalizar(false)
  }

  const calcularPrecioItem = (item) => {
    const costoExtras = item.extrasSeleccionados?.reduce((acc, e) => acc + e.precio, 0) || 0
    return item.precio_venta + costoExtras
  }

  const enviarComandaAlBackend = () => {
    fetch('http://127.0.0.1:5000/api/mesas/comandar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        numero_mesa: mesaSeleccionada.numero_mesa, 
        productos: comandaSesion 
      })
    }).then(() => {
      fetchMesas()
      setMesaSeleccionada(null)
      setComandaSesion([])
    })
  }

  const liquidarCuentaMesa = () => {
    const totalFinal = mesaSeleccionada.subtotal + parseFloat(propina || 0)
    fetch('http://127.0.0.1:5000/api/mesas/cerrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numero_mesa: mesaSeleccionada.numero_mesa, total: totalFinal, metodo_pago: metodoPago })
    }).then(() => {
      fetchMesas()
      setMesaSeleccionada(null)
      setMostrarModalPago(false)
      setPropina(0)
      setEfectivoRecibido('')
    })
  }

  // Carga las opciones de personalización específicas de la categoría del producto a editar
  const opcionesMesaConfig = productoAEditar ? obtenerOpcionesDePersonalizacion(productoAEditar.categoria) : { modificadores: [], extras: [] }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col space-y-4">
      
      {/* HEADER */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 flex justify-between items-center flex-shrink-0">
        <div>
          <h2 className="text-lg font-black text-gray-800">Monitor de Mesas Dinámico</h2>
          {mesaSeleccionada && <span className="text-3xs font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">PANEL COMANDAS: MESA {mesaSeleccionada.numero_mesa}</span>}
        </div>
        {!mesaSeleccionada && (
          <button onClick={() => setMostrarModalApertura(true)} className="bg-[#8B5A2B] text-white font-black text-xs py-2.5 px-5 rounded-xl shadow active:scale-95">
            + Abrir Nueva Mesa
          </button>
        )}
      </div>

      {/* ESTADO VACÍO */}
      {!mesaSeleccionada && mesasActivas.length === 0 ? (
        <div className="flex-1 bg-white border border-gray-100 rounded-3xl flex flex-col items-center justify-center p-8 text-center animate-fade-in">
          <span className="text-4xl block mb-3 opacity-60">🍽️</span>
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider">No hay ninguna cuenta abierta</h3>
          <p className="text-xs text-gray-400 font-medium mt-1">Presiona el botón superior para dar de alta una mesa en piso.</p>
        </div>
      ) : null}

      {/* DETALLE MESAS ACTIVAS */}
      {!mesaSeleccionada && mesasActivas.length > 0 ? (
        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-4 gap-4 pr-1">
          {mesasActivas.map(m => (
            <div 
              key={m.numero_mesa}
              onClick={() => seleccionarMesaParaOperar(m)}
              className="bg-white border-2 border-dashed border-amber-600/60 rounded-2xl p-5 h-44 flex flex-col justify-between cursor-pointer hover:shadow-md transition-all active:scale-98"
            >
              <div className="flex justify-between items-start">
                <span className="text-base font-black text-gray-800">MESA {m.numero_mesa}</span>
                <span className="text-3xs bg-red-50 text-red-600 font-black px-2 py-0.5 rounded uppercase tracking-wide">Ocupada</span>
              </div>
              <div className="text-xs font-bold text-gray-400 space-y-0.5">
                <p>👤 {m.comensales} Comensales</p>
                <p>🤵 Mesero: {m.mesero}</p>
              </div>
              <div className="border-t pt-2 flex justify-between items-center">
                <span className="text-3xs font-black text-gray-400">Total Cuenta:</span>
                <span className="text-sm font-black text-amber-700">${m.subtotal.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* INTERFAZ DE COMANDADO ACTIVE */}
      {mesaSeleccionada ? (
        <div className="flex-1 flex flex-col lg:flex-row gap-5 overflow-hidden animate-fade-in">
          {/* CATALOGO DE SELECCIÓN */}
          <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
            <div className="grid grid-cols-4 gap-2 bg-gray-100 p-1 rounded-xl border">
              {categories.map(cat => (
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
                  onClick={() => agregarAComandaSesion(prod)}
                  className="bg-white border p-4 rounded-xl flex flex-col justify-between items-center text-center h-24 hover:border-[#8B5A2B] transition-all active:scale-95"
                >
                  <span className="font-bold text-gray-700 text-xs line-clamp-2">{prod.nombre_producto}</span>
                  <span className="text-[#8B5A2B] font-black text-xs">${prod.precio_venta.toFixed(2)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* MONITOR LATERAL DE LA CUENTA */}
          <div className="w-full lg:w-85 bg-white border rounded-2xl p-4 flex flex-col justify-between h-full overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden space-y-3">
              <div className="border-b pb-2 flex justify-between items-center">
                <div>
                  <h3 className="font-black text-gray-800 text-xs">MESA {mesaSeleccionada.numero_mesa}</h3>
                  <p className="text-3xs text-gray-400 font-bold">Atendiendo: {mesaSeleccionada.mesero}</p>
                </div>
                <button onClick={() => setMesaSeleccionada(null)} className="text-3xs font-black text-gray-400 bg-gray-100 px-2 py-1 rounded">Regresar</button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 text-xs pr-1">
                {/* 1. Productos ya enviados y salvados previamente en SQLite/Flask */}
                {mesaSeleccionada.productos?.map((item, i) => (
                  <div key={`saved-${i}`} className="bg-gray-100 p-2.5 rounded-xl border opacity-80">
                    <div className="flex justify-between font-bold text-gray-600">
                      <span>✓ {item.nombre_producto}</span>
                      <span>${calcularPrecioItem(item).toFixed(2)}</span>
                    </div>
                    {item.modificadores?.base && <span className="text-3xs text-gray-400 block">🥛 {item.modificadores.base}</span>}
                    {item.extrasSeleccionados?.map(e => <span key={e.id} className="text-3xs text-gray-400 block">+ {e.nombre}</span>)}
                    {item.notas && <p className="text-3xs text-emerald-700 font-mono italic mt-1 bg-white px-1.5 py-0.5 rounded border border-gray-100">" {item.notas} "</p>}
                  </div>
                ))}
                
                {/* 2. Productos añadidos en la sesión actual listos para comandar */}
                {comandaSesion.map((item, index) => (
                  <div key={item.uniqueId} onClick={() => abrirPersonalizacion(item, index)} className="bg-amber-50/50 p-2.5 rounded-xl border border-dashed border-amber-300 cursor-pointer hover:border-amber-500 transition-colors">
                    <div className="flex justify-between font-black text-gray-800">
                      <span>+ {item.nombre_producto}</span>
                      <span>${calcularPrecioItem(item).toFixed(2)}</span>
                    </div>
                    {item.modificadores?.base && <span className="text-3xs text-gray-400 block">🥛 {item.modificadores.base}</span>}
                    {item.extrasSeleccionados?.length > 0 && (
                      <div className="text-3xs text-[#8B5A2B] font-extrabold mt-1">
                        {item.extrasSeleccionados.map(e => `+ ${e.nombre} `)}
                      </div>
                    )}
                    {item.notas && <p className="text-3xs text-emerald-600 font-bold italic mt-1 bg-white p-1 rounded border border-emerald-100">📝 "{item.notas}"</p>}
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-3 space-y-2 mt-2">
              <div className="flex justify-between font-black text-gray-800 text-sm">
                <span>Total Cuenta:</span>
                <span>${(mesaSeleccionada.subtotal + comandaSesion.reduce((acc, i) => acc + calcularPrecioItem(i), 0)).toFixed(2)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={enviarComandaAlBackend} disabled={comandaSesion.length === 0} className={`py-2.5 rounded-xl font-black text-2xs text-white uppercase transition-colors ${comandaSesion.length === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#6B8E23] hover:bg-[#5A781D]'}`}>🖨️ Mandar Cocina</button>
                <button onClick={() => setMostrarModalPago(true)} className="py-2.5 bg-[#8B5A2B] text-white rounded-xl font-black text-2xs uppercase hover:bg-[#7A4F25] transition-colors">Cerrar Cuenta</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* MODAL 1: APERTURA CON BOTONERA TÁCTIL DINÁMICA */}
      {mostrarModalApertura && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form onSubmit={handleAbrirMesa} className="bg-white rounded-3xl p-6 w-full max-w-sm space-y-4 text-xs font-bold text-gray-500 shadow-2xl">
            <h3 className="text-base font-black text-gray-800 border-b pb-1">Abrir Servicio de Mesa</h3>
            
            <div className="space-y-1.5">
              <span className="block text-3xs font-black text-gray-400 uppercase tracking-wider">Seleccionar Número de Mesa:</span>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: maxMesas }, (_, i) => i + 1).map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setNumMesaSeleccionada(String(num))}
                    className={`py-3 rounded-xl border text-center font-black text-sm transition-all active:scale-95 ${
                      numMesaSeleccionada === String(num) ? 'bg-[#8B5A2B] text-white border-[#8B5A2B]' : 'bg-gray-50 text-gray-700'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-3xs uppercase tracking-wider text-gray-400">Comensales:</label>
                <input type="number" required value={comensalesInput} onChange={e => setComensalesInput(e.target.value)} min="1" className="w-full p-2.5 border rounded-xl font-medium text-gray-800 bg-gray-50" />
              </div>
              <div>
                <label className="block mb-1 text-3xs uppercase tracking-wider text-gray-400">Mesero Real:</label>
                <select value={meseroInput} onChange={e => setMeseroInput(e.target.value)} className="w-full p-2.5 border rounded-xl font-medium text-gray-800 bg-gray-50 bg-none cursor-pointer">
                  {meseros.map((m, idx) => (
                    <option key={idx} value={m.nombre}>{m.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <button type="button" onClick={() => setMostrarModalApertura(false)} className="w-1/3 py-2.5 border rounded-xl text-gray-400">Cerrar</button>
              <button type="submit" className="flex-1 py-2.5 bg-[#8B5A2B] text-white rounded-xl font-black uppercase">Abrir Servicio</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: EXTRAS SEGMENTADOS POR CATEGORÍA INDIVIDUAL + NOTAS DE COCINA */}
      {mostrarModalPersonalizar && productoAEditar && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl animate-fade-in">
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
              <span className="font-black text-gray-800 text-xs">{productoAEditar.nombre_producto}</span>
              <span className="text-xs font-black text-[#8B5A2B]">${productoAEditar.precio_venta.toFixed(2)}</span>
            </div>
            
            <div className="p-5 space-y-4 text-3xs font-black uppercase text-gray-400 overflow-y-auto max-h-[50vh]">
              {opcionesMesaConfig.modificadores.length === 0 && opcionesMesaConfig.extras.length === 0 ? (
                <div className="text-center py-6 text-gray-400 border border-dashed rounded-xl bg-gray-50 font-bold p-4 normal-case">
                  Este producto no requiere modificadores de receta ni adiciones extras por su naturaleza.
                </div>
              ) : (
                <>
                  {opcionesMesaConfig.modificadores.length > 0 && (
                    <div className="space-y-1">
                      <span>🥛 Receta Base Condicional ({productoAEditar.categoria})</span>
                      <div className="grid grid-cols-3 gap-2">
                        {opcionesMesaConfig.modificadores.map(m => (
                          <button 
                            key={m.id} 
                            type="button"
                            onClick={() => setProductoAEditar({...productoAEditar, modificadores: {base: m.nombre}})}
                            className={`p-2 border rounded-xl text-center font-bold transition-all ${productoAEditar.modificadores?.base === m.nombre ? 'bg-gray-800 text-white border-gray-800 shadow-sm' : 'bg-white text-gray-600'}`}
                          >
                            {m.nombre}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {opcionesMesaConfig.extras.length > 0 && (
                    <div className="space-y-1 pt-2">
                      <span>➕ Extras Permitidos para el Platillo</span>
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

              {/* APARTADO DE NOTAS RESTAURADO */}
              <div className="space-y-1 pt-2 border-t">
                <span>📝 Instrucciones Especiales de Comanda</span>
                <textarea
                  rows="2"
                  value={productoAEditar.notas || ''}
                  onChange={e => setProductoAEditar({ ...productoAEditar, notas: e.target.value })}
                  placeholder="Ej. Sin hielo, bien tostado, aderezo a un lado..."
                  className="w-full p-2 border rounded-xl bg-gray-50 font-medium normal-case text-gray-700 focus:outline-none text-xs"
                />
              </div>
            </div>

            {/* ACCIONES DEL MODAL DE PERSONALIZACIÓN */}
            <div className="p-4 bg-gray-50 border-t flex gap-2.5">
              <button
                type="button"
                onClick={() => setMostrarModalPersonalizar(false)}
                className="w-1/3 py-2.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 font-bold rounded-xl text-2xs uppercase tracking-wider transition-colors"
              >
                Cancelar
              </button>
              
              <button 
                onClick={guardarPersonalizacion} 
                className="flex-1 py-2.5 bg-[#8B5A2B] hover:bg-[#7A4F25] text-white font-black rounded-xl text-2xs uppercase tracking-wider shadow text-center transition-colors"
              >
                Aplicar a la Comanda
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: COBRO OSCURO FINANCIERO */}
      {mostrarModalPago && mesaSeleccionada && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col animate-scale-up">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-sm font-black text-gray-800">Cierre de Cuenta — Mesa {mesaSeleccionada.numero_mesa}</h3>
              <button onClick={() => setMostrarModalPago(false)} className="text-gray-400 font-bold">✕</button>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-5 gap-5 text-2xs font-extrabold uppercase text-gray-400">
              <div className="md:col-span-3 space-y-3">
                <span>Método de Pago Seleccionado</span>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setMetodoPago('Efectivo')} className={`p-3 border rounded-xl font-black ${metodoPago === 'Efectivo' ? 'bg-[#8B5A2B]/10 border-[#8B5A2B] text-[#8B5A2B]' : 'bg-white text-gray-500'}`}>💵 Efectivo</button>
                  <button onClick={() => setMetodoPago('Tarjeta')} className={`p-3 border rounded-xl font-black ${metodoPago === 'Tarjeta' ? 'bg-[#8B5A2B]/10 border-[#8B5A2B] text-[#8B5A2B]' : 'bg-white text-gray-500'}`}>💳 Tarjeta</button>
                </div>
                {metodoPago === 'Efectivo' && (
                  <div className="space-y-1">
                    <span>Efectivo Recibido en Caja ($)</span>
                    <input type="number" value={efectivoRecibido} onChange={e => setEfectivoRecibido(e.target.value)} placeholder="$ 0.00" className="w-full p-2.5 border rounded-xl font-mono text-gray-800 text-sm focus:outline-none" />
                    {efectivoRecibido && parseFloat(efectivoRecibido) >= (mesaSeleccionada.subtotal + parseFloat(propina || 0)) && (
                      <div className="bg-emerald-50 text-emerald-700 p-2 rounded-lg text-3xs font-bold border border-emerald-100 mt-1">Cambio a entregar: ${(parseFloat(efectivoRecibido) - (mesaSeleccionada.subtotal + parseFloat(propina || 0))).toFixed(2)} MXN</div>
                    )}
                  </div>
                )}
                <div className="space-y-1">
                  <span>Añadir Propina Facultativa ($)</span>
                  <input type="number" value={propina} onChange={e => setPropina(e.target.value)} placeholder="Opcional" className="w-full p-2.5 border rounded-xl text-gray-800 text-xs" />
                </div>
              </div>
              
              <div className="md:col-span-2 bg-[#0F172A] text-white p-4 rounded-xl flex flex-col justify-between shadow-inner">
                <div className="space-y-2 text-3xs font-medium text-slate-400">
                  <span className="border-b border-slate-700 pb-1 block font-bold text-slate-300">Resumen Mesa {mesaSeleccionada.numero_mesa}</span>
                  <div className="flex justify-between"><span>Consumo Base:</span><span>${mesaSeleccionada.subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Propina Staff:</span><span>${parseFloat(propina || 0).toFixed(2)}</span></div>
                </div>
                <div className="border-t border-slate-700 pt-2 mt-2">
                  <span className="text-3xs text-slate-400 block font-bold">Total General</span>
                  <div className="flex justify-between items-baseline text-amber-400 font-black"><span className="text-3xs">MXN</span><span className="text-xl font-mono">${(mesaSeleccionada.subtotal + parseFloat(propina || 0)).toFixed(2)}</span></div>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 border-t">
              <button onClick={liquidarCuentaMesa} disabled={metodoPago === 'Efectivo' && (!efectivoRecibido || parseFloat(efectivoRecibido) < (mesaSeleccionada.subtotal + parseFloat(propina || 0)))} className="w-full py-3 bg-[#8B5A2B] text-white font-black rounded-xl text-xs uppercase disabled:bg-gray-200 disabled:text-gray-400 transition-colors">🖨 Honorar Cobro e Imprimir Ticket</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}