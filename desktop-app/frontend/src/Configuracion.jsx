import React, { useState, useEffect } from 'react'
import { apiFetch } from './helpers/apiFetch'

export default function Configuracion({ usuario, onSessionError }) {
  const [config, setConfig] = useState({ empresa: '', direccion: '', moneda: '', iva: '', limite_mesas: 5, version: '' })
  const [mensaje, setMensaje] = useState('')

  const cargarConfig = () => {
    apiFetch('http://127.0.0.1:5000/api/configuracion', {}, usuario, onSessionError)
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(err => console.error("Error al leer configuración:", err))
  }

  useEffect(() => {
    cargarConfig()
  }, [])

  const handleGuardar = (e) => {
    e.preventDefault()
    apiFetch('http://127.0.0.1:5000/api/configuracion', {
      method: 'POST',
      body: JSON.stringify(config)
    }, usuario, onSessionError)
    .then(res => res.json())
    .then(() => {
      setMensaje('¡Parámetros e inventario de mesas guardados localmente!')
      cargarConfig()
      setTimeout(() => setMensaje(''), 3000)
    })
  }

  return (
    <div className="max-w-2xl bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Configuración General del Sistema</h2>
        <p className="text-xs text-gray-400 mt-1">Ajustes de identidad, impuestos del local.</p>
      </div>

      {mensaje && (
        <div className="bg-[#6B8E23] text-white p-3 rounded-xl text-xs font-bold shadow-sm">
           {mensaje}
        </div>
      )}

      <form onSubmit={handleGuardar} className="space-y-4 text-xs font-bold text-gray-500">
        <div>
          <label className="block mb-1">Nombre del Establecimiento:</label>
          <input type="text" value={config.empresa} onChange={e => setConfig({...config, empresa: e.target.value})} className="w-full p-2.5 border rounded-xl bg-gray-50 font-medium text-gray-800 focus:outline-none" />
        </div>

        <div>
          <label className="block mb-1">Dirección de la Sucursal:</label>
          <input type="text" value={config.direccion} onChange={e => setConfig({...config, direccion: e.target.value})} className="w-full p-2.5 border rounded-xl bg-gray-50 font-medium text-gray-800 focus:outline-none" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1">Tasa de Impuesto (IVA):</label>
            <input type="text" value={config.iva} onChange={e => setConfig({...config, iva: e.target.value})} className="w-full p-2.5 border rounded-xl bg-gray-50 font-medium text-gray-800 focus:outline-none" />
          </div>
          <div>
            <label className="block mb-1">Versión de Compilación (Build):</label>
            <input type="text" value={config.version} className="w-full p-2.5 border rounded-xl bg-gray-100 font-medium text-gray-400 cursor-not-allowed" disabled />
          </div>
        </div>

        <div className="border-t pt-4 flex justify-end">
          <button type="submit" className="bg-[#8B5A2B] hover:bg-[#7A4F25] text-white py-2.5 px-6 rounded-xl shadow transition-all font-bold">
            GUARDAR CONFIGURACIÓN
          </button>
        </div>
      </form>
    </div>
  )
}