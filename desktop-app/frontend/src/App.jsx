import React from 'react'

function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center p-6 antialiased">
      <div className="bg-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-800 text-center max-w-md w-full dynamic-card">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 mb-4 border border-emerald-500/20">
          <span className="text-2xl font-bold">POS</span>
        </div>
        
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 mb-2 tracking-tight">
          Sistema POS Inteligente
        </h1>
        
        <p className="text-gray-400 text-sm leading-relaxed mb-6">
          Entorno visual del Frontend inicializado con Vite, React y Tailwind CSS v4 de forma exitosa.
        </p>
        
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-gray-950 font-bold py-2.5 px-5 rounded-xl shadow-lg shadow-emerald-950/20 transition-all active:scale-98 text-sm">
            Panel de Ventas
          </button>
          <button className="bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 font-semibold py-2.5 px-5 rounded-xl transition-all active:scale-98 text-sm">
            Módulo IA
          </button>
        </div>
      </div>
    </div>
  )
}

export default App