import React, { useState, useEffect } from 'react'
import Llevar        from './Llevar'
import Mesas         from './Mesas'
import Menu          from './Menu'
import Inventario    from './Inventario'
import Usuarios      from './Usuarios'
import Administracion from './Administracion'
import Configuracion from './Configuracion'
import Pedidos       from './Pedidos'

// ============================================================
// ICONOS SVG INTERNOS (sidebar + alertas)
// ============================================================
const IcoHome  = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
const IcoMesas = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h16" /><path d="M4 12v8" /><path d="M20 12v8" /><path d="M7 12V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v6" /></svg>
const IcoLlevar = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
const IcoPedidos = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" /><line x1="9" y1="12" x2="15" y2="12" /><line x1="9" y1="16" x2="15" y2="16" /></svg>
const IcoMenu  = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
const IcoInv   = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" /><line x1="3" y1="9" x2="21" y2="9" /></svg>
const IcoUsers = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
const IcoAdmin = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
const IcoConf  = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
const IcoSalir = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
const IcoIA    = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" /><line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" /><line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" /><line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="14" x2="23" y2="14" /><line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="14" x2="4" y2="14" /></svg>
const IcoAlerta = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
const IcoCheck  = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
const IcoSync   = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
const IcoHerr   = () => <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
const IcoCafe   = () => <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 8h1a4 4 0 0 1 0 8h-1" /><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" /><line x1="6" y1="2" x2="6" y2="4" /><line x1="10" y1="2" x2="10" y2="4" /><line x1="14" y1="2" x2="14" y2="4" /></svg>

// ============================================================
// PANTALLA DE LOGIN
// ============================================================
function LoginScreen({ onLogin }) {
  const [nombre,   setNombre]   = useState('')
  const [clave,    setClave]    = useState('')
  const [error,    setError]    = useState('')
  const [cargando, setCargando] = useState(false)
 
  const handleSubmit = (e) => {
    e.preventDefault()
    setCargando(true)
    setError('')
    fetch('http://127.0.0.1:5000/api/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ usuario: nombre, contrasena: clave }),
    })
    .then(res => {
      // Validacion defensiva antes de parsear JSON
      if (!res.ok) {
        return res.json().catch(() => { throw new Error(`Error del servidor: ${res.status}`) })
          .then(d => { throw new Error(d.error || `Error ${res.status}`) })
      }
      return res.json()
    })
    .then(data => {
      setCargando(false)
      if (data.status === 'Authenticated') {
        onLogin(data)
      } else {
        setError(data.error || 'Credenciales incorrectas.')
      }
    })
    .catch(err => {
      setCargando(false)
      setError(err.message || 'No se pudo conectar con el servidor.')
    })
  }
 
  // Icono de la cafeteria
  const IcoCafe = () => (
    <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
      <line x1="6" y1="2" x2="6" y2="4" />
      <line x1="10" y1="2" x2="10" y2="4" />
      <line x1="14" y1="2" x2="14" y2="4" />
    </svg>
  )
 
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 w-full max-w-sm shadow-sm space-y-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-[#8B5A2B] flex items-center justify-center mx-auto">
            <IcoCafe />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-800">SmartPOS</h1>
            <p className="text-xs text-gray-400 font-medium">Sistema de Punto de Venta Local</p>
          </div>
        </div>
 
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-3xs text-gray-400 uppercase font-black block">Usuario</label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Nombre de acceso"
              className="w-full p-3 border rounded-xl bg-gray-50 text-gray-800 font-medium focus:outline-none focus:border-[#8B5A2B] text-xs"
              required
              autoFocus
              disabled={cargando}
            />
          </div>
          <div className="space-y-1">
            <label className="text-3xs text-gray-400 uppercase font-black block">Contrasena</label>
            <input
              type="password"
              value={clave}
              onChange={e => setClave(e.target.value)}
              placeholder="Contrasena de acceso"
              className="w-full p-3 border rounded-xl bg-gray-50 text-gray-800 font-medium focus:outline-none focus:border-[#8B5A2B] text-xs"
              required
              disabled={cargando}
            />
          </div>
 
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-bold">
              {error}
            </div>
          )}
 
          <button
            type="submit"
            disabled={cargando}
            className="w-full py-3 bg-[#8B5A2B] hover:bg-[#7A4F25] text-white font-black rounded-xl uppercase tracking-wider transition-colors disabled:bg-gray-200 disabled:text-gray-400 text-xs"
          >
            {cargando ? 'Verificando...' : 'Ingresar al Sistema'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ============================================================
// BOTON DE NAVEGACION DE LA BARRA LATERAL
// ============================================================
function NavBtn({ id, actual, onClick, title, children, disabled = false }) {
  if (disabled) return null
  return (
    <button
      onClick={() => onClick(id)}
      title={title}
      className={`w-14 h-14 flex items-center justify-center rounded-xl transition-all active:scale-95 ${
        actual === id ? 'bg-[#8B5A2B] text-white shadow-md' : 'text-gray-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

// ============================================================
// APP PRINCIPAL
// ============================================================
function App() {
  const [vistaActual, setVistaActual] = useState('INICIO')
  const [usuario,     setUsuario]     = useState(null)
  const [alertasIA,   setAlertasIA]   = useState([])
  const [metricasHoy, setMetricasHoy] = useState({ monto_ventas: 0, tickets_emitidos: 0, ticket_promedio: 0 })
  const [balanceHoy,  setBalanceHoy]  = useState({ total_ventas: 0, total_gastos: 0, balance_neto: 0 })

  const esAdmin = usuario?.permisos === 'Total' || usuario?.puesto === 'Administrador'

  const handleLogout = () => {
    setUsuario(null)
    setVistaActual('INICIO')
  }

  useEffect(() => {
    if (!usuario) return
    fetch('http://127.0.0.1:5000/api/ia/alertas-dashboard')
      .then(res => res.json())
      .then(data => setAlertasIA(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error alertas IA:", err))
  }, [usuario])

  const cargarBalanceReal = () => {
    fetch('http://127.0.0.1:5000/api/administracion/corte-diario')
      .then(res => res.json())
      .then(data => { if (!data.error) setBalanceHoy(data) })
      .catch(() => {})
  }
  const cargarMetricasReales = () => {
    fetch('http://127.0.0.1:5000/api/administracion/resumen-hoy')
      .then(res => res.json())
      .then(data => setMetricasHoy(data))
      .catch(() => {})
  }
  useEffect(() => {
    if (!usuario) return
    cargarBalanceReal()
    cargarMetricasReales()
    const t1 = setInterval(cargarBalanceReal,    30000)
    const t2 = setInterval(cargarMetricasReales, 30000)
    return () => { clearInterval(t1); clearInterval(t2) }
  }, [usuario])

  // Mostrar login si no hay sesion activa
  if (!usuario) return <LoginScreen onLogin={setUsuario} />

  const VISTAS_ADMIN = ['MENU', 'INVENTARIO', 'USUARIOS', 'ADMINISTRACION', 'CONFIGURACION']

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-800 antialiased font-sans">

      {/* BARRA LATERAL */}
      <aside className="w-20 bg-[#2D2A26] flex flex-col justify-between items-center py-6 border-r border-black/10 shadow-lg flex-shrink-0">
        <div className="w-12 h-12 rounded-xl bg-[#8B5A2B] flex items-center justify-center shadow-md border border-white/10 mb-6">
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 8h1a4 4 0 0 1 0 8h-1" /><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
            <line x1="6" y1="2" x2="6" y2="4" /><line x1="10" y1="2" x2="10" y2="4" /><line x1="14" y1="2" x2="14" y2="4" />
          </svg>
        </div>

        <nav className="flex-1 w-full px-2 space-y-3 flex flex-col items-center overflow-y-auto">
          <NavBtn id="INICIO"   actual={vistaActual} onClick={setVistaActual} title="Inicio"><IcoHome /></NavBtn>
          <NavBtn id="MESAS"    actual={vistaActual} onClick={setVistaActual} title="Mesas"><IcoMesas /></NavBtn>
          <NavBtn id="LLEVAR"   actual={vistaActual} onClick={setVistaActual} title="Para Llevar"><IcoLlevar /></NavBtn>
          <NavBtn id="PEDIDOS"  actual={vistaActual} onClick={setVistaActual} title="Monitor de Cocina"><IcoPedidos /></NavBtn>

          {/* Separador: tabs exclusivos de administrador */}
          {esAdmin && <div className="w-8 border-t border-white/10 my-2" />}

          <NavBtn id="MENU"          actual={vistaActual} onClick={setVistaActual} title="Menu y Catalogo" disabled={!esAdmin}><IcoMenu /></NavBtn>
          <NavBtn id="INVENTARIO"    actual={vistaActual} onClick={setVistaActual} title="Inventario" disabled={!esAdmin}><IcoInv /></NavBtn>
          <NavBtn id="USUARIOS"      actual={vistaActual} onClick={setVistaActual} title="Personal" disabled={!esAdmin}><IcoUsers /></NavBtn>
          <NavBtn id="ADMINISTRACION" actual={vistaActual} onClick={setVistaActual} title="Administracion" disabled={!esAdmin}><IcoAdmin /></NavBtn>
          <NavBtn id="CONFIGURACION" actual={vistaActual} onClick={setVistaActual} title="Configuracion" disabled={!esAdmin}><IcoConf /></NavBtn>
        </nav>

        <div className="text-[9px] font-black text-white/30 tracking-tight uppercase select-none">v1.2</div>
      </aside>

      {/* PANEL CENTRAL */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#F3F4F6]">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 font-medium text-sm">Seccion:</span>
            <span className="text-gray-800 font-bold uppercase tracking-wider text-sm bg-gray-100 px-2.5 py-1 rounded-md">
              {vistaActual}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs bg-gray-50 py-1.5 px-3 rounded-xl border border-gray-200 flex items-center gap-2">
              <span className="text-gray-400 font-medium">Nombre:</span>
              <span className="font-black text-gray-800">{usuario.nombre}</span>
              <span className="text-gray-300 select-none">|</span>
              <span className="text-gray-400 font-medium">Puesto:</span>
              <span className="font-black text-gray-800">{usuario.puesto}</span>
            </div>
            <button
              onClick={handleLogout}
              title="Cerrar sesion"
              className="flex items-center gap-1.5 text-3xs font-black text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-xl transition-colors"
            >
              <IcoSalir />
              Salir
            </button>
          </div>
        </header>

        <section className="flex-1 p-8 overflow-y-auto">

          {/* ACCESO DENEGADO para vistas admin sin permiso */}
          {VISTAS_ADMIN.includes(vistaActual) && !esAdmin ? (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 text-center text-red-500 flex flex-col items-center gap-3">
              <IcoAlerta />
              <p className="font-black text-sm">Acceso restringido</p>
              <p className="text-xs text-gray-400 font-medium">Esta seccion requiere permisos de Administrador.</p>
            </div>
          ) : (
            <>
              {/* ---- INICIO ---- */}
              {vistaActual === 'INICIO' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs">
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Panel Principal</h2>
                    <span className="text-3xs font-extrabold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md uppercase tracking-wider">Operacion Activa</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {[
                      { id: 'MESAS',   color: 'bg-[#8B5A2B]', icon: <IcoMesas />,   label: 'MESAS' },
                      { id: 'LLEVAR',  color: 'bg-[#6B8E23]', icon: <IcoLlevar />,  label: 'LLEVAR' },
                      { id: 'PEDIDOS', color: 'bg-[#CD853F]', icon: <IcoPedidos />, label: 'PEDIDOS' },
                    ].map(({ id, color, icon, label }) => (
                      <button
                        key={id}
                        onClick={() => setVistaActual(id)}
                        className={`${color} text-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-98 text-center flex flex-col items-center justify-center gap-3 h-36`}
                      >
                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">{icon}</div>
                        <span className="tracking-wider uppercase text-xs font-black">{label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-2xs border border-gray-200/80 flex flex-col justify-between h-48">
                      <div>
                        <h3 className="text-3xs font-black text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full block ${balanceHoy.balance_neto >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                          Balance de Caja
                        </h3>
                        <span className={`font-mono font-black text-xl ${balanceHoy.balance_neto >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          ${balanceHoy.balance_neto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      {esAdmin && (
                        <div className="grid grid-cols-2 gap-2 border-t pt-3 mt-2">
                          <button onClick={() => setVistaActual('ADMINISTRACION')} className="bg-gray-100 hover:bg-gray-200 text-slate-600 py-2 rounded-xl text-3xs font-black uppercase tracking-wider text-center transition-colors">Ver Caja</button>
                          <button onClick={() => setVistaActual('ADMINISTRACION')} className="bg-[#8B5A2B] hover:bg-[#7A4F25] text-white py-2 rounded-xl text-3xs font-black uppercase tracking-wider text-center transition-colors">Anadir Gasto</button>
                        </div>
                      )}
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-2xs border border-gray-200/80 flex flex-col justify-between h-48">
                      <div>
                        <h3 className="text-3xs font-black text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500 block"></span>Resumen del Dia
                        </h3>
                        <div className="space-y-2 text-xs font-bold">
                          {[
                            ['Monto Ventas', `$${metricasHoy.monto_ventas.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`],
                            ['Tickets Emitidos', metricasHoy.tickets_emitidos],
                            ['Ticket Promedio', `$${metricasHoy.ticket_promedio.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`],
                          ].map(([label, value]) => (
                            <div key={label} className="flex justify-between border-b border-gray-50 pb-1.5 last:border-0">
                              <span className="text-slate-500">{label}:</span>
                              <span className="font-mono text-slate-800 font-black text-sm">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ALERTAS DE IA */}
                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
                    <h3 className="text-3xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-600 block"></span>Alertas del Sistema y Stock Predictivo
                    </h3>
                    <div className="space-y-2">
                      {alertasIA.length === 0 ? (
                        <div className="bg-gray-50 border border-gray-200 text-gray-500 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-3">
                          <IcoSync /><p className="font-medium">Sincronizando analiticas...</p>
                        </div>
                      ) : (
                        alertasIA.map((alerta, idx) => {
                          const esIA  = alerta.tipo === 'IA_PREDICCION'
                          const esCri = alerta.tipo === 'STOCK_CRITICO'
                          return (
                            <div key={idx} className={`border px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-3 ${esIA ? 'bg-purple-50 border-purple-200 text-purple-900' : esCri ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                              <span className="flex-shrink-0">{esIA ? <IcoIA /> : esCri ? <IcoAlerta /> : <IcoCheck />}</span>
                              <div>
                                <p className={`font-black ${esIA ? 'text-purple-950' : esCri ? 'text-amber-900' : 'text-emerald-950'}`}>
                                  {esIA ? 'Analisis de Demanda Estimada' : esCri ? 'Alerta de Almacen Fisico' : 'Estatus Operativo'}
                                </p>
                                <p className="text-3xs opacity-85 font-medium mt-0.5 normal-case leading-relaxed">{alerta.mensaje}</p>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}

              {vistaActual === 'LLEVAR'          && <Llevar />}
              {vistaActual === 'MESAS'           && <Mesas />}
              {vistaActual === 'MENU'            && <Menu />}
              {vistaActual === 'INVENTARIO'      && <Inventario />}
              {vistaActual === 'USUARIOS'        && <Usuarios />}
              {vistaActual === 'ADMINISTRACION'  && <Administracion />}
              {vistaActual === 'CONFIGURACION'   && <Configuracion />}
              {vistaActual === 'PEDIDOS'         && <Pedidos />}

              {!['INICIO','LLEVAR','MESAS','MENU','INVENTARIO','USUARIOS','ADMINISTRACION','CONFIGURACION','PEDIDOS'].includes(vistaActual) && (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center text-gray-400 flex flex-col items-center gap-4">
                  <IcoHerr />
                  <p>La seccion <span className="font-bold text-gray-700">{vistaActual}</span> esta lista para conectarse.</p>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  )
}

export default App