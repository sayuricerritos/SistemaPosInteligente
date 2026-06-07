import React, { useState, useEffect } from 'react';
import { useDialogo } from './components/Dialogo'
import { noNeg } from './helpers/validacion'
const IconoPersonas = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)
const IconoMesero = ({ className = "w-3 h-3" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
)
const IconoDocumento = ({ className = "w-8 h-8" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
  </svg>
)
const IconoNota = ({ className = "w-3 h-3" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
  </svg>
)
const IconoImpresora = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
)
const IconoMas = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
  </svg>
)
const IconoCerrar = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)
const IconoBillete = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" />
  </svg>
)
const IconoTarjeta = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
  </svg>
)
const IconoGota = ({ className = "w-3 h-3" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
  </svg>
)

function Toast({ mensaje, visible }) {
  if (!visible) return null
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-white border border-emerald-200 text-emerald-800 px-5 py-3 rounded-xl shadow-lg text-xs font-black">
      <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
      {mensaje}
    </div>
  )
}

export default function Mesas() {
  const [toastMsg,     setToastMsg]     = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const [mesasGrid, setMesasGrid]     = useState([]);
  const [mesasActivas, setMesasActivas] = useState([]);
  const [productos, setProductos]     = useState([]);
  const [meseros, setMeseros]         = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState('Bebidas Calientes');
  const [mostrarModalApertura, setMostrarModalApertura] = useState(false);
  const [mostrarModalPago, setMostrarModalPago]         = useState(false);
  const [mostrarModalPersonalizar, setMostrarModalPersonalizar] = useState(false);
  const [mesaSeleccionada, setMesaSeleccionada]         = useState(null);
  const [numMesaSeleccionada, setNumMesaSeleccionada]   = useState('');
  const [capacidadMesaSeleccionada, setCapacidadMesaSeleccionada] = useState(4);
  const [comensalesInput, setComensalesInput]           = useState('1');
  const [meseroInput, setMeseroInput]                   = useState('');
  const [comandaSesion, setComandaSesion]               = useState([]);
  const [productoAEditar, setProductoAEditar]           = useState(null);
  const [indiceAEditar, setIndiceAEditar]               = useState(null);
  const [metodoPago, setMetodoPago]                     = useState('Efectivo');
  const [efectivoRecibido, setEfectivoRecibido]         = useState('');
  const [propina, setPropina]                           = useState(0);
  const [enviandoComanda, setEnviandoComanda]           = useState(false);
  const [cerrandoCuenta, setCerrandoCuenta]             = useState(false);

  const { notificar, DialogoUI } = useDialogo()
  const categories = ['Bebidas Calientes', 'Bebidas Frias', 'Panaderia', 'Alimentos'];
  const mostrarToast = (mensaje) => {
  setToastMsg(mensaje)
  setToastVisible(true)
  setTimeout(() => setToastVisible(false), 3000)
  };
  const obtenerOpcionesDePersonalizacion = (categoria) => {
    if (categoria === 'Bebidas Calientes') return {
      modificadores: [{ id: 'leche_entera', nombre: 'Leche Entera' }, { id: 'leche_des', nombre: 'Leche Deslactosada' }, { id: 'leche_alm', nombre: 'Leche de Almendra' }],
      extras: [{ id: 'ex_shot', nombre: 'Shot Extra Espresso', precio: 15.0 }, { id: 'ex_vai', nombre: 'Jarabe de Vainilla', precio: 8.0 }]
    };
    if (categoria === 'Bebidas Frias') return {
      modificadores: [{ id: 'hielo_normal', nombre: 'Hielo Normal' }, { id: 'frappe', nombre: 'Estilo Frappe' }],
      extras: [{ id: 'ex_crema', nombre: 'Crema Batida', precio: 12.0 }, { id: 'ex_tapioca', nombre: 'Tapioca', precio: 10.0 }]
    };
    return { modificadores: [], extras: [] };
  };

  const refrescarEcosistemaPiso = () => {
    fetch('http://127.0.0.1:5000/api/mesas')
      .then(res => res.json()).then(data => setMesasGrid(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error al cargar mapa de mesas:", err));
    fetch('http://127.0.0.1:5000/api/mesas/activas')
      .then(res => res.json()).then(data => setMesasActivas(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error al cargar comandas activas:", err));
  };

  useEffect(() => {
    refrescarEcosistemaPiso();
    fetch('http://127.0.0.1:5000/api/productos')
      .then(res => res.json()).then(data => setProductos(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error al cargar productos:", err));
    fetch('http://127.0.0.1:5000/api/usuarios')
      .then(res => res.json())
      .then(data => {
        const lista = Array.isArray(data) ? data : [];
        const listaMeseros = lista.filter(u => u.puesto.toLowerCase() === 'mesero' || u.permisos === 'Basico');
        setMeseros(listaMeseros.length > 0 ? listaMeseros : [{ nombre: 'Juan Perez' }, { nombre: 'Maria Lopez' }]);
        setMeseroInput(listaMeseros.length > 0 ? listaMeseros[0].nombre : 'Juan Perez');
      })
      .catch(() => { setMeseros([{ nombre: 'Juan Perez' }, { nombre: 'Maria Lopez' }]); setMeseroInput('Juan Perez'); });
  }, []);

  const handleMesaClick = (m) => {
    const cuentaViva = mesasActivas.find(a => String(a.numero_mesa) === String(m.numero_mesa));
    if (m.estado === 'Ocupada') {
      setMesaSeleccionada(cuentaViva || { numero_mesa: m.numero_mesa, comensales: 1, mesero: 'General', productos: [], subtotal: 0.0 });
      setComandaSesion([]);
    } else {
      setNumMesaSeleccionada(String(m.numero_mesa));
      setCapacidadMesaSeleccionada(m.capacidad || 4);
      setComensalesInput('1');
      setMostrarModalApertura(true);
    }
  };

  const handleAbrirMesa = (e) => {
    e.preventDefault();
    fetch('http://127.0.0.1:5000/api/mesas/abrir', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numero_mesa: numMesaSeleccionada, comensales: parseInt(comensalesInput), mesero: meseroInput })
    })
    .then(res => { if (!res.ok) return res.json().then(err => { throw new Error(err.error) }); return res.json(); })
    .then(() => { refrescarEcosistemaPiso(); setMostrarModalApertura(false); })
    .catch(err => notificar(`Error: ${err.message}`, 'error'));
  };

  const calcularPrecioItem = (item) => {
    const costoExtras = item.extrasSeleccionados?.reduce((acc, e) => acc + e.precio, 0) || 0;
    return item.precio_venta + costoExtras;
  };

  const agregarAComandaSesion = (prod) => {
    const config = obtenerOpcionesDePersonalizacion(prod.categoria);
    setComandaSesion([...comandaSesion, {
      ...prod, uniqueId: Date.now() + Math.random(), cantidad: 1,
      modificadores: config.modificadores.length > 0 ? { base: config.modificadores[0].nombre } : {},
      extrasSeleccionados: [], notas: ''
    }]);
  };

  const abrirPersonalizacion = (item, index) => { setProductoAEditar({ ...item }); setIndiceAEditar(index); setMostrarModalPersonalizar(true); };
  const guardarPersonalizacion = () => {
    const nuevo = [...comandaSesion]; nuevo[indiceAEditar] = productoAEditar;
    setComandaSesion(nuevo); setMostrarModalPersonalizar(false);
  };

  const enviarComandaAlBackend = () => {
    if (enviandoComanda) return;
    if (comandaSesion.length === 0) return;
    setEnviandoComanda(true);
    fetch('http://127.0.0.1:5000/api/mesas/comandar', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numero_mesa: mesaSeleccionada.numero_mesa, productos: comandaSesion })
    })
    .then(res => { if (!res.ok) throw new Error('Error al enviar comanda'); return res.json(); })
    .then(data => {
      const nuevaMesa = { ...mesaSeleccionada, productos: [...(mesaSeleccionada.productos || []), ...comandaSesion], subtotal: data.subtotal || mesaSeleccionada.subtotal };
      setMesaSeleccionada(nuevaMesa);
      mostrarToast('Comanda enviada a la cola de produccion correctamente')
    // El carrito se limpia con un breve retraso para que el cajero vea el resultado
      setTimeout(() => setComandaSesion([]), 800);
       refrescarEcosistemaPiso();
    })
    .catch(err => notificar(`Error: ${err.message}`, 'error'))
    .finally(() => setEnviandoComanda(false));
  };

  const handleVolverAGrid = async () => {
    // Si hay modal de personalización abierto, cerrarlo primero
    if (mostrarModalPersonalizar) {
      setMostrarModalPersonalizar(false)
      setProductoAEditar(null)
      setIndiceAEditar(null)
    }

    // Si hay productos en el carrito sin mandar a cocina, pedir confirmación
    if (comandaSesion.length > 0) {
      const ok = await confirmar(
        'Hay productos en el carrito que no se han mandado a cocina. ¿Deseas descartarlos y volver al piso?'
      )
      if (!ok) return
    }

    // Limpiar todo y volver al grid
    setMesaSeleccionada(null)
    setComandaSesion([])
    setProductoAEditar(null)
    setIndiceAEditar(null)
    setMostrarModalPago(false)
  }

  const liquidarCuentaMesa = () => {
    if (cerrandoCuenta) return;
    setCerrandoCuenta(true);
    fetch('http://127.0.0.1:5000/api/mesas/cerrar', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numero_mesa: mesaSeleccionada.numero_mesa, total: mesaSeleccionada.subtotal + parseFloat(propina || 0), metodo_pago: metodoPago, productos: mesaSeleccionada.productos })
    })
    .then(res => { if (!res.ok) return res.json().then(err => { throw new Error(err.error) }); return res.json(); })
    .then(() => { refrescarEcosistemaPiso(); setMesaSeleccionada(null); setMostrarModalPago(false); setPropina(0); setEfectivoRecibido(''); notificar('Cuenta liquidada con exito. Mesa disponible.', 'exito'); })
    .catch(err => notificar(`Error: ${err.message}`, 'error'))
    .finally(() => setCerrandoCuenta(false));
  };

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
    <div className="h-[calc(100vh-120px)] flex flex-col space-y-4 text-xs font-bold text-gray-500">
      <div className="bg-white p-4 rounded-xl border border-gray-200 flex justify-between items-center flex-shrink-0">
        <div>
          <h2 className="text-lg font-black text-gray-800">Monitor de Mesas y Control de Piso</h2>
          {mesaSeleccionada && (
            <span className="text-3xs font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              PANEL ADICION: MESA {mesaSeleccionada.numero_mesa}
            </span>
          )}
        </div>
      </div>

      {/* MAPA DE MESAS */}
      {!mesaSeleccionada ? (
        <div className="flex-1 flex flex-col lg:flex-row gap-5 overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-1">
            <span className="block text-3xs font-black text-gray-400 uppercase tracking-wider mb-2">Diseno y Estatus del Establecimiento:</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {mesasGrid.map(m => {
                const esOcupada  = m.estado === 'Ocupada';
                const cuentaViva = mesasActivas.find(a => String(a.numero_mesa) === String(m.numero_mesa));
                return (
                  <div
                    key={m.id_mesa}
                    onClick={() => handleMesaClick(m)}
                    className={`border-2 rounded-2xl p-5 h-40 flex flex-col justify-between cursor-pointer transition-all active:scale-97 bg-white ${esOcupada ? 'border-red-200 bg-red-50/10 hover:border-red-400' : 'border-emerald-200 hover:border-emerald-400 hover:shadow-xs'}`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-black text-gray-800">MESA {m.numero_mesa}</span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wide ${esOcupada ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {esOcupada ? 'Ocupada' : 'Libre'}
                      </span>
                    </div>
                    <div className="text-3xs font-bold text-gray-400 space-y-0.5">
                      <p className="flex items-center gap-1"><IconoPersonas /> Capacidad: {m.capacidad} asientos</p>
                      {cuentaViva && <p className="flex items-center gap-1 text-gray-500 font-extrabold text-[10px]"><IconoMesero /> {cuentaViva.mesero}</p>}
                    </div>
                    <div className="border-t pt-2 flex justify-between items-baseline">
                      <span className="text-3xs font-black text-gray-400 uppercase">Cuenta:</span>
                      <span className={`text-sm font-black font-mono ${esOcupada ? 'text-amber-700' : 'text-gray-400'}`}>
                        ${cuentaViva ? parseFloat(cuentaViva.subtotal || 0).toFixed(2) : '0.00'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="w-full lg:w-80 bg-white border rounded-2xl p-4 flex flex-col justify-between h-full overflow-hidden shadow-2xs">
            <div className="flex-1 flex flex-col overflow-hidden space-y-2.5">
              <div className="border-b pb-2">
                <h3 className="font-black text-gray-800 text-2xs uppercase tracking-wider">Comandas Vivas en Comedor</h3>
                <p className="text-3xs text-gray-400 font-medium">Cuentas con folios abiertos en la sesion actual</p>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-3xs font-medium">
                {mesasActivas.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-12 gap-2">
                    <IconoDocumento className="text-gray-400" />
                    <p className="font-bold uppercase text-[9px]">Sin folios abiertos</p>
                  </div>
                ) : (
                  mesasActivas.map(ma => (
                    <div key={ma.numero_mesa} onClick={() => { setMesaSeleccionada(ma); setComandaSesion([]); setProductoAEditar(null); setIndiceAEditar(null); }} className="p-3 bg-amber-50/40 border border-dashed border-amber-300 rounded-xl cursor-pointer hover:bg-amber-50 transition-colors flex justify-between items-center">
                      <div>
                        <p className="font-black text-gray-800 text-2xs">MESA NUM. {ma.numero_mesa}</p>
                        <p className="text-gray-400 font-bold mt-0.5">Mesero: {ma.mesero}</p>
                      </div>
                      <span className="font-mono font-black text-amber-700 text-xs">${parseFloat(ma.subtotal || 0).toFixed(2)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* INTERFAZ DE COMANDADO */}
      {mesaSeleccionada ? (
        <div className="flex-1 flex flex-col lg:flex-row gap-5 overflow-hidden animate-fade-in">
          <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
            <div className="grid grid-cols-4 gap-2 bg-gray-100 p-1 rounded-xl border">
              {categories.map(cat => (
                <button key={cat} onClick={() => setCategoriaActiva(cat)} className={`py-2.5 rounded-lg text-2xs font-black transition-all ${categoriaActiva === cat ? 'bg-[#8B5A2B] text-white shadow-sm' : 'bg-white text-gray-500'}`}>{cat}</button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3 pr-1">
              {productos.filter(p => p.categoria === categoriaActiva).map(prod => (
                <button key={prod.id_producto} onClick={() => agregarAComandaSesion(prod)} className="bg-white border p-4 rounded-xl flex flex-col justify-between items-center text-center h-24 hover:border-[#8B5A2B] transition-all active:scale-95">
                  <span className="font-bold text-gray-700 text-xs line-clamp-2">{prod.nombre_producto}</span>
                  <span className="text-[#8B5A2B] font-black text-xs">${prod.precio_venta.toFixed(2)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="w-full lg:w-85 bg-white border rounded-2xl p-4 flex flex-col justify-between h-full overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden space-y-3">
              <div className="border-b pb-2 flex justify-between items-center">
                <div>
                  <h3 className="font-black text-gray-800 text-xs">MESA {mesaSeleccionada.numero_mesa}</h3>
                  <p className="text-3xs text-gray-400 font-bold">Atendiendo: {mesaSeleccionada.mesero}</p>
                </div>
                <button onClick={handleVolverAGrid} className="text-3xs font-black text-gray-400 bg-gray-100 px-2 py-1 rounded">Regresar</button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 text-xs pr-1">
                {mesaSeleccionada.productos?.map((item, i) => (
                  <div key={`saved-${i}`} className="bg-gray-100 p-2.5 rounded-xl border opacity-80">
                    <div className="flex justify-between font-bold text-gray-600">
                      <span>+ {item.nombre_producto}</span>
                      <span>${calcularPrecioItem(item).toFixed(2)}</span>
                    </div>
                    {item.modificadores?.base && <span className="text-3xs text-gray-400 block">* {item.modificadores.base}</span>}
                    {item.extrasSeleccionados?.map((e, idx) => <span key={idx} className="text-3xs text-gray-400 block">+ {e.nombre}</span>)}
                    {item.notas && <p className="text-3xs text-emerald-700 font-mono italic mt-1 bg-white px-1.5 py-0.5 rounded border border-gray-100">"{item.notas}"</p>}
                  </div>
                ))}
                {comandaSesion.map((item, index) => (
                  <div key={item.uniqueId} onClick={() => abrirPersonalizacion(item, index)} className="bg-amber-50/50 p-2.5 rounded-xl border border-dashed border-amber-300 cursor-pointer hover:border-amber-500 transition-colors">
                    <div className="flex justify-between font-black text-gray-800">
                      <span>+ {item.nombre_producto}</span>
                      <span>${calcularPrecioItem(item).toFixed(2)}</span>
                    </div>
                    {item.modificadores?.base && <span className="text-3xs text-gray-400 block">* {item.modificadores.base}</span>}
                    {item.extrasSeleccionados?.length > 0 && (
                      <div className="text-3xs text-[#8B5A2B] font-extrabold mt-1">{item.extrasSeleccionados.map(e => `+ ${e.nombre} `)}</div>
                    )}
                    {item.notas && (
                      <p className="text-3xs text-emerald-600 font-bold italic mt-1 bg-white p-1 rounded border border-emerald-100 flex items-center gap-1">
                        <IconoNota />{item.notas}
                      </p>
                    )}
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
                <button
                  onClick={enviarComandaAlBackend}
                  disabled={enviandoComanda || comandaSesion.length === 0}
                  className={`py-2.5 rounded-xl font-black text-2xs text-white uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 ${enviandoComanda || comandaSesion.length === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#6B8E23] hover:bg-[#5A781D]'}`}
                >
                  <Toast mensaje={toastMsg} visible={toastVisible} />
                  <IconoImpresora className="w-3.5 h-3.5" />
                  {enviandoComanda ? 'Enviando...' : 'Mandar Cocina'}
                </button>
                <button onClick={() => setMostrarModalPago(true)} className="py-2.5 bg-[#8B5A2B] text-white rounded-xl font-black text-2xs uppercase tracking-wider hover:bg-[#7A4F25] transition-colors">
                  Cerrar Cuenta
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* MODAL 1: APERTURA */}
      {mostrarModalApertura && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form onSubmit={handleAbrirMesa} className="bg-white rounded-3xl p-6 w-full max-w-sm space-y-4 text-xs font-bold text-gray-500 shadow-2xl">
            <h3 className="text-base font-black text-gray-800 border-b pb-1">Abrir Servicio: Mesa {numMesaSeleccionada}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-3xs uppercase tracking-wider text-gray-400">Comensales (máx. {capacidadMesaSeleccionada}):</label>
                <input type="number" required value={comensalesInput}
                onChange={e => setComensalesInput(e.target.value)} min="1" max={capacidadMesaSeleccionada}
                 className="w-full p-2.5 border rounded-xl font-medium text-gray-800 bg-gray-50 focus:outline-none" />
              </div>
              <div>
                <label className="block mb-1 text-3xs uppercase tracking-wider text-gray-400">Mesero Asignado:</label>
                <select value={meseroInput} onChange={e => setMeseroInput(e.target.value)} className="w-full p-2.5 border rounded-xl font-medium text-gray-800 bg-gray-50 cursor-pointer focus:outline-none">
                  {meseros.map((m, idx) => <option key={idx} value={m.nombre}>{m.nombre}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-2 border-t">
              <button type="button" onClick={() => setMostrarModalApertura(false)} className="w-1/3 py-2.5 border rounded-xl text-gray-400">Cancelar</button>
              <button type="submit" className="flex-1 py-2.5 bg-[#8B5A2B] text-white rounded-xl font-black uppercase shadow hover:bg-[#7A4F25] transition-colors">Abrir Servicio</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: PERSONALIZACION */}
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
                  Este producto no requiere modificadores de receta.
                </div>
              ) : (
                <>
                  {opcionesMesaConfig.modificadores.length > 0 && (
                    <div className="space-y-1">
                      <span className="flex items-center gap-1"><IconoGota /> Receta Base ({productoAEditar.categoria})</span>
                      <div className="grid grid-cols-3 gap-2">
                        {opcionesMesaConfig.modificadores.map(m => (
                          <button key={m.id} type="button" onClick={() => setProductoAEditar({...productoAEditar, modificadores: {base: m.nombre}})} className={`p-2 border rounded-xl text-center font-bold transition-all ${productoAEditar.modificadores?.base === m.nombre ? 'bg-gray-800 text-white border-gray-800 shadow-sm' : 'bg-white text-gray-600'}`}>
                            {m.nombre}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {opcionesMesaConfig.extras.length > 0 && (
                    <div className="space-y-1 pt-2">
                      <span className="flex items-center gap-1"><IconoMas /> Extras Permitidos</span>
                      <div className="grid grid-cols-1 gap-2">
                        {opcionesMesaConfig.extras.map(e => {
                          const sel = productoAEditar.extrasSeleccionados?.some(x => x.id === e.id);
                          return (
                            <button key={e.id} type="button" onClick={() => { const n = sel ? productoAEditar.extrasSeleccionados.filter(x => x.id !== e.id) : [...(productoAEditar.extrasSeleccionados || []), e]; setProductoAEditar({ ...productoAEditar, extrasSeleccionados: n }); }} className={`p-2.5 border rounded-xl flex justify-between font-bold transition-all ${sel ? 'bg-[#8B5A2B]/10 border-[#8B5A2B] text-[#8B5A2B]' : 'bg-white text-gray-600'}`}>
                              <span>{e.nombre}</span>
                              <span className="font-black">+${e.precio.toFixed(2)}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
              <div className="space-y-1 pt-2 border-t">
                <span>Anadir nota</span>
                <textarea rows="2" value={productoAEditar.notas || ''} onChange={e => setProductoAEditar({ ...productoAEditar, notas: e.target.value })} placeholder="Ej. Sin hielo, bien tostado..." className="w-full p-2 border rounded-xl bg-gray-50 font-medium normal-case text-gray-700 focus:outline-none text-xs" />
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t flex gap-2.5">
              <button type="button" onClick={() => setMostrarModalPersonalizar(false)} className="w-1/3 py-2.5 border border-gray-200 bg-white text-gray-500 font-bold rounded-xl text-2xs uppercase tracking-wider">Cancelar</button>
              <button onClick={guardarPersonalizacion} className="flex-1 py-2.5 bg-[#8B5A2B] text-white font-black rounded-xl text-2xs uppercase tracking-wider shadow">Aplicar a la Comanda</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: COBRO - fondo blanco, sin oscuros */}
      {mostrarModalPago && mesaSeleccionada && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-sm font-black text-gray-800">Cierre de Cuenta - Mesa {mesaSeleccionada.numero_mesa}</h3>
              <button onClick={() => setMostrarModalPago(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <IconoCerrar />
              </button>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-5 gap-5 text-2xs font-extrabold uppercase text-gray-400">
              <div className="md:col-span-3 space-y-3">
                <span>Metodo de Pago Seleccionado</span>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setMetodoPago('Efectivo')} className={`p-3 border rounded-xl font-black flex items-center justify-center gap-2 ${metodoPago === 'Efectivo' ? 'bg-[#8B5A2B]/10 border-[#8B5A2B] text-[#8B5A2B]' : 'bg-white text-gray-500'}`}>
                    <IconoBillete /> Efectivo
                  </button>
                  <button onClick={() => setMetodoPago('Tarjeta')} className={`p-3 border rounded-xl font-black flex items-center justify-center gap-2 ${metodoPago === 'Tarjeta' ? 'bg-[#8B5A2B]/10 border-[#8B5A2B] text-[#8B5A2B]' : 'bg-white text-gray-500'}`}>
                    <IconoTarjeta /> Tarjeta
                  </button>
                </div>
                {metodoPago === 'Efectivo' && (
                  <div className="space-y-1">
                    <span>Efectivo Recibido en Caja ($)</span>
                    <input type="number" value={efectivoRecibido} onChange={e => setEfectivoRecibido(noNeg(e.target.value, efectivoRecibido))} placeholder="$ 0.00" className="w-full p-2.5 border rounded-xl font-mono text-gray-800 text-sm focus:outline-none" />
                    {efectivoRecibido && parseFloat(efectivoRecibido) >= (mesaSeleccionada.subtotal + parseFloat(propina || 0)) && (
                      <div className="bg-emerald-50 text-emerald-700 p-2 rounded-lg text-3xs font-bold border border-emerald-200 mt-1">
                        Cambio a entregar: ${(parseFloat(efectivoRecibido) - (mesaSeleccionada.subtotal + parseFloat(propina || 0))).toFixed(2)} MXN
                      </div>
                    )}
                  </div>
                )}
                <div className="space-y-1">
                  <span>Anadir Propina ($)</span>
                  <input type="number" value={propina} onChange={e => setPropina(noNeg(e.target.value, propina))} placeholder="Opcional" className="w-full p-2.5 border rounded-xl text-gray-800 text-xs focus:outline-none" />
                </div>
              </div>
              {/* RESUMEN - fondo claro */}
              <div className="md:col-span-2 bg-gray-50 border border-gray-200 p-4 rounded-xl flex flex-col justify-between">
                <div className="space-y-2 text-3xs font-medium text-gray-500">
                  <span className="border-b border-gray-200 pb-1 block font-black text-gray-700">Resumen Mesa {mesaSeleccionada.numero_mesa}</span>
                  <div className="flex justify-between"><span>Consumo Base:</span><span className="text-gray-800 font-black">${mesaSeleccionada.subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Propina:</span><span className="text-gray-800 font-black">${parseFloat(propina || 0).toFixed(2)}</span></div>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <span className="text-3xs text-gray-500 block font-bold">Total General</span>
                  <div className="flex justify-between items-baseline text-[#8B5A2B] font-black">
                    <span className="text-3xs">MXN</span>
                    <span className="text-xl font-mono">${(mesaSeleccionada.subtotal + parseFloat(propina || 0)).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t">
              <button
                onClick={liquidarCuentaMesa}
                disabled={cerrandoCuenta || (metodoPago === 'Efectivo' && (!efectivoRecibido || parseFloat(efectivoRecibido) < (mesaSeleccionada.subtotal + parseFloat(propina || 0))))}
                className="w-full py-3 bg-[#8B5A2B] hover:bg-[#7A4F25] text-white font-black rounded-xl text-xs uppercase tracking-wider disabled:bg-gray-200 disabled:text-gray-400 transition-colors flex items-center justify-center gap-2"
              >
                <IconoImpresora />
                {cerrandoCuenta ? 'Procesando...' : 'Pagar y Cerrar Cuenta'}
              </button>
            </div>
          </div>
        </div>
      )}
      <DialogoUI />
    </div>
  );
}
