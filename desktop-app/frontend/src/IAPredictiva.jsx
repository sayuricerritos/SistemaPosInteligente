import React, { useState, useEffect } from 'react';
const IconoRecarga = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
)
const IconoCPU = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <rect x="9" y="9" width="6" height="6" />
    <line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" />
    <line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" />
    <line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="14" x2="23" y2="14" />
    <line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="14" x2="4" y2="14" />
  </svg>
)

export default function IAPredictiva() {
  const [reporteIA, setReporteIA] = useState(null);
  const [cargando, setCargando]   = useState(true);

  const consultarMotorPredictivo = () => {
    setCargando(true);
    fetch('http://127.0.0.1:5000/api/ia/prediccion-demanda')
      .then(res => res.json())
      .then(data => { setReporteIA(data); setCargando(false); })
      .catch(err => { console.error("Error al conectar con la IA:", err); setCargando(false); });
  };

  useEffect(() => { consultarMotorPredictivo(); }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen text-xs font-bold text-gray-500 space-y-6">

      {/* HEADER */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 flex justify-between items-center shadow-2xs">
        <div>
          <h2 className="text-xl font-black text-gray-800">Motor Predictivo de Demanda</h2>
          <p className="text-3xs text-gray-400 font-medium uppercase tracking-wider mt-0.5">Modulo de Machine Learning integrado bajo lineamientos de analitica predictiva</p>
        </div>
        <button
          onClick={consultarMotorPredictivo}
          className="bg-purple-700 hover:bg-purple-800 text-white font-black text-3xs uppercase px-4 py-2.5 rounded-xl shadow transition-colors active:scale-95 flex items-center gap-2"
        >
          <IconoRecarga />
          Recargar
        </button>
      </div>

      {cargando ? (
        <div className="text-center py-20 font-black uppercase text-purple-600 tracking-widest animate-pulse">
          Calculando prediccion...
        </div>
      ) : (
        reporteIA && (
          <div className="space-y-6 animate-fade-in">

            {/* KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white border border-purple-100 rounded-2xl p-5 flex flex-col justify-between h-32 shadow-3xs">
                <span className="text-3xs text-purple-700 uppercase font-black">Algoritmo de Computo</span>
                <span className="text-xs font-black text-gray-800 mt-2">{reporteIA.algoritmo}</span>
                <span className="inline-block bg-purple-50 text-purple-700 text-[9px] px-2 py-0.5 rounded border border-purple-100 w-fit mt-1">SciKit-Learn Core</span>
              </div>

              <div className="bg-white border border-purple-100 rounded-2xl p-5 flex flex-col justify-between h-32 shadow-3xs md:col-span-2">
                <span className="text-3xs text-purple-700 uppercase font-black">Estatus de Datos en Base de Datos</span>
                <p className="text-xs font-black text-gray-700 mt-1 leading-relaxed normal-case">{reporteIA.origen_datos}</p>
                <span className="text-3xs text-gray-400 font-mono">Lectura dinamica sobre tabla Pedidos</span>
              </div>

              <div className="bg-white border border-purple-100 rounded-2xl p-5 flex flex-col justify-between h-32 shadow-3xs">
                <span className="text-3xs text-purple-700 uppercase font-black">Coeficiente de Precision R2</span>
                <span className="text-2xl font-black font-mono text-purple-700">{reporteIA.fiabilidad_entrenamiento}</span>
                <p className="text-3xs text-gray-400 normal-case">Tasa de ajuste del entrenamiento matematico</p>
              </div>
            </div>

            {/* PANEL PRINCIPAL DE PREDICCION - fondo blanco, sin oscuros */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2">
                <span className="text-purple-700 text-3xs font-black uppercase tracking-widest bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-md inline-block">
                  Inferencia Inteligente para el dia de Hoy
                </span>
                <h3 className="text-xl font-black text-gray-800">Calculo de Provision Operativa Real</h3>
                <p className="text-gray-500 text-xs font-medium normal-case max-w-xl leading-relaxed">
                  Analizando el comportamiento historico del dia de la semana (
                  <span className="text-purple-700 font-black">{reporteIA.dia_semana_texto}</span>
                  ), el modelo predictivo ha calculado la siguiente cuota de produccion estimada para evitar el desabasto de inventario.
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 p-5 rounded-2xl text-center w-full md:w-56 flex flex-col justify-center flex-shrink-0">
                <span className="text-3xs text-gray-500 uppercase tracking-wider block">Articulos a Vender Hoy:</span>
                <span className="text-4xl font-black font-mono text-[#8B5A2B] block my-1">{reporteIA.cantidad_predicha_hoy}</span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-black uppercase tracking-wide">
                  Unidades Sugeridas
                </span>
              </div>
            </div>

            {/* ANALISIS DE TENDENCIA */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-3xs space-y-2">
              <h4 className="text-gray-800 font-black text-xs uppercase tracking-wide flex items-center gap-2">
                <IconoCPU />
                Reporte Cientifico para el Administrador
              </h4>
              <p className="text-xs text-gray-600 font-medium normal-case leading-relaxed">
                El coeficiente de tendencia del algoritmo se situa en{' '}
                <span className="font-mono font-bold text-purple-700">{reporteIA.coeficiente_tendencia}</span>. Esto significa que por cada ciclo semanal, la demanda total de la cafeteria experimenta un comportamiento{' '}
                {reporteIA.coeficiente_tendencia >= 0 ? 'de crecimiento lineal positivo' : 'de ajuste estacional regular'}. Se aconseja al administrador revisar que las compras de materias primas en almacen se alineen con este margen para maximizar los rendimientos financieros.
              </p>
            </div>
          </div>
        )
      )}
    </div>
  );
}
