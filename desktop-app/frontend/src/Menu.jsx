import React, { useState, useEffect } from 'react'

export default function Menu() {
  const [productos, setProductos] = useState([])
  const [pestana, setPestana] = useState('GENERAL') // GENERAL, MATERIAS, EXTRAS
  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState('')
  const [categoria, setCategoria] = useState('Bebidas Calientes')
  const [notificacion, setNotificacion] = useState('')

  // Función para obtener el catálogo al día
  const cargarMenu = () => {
    fetch('http://127.0.0.1:5000/api/productos')
      .then(res => res.json())
      .then(data => setProductos(data))
      .catch(err => console.error("Error al leer menú:", err))
  }

  useEffect(() => {
    cargarMenu()
  }, [])

  const guardarProducto = (e) => {
    e.preventDefault()
    if (!nombre || !precio) return

    fetch('http://127.0.0.1:5000/api/productos/nuevo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre_producto: nombre,
        categoria: categoria,
        precio_venta: parseFloat(precio)
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.id_producto) {
          setNotificacion('¡Producto agregado al menú local!');
          setNombre('')
          setPrecio('')
          cargarMenu() // Recargar lista física
          setTimeout(() => setNotificacion(''), 3000)
        }
      })
  }

  return (
    <div className="space-y-6">
      {/* CABECERA Y SUB-NAVEGACIÓN DE PESTAÑAS */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          <button onClick={() => setPestana('GENERAL')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${pestana === 'GENERAL' ? 'bg-[#8B5A2B] text-white shadow' : 'text-gray-500 hover:text-gray-800'}`}>Vista General</button>
          <button onClick={() => setPestana('MATERIAS')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${pestana === 'MATERIAS' ? 'bg-[#8B5A2B] text-white shadow' : 'text-gray-500 hover:text-gray-800'}`}>Materias Primas</button>
          <button onClick={() => setPestana('EXTRAS')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${pestana === 'EXTRAS' ? 'bg-[#8B5A2B] text-white shadow' : 'text-gray-500 hover:text-gray-800'}`}>Extras</button>
        </div>
        <span className="text-xs font-bold text-gray-400">ADMINISTRACIÓN DE ARTÍCULOS</span>
      </div>

      {notificacion && (
        <div className="bg-amber-600 text-white p-3 rounded-xl text-sm font-bold shadow">
          {notificacion}
        </div>
      )}

      {pestana === 'GENERAL' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* FORMULARIO PARA AÑADIR (Izquierda) */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm h-fit space-y-4">
            <h3 className="font-bold text-gray-800 border-b pb-2 text-sm uppercase tracking-wider text-[#8B5A2B]">➕ Registrar Producto</h3>
            <form onSubmit={guardarProducto} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-500 font-bold mb-1">Nombre del Alimento/Bebida:</label>
                <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej. Latte Vainilla" className="w-full p-2.5 border rounded-lg bg-gray-50 focus:outline-none focus:border-[#8B5A2B]" required />
              </div>
              <div>
                <label className="block text-gray-500 font-bold mb-1">Precio de Venta ($):</label>
                <input type="number" step="0.01" value={precio} onChange={e => setPrecio(e.target.value)} placeholder="0.00" className="w-full p-2.5 border rounded-lg bg-gray-50 focus:outline-none focus:border-[#8B5A2B]" required />
              </div>
              <div>
                <label className="block text-gray-500 font-bold mb-1">Categoría:</label>
                <select value={categoria} onChange={e => setCategoria(e.target.value)} className="w-full p-2.5 border rounded-lg bg-gray-50 focus:outline-none focus:border-[#8B5A2B]">
                  <option value="Bebidas Calientes">Bebidas Calientes</option>
                  <option value="Bebidas Frías">Bebidas Frías</option>
                  <option value="Panadería">Panadería</option>
                  <option value="Alimentos">Alimentos</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-[#8B5A2B] hover:bg-[#7A4F25] text-white font-bold py-2.5 rounded-lg shadow transition-all mt-2">
                GUARDAR EN CATÁLOGO
              </button>
            </form>
          </div>

          {/* LISTADO DE PRODUCTOS (Derecha) */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
            <h3 className="font-bold text-gray-800 border-b pb-2 text-sm uppercase tracking-wider">Menú Registrado Localmente ({productos.length})</h3>
            <div className="divide-y divide-gray-100 max-h-[26rem] overflow-y-auto pr-1">
              {productos.map(p => (
                <div key={p.id_producto} className="flex justify-between items-center py-3 text-sm hover:bg-gray-50 px-2 rounded-lg transition-colors">
                  <div>
                    <span className="font-bold text-gray-800 block">{p.nombre_producto}</span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded font-semibold">{p.categoria}</span>
                  </div>
                  <span className="font-black text-[#8B5A2B]">${p.precio_venta.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {pestana !== 'GENERAL' && (
        <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center text-gray-400">
          ⚙️ El módulo de <span className="font-bold text-gray-700">{pestana}</span> se habilitará automáticamente al mapear las recetas con el Inventario Físico en el siguiente paso.
        </div>
      )}
    </div>
  )
}