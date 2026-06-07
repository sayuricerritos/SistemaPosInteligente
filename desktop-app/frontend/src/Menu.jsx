import React, { useState, useEffect } from 'react'
import { useDialogo } from './components/Dialogo'
import { noNeg } from './helpers/validacion'
import { apiFetch } from './helpers/apiFetch'
// ============================================================
// ICONOS
// ============================================================
const IconoEditar = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)
const IconoEliminar = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" /><path d="M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
)
const IconoGuardar = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
  </svg>
)
const IconoCerrar = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)
const IconoVincular = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
)
const IconoMas = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
  </svg>
)
const IconoIA = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" />
    <line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" />
    <line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" />
    <line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="14" x2="23" y2="14" />
    <line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="14" x2="4" y2="14" />
  </svg>
)

// ============================================================
// CONSTANTES
// ============================================================
const CATEGORIAS = ['Bebidas Calientes', 'Bebidas Frias', 'Panaderia', 'Alimentos']

const FORM_PRODUCTO_VACIO = {
  id_producto_sel: null,
  nombre_producto: '',
  precio_venta:    '',
  categoria:       'Bebidas Calientes',
}

const FORM_EXTRA_VACIO = {
  nombre:             '',
  precio:             '',
  id_insumo:          '',
  cantidad_descuento: '0',
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function Menu({ usuario }) {
  const [productos,          setProductos]          = useState([])
  const [insumos,            setInsumos]            = useState([])
  const [subPestana,         setSubPestana]         = useState('General')
  const [formProducto,       setFormProducto]       = useState(FORM_PRODUCTO_VACIO)
  const [modoEdicion,        setModoEdicion]        = useState(false)

  // Confirmacion de eliminacion
  const [productoAEliminar,  setProductoAEliminar]  = useState(null)

  // Receta fraccional: { [id_insumo]: { id_insumo, nombre_insumo, cantidad, unidad } }
  const [recetaMap,          setRecetaMap]          = useState({})
  const [productoReceta,     setProductoReceta]     = useState('')

  // Extras dinamicos con insumo vinculado
  // [{ id, nombre, precio, id_insumo (opcional), cantidad_descuento }]
  const [extrasLista,        setExtrasLista]        = useState([])
  const [productoExtras,     setProductoExtras]     = useState('')
  const [mostrarFormExtra,   setMostrarFormExtra]   = useState(false)
  const [formExtra,          setFormExtra]          = useState(FORM_EXTRA_VACIO)
  const [guardandoProducto,  setGuardandoProducto]  = useState(false)
  const [guardandoReceta,    setGuardandoReceta]    = useState(false)
  const [guardandoExtras,    setGuardandoExtras]    = useState(false)
  const { notificar, confirmar, DialogoUI } = useDialogo()

  // ============================================================
  // CARGA DE DATOS
  // ============================================================
  const cargarDatos = () => {
    apiFetch('http://127.0.0.1:5000/api/productos', {}, usuario)
      .then(r => r.json())
      .then(d => setProductos(Array.isArray(d) ? d : []))
      .catch(e => console.error("[MENU] Error productos:", e))

    apiFetch('http://127.0.0.1:5000/api/inventario', {}, usuario)
      .then(r => r.json())
      .then(d => setInsumos(Array.isArray(d) ? d : []))
      .catch(e => console.error("[MENU] Error insumos:", e))
  }

  useEffect(() => { cargarDatos() }, [])

  // ============================================================
  // PRODUCTO: alta / edicion / eliminacion
  // ============================================================
  const iniciarEdicion = (p) => {
    setFormProducto({
      id_producto_sel: p.id_producto,
      nombre_producto: p.nombre_producto,
      precio_venta:    p.precio_venta,
      categoria:       p.categoria,
    })
    setModoEdicion(true)
  }

  const cancelarEdicion = () => {
    setFormProducto(FORM_PRODUCTO_VACIO)
    setModoEdicion(false)
  }

  const handleGuardarProducto = (e) => {
    e.preventDefault()
    if (guardandoProducto) return
    const url    = modoEdicion
      ? `http://127.0.0.1:5000/api/productos/${formProducto.id_producto_sel}`
      : 'http://127.0.0.1:5000/api/productos'
    const metodo = modoEdicion ? 'PUT' : 'POST'
    const body   = {
      nombre_producto: formProducto.nombre_producto,
      precio_venta:    parseFloat(formProducto.precio_venta),
      categoria:       formProducto.categoria,
    }
    setGuardandoProducto(true)
    apiFetch(url, {
      method:  metodo,
      body:    JSON.stringify(body),
    }, usuario)
    .then(r => { if (!r.ok) throw new Error("Error del servidor"); return r.json() })
    .then(() => {
      notificar(modoEdicion ? 'Producto actualizado.' : 'Producto agregado al catalogo.')
      cancelarEdicion()
      cargarDatos()
    })
    .catch(err => notificar(`Error: ${err.message}`))
    .finally(() => setGuardandoProducto(false))
  }

  const handleEliminarProducto = (id_producto) => {
    apiFetch(`http://127.0.0.1:5000/api/productos/${id_producto}`, { method: 'DELETE' }, usuario)
      .then(r => {
        if (!r.ok) return r.json().then(d => { throw new Error(d.error || `Error ${r.status}`) })
        return r.json()
      })
      .then(() => {
        cargarDatos()
        setProductoAEliminar(null)
        if (modoEdicion && formProducto.id_producto_sel === id_producto) cancelarEdicion()
      })
      .catch(err => notificar(`No se pudo eliminar: ${err.message}`))
  }

  // ============================================================
  // RECETA FRACCIONAL
  // ============================================================
  const cargarRecetaDeProducto = (idProd) => {
    const prodObj = productos.find(p => p.id_producto === idProd)
    if (!prodObj) { setRecetaMap({}); return }
    const receta = Array.isArray(prodObj.insumos_receta) ? prodObj.insumos_receta : []
    const mapa   = {}
    receta.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        mapa[item.id_insumo] = { ...item }
      } else {
        const ins = insumos.find(i => i.id_insumo === item)
        mapa[item] = {
          id_insumo:    item,
          nombre_insumo: ins ? ins.nombre_insumo : `Insumo ${item}`,
          cantidad:     1,
          unidad:       ins ? ins.unidad_medida : 'unidad',
        }
      }
    })
    setRecetaMap(mapa)
  }

  const toggleInsumoReceta = (insumo) => {
    if (recetaMap[insumo.id_insumo]) {
      const nuevo = { ...recetaMap }
      delete nuevo[insumo.id_insumo]
      setRecetaMap(nuevo)
    } else {
      setRecetaMap({
        ...recetaMap,
        [insumo.id_insumo]: {
          id_insumo:    insumo.id_insumo,
          nombre_insumo: insumo.nombre_insumo,
          cantidad:     1,
          unidad:       insumo.unidad_medida || 'unidad',
        },
      })
    }
  }

  const updateCantidadReceta = (id_insumo, valor) => {
    if (!recetaMap[id_insumo]) return
    setRecetaMap({
      ...recetaMap,
      [id_insumo]: { ...recetaMap[id_insumo], cantidad: parseFloat(valor) || 0 },
    })
  }

  const handleGuardarReceta = () => {
    if (guardandoReceta) return
    if (!productoReceta) return
    setGuardandoReceta(true)
    apiFetch('http://127.0.0.1:5000/api/productos/guardar-receta', {
      method:  'POST',
      body:    JSON.stringify({ id_producto: productoReceta, insumos: Object.values(recetaMap) }),
    }, usuario)
    .then(r => { if (!r.ok) throw new Error("Error al guardar receta"); return r.json() })
    .then(() => { notificar("Receta vinculada con exito."); cargarDatos() })
    .catch(err => notificar(`Error: ${err.message}`))
    .finally(() => setGuardandoReceta(false))
  }

  // ============================================================
  // EXTRAS DINAMICOS CON INSUMO VINCULADO
  // ============================================================
  const cargarExtrasDeProducto = (idProd) => {
    const prodObj = productos.find(p => p.id_producto === idProd)
    if (!prodObj) { setExtrasLista([]); return }
    const extras = Array.isArray(prodObj.extras_disponibles) ? prodObj.extras_disponibles : []
    if (extras.length > 0 && typeof extras[0] === 'object') {
      setExtrasLista(extras)
    } else if (extras.length > 0) {
      // Legacy: lista de IDs de texto
      setExtrasLista(extras.map(id => ({
        id,
        nombre:             String(id),
        precio:             0,
        id_insumo:          null,
        cantidad_descuento: 0,
      })))
    } else {
      setExtrasLista([])
    }
  }

  const handleAgregarExtra = (e) => {
    e.preventDefault()
    if (!formExtra.nombre.trim()) return
    const nuevo = {
      id:                 `extra_${Date.now()}`,
      nombre:             formExtra.nombre.trim(),
      precio:             parseFloat(formExtra.precio) || 0,
      id_insumo:          formExtra.id_insumo ? parseInt(formExtra.id_insumo) : null,
      cantidad_descuento: parseFloat(formExtra.cantidad_descuento) || 0,
    }
    setExtrasLista([...extrasLista, nuevo])
    setFormExtra(FORM_EXTRA_VACIO)
    setMostrarFormExtra(false)
  }

  const handleEliminarExtra = (id) => {
    setExtrasLista(extrasLista.filter(e => e.id !== id))
  }

  const handleGuardarExtras = () => {
    if (guardandoExtras) return
    if (!productoExtras) return
    setGuardandoExtras(true)
    apiFetch('http://127.0.0.1:5000/api/productos/guardar-extras', {
      method:  'POST',
      body:    JSON.stringify({ id_producto: productoExtras, extras: extrasLista }),
    }, usuario)
    .then(r => { if (!r.ok) throw new Error("Error al guardar extras"); return r.json() })
    .then(() => { notificar("Extras guardados correctamente."); cargarDatos() })
    .catch(err => notificar(`Error: ${err.message}`))
    .finally(() => setGuardandoExtras(false))
  }

  // Insumo seleccionado para mostrar su unidad en el form de extra
  const insumoSeleccionadoParaExtra = formExtra.id_insumo
    ? insumos.find(i => i.id_insumo === parseInt(formExtra.id_insumo))
    : null

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="p-6 bg-gray-50 min-h-screen text-xs font-bold text-gray-500 space-y-5">

      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-2xs">
        <div>
          <h1 className="text-2xl font-black text-gray-800">Configuracion de Catalogo y Recetas</h1>
          <p className="text-3xs text-gray-400 font-medium">
            Administracion del menu, insumos fraccionales y extras con descuento de almacen.
          </p>
        </div>
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl border">
          {[
            ['General',  'Menu General'],
            ['Materias', 'Recetas'],
            ['Extras',   'Extras'],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSubPestana(key)}
              className={`px-4 py-2 rounded-lg text-3xs font-black uppercase transition-all ${
                subPestana === key ? 'bg-[#8B5A2B] text-white shadow-sm' : 'bg-white text-gray-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* =========================================================
          SUB-PESTANA 1: MENU GENERAL
      ========================================================= */}
      {subPestana === 'General' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Formulario izquierdo */}
          <div className="bg-white border rounded-2xl p-5 shadow-2xs h-fit space-y-4">
            <div className="border-b pb-2">
              <h3 className="text-sm font-black text-gray-800 uppercase flex items-center gap-2">
                <IconoEditar />{modoEdicion ? 'Editar Articulo' : 'Nuevo Articulo'}
              </h3>
              <p className="text-3xs text-gray-400">
                {modoEdicion ? 'Modificando registro existente.' : 'Inyeccion al catalogo de ventas.'}
              </p>
            </div>

            <form onSubmit={handleGuardarProducto} className="space-y-3">
              <div>
                <label className="text-3xs text-gray-400 uppercase block mb-1">Nombre del Producto *</label>
                <input
                  type="text"
                  required
                  value={formProducto.nombre_producto}
                  onChange={e => setFormProducto({ ...formProducto, nombre_producto: e.target.value })}
                  placeholder="Ej. Latte Vainilla"
                  className="w-full p-2.5 border rounded-xl bg-gray-50 text-gray-800 font-medium focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-3xs text-gray-400 uppercase block mb-1">Precio ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formProducto.precio_venta}
                    onChange={e => setFormProducto({ ...formProducto, precio_venta: noNeg(e.target.value, formProducto.precio_venta) })}
                    placeholder="0.00"
                    className="w-full p-2.5 border rounded-xl bg-gray-50 text-gray-800 font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-3xs text-gray-400 uppercase block mb-1">Categoria</label>
                  <select
                    value={formProducto.categoria}
                    onChange={e => setFormProducto({ ...formProducto, categoria: e.target.value })}
                    className="w-full p-2.5 border rounded-xl bg-gray-50 text-gray-800 font-medium focus:outline-none"
                  >
                    {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={guardandoProducto}
                  className={`flex-1 py-3 text-white font-black rounded-xl uppercase tracking-wider shadow flex items-center justify-center gap-2 ${
                    guardandoProducto ? 'bg-gray-400 cursor-not-allowed' : (modoEdicion ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#8B5A2B] hover:bg-[#7A4F25]')
                  }`}
                >
                  <IconoGuardar />
                  {guardandoProducto ? 'Guardando...' : (modoEdicion ? 'Actualizar' : 'Guardar')}
                </button>
                {modoEdicion && (
                  <button
                    type="button"
                    onClick={cancelarEdicion}
                    className="px-3 py-3 bg-gray-200 hover:bg-gray-300 text-gray-600 font-black rounded-xl"
                  >
                    <IconoCerrar />
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Catalogo derecho */}
          <div className="lg:col-span-2 space-y-3">
            <span className="block text-3xs font-black text-gray-400 uppercase tracking-wider">
              Articulos en Catalogo ({productos.length}):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {productos.map(p => (
                <div
                  key={p.id_producto}
                  className="bg-white border rounded-xl p-4 shadow-2xs hover:border-gray-300 transition-all"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-black text-gray-800 text-sm">{p.nombre_producto}</h4>
                      <span className="inline-block bg-amber-50 text-[#8B5A2B] text-[10px] font-bold px-2 py-0.5 rounded border border-amber-100 mt-1">
                        {p.categoria}
                      </span>
                    </div>
                    <span className="text-sm font-black font-mono text-gray-700">
                      ${parseFloat(p.precio_venta).toFixed(2)}
                    </span>
                  </div>

                  {/* Tres botones de accion */}
                  <div className="flex gap-2 border-t pt-3">
                    <button
                      onClick={() => iniciarEdicion(p)}
                      className="flex-1 py-1.5 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 text-3xs font-black rounded-lg flex items-center justify-center gap-1 transition-colors"
                    >
                      <IconoEditar />
                      Editar
                    </button>

                    {/* Boton Eliminar Producto */}
                    <button
                      onClick={() => setProductoAEliminar(p)}
                      className="flex-1 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-3xs font-black rounded-lg flex items-center justify-center gap-1 transition-colors"
                    >
                      <IconoEliminar />
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          SUB-PESTANA 2: RECETAS FRACCIONALES
      ========================================================= */}
      {subPestana === 'Materias' && (
        <div className="bg-white border rounded-2xl p-6 shadow-2xs space-y-5">
          <div className="border-b pb-3">
            <h3 className="text-base font-black text-gray-800 uppercase">Recetas con Insumos por Fraccion</h3>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              Define exactamente cuantas unidades (KG, ML, Pieza) consume cada producto por porcion.
            </p>
          </div>

          {/* Selector de producto */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1">
              <label className="text-3xs text-gray-400 uppercase font-black block mb-1">
                1. Selecciona el Producto a Configurar:
              </label>
              <select
                value={productoReceta || ''}
                onChange={e => {
                  const id = e.target.value ? parseInt(e.target.value) : ''
                  setProductoReceta(id)
                  if (id) cargarRecetaDeProducto(id)
                  else setRecetaMap({})
                }}
                className="w-full p-3 border rounded-xl bg-white text-gray-800 font-bold focus:outline-none"
              >
                <option value="">-- Selecciona un articulo del menu --</option>
                {productos.map(p => (
                  <option key={p.id_producto} value={p.id_producto}>
                    {p.nombre_producto} ({p.categoria})
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              disabled={!productoReceta || guardandoReceta}
              onClick={handleGuardarReceta}
              className={`sm:w-48 py-3.5 rounded-xl font-black uppercase tracking-wider flex items-center justify-center gap-2 ${
                !productoReceta || guardandoReceta
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow'
              }`}
            >
              <IconoVincular />{guardandoReceta ? 'Guardando...' : 'Vincular Receta'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Lista de insumos con cantidad fraccional */}
            <div className="space-y-2">
              <span className="block text-3xs font-black text-gray-400 uppercase tracking-wider">
                2. Insumos y cantidad exacta por porcion:
              </span>
              <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
                {insumos.length === 0 ? (
                  <p className="text-gray-400 text-3xs font-medium p-4 border border-dashed rounded-xl text-center normal-case">
                    No hay insumos registrados. Crea insumos desde la seccion Inventario.
                  </p>
                ) : (
                  insumos.map(insumo => {
                    const sel  = !!recetaMap[insumo.id_insumo]
                    const item = recetaMap[insumo.id_insumo]
                    return (
                      <div
                        key={insumo.id_insumo}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                          sel ? 'bg-amber-50/40 border-amber-300' : 'bg-white border-gray-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={sel}
                          disabled={!productoReceta}
                          onChange={() => toggleInsumoReceta(insumo)}
                          className="w-4 h-4 accent-[#8B5A2B] flex-shrink-0 cursor-pointer"
                        />
                        <span className={`flex-1 font-bold text-xs ${!productoReceta ? 'text-gray-400' : 'text-gray-700'}`}>
                          {insumo.nombre_insumo}
                        </span>
                        {sel && (
                          <>
                            <input
                              type="number"
                              step="0.001"
                              min="0"
                              value={item.cantidad}
                              onChange={e => updateCantidadReceta(insumo.id_insumo, noNeg(e.target.value, item.cantidad))}
                              className="w-20 p-1.5 border rounded-lg text-xs font-mono text-center text-gray-800 bg-white focus:outline-none focus:border-[#8B5A2B]"
                            />
                            <span className="text-3xs text-gray-400 font-black w-10 text-left">
                              {insumo.unidad_medida}
                            </span>
                          </>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Panel de ayuda */}
            <div className="bg-amber-50/20 border border-dashed border-amber-200 p-5 rounded-xl flex flex-col justify-between">
              <div>
                <span className="block text-3xs font-black text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <IconoIA />Control Inteligente de Inventario
                </span>
                <p className="text-xs text-gray-600 font-medium normal-case leading-relaxed">
                  Al despachar desde cocina, el sistema descuenta la cantidad exacta de cada insumo multiplicada por las unidades vendidas.
                </p>
                <div className="mt-4 space-y-2">
                  <div className="bg-white border border-amber-100 rounded-lg p-2.5 text-3xs font-mono text-gray-600">
                    <p className="font-black text-amber-800 mb-1">Ejemplo: Cafe Latte</p>
                    <p>Cafe en grano: 0.015 KG x 2 = 0.030 KG</p>
                    <p>Leche: 0.250 ML x 2 = 0.500 ML</p>
                  </div>
                  <div className="bg-white border border-amber-100 rounded-lg p-2.5 text-3xs font-mono text-gray-600">
                    <p className="font-black text-amber-800 mb-1">Ejemplo: Dona de Chocolate</p>
                    <p>Dona base: 1 Pieza x 3 = 3 Piezas</p>
                    <p>Cobertura: 0.030 KG x 3 = 0.090 KG</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-amber-100 text-3xs text-[#8B5A2B] font-mono mt-4">
                Insumos en receta activa: {Object.keys(recetaMap).length} componentes.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          SUB-PESTANA 3: EXTRAS DINAMICOS
      ========================================================= */}
      {subPestana === 'Extras' && (
        <div className="bg-white border rounded-2xl p-6 shadow-2xs space-y-5">
          <div className="border-b pb-3">
            <h3 className="text-base font-black text-gray-800 uppercase">Extras y Modificadores con Descuento de Almacen</h3>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              Registra extras cobrados y vinculalos a un insumo para descontar la fraccion exacta al despachar.
            </p>
          </div>

          {/* Selector de producto */}
          <div className="bg-gray-100/60 p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1">
              <label className="text-3xs text-gray-400 uppercase font-black block mb-1">
                1. Selecciona el Producto Objetivo:
              </label>
              <select
                value={productoExtras || ''}
                onChange={e => {
                  const id = e.target.value ? parseInt(e.target.value) : ''
                  setProductoExtras(id)
                  if (id) cargarExtrasDeProducto(id)
                  else setExtrasLista([])
                }}
                className="w-full p-3 border rounded-xl bg-white text-gray-800 font-bold focus:outline-none"
              >
                <option value="">-- Selecciona un articulo del menu --</option>
                {productos.map(p => (
                  <option key={p.id_producto} value={p.id_producto}>
                    {p.nombre_producto} ({p.categoria})
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              disabled={!productoExtras || guardandoExtras}
              onClick={handleGuardarExtras}
              className={`sm:w-44 py-3.5 rounded-xl font-black uppercase tracking-wider flex items-center justify-center gap-2 ${
                !productoExtras || guardandoExtras
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-amber-600 hover:bg-amber-700 text-white shadow active:scale-95'
              }`}
            >
              <IconoVincular />{guardandoExtras ? 'Guardando...' : 'Guardar Extras'}
            </button>
          </div>

          {/* Lista de extras configurados */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-3xs font-black text-gray-400 uppercase tracking-wider">
                2. Extras configurados para este producto:
              </span>
              {productoExtras && (
                <button
                  type="button"
                  onClick={() => setMostrarFormExtra(true)}
                  className="text-3xs font-black text-[#8B5A2B] bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-amber-100 transition-colors"
                >
                  <IconoMas className="w-3 h-3" />
                  Agregar Extra
                </button>
              )}
            </div>

            {!productoExtras ? (
              <p className="text-3xs text-gray-400 font-medium p-4 border border-dashed rounded-xl text-center normal-case">
                Selecciona un producto para ver y editar sus extras.
              </p>
            ) : extrasLista.length === 0 ? (
              <p className="text-3xs text-gray-400 font-medium p-4 border border-dashed rounded-xl text-center normal-case">
                Este producto no tiene extras configurados. Usa el boton "Agregar Extra".
              </p>
            ) : (
              <div className="space-y-2">
                {extrasLista.map(extra => {
                  const insumoVinculado = extra.id_insumo
                    ? insumos.find(i => i.id_insumo === extra.id_insumo)
                    : null
                  return (
                    <div
                      key={extra.id}
                      className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center gap-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-black text-gray-800 text-xs">{extra.nombre}</span>
                          <span className="bg-amber-50 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded border border-amber-100">
                            +${parseFloat(extra.precio || 0).toFixed(2)}
                          </span>
                        </div>
                        {insumoVinculado ? (
                          <p className="text-3xs text-emerald-700 font-bold">
                            Descuenta: {extra.cantidad_descuento} {insumoVinculado.unidad_medida}
                            {' '}de {insumoVinculado.nombre_insumo}
                          </p>
                        ) : (
                          <p className="text-3xs text-gray-400 font-medium">Sin descuento de inventario</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleEliminarExtra(extra.id)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <IconoCerrar className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Formulario para agregar nuevo extra */}
          {mostrarFormExtra && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
              <form
                onSubmit={handleAgregarExtra}
                className="bg-white rounded-3xl p-6 w-full max-w-sm space-y-4 text-xs font-bold text-gray-500 shadow-2xl"
              >
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="text-sm font-black text-gray-800">Configurar Nuevo Extra</h3>
                  <button
                    type="button"
                    onClick={() => { setMostrarFormExtra(false); setFormExtra(FORM_EXTRA_VACIO) }}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
                  >
                    <IconoCerrar />
                  </button>
                </div>

                <div>
                  <label className="block mb-1 text-3xs uppercase text-gray-400">Nombre del Extra *</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={formExtra.nombre}
                    onChange={e => setFormExtra({ ...formExtra, nombre: e.target.value })}
                    placeholder="Ej. Shot Extra Espresso, Rebanada de Pan"
                    className="w-full p-2.5 border rounded-xl font-medium text-gray-800 bg-gray-50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-3xs uppercase text-gray-400">Precio Adicional ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formExtra.precio}
                    onChange={e => setFormExtra({ ...formExtra, precio: noNeg(e.target.value, formExtra.precio) })}
                    placeholder="0.00"
                    className="w-full p-2.5 border rounded-xl font-mono text-gray-800 bg-gray-50 focus:outline-none"
                  />
                </div>

                {/* Vinculacion a insumo (opcional) */}
                <div className="border-t pt-3 space-y-3">
                  <div>
                    <label className="block mb-1 text-3xs uppercase text-gray-400">
                      Insumo del Almacen a Descontar (opcional)
                    </label>
                    <select
                      value={formExtra.id_insumo}
                      onChange={e => setFormExtra({ ...formExtra, id_insumo: e.target.value })}
                      className="w-full p-2.5 border rounded-xl font-medium text-gray-800 bg-gray-50 focus:outline-none"
                    >
                      <option value="">Sin descuento de inventario</option>
                      {insumos.map(i => (
                        <option key={i.id_insumo} value={i.id_insumo}>
                          {i.nombre_insumo} (stock: {i.cantidad_actual} {i.unidad_medida})
                        </option>
                      ))}
                    </select>
                  </div>

                  {formExtra.id_insumo && (
                    <div>
                      <label className="block mb-1 text-3xs uppercase text-gray-400">
                        Cantidad a Descontar
                        {insumoSeleccionadoParaExtra && (
                          <span className="normal-case font-medium ml-1">
                            (en {insumoSeleccionadoParaExtra.unidad_medida})
                          </span>
                        )}
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        value={formExtra.cantidad_descuento}
                        onChange={e => setFormExtra({ ...formExtra, cantidad_descuento: noNeg(e.target.value, formExtra.cantidad_descuento) })}
                        placeholder="Ej. 0.015 KG, 1 Pieza, 0.250 ML"
                        className="w-full p-2.5 border rounded-xl font-mono text-gray-800 bg-gray-50 focus:outline-none"
                      />
                      <p className="text-3xs text-gray-400 font-medium mt-1 normal-case">
                        Al despachar este extra, el sistema descontara esta cantidad del insumo seleccionado.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2 border-t font-black uppercase text-2xs">
                  <button
                    type="button"
                    onClick={() => { setMostrarFormExtra(false); setFormExtra(FORM_EXTRA_VACIO) }}
                    className="w-1/3 py-2.5 border rounded-xl text-gray-400 normal-case font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-[#8B5A2B] hover:bg-[#7A4F25] text-white rounded-xl shadow tracking-wide"
                  >
                    Agregar Extra
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* =========================================================
          MODAL: CONFIRMAR ELIMINACION DE PRODUCTO
      ========================================================= */}
      {productoAEliminar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl text-xs font-bold text-gray-500">
            <div className="border-b pb-3">
              <h3 className="text-sm font-black text-gray-800">Eliminar Producto del Catalogo</h3>
              <p className="text-3xs text-gray-400 font-medium mt-0.5">Esta accion es permanente e irreversible.</p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="font-black text-gray-800 text-xs mb-1">{productoAEliminar.nombre_producto}</p>
              <p className="text-3xs text-gray-500 font-medium">
                {productoAEliminar.categoria} -
                ${parseFloat(productoAEliminar.precio_venta).toFixed(2)}
              </p>
            </div>

            <p className="text-3xs text-gray-500 font-medium normal-case leading-relaxed">
              Se eliminara permanentemente del catalogo. Las comandas historicas que contenian este
              producto no se veran afectadas porque los datos de pedidos se guardan como texto.
            </p>

            <div className="flex gap-2 pt-2 border-t font-black uppercase text-2xs">
              <button
                type="button"
                onClick={() => setProductoAEliminar(null)}
                className="flex-1 py-2.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 rounded-xl normal-case font-bold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleEliminarProducto(productoAEliminar.id_producto)}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow tracking-wide flex items-center justify-center gap-2 transition-colors"
              >
                <IconoEliminar />
                Confirmar Baja
              </button>
            </div>
          </div>
        </div>
      )}
      <DialogoUI />
    </div>
  )
}