import React, { useState, useEffect } from 'react';

export default function IAPredictiva() {
  const [reporteIA, setReporteIA] = useState(null);
  const [cargando, setCargando] = useState(true);

  const consultarMotorPredictivo = () => {
    setCargando(true);
    fetch('http://127.0.0.1:5000/api/ia/prediccion-demanda')
      .then(res => res.json())
      .then(data => {
        setReporteIA(data);
        setCargando(false);
      })
      .catch(err => {
        console.error("Error al conectar con la IA:", err);
        setCargando(false);
      });
  };

  useEffect(() => {
    consultarMotorPredictivo();
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen text-xs font-bold text-gray-500 space-y-6">
      
      {/* HEADER PRINCIPAL */}
      <div className="bg-white p-5 rounded-2xl border flex justify-between items-center shadow-2xs">
        <div>
          <h2 className="text-xl font-black text-gray-800"> Motor Predictivo de Demanda Avanzado</h2>
          <p className="text-3xs text-gray-400 font-medium uppercase tracking-wider mt-0.5">Módulo de Machine Learning Integrado bajo lineamientos de analítica predictiva</p>
        </div>
        <button 
          onClick={consultarMotorPredictivo}
          className="bg-purple-700 hover:bg-purple-800 text-white font-black text-3xs uppercase px-4 py-2.5 rounded-xl shadow transition-colors active:scale-95"
        >
           Recargar
        </button>
      </div>

      {cargando ? (
        <div className="text-center py-20 font-black uppercase text-purple-600 tracking-widest animate-pulse">
           cargando...
        </div>
      ) : (
        reporteIA && (
          <div className="space-y-6 animate-fade-in">
            
            {/* PANEL PRINCIPAL DE KPI INTELECTUAL */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              <div className="bg-white border-2 border-purple-100 rounded-2xl p-5 flex flex-col justify-between h-32 shadow-3xs">
                <span className="text-3xs text-purple-700 uppercase font-black"> Algoritmo de Cómputo</span>
                <span className="text-xs font-black text-gray-800 mt-2">{reporteIA.algoritmo}</span>
                <span className="inline-block bg-purple-50 text-purple-700 text-[9px] px-2 py-0.5 rounded border border-purple-100 w-fit mt-1">SciKit-Learn Core</span>
              </div>

              <div className="bg-white border-2 border-purple-100 rounded-2xl p-5 flex flex-col justify-between h-32 shadow-3xs md:col-span-2">
                <span className="text-3xs text-purple-700 uppercase font-black"> Estatus de Datos en Base de Datos</span>
                <p className="text-xs font-black text-gray-700 mt-1 leading-relaxed normal-case">{reporteIA.origen_datos}</p>
                <span className="text-3xs text-gray-400 font-mono">Lectura dinámica sobre tabla Pedidos</span>
              </div>

              <div className="bg-white border-2 border-purple-100 rounded-2xl p-5 flex flex-col justify-between h-32 shadow-3xs">
                <span className="text-3xs text-purple-700 uppercase font-black"> Coeficiente de Precisión R²</span>
                <span className="text-2xl font-black font-mono text-purple-700">{reporteIA.fiabilidad_entrenamiento}</span>
                <p className="text-3xs text-gray-400 normal-case">Tasa de ajuste del entrenamiento matemático</p>
              </div>

            </div>

            {/* SECCIÓN DEL ARQUEO PREDICTIVO PARA HOY */}
            <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2">
                <span className="text-purple-400 text-3xs font-black uppercase tracking-widest bg-purple-950/60 border border-purple-800 px-2.5 py-1 rounded-md">
                  Inferencia Inteligente para el día de Hoy
                </span>
                <h3 className="text-xl font-black text-slate-100">Cálculo de Provisión Operativa Real</h3>
                <p className="text-slate-400 text-xs font-medium normal-case max-w-xl leading-relaxed">
                  Analizando el comportamiento histórico del día de la semana (<span className="text-purple-400 font-black">{reporteIA.dia_semana_texto}</span>), el modelo predictivo ha calculado la siguiente cuota de producción estimada para evitar el desabasto de inventario en tu local.
                </p>
              </div>

              <div className="bg-slate-800 border border-slate-700 p-5 rounded-2xl text-center w-full md:w-56 flex flex-col justify-center">
                <span className="text-3xs text-slate-400 uppercase tracking-wider block">Artículos a Vender Hoy:</span>
                <span className="text-4xl font-black font-mono text-amber-400 block my-1">{reporteIA.cantidad_predicha_hoy}</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-900 px-2 py-0.5 rounded font-black uppercase tracking-wide">
                  Unidades Sugeridas
                </span>
              </div>
            </div>

            {/* ANÁLISIS DE TENDENCIA */}
            <div className="bg-white border rounded-2xl p-5 shadow-3xs space-y-2">
              <h4 className="text-gray-800 font-black text-xs uppercase tracking-wide"> Reporte Científico para el Administrador</h4>
              <p className="text-xs text-gray-600 font-medium normal-case leading-relaxed">
                El coeficiente de tendencia del algoritmo se sitúa en <span className="font-mono font-bold text-purple-700">{reporteIA.coeficiente_tendencia}</span>. Esto significa que por cada ciclo semanal, la demanda total de la cafetería experimenta un comportamiento {reporteIA.coeficiente_tendencia >= 0 ? 'de crecimiento lineal positivo' : 'de ajuste estacional regular'}. Se aconseja al Project Manager revisar que las compras de materias primas en Almacén se alineen con este margen para maximizar los rendimientos financieros.
              </p>
            </div>

          </div>
        )
      )}

    </div>
  );
}