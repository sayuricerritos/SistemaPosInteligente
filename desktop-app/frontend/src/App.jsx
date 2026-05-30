import React, { useState, useEffect } from 'react'
import Llevar from './Llevar'
import Mesas from './Mesas'
import Menu from './Menu'
import Inventario from './Inventario'
import Usuarios from './Usuarios'
import Administracion from './Administracion'
import Configuracion from './Configuracion'
import Pedidos from './Pedidos'

function App() {
  const [vistaActual, setVistaActual] = useState('INICIO')
  const [alertasIA, setAlertasIA] = useState([])

  // Carga automática de las alertas de inventario y IA real
  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/ia/alertas-dashboard')
      .then(res => res.json())
      .then(data => setAlertasIA(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error al conectar alertas de IA:", err))
  }, [])

const [metricasHoy, setMetricasHoy] = useState({
  monto_ventas: 0,
  tickets_emitidos: 0,
  ticket_promedio: 0
});
const [balanceHoy, setBalanceHoy] = useState({
  total_ventas: 0,
  total_gastos: 0,
  balance_neto: 0
});

// Función para solicitar el corte de caja real a Flask
const cargarBalanceReal = () => {
  fetch('http://127.0.0.1:5000/api/administracion/corte-diario')
    .then(res => res.json())
    .then(data => {
      // Si el backend responde correctamente, guardamos los datos
      if (!data.error) {
        setBalanceHoy(data);
      }
    })
    .catch(err => console.error("Error al traer balance de caja:", err));
};

// Asegúrate de llamarlo dentro de tu useEffect que ya existe para que cargue al iniciar
useEffect(() => {
  cargarBalanceReal();
  
  // Refrescar automáticamente cada 30 segundos junto con las otras métricas
  const intervalo = setInterval(cargarBalanceReal, 30000);
  return () => clearInterval(intervalo);
}, []);

// Función para pedirle los datos reales a Flask
const cargarMetricasReales = () => {
  fetch('http://127.0.0.1:5000/api/administracion/resumen-hoy')
    .then(res => res.json())
    .then(data => setMetricasHoy(data))
    .catch(err => console.error("Error al traer métricas vivas:", err));
};

// Cargar al montar el componente
useEffect(() => {
  cargarMetricasReales();
  
  // Opcional: Refrescar de forma automática cada 30 segundos por si cae un pedido web
  const intervalo = setInterval(cargarMetricasReales, 30000);
  return () => clearInterval(intervalo);
}, []);  
  
  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-800 antialiased font-sans">
      
      {/* BARRA LATERAL ULTRA COMPACTA (DISEÑO TÁCTIL INDUSTRIAL) */}
      <aside className="w-20 bg-[#2D2A26] flex flex-col justify-between items-center py-6 border-r border-black/10 shadow-lg flex-shrink-0">
        
        {/* LOGO SUPERIOR COMPACTO */}
        <div className="w-12 h-12 rounded-xl bg-[#8B5A2B] flex items-center justify-center shadow-md border border-white/10 mb-6">
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
            <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
            <line x1="6" y1="2" x2="6" y2="4" />
            <line x1="10" y1="2" x2="10" y2="4" />
            <line x1="14" y1="2" x2="14" y2="4" />
          </svg>
        </div>

        {/* MENÚ DE ICONOS VERTICALES */}
        <nav className="flex-1 w-full px-2 space-y-3 flex flex-col items-center overflow-y-auto">
          
          {/* INICIO */}
          <button 
            onClick={() => setVistaActual('INICIO')}
            title="Inicio"
            className={`w-14 h-14 flex flex-col items-center justify-center rounded-xl transition-all active:scale-95 group ${
              vistaActual === 'INICIO' ? 'bg-[#8B5A2B] text-white shadow-md' : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            
          </button>

          {/* MESAS */}
          <button 
            onClick={() => setVistaActual('MESAS')}
            title="Mesas"
            className={`w-14 h-14 flex flex-col items-center justify-center rounded-xl transition-all active:scale-95 group ${
              vistaActual === 'MESAS' ? 'bg-[#8B5A2B] text-white shadow-md' : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12h16" />
              <path d="M4 12v8" />
              <path d="M20 12v8" />
              <path d="M7 12V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v6" />
            </svg>
            
          </button>

          {/* LLEVAR */}
          <button 
            onClick={() => setVistaActual('LLEVAR')}
            title="Llevar"
            className={`w-14 h-14 flex flex-col items-center justify-center rounded-xl transition-all active:scale-95 group ${
              vistaActual === 'LLEVAR' ? 'bg-[#8B5A2B] text-white shadow-md' : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            
          </button>

          {/* PEDIDOS */}
          <button 
            onClick={() => setVistaActual('PEDIDOS')}
            title="Pedidos"
            className={`w-14 h-14 flex flex-col items-center justify-center rounded-xl transition-all active:scale-95 group ${
              vistaActual === 'PEDIDOS' ? 'bg-[#8B5A2B] text-white shadow-md' : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              <line x1="9" y1="12" x2="15" y2="12" />
              <line x1="9" y1="16" x2="15" y2="16" />
            </svg>
            
          </button>

          <div className="w-8 border-t border-white/10 my-2" />

          {/* MENÚ */}
          <button 
            onClick={() => setVistaActual('MENU')}
            title="Menú"
            className={`w-14 h-14 flex flex-col items-center justify-center rounded-xl transition-all active:scale-95 group ${
              vistaActual === 'MENU' ? 'bg-[#8B5A2B] text-white shadow-md' : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            
          </button>

          {/* INVENTARIO */}
          <button 
            onClick={() => setVistaActual('INVENTARIO')}
            title="Inventario"
            className={`w-14 h-14 flex flex-col items-center justify-center rounded-xl transition-all active:scale-95 group ${
              vistaActual === 'INVENTARIO' ? 'bg-[#8B5A2B] text-white shadow-md' : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
              <line x1="15" y1="3" x2="15" y2="21" />
              <line x1="3" y1="9" x2="21" y2="9" />
            </svg>
            
          </button>

          {/* USUARIOS */}
          <button 
            onClick={() => setVistaActual('USUARIOS')}
            title="Usuarios"
            className={`w-14 h-14 flex flex-col items-center justify-center rounded-xl transition-all active:scale-95 group ${
              vistaActual === 'USUARIOS' ? 'bg-[#8B5A2B] text-white shadow-md' : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
            
          </button>

          {/* ADMINISTRACIÓN */}
          <button 
            onClick={() => setVistaActual('ADMINISTRACION')}
            title="Administración"
            className={`w-14 h-14 flex flex-col items-center justify-center rounded-xl transition-all active:scale-95 group ${
              vistaActual === 'ADMINISTRACION' ? 'bg-[#8B5A2B] text-white shadow-md' : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            
          </button>

          {/* CONFIGURACIÓN */}
          <button 
            onClick={() => setVistaActual('CONFIGURACION')}
            title="Configuración"
            className={`w-14 h-14 flex flex-col items-center justify-center rounded-xl transition-all active:scale-95 group ${
              vistaActual === 'CONFIGURACION' ? 'bg-[#8B5A2B] text-white shadow-md' : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            
          </button>

        </nav>

        {/* INDICADOR DE COMPILACIÓN INFERIOR MINIMALISTA */}
        <div className="text-[9px] font-black text-white/30 tracking-tight uppercase select-none">
          v1.2
        </div>
      </aside>

      {/* PANEL CENTRAL DINÁMICO */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#F3F4F6]">
        
        {/* BARRA SUPERIOR (Navbar) */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 font-medium">Sección:</span>
            <span className="text-gray-800 font-bold uppercase tracking-wider text-sm bg-gray-100 px-2.5 py-1 rounded-md">
              {vistaActual}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative p-2 bg-gray-50 rounded-full hover:bg-gray-100 cursor-pointer transition-colors">
               <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
            </div>
            <div className="h-8 w-px bg-gray-200"></div>
            <span className="text-sm font-semibold text-gray-700 bg-emerald-50 py-1 px-3 rounded-full border border-emerald-100">
               (Admin)
            </span>
          </div>
        </header>

        {/* CONTENIDO DE LA VISTA CENTRAL - SISTEMA MODULAR */}
        <section className="flex-1 p-8 overflow-y-auto">
          {vistaActual === 'INICIO' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs">
                <h2 className="text-xl font-black text-slate-800 tracking-tight">INICIO </h2>
                <span className="text-3xs font-extrabold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md uppercase tracking-wider"> </span>
              </div>
              
              {/* ACCESOS RÁPIDOS SUPERIORES */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                
                {/* BOTÓN MESAS */}
                <button 
                  onClick={() => setVistaActual('MESAS')} 
                  className="bg-[#8B5A2B] text-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-98 text-center flex flex-col items-center justify-center gap-3 h-36 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 12h16" />
                      <path d="M4 12v8" />
                      <path d="M20 12v8" />
                      <path d="M7 12V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v6" />
                    </svg>
                  </div>
                  <span className="tracking-wider uppercase text-xs font-black">MESAS</span>
                </button>

                {/* BOTÓN LLEVAR */}
                <button 
                  onClick={() => setVistaActual('LLEVAR')} 
                  className="bg-[#6B8E23] text-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-98 text-center flex flex-col items-center justify-center gap-3 h-36 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <path d="M16 10a4 4 0 0 1-8 0" />
                    </svg>
                  </div>
                  <span className="tracking-wider uppercase text-xs font-black">LLEVAR</span>
                </button>

                {/* BOTÓN PEDIDOS */}
                <button 
                  onClick={() => setVistaActual('PEDIDOS')} 
                  className="bg-[#CD853F] text-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-98 text-center flex flex-col items-center justify-center gap-3 h-36 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                      <line x1="9" y1="12" x2="15" y2="12" />
                      <line x1="9" y1="16" x2="15" y2="16" />
                    </svg>
                  </div>
                  <span className="tracking-wider uppercase text-xs font-black">PEDIDOS</span>
                </button>
              </div>

              {/* CAJA Y RESUMEN FINANCIERO */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-2xs border border-gray-200/80 flex flex-col justify-between h-48">
                  <div>
                    <h3 className="text-3xs font-black text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full block ${balanceHoy.balance_neto >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></span> 
                      Balance de Caja
                    </h3>
                    
                    <span className={`font-mono font-black text-xl tracking-tight ${balanceHoy.balance_neto >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      ${balanceHoy.balance_neto.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 border-t pt-3 mt-2">
                    <button onClick={() => setVistaActual('ADMINISTRACION')} className="bg-gray-100 hover:bg-gray-200 text-slate-600 py-2 rounded-xl text-3xs font-black uppercase tracking-wider text-center transition-colors">Ver Caja</button>
                    <button onClick={() => setVistaActual('ADMINISTRACION')} className="bg-slate-800 hover:bg-slate-900 text-white py-2 rounded-xl text-3xs font-black uppercase tracking-wider text-center transition-colors">Añadir Gasto</button>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-2xs border border-gray-200/80 flex flex-col justify-between h-48">
                  <div>
                    <h3 className="text-3xs font-black text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500 block"></span> Resumen del Día
                    </h3>
                    <div className="space-y-2 text-xs font-bold">
  <div className="flex justify-between border-b border-gray-50 pb-1.5">
    <span className="text-slate-500">Monto Ventas:</span>
    <span className="font-mono text-slate-800 font-black text-sm">
      ${metricasHoy.monto_ventas.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
    </span>
  </div>
  
  <div className="flex justify-between border-b border-gray-50 pb-1.5">
    <span className="text-slate-500">Tickets Emitidos:</span>
    <span className="font-mono text-slate-800 font-black text-sm">
      {metricasHoy.tickets_emitidos}
    </span>
  </div>
  
  <div className="flex justify-between pt-0.5">
    <span className="text-slate-500">Ticket Promedio:</span>
    <span className="font-mono text-slate-800 font-black text-sm">
      ${metricasHoy.ticket_promedio.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
    </span>
  </div>
</div>
                  </div>
                </div>
              </div>
              
              {/* SECCIÓN INFERIOR: ALERTAS CRÍTICAS DE INVENTARIO CONECTADAS A IA REAL */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
                <h3 className="text-3xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-600 block"></span> Alertas del Sistema & Stock Predictivo 
                </h3>
                
                <div className="space-y-2">
                  {alertasIA.length === 0 ? (
                    <div className="bg-gray-50 border border-gray-200 text-gray-500 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-3">
                      <span>🔄</span>
                      <p className="font-medium">Sincronizando analíticas ...</p>
                    </div>
                  ) : (
                    alertasIA.map((alerta, idx) => (
                      <div 
                        key={idx} 
                        className={`border px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-3 shadow-3xs transition-all ${
                          alerta.tipo === 'IA_PREDICCION' 
                            ? 'bg-purple-50 border-purple-200 text-purple-900' 
                            : alerta.tipo === 'STOCK_CRITICO'
                            ? 'bg-amber-50 border-amber-200 text-amber-800'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        }`}
                      >
                        <span className="text-base">
                          {alerta.tipo === 'IA_PREDICCION' ? '🤖' : alerta.tipo === 'STOCK_CRITICO' ? '⚠️' : '✨'}
                        </span>
                        <div>
                          <p className={`font-black ${
                            alerta.tipo === 'IA_PREDICCION' ? 'text-purple-950' : alerta.tipo === 'STOCK_CRITICO' ? 'text-amber-900' : 'text-emerald-950'
                          }`}>
                            {alerta.tipo === 'IA_PREDICCION' ? 'Análisis de Demanda Estimada' : alerta.tipo === 'STOCK_CRITICO' ? 'Alerta de Almacén Físico' : 'Estatus Operativo'}
                          </p>
                          <p className="text-3xs opacity-85 font-medium mt-0.5 normal-case leading-relaxed">{alerta.mensaje}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* RENDERIZADO EXCLUSIVO DE COMPONENTES DE OTRAS PESTAÑAS */}
          {vistaActual === 'LLEVAR' && <Llevar />}
          {vistaActual === 'MESAS' && <Mesas />}
          {vistaActual === 'MENU' && <Menu />}
          {vistaActual === 'INVENTARIO' && <Inventario />}
          {vistaActual === 'USUARIOS' && <Usuarios />}
          {vistaActual === 'ADMINISTRACION' && <Administracion />}
          {vistaActual === 'CONFIGURACION' && <Configuracion />}
          {vistaActual === 'PEDIDOS' && <Pedidos />}

          {/* MENSAJE ÚNICO PARA PANTALLAS EN DESARROLLO */}
          {vistaActual !== 'INICIO' && 
           vistaActual !== 'LLEVAR' && 
           vistaActual !== 'MESAS' && 
           vistaActual !== 'MENU' && 
           vistaActual !== 'INVENTARIO' && 
           vistaActual !== 'USUARIOS' && 
           vistaActual !== 'ADMINISTRACION' && 
           vistaActual !== 'CONFIGURACION' && 
           vistaActual !== 'PEDIDOS' && (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center text-gray-400 py-12">
              <span className="text-4xl mb-2 block">🛠️</span>
              La sección <span className="font-bold text-gray-700">{vistaActual}</span> está lista para ser conectada a los módulos de la base de datos local.
            </div>
          )}
        </section>
      </main>

    </div>
  )
}

export default App