import React, { useState, useEffect } from 'react';
import IAPredictiva from './IAPredictiva'; // Importamos tu archivo de IA creado con éxito

export default function Administracion() {
  const [gastos, setGastos] = useState([]);
  const [corte, setCorte] = useState({ total_ventas: 0, total_gastos: 0, balance_neto: 0 });
  const [fechaFiltro, setFechaFiltro] = useState(new Date().toISOString().split('T')[0]);
  const [seccionActiva, setSeccionActiva] = useState('Finanzas'); // 'Finanzas' o 'IA'
  
  // Formulario de Gastos
  const [concepto, setConcepto] = useState('');
  const [montoGasto, setMontoGasto] = useState('');

  const cargarDatosAdministrativos = () => {
    fetch('http://127.0.0.1:5000/api/administracion/gastos')
      .then(res => res.json())
      .then(data => setGastos(data))
      .catch(err => console.error("Error cargando gastos:", err));

    fetch(`http://127.0.0.1:5000/api/administracion/corte-diario?fecha=${fechaFiltro}`)
      .then(res => res.json())
      .then(data => setCorte(data))
      .catch(err => console.error("Error recalculando corte:", err));
  };

  useEffect(() => {
    if (seccionActiva === 'Finanzas') {
      cargarDatosAdministrativos();
    }
  }, [fechaFiltro, seccionActiva]);

  const registrarGastoManual = (e) => {
    e.preventDefault();
    if (!concepto || !montoGasto) return;

    fetch('http://127.0.0.1:5000/api/administracion/gastos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ concepto: concepto, monto: parseFloat(montoGasto) })
    })
    .then(() => {
      alert(" Gasto operativo registrado de forma exitosa en SQLite.");
      setConcepto('');
      setMontoGasto('');
      cargarDatosAdministrativos();
    });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen text-xs font-bold text-gray-500 space-y-5">
      
      {/* BARRA SUPERIOR DE CONMUTACIÓN DE MÓDULOS GERENCIALES */}
      <div className="bg-white p-4 rounded-xl border flex justify-between items-center shadow-2xs">
        <div>
          <h2 className="text-xl font-black text-gray-800"> Panel de Control Gerencial y Analítico</h2>
          <p className="text-3xs text-gray-400 font-medium uppercase">Auditoría financiera y algoritmos predictivos del establecimiento</p>
        </div>
        
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl border">
          <button 
            onClick={() => setSeccionActiva('Finanzas')} 
            className={`px-4 py-2 rounded-lg text-3xs font-black uppercase transition-all ${seccionActiva === 'Finanzas' ? 'bg-[#8B5A2B] text-white shadow-sm' : 'bg-white text-gray-500'}`}
          >
            Flujo de Caja y Gastos
          </button>
          <button 
            onClick={() => setSeccionActiva('IA')} 
            className={`px-4 py-2 rounded-lg text-3xs font-black uppercase transition-all ${seccionActiva === 'IA' ? 'bg-purple-700 text-white shadow-sm' : 'bg-white text-gray-500'}`}
          >
             Reporte  IA
          </button>
        </div>
      </div>

      {/* VISTA CONTABLE DE FINANZAS */}
      {seccionActiva === 'Finanzas' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-end items-center gap-2">
            <span className="text-3xs uppercase text-gray-400">Seleccionar Fecha de Arqueo:</span>
            <input type="date" value={fechaFiltro} onChange={(e) => setFechaFiltro(e.target.value)} className="p-2 border rounded-xl bg-white font-bold text-gray-700 focus:outline-none cursor-pointer" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border rounded-2xl p-5 shadow-2xs flex flex-col justify-between h-28">
              <span className="text-3xs text-emerald-600 uppercase font-black">Ingresos por Ventas</span>
              <span className="text-2xl font-black font-mono text-gray-800">${corte.total_ventas.toFixed(2)}</span>
              <p className="text-3xs text-gray-400 normal-case">Ventas acumuladas del día</p>
            </div>
            <div className="bg-white border rounded-2xl p-5 shadow-2xs flex flex-col justify-between h-28">
              <span className="text-3xs text-red-500 uppercase font-black"> Egresos por Gastos Operativos</span>
              <span className="text-2xl font-black font-mono text-gray-800">${corte.total_gastos.toFixed(2)}</span>
              <p className="text-3xs text-gray-400 normal-case">Salidas registradas</p>
            </div>
            <div className={`border rounded-2xl p-5 shadow-2xs flex flex-col justify-between h-28 ${corte.balance_neto >= 0 ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800' : 'bg-red-50/50 border-red-200 text-red-800'}`}>
              <span className="text-3xs uppercase font-black"> Balance Neto de Caja</span>
              <span className="text-2xl font-black font-mono">${corte.balance_neto.toFixed(2)}</span>
              <p className="text-3xs opacity-60 normal-case">Efectivo físico disponible teórico</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <form onSubmit={registrarGastoManual} className="bg-white border rounded-2xl p-5 shadow-2xs h-fit space-y-4">
              <div className="border-b pb-2">
                <h3 className="text-sm font-black text-gray-800 uppercase">Registrar Salida de Efectivo</h3>
                <p className="text-3xs text-gray-400">Afecta el arqueo del día seleccionado</p>
              </div>
              <div className="space-y-1">
                <label className="text-3xs text-gray-400 uppercase">Concepto de Gasto</label>
                <input type="text" value={concepto} onChange={e => setConcepto(e.target.value)} placeholder="Ej. Compra de insumos urgentes" className="w-full p-2.5 border rounded-xl bg-gray-50 text-gray-800 font-medium focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-3xs text-gray-400 uppercase">Monto ($)</label>
                <input type="number" step="0.01" value={montoGasto} onChange={e => setMontoGasto(e.target.value)} placeholder="0.00" className="w-full p-2.5 border rounded-xl bg-gray-50 text-gray-800 font-mono focus:outline-none" />
              </div>
              <button type="submit" className="w-full py-3 bg-gray-800 hover:bg-gray-900 text-white font-black rounded-xl uppercase tracking-wider shadow transition-colors">📉 Registrar Egreso</button>
            </form>

            <div className="lg:col-span-2 bg-white border rounded-2xl p-5 shadow-2xs space-y-3">
              <span className="block text-3xs font-black text-gray-400 uppercase tracking-wider border-b pb-2">Historial de Salidas Generales:</span>
              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                {gastos.length === 0 ? (
                  <p className="text-center text-gray-400 py-6 font-medium">No se registran egresos de caja en el historial.</p>
                ) : (
                  gastos.map(g => (
                    <div key={g.id_gasto} className="p-3 bg-gray-50 border rounded-xl flex justify-between items-center shadow-3xs">
                      <div>
                        <h4 className="font-black text-gray-700 text-xs">{g.concepto}</h4>
                        <p className="text-3xs text-gray-400 font-mono mt-0.5">{g.fecha}</p>
                      </div>
                      <span className="font-mono text-red-600 font-black text-sm">-${parseFloat(g.monto).toFixed(2)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VISTA VINCULADA CON TU COMPONENTE DE IA REAL */}
      {seccionActiva === 'IA' && (
        <div className="animate-fade-in">
          <IAPredictiva />
        </div>
      )}

    </div>
  );
}