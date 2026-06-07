import React, { useState, useEffect } from 'react'
import { useDialogo } from './components/Dialogo'
const IconoTarjeta = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
)
const IconoBillete = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <circle cx="12" cy="12" r="2" />
    <path d="M6 12h.01M18 12h.01" />
  </svg>
)
const IconoImpresora = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
)
const IconoCerrar = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)
const IconoGota = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
  </svg>
)
const IconoMas = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
)
const IconoNota = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
)

export default function Llevar() {
  const [productos, setProductos]                         = useState([])
  const [categoriaActiva, setCategoriaActiva]             = useState('Bebidas Calientes')
  const [mostrarModalPago, setMostrarModalPago]           = useState(false)
  const [mostrarModalPersonalizar, setMostrarModalPersonalizar] = useState(false)
  const [carritoLlevar, setCarritoLlevar]                 = useState([])
  const [productoAEditar, setProductoAEditar]             = useState(null)
  const [indiceAEditar, setIndiceAEditar]                 = useState(null)
  const [metodoPago, setMetodoPago]                       = useState('Efectivo')
  const [efectivoRecibido, setEfectivoRecibido]           = useState('')
  const [propina, setPropina]                             = useState(0)
  const [procesandoVenta, setProcesandoVenta]             = useState(false)
  const { notificar, DialogoUI } = useDialogo()

  const categorias = ['Bebidas Calientes', 'Bebidas Frias', 'Panaderia', 'Alimentos']

  const obtenerOpcionesDePersonalizacion = (categoria) => {
    if (categoria === 'Bebidas Calientes') return {
      modificadores: [
        { id: 'leche_entera', nombre: 'Leche Entera' },
        { id: 'leche_des',    nombre: 'Leche Deslactosada' },
        { id: 'leche_alm',    nombre: 'Leche de Almendra' }
      ],
      extras: [
        { id: 'ex_shot', nombre: 'Shot Extra Espresso', precio: 15.0 },
        { id: 'ex_vai',  nombre: 'Jarabe de Vainilla',  precio: 8.0 }
      ]
    }
    if (categoria === 'Bebidas Frias') return {
      modificadores: [
        { id: 'hielo_normal', nombre: 'Hielo Normal' },
        { id: 'frappe',       nombre: 'Estilo Frappe' }
      ],
      extras: [
        { id: 'ex_crema',   nombre: 'Crema Batida', precio: 12.0 },
        { id: 'ex_tapioca', nombre: 'Tapioca',      precio: 10.0 }
      ]
    }
    return { modificadores: [], extras: [] }
  }

  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/productos')
      .then(res => res.json())
      .then(data => setProductos(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error al conectar con la API de productos:", err))
  }, [])

  const agregarAlCarrito = (prod) => {
    const config = obtenerOpcionesDePersonalizacion(prod.categoria)
    setCarritoLlevar([...carritoLlevar, {
      ...prod,
      uniqueId:          Date.now() + Math.random(),
      cantidad:          1,
      modificadores:     config.modificadores.length > 0 ? { base: config.modificadores[0].nombre } : {},
      extrasSeleccionados: [],
      notas:             ''
    }])
  }

  const abrirPersonalizacion = (item, index) => {
    setProductoAEditar({ ...item })
    setIndiceAEditar(index)
    setMostrarModalPersonalizar(true)
  }

  const guardarPersonalizacion = () => {
    const nuevo = [...carritoLlevar]
    nuevo[indiceAEditar] = productoAEditar
    setCarritoLlevar(nuevo)
    setMostrarModalPersonalizar(false)
  }

  const calcularPrecioItem = (item) => {
    const costoExtras = item.extrasSeleccionados?.reduce((acc, e) => acc + e.precio, 0) || 0
    return item.precio_venta + costoExtras
  }

  const calcularTotalCarrito = () => carritoLlevar.reduce((acc, i) => acc + calcularPrecioItem(i), 0)

  const procesarVentaInmediata = async () => {
    if (procesandoVenta) return
    const totalFinal = calcularTotalCarrito() + parseFloat(propina || 0)
    setProcesandoVenta(true)
    try {
      const respuesta = await fetch('http://127.0.0.1:5000/api/pedidos/venta-directa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productos: carritoLlevar, total: totalFinal, metodo_pago: metodoPago })
      })
      if (!respuesta.ok) throw new Error('El servidor local rechazo la operacion.')
      notificar('Venta completada. Inventario actualizado.', 'exito')
      setCarritoLlevar([])
      setMostrarModalPago(false)
      setPropina(0)
      setEfectivoRecibido('')
    } catch (err) {
      console.error("Error en flujo de caja:", err)
      notificar(`Error al procesar la venta: ${err.message}`, 'error')
    } finally {
      setProcesandoVenta(false)
    }
  }

  const opcionesMesaConfig = (() => {
    if (!productoAEditar) return { modificadores: [], extras: [] }
    const modificadores = obtenerOpcionesDePersonalizacion(productoAEditar.categoria).modificadores
    const raw = productoAEditar.extras_disponibles
    let extras = []
    if (Array.isArray(raw)) extras = raw
    else if (typeof raw === 'string' && raw.trim()) {
      try { const p = JSON.parse(raw); if (Array.isArray(p)) extras = p } catch { /* JSON invalido */ }
    }
    return { modificadores, extras }
  })()

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col space-y-4">

      {/* HEADER */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 flex justify-between items-center flex-shrink-0">
        <div>
          <h2 className="text-lg font-black text-gray-800">Modulo Venta Inmediata (Para Llevar)</h2>
          <span className="text-3xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Canal de Despacho en Mostrador Rapido
          </span>
        </div>
      </div>

      {/* INTERFAZ CENTRAL */}
      <div className="flex-1 flex flex-col lg:flex-row gap-5 overflow-hidden">

        {/* PANEL IZQUIERDO: CATALOGO */}
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

          <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3 pr-1 content-start">
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

        {/* PANEL DERECHO: CARRITO */}
        <div className="w-full lg:w-80 bg-white border border-gray-200 rounded-2xl p-4 flex flex-col justify-between overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            <div className="border-b pb-2 mb-2">
              <h3 className="font-black text-gray-800 text-xs uppercase tracking-wider">Orden Actual</h3>
            </div>
            {carritoLlevar.length === 0 ? (
              <div className="h-full flex items-center justify-center text-3xs text-gray-400 font-bold uppercase text-center opacity-50 py-12">
                Selecciona articulos del catalogo
              </div>
            ) : (
              carritoLlevar.map((item, index) => (
                <div
                  key={item.uniqueId}
                  className="bg-gray-50 p-2.5 rounded-xl border border-dashed border-gray-300 transition-colors"
                >
                  <div className="flex justify-between font-black text-gray-800 text-xs items-start">
                    <span onClick={() => abrirPersonalizacion(item, index)} className="flex-1 cursor-pointer hover:text-[#8B5A2B] transition-colors">{item.nombre_producto}</span>
                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                      <span>${calcularPrecioItem(item).toFixed(2)}</span>
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); setCarritoLlevar(prev => prev.filter((_, i) => i !== index)) }}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded px-1 transition-colors leading-none font-black text-sm"
                        title="Quitar del carrito"
                      >×</button>
                    </div>
                  </div>
                  {item.modificadores?.base && (
                    <span className="text-3xs text-gray-400 block">* {item.modificadores.base}</span>
                  )}
                  {item.extrasSeleccionados?.length > 0 && (
                    <div className="text-3xs text-[#8B5A2B] font-extrabold mt-1">
                      {item.extrasSeleccionados.map(e => `+ ${e.nombre} `)}
                    </div>
                  )}
                  {item.notas && (
                    <p className="text-3xs text-emerald-700 font-bold italic mt-1 bg-white p-1 rounded border border-gray-100">
                      "{item.notas}"
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="border-t pt-3 space-y-2 mt-2">
            <div className="flex justify-between font-black text-gray-800 text-sm">
              <span>Total:</span>
              <span>${calcularTotalCarrito().toFixed(2)}</span>
            </div>
            <button
              onClick={() => setMostrarModalPago(true)}
              disabled={carritoLlevar.length === 0}
              className="w-full py-3 bg-[#8B5A2B] hover:bg-[#7A4F25] text-white rounded-xl font-black text-xs uppercase tracking-wider disabled:bg-gray-200 disabled:text-gray-400 transition-colors flex items-center justify-center gap-2"
            >
              <IconoTarjeta />
              Proceder al Cobro
            </button>
          </div>
        </div>
      </div>

      {/* MODAL A: PERSONALIZACION */}
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
                  Este articulo no cuenta con modificadores ni adiciones especiales.
                </div>
              ) : (
                <>
                  {opcionesMesaConfig.modificadores.length > 0 && (
                    <div className="space-y-1">
                      <span className="flex items-center gap-1.5">
                        <IconoGota />
                        Configuracion de Receta Base ({productoAEditar.categoria})
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        {opcionesMesaConfig.modificadores.map(m => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setProductoAEditar({ ...productoAEditar, modificadores: { base: m.nombre } })}
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
                      <span className="flex items-center gap-1.5">
                        <IconoMas />
                        Extras Permitidos
                      </span>
                      <div className="grid grid-cols-1 gap-2">
                        {opcionesMesaConfig.extras.map(e => {
                          const sel = productoAEditar.extrasSeleccionados?.some(x => x.id === e.id)
                          return (
                            <button
                              key={e.id}
                              type="button"
                              onClick={() => {
                                const n = sel
                                  ? productoAEditar.extrasSeleccionados.filter(x => x.id !== e.id)
                                  : [...(productoAEditar.extrasSeleccionados || []), e]
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

              <div className="space-y-1 pt-2 border-t">
                <span className="flex items-center gap-1.5">
                  <IconoNota />
                  Especificaciones de Preparacion
                </span>
                <textarea
                  rows="2"
                  value={productoAEditar.notas || ''}
                  onChange={e => setProductoAEditar({ ...productoAEditar, notas: e.target.value })}
                  placeholder="Ej. Con endulzante, popote de papel, aderezo extra..."
                  className="w-full p-2 border rounded-xl bg-gray-50 font-medium normal-case text-gray-700 focus:outline-none text-xs"
                />
              </div>
            </div>

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
                className="flex-1 py-2.5 bg-[#8B5A2B] text-white font-black rounded-xl text-2xs uppercase tracking-wider shadow"
              >
                Aplicar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL B: COBRO - fondo blanco, sin colores oscuros */}
      {mostrarModalPago && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-sm font-black text-gray-800">Cierre de Ticket Rapido (Para Llevar)</h3>
              <button
                onClick={() => setMostrarModalPago(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <IconoCerrar />
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-5 gap-5 text-2xs font-extrabold uppercase text-gray-400">
              {/* METODO DE PAGO */}
              <div className="md:col-span-3 space-y-3">
                <span>Metodo de Liquidacion</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setMetodoPago('Efectivo')}
                    className={`p-3 border rounded-xl font-black flex items-center justify-center gap-2 ${metodoPago === 'Efectivo' ? 'bg-[#8B5A2B]/10 border-[#8B5A2B] text-[#8B5A2B]' : 'bg-white text-gray-500'}`}
                  >
                    <IconoBillete />
                    Efectivo
                  </button>
                  <button
                    onClick={() => setMetodoPago('Tarjeta')}
                    className={`p-3 border rounded-xl font-black flex items-center justify-center gap-2 ${metodoPago === 'Tarjeta' ? 'bg-[#8B5A2B]/10 border-[#8B5A2B] text-[#8B5A2B]' : 'bg-white text-gray-500'}`}
                  >
                    <IconoTarjeta />
                    Tarjeta
                  </button>
                </div>

                {metodoPago === 'Efectivo' && (
                  <div className="space-y-1">
                    <span>Monto Recibido en Ventanilla ($)</span>
                    <input
                      type="number"
                      value={efectivoRecibido}
                      onChange={e => setEfectivoRecibido(e.target.value)}
                      placeholder="$ 0.00"
                      className="w-full p-2.5 border rounded-xl font-mono text-gray-800 text-sm focus:outline-none"
                    />
                    {efectivoRecibido && parseFloat(efectivoRecibido) >= (calcularTotalCarrito() + parseFloat(propina || 0)) && (
                      <div className="bg-emerald-50 text-emerald-700 p-2 rounded-lg text-3xs font-bold border border-emerald-200 mt-1">
                        Cambio de caja: ${(parseFloat(efectivoRecibido) - (calcularTotalCarrito() + parseFloat(propina || 0))).toFixed(2)} MXN
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-1">
                  <span>Anadir Propina ($)</span>
                  <input
                    type="number"
                    value={propina}
                    onChange={e => setPropina(e.target.value)}
                    placeholder="Opcional"
                    className="w-full p-2.5 border rounded-xl text-gray-800 text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* RESUMEN DE VENTA - fondo blanco con borde, sin oscuros */}
              <div className="md:col-span-2 bg-gray-50 border border-gray-200 p-4 rounded-xl flex flex-col justify-between">
                <div className="space-y-2 text-3xs font-medium text-gray-500">
                  <span className="border-b border-gray-200 pb-1 block font-black text-gray-700">Resumen de Venta Inmediata</span>
                  <div className="flex justify-between">
                    <span>Consumo Base:</span>
                    <span className="text-gray-800 font-black">${calcularTotalCarrito().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Propina:</span>
                    <span className="text-gray-800 font-black">${parseFloat(propina || 0).toFixed(2)}</span>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <span className="text-3xs text-gray-500 block font-bold">Total Facturado</span>
                  <div className="flex justify-between items-baseline text-[#8B5A2B] font-black">
                    <span className="text-3xs">MXN</span>
                    <span className="text-xl font-mono">${(calcularTotalCarrito() + parseFloat(propina || 0)).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t">
              <button
                onClick={procesarVentaInmediata}
                disabled={procesandoVenta || (metodoPago === 'Efectivo' && (!efectivoRecibido || parseFloat(efectivoRecibido) < (calcularTotalCarrito() + parseFloat(propina || 0))))}
                className="w-full py-3 bg-[#8B5A2B] hover:bg-[#7A4F25] text-white font-black rounded-xl text-xs uppercase disabled:bg-gray-200 disabled:text-gray-400 transition-colors flex items-center justify-center gap-2"
              >
                <IconoImpresora />
                {procesandoVenta ? 'Procesando...' : 'Emitir Ticket de Venta Directa'}
              </button>
            </div>
          </div>
        </div>
      )}
      <DialogoUI />
    </div>
  )
}
