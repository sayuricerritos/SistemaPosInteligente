import React, { useState, useEffect } from 'react';

export default function Menu() {
  // 1. DECLARACIÓN DE ESTADOS GLOBALES
  const [productos, setProductos] = useState([]);
  const [insumosDisponibles, setInsumosDisponibles] = useState([]);
  const [subPestaña, setSubPestaña] = useState('General'); // 'General', 'Materias', 'Extras'
  
  // Campos del formulario básico (Pestaña 1)
  const [nombreProducto, setNombreProducto] = useState('');
  const [precioVenta, setPrecioVenta] = useState('');
  const [categoria, setCategoria] = useState('Bebidas Calientes');
  const [insumosSeleccionados, setInsumosSeleccionados] = useState([]);

  // Estados de control para Edición, Recetas y Extras
  const [productoAEditar, setProductoAEditar] = useState(''); 
  const [productoParaExtras, setProductoParaExtras] = useState('');
  const [extrasSeleccionados, setExtrasSeleccionados] = useState([]);
  const [idProductoSeleccionadoForm, setIdProductoSeleccionadoForm] = useState(null); 
  const [modoEdicion, setModoEdicion] = useState(false);

  const categories = ['Bebidas Calientes', 'Bebidas Frías', 'Panadería', 'Alimentos'];

  // Catálogo maestro de Extras disponibles en la cafetería
  const listaExtrasMaestra = [
    { id: 'leche_entera', nombre: 'Leche Entera Santa Clara', tipo: 'Lácteo' },
    { id: 'leche_des', nombre: 'Leche Deslactosada Light', tipo: 'Lácteo' },
    { id: 'leche_alm', nombre: 'Leche de Almendra Silk', tipo: 'Lácteo' },
    { id: 'shot_esp', nombre: 'Shot Extra Espresso Arábica', tipo: 'Sabor' },
    { id: 'jarabe_vai', nombre: 'Jarabe de Vainilla Francesa', tipo: 'Sabor' },
    { id: 'crema_bat', nombre: 'Crema Batida Hershey', tipo: 'Sabor' }
  ];

  // Cargar datos al iniciar
  const cargarDatosMenu = () => {
    fetch('http://127.0.0.1:5000/api/productos')
      .then(res => res.json())
      .then(data => setProductos(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error cargando productos:", err));

    fetch('http://127.0.0.1:5000/api/inventario')
      .then(res => res.json())
      .then(data => setInsumosDisponibles(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error cargando insumos:", err));
  };

  useEffect(() => {
    cargarDatosMenu();
  }, []);

  // Control de checkboxes para Insumos (Recetas)
  const handleCheckboxInsumo = (idInsumo) => {
    if (insumosSeleccionados.includes(idInsumo)) {
      setInsumosSeleccionados(insumosSeleccionados.filter(id => id !== idInsumo));
    } else {
      setInsumosSeleccionados([...insumosSeleccionados, idInsumo]);
    }
  };

  // Control de checkboxes para Extras
  const handleCheckboxExtra = (idExtra) => {
    if (extrasSeleccionados.includes(idExtra)) {
      setExtrasSeleccionados(extrasSeleccionados.filter(id => id !== idExtra));
    } else {
      setExtrasSeleccionados([...extrasSeleccionados, idExtra]);
    }
  };

  // Funciones para Edición básica
  const iniciarEdicion = (p) => {
    setIdProductoSeleccionadoForm(p.id_producto);
    setNombreProducto(p.nombre_producto);
    setPrecioVenta(p.precio_venta);
    setCategoria(p.categoria);
    setModoEdicion(true);
  };

  const cancelarEdicion = () => {
    setIdProductoSeleccionadoForm(null);
    setNombreProducto('');
    setPrecioVenta('');
    setCategoria('Bebidas Calientes');
    setModoEdicion(false);
  };

  const handleGuardarProducto = (e) => {
    e.preventDefault();
    if (!nombreProducto || !precioVenta) {
      alert("Por favor rellena los campos obligatorios.");
      return;
    }

    const datosItem = {
      nombre_producto: nombreProducto,
      precio_venta: parseFloat(precioVenta),
      categoria: categoria
    };

    const url = modoEdicion 
      ? `http://127.0.0.1:5000/api/productos/${idProductoSeleccionadoForm}`
      : 'http://127.0.0.1:5000/api/productos';
      
    const metodo = modoEdicion ? 'PUT' : 'POST';

    fetch(url, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(modoEdicion ? datosItem : { ...datosItem, insumos_receta: insumosSeleccionados })
    })
    .then(res => {
      if (!res.ok) throw new Error("Error en el servidor");
      return res.json();
    })
    .then(() => {
      alert(modoEdicion ? " ¡Producto actualizado con éxito!" : "✨ ¡Producto agregado con éxito!");
      cancelarEdicion();
      cargarDatosMenu();
    })
    .catch(err => alert(`❌ Error: ${err.message}`));
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen text-xs font-bold text-gray-500">
      
      {/* HEADER DE NAVEGACIÓN */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border mb-6 shadow-2xs">
        <div>
          <h1 className="text-2xl font-black text-gray-800"> Configuración de Catálogo y Recetas</h1>
          <p className="text-3xs text-gray-400 font-medium">Administración global del menú </p>
        </div>
        
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl border">
          <button 
            onClick={() => setSubPestaña('General')} 
            className={`px-4 py-2 rounded-lg text-3xs font-black uppercase transition-all ${subPestaña === 'General' ? 'bg-[#8B5A2B] text-white shadow-sm' : 'bg-white text-gray-500'}`}
          >
             Menú General
          </button>
          <button 
            onClick={() => setSubPestaña('Materias')} 
            className={`px-4 py-2 rounded-lg text-3xs font-black uppercase transition-all ${subPestaña === 'Materias' ? 'bg-[#8B5A2B] text-white shadow-sm' : 'bg-white text-gray-500'}`}
          >
             Recetas / Materias Primas
          </button>
          <button 
            onClick={() => setSubPestaña('Extras')} 
            className={`px-4 py-2 rounded-lg text-3xs font-black uppercase transition-all ${subPestaña === 'Extras' ? 'bg-[#8B5A2B] text-white shadow-sm' : 'bg-white text-gray-500'}`}
          >
             Modificadores y Extras
          </button>
        </div>
      </div>

      {/* SUB-PESTAÑA 1: MENÚ GENERAL */}
      {subPestaña === 'General' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white border rounded-2xl p-5 shadow-2xs h-fit space-y-4">
            <div className="border-b pb-2">
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide">{modoEdicion ? "✏️ Editar Artículo" : "Nuevo Artículo"}</h3>
              <p className="text-3xs text-gray-400">{modoEdicion ? "Modificando registro existente en SQLite" : "Inyección directa al catálogo de ventas"}</p>
            </div>
            
            <form onSubmit={handleGuardarProducto} className="space-y-3">
              <div className="space-y-1">
                <label className="text-3xs text-gray-400 uppercase">Nombre del Producto *</label>
                <input type="text" value={nombreProducto} onChange={e => setNombreProducto(e.target.value)} placeholder="Ej. Latte Vainilla Frío" className="w-full p-2.5 border rounded-xl bg-gray-50 text-gray-800 font-medium focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-3xs text-gray-400 uppercase">Precio de Venta ($) *</label>
                  <input type="number" step="0.01" value={precioVenta} onChange={e => setPrecioVenta(e.target.value)} placeholder="0.00" className="w-full p-2.5 border rounded-xl bg-gray-50 text-gray-800 font-mono focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-3xs text-gray-400 uppercase">Categoría</label>
                  <select value={categoria} onChange={e => setCategoria(e.target.value)} className="w-full p-2.5 border rounded-xl bg-gray-50 text-gray-800 font-medium cursor-pointer focus:outline-none">
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" className={`flex-1 py-3 text-white font-black rounded-xl uppercase tracking-wider shadow transition-colors ${modoEdicion ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#8B5A2B] hover:bg-[#7A4F25]'}`}>
                  {modoEdicion ? " Actualizar Cambios" : " Guardar en Menú"}
                </button>
                {modoEdicion && <button type="button" onClick={cancelarEdicion} className="px-3 py-3 bg-gray-200 hover:bg-gray-300 text-gray-600 font-black rounded-xl uppercase">❌</button>}
              </div>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-3">
            <span className="block text-3xs font-black text-gray-400 uppercase tracking-wider">Artículos en Catálogo:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {productos.map(p => (
                <div key={p.id_producto} className="bg-white border rounded-xl p-4 flex justify-between items-center shadow-2xs hover:border-gray-300 transition-all">
                  <div>
                    <h4 className="font-black text-gray-800 text-sm">{p.nombre_producto}</h4>
                    <span className="inline-block bg-amber-50 text-[#8B5A2B] text-[10px] font-bold px-2 py-0.5 rounded border border-amber-100 mt-1">{p.categoria}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black font-mono text-gray-700">${parseFloat(p.precio_venta).toFixed(2)}</span>
                    <button onClick={() => iniciarEdicion(p)} className="px-2 py-1.5 bg-gray-100 hover:bg-amber-100 hover:text-amber-800 border rounded-lg text-3xs transition-colors">✏️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-PESTAÑA 2: RECETAS / MATERIAS PRIMAS */}
      {subPestaña === 'Materias' && (
        <div className="bg-white border rounded-2xl p-6 shadow-2xs space-y-5">
          <div className="border-b pb-3">
            <h3 className="text-base font-black text-gray-800 uppercase">Mapeo Tecnológico de Recetas e IA</h3>
            <p className="text-xs text-gray-400 font-medium mt-0.5">Asigna qué materias primas consume cada platillo de tu menú de forma definitiva.</p>
          </div>

          <div className="bg-gray-100/60 p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 space-y-1">
              <label className="text-3xs text-gray-400 uppercase font-black block">1. Selecciona el Producto a Vincular:</label>
              <select 
                value={productoAEditar || ''} 
                onChange={e => {
                  const idSel = e.target.value ? parseInt(e.target.value) : '';
                  setProductoAEditar(idSel);
                  const prodObj = productos.find(p => p.id_producto === idSel);
                  if (prodObj && Array.isArray(prodObj.insumos_receta)) {
                    setInsumosSeleccionados(prodObj.insumos_receta);
                  } else {
                    setInsumosSeleccionados([]);
                  }
                }}
                className="w-full p-3 border rounded-xl bg-white text-gray-800 font-bold cursor-pointer focus:outline-none"
              >
                <option value="">-- Selecciona un artículo del menú --</option>
                {productos.map(p => <option key={p.id_producto} value={p.id_producto}>{p.nombre_producto} ({p.categoria})</option>)}
              </select>
            </div>
            
            <button
              type="button"
              disabled={!productoAEditar}
              onClick={() => {
                fetch('http://127.0.0.1:5000/api/productos/guardar-receta', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id_producto: productoAEditar, insumos: insumosSeleccionados })
                })
                .then(res => { if (!res.ok) throw new Error("Error al guardar receta"); return res.json(); })
                .then(() => { alert(" ¡Receta vinculada y sincronizada con éxito!"); cargarDatosMenu(); })
                .catch(err => alert(`X Error: ${err.message}`));
              }}
              className={`sm:w-48 py-3.5 rounded-xl font-black uppercase tracking-wider transition-all shadow ${!productoAEditar ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
            >
               Vincular Receta
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-3 bg-gray-50/50 p-4 rounded-xl border border-dashed">
              <span className="block text-3xs font-black text-gray-400 uppercase tracking-wider">2. Marcar Insumos que consume la receta:</span>
              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                {insumosDisponibles.map(insumo => (
                  <label key={insumo.id_insumo} className="flex items-center justify-between p-3 bg-white border rounded-xl cursor-pointer hover:border-[#8B5A2B] transition-colors shadow-2xs">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" disabled={!productoAEditar} checked={insumosSeleccionados.includes(insumo.id_insumo)} onChange={() => handleCheckboxInsumo(insumo.id_insumo)} className="w-4 h-4 accent-[#8B5A2B]" />
                      <span className={`font-bold ${!productoAEditar ? 'text-gray-400' : 'text-gray-700'}`}>{insumo.nombre_insumo}</span>
                    </div>
                    <span className="text-3xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded font-mono">Stock: {insumo.cantidad_actual} {insumo.unidad_medida}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-3 bg-amber-50/20 p-4 rounded-xl border border-dashed border-amber-200 flex flex-col justify-between">
              <div>
                <span className="block text-3xs font-black text-amber-800 uppercase tracking-wider mb-1"> Control  Inteligente</span>
                <p className="text-xs text-gray-600 font-medium normal-case leading-relaxed">Al asociar el menú con las materias primas, el backend descontará el almacén automáticamente al despachar las comandas.</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-amber-100 text-3xs text-[#8B5A2B] font-mono shadow-3xs">Estatus: {insumosSeleccionados.length} componentes listos para ligar.</div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-PESTAÑA 3: ASIGNACIÓN DE MODIFICADORES Y EXTRAS (TOTALMENTE CONECTADA) */}
      {subPestaña === 'Extras' && (
        <div className="bg-white border rounded-2xl p-6 shadow-2xs space-y-5">
          <div className="border-b pb-3">
            <h3 className="text-base font-black text-gray-800 uppercase">Asignación de Modificadores y Extras</h3>
            <p className="text-xs text-gray-400 font-medium mt-0.5">Configura qué opciones de personalización (lácteos alternativos, shots o jarabes) puede elegir el cliente para este producto.</p>
          </div>

          {/* Selector de Producto Objetivo para Extras */}
          <div className="bg-gray-100/60 p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 space-y-1">
              <label className="text-3xs text-gray-400 uppercase font-black block">1. Selecciona el Producto Objetivo:</label>
              <select 
                value={productoParaExtras || ''} 
                onChange={e => {
                  const idSel = e.target.value ? parseInt(e.target.value) : '';
                  setProductoParaExtras(idSel);
                  
                  // Recuperar si el producto ya tenía extras guardados
                  const prodObj = productos.find(p => p.id_producto === idSel);
                  if (prodObj && prodObj.extras_disponibles) {
                    try {
                      // Si viene guardado como string de arreglo "['leche_alm', 'shot_esp']", lo parseamos de forma segura
                      const strClean = prodObj.extras_disponibles.replace(/'/g, '"');
                      setExtrasSeleccionados(JSON.parse(strClean));
                    } catch {
                      setExtrasSeleccionados([]);
                    }
                  } else {
                    setExtrasSeleccionados([]);
                  }
                }}
                className="w-full p-3 border rounded-xl bg-white text-gray-800 font-bold cursor-pointer focus:outline-none"
              >
                <option value="">-- Selecciona un artículo del menú --</option>
                {productos.map(p => <option key={p.id_producto} value={p.id_producto}>{p.nombre_producto} ({p.categoria})</option>)}
              </select>
            </div>
            
            <button
              type="button"
              disabled={!productoParaExtras}
              onClick={() => {
                fetch('http://127.0.0.1:5000/api/productos/guardar-extras', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id_producto: productoParaExtras, extras: extrasSeleccionados })
                })
                .then(res => { if (!res.ok) throw new Error("Error al guardar extras"); return res.json(); })
                .then(() => { 
                  alert("➕ ¡Extras asignados correctamente al producto en SQLite!"); 
                  cargarDatosMenu(); 
                })
                .catch(err => alert(`❌ Error: ${err.message}`));
              }}
              className={`sm:w-48 py-3.5 rounded-xl font-black uppercase tracking-wider transition-all shadow ${
                !productoParaExtras ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-700 text-white active:scale-95'
              }`}
            >
              ➕ Asignar Extras
            </button>
          </div>

          {/* Listado Maestro de Casillas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-3 bg-gray-50/50 p-4 rounded-xl border border-dashed">
              <span className="block text-3xs font-black text-gray-400 uppercase tracking-wider">2. Habilitar Extras Autorizados:</span>
              <div className="space-y-2">
                {listaExtrasMaestra.map(extra => (
                  <label key={extra.id} className="flex items-center justify-between p-3 bg-white border rounded-xl cursor-pointer hover:border-amber-600 transition-colors shadow-2xs">
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        disabled={!productoParaExtras}
                        checked={extrasSeleccionados.includes(extra.id)} 
                        onChange={() => handleCheckboxExtra(extra.id)} 
                        className="w-4 h-4 accent-amber-600 cursor-pointer" 
                      />
                      <span className={`font-bold ${!productoParaExtras ? 'text-gray-400' : 'text-gray-700'}`}>{extra.nombre}</span>
                    </div>
                    <span className="text-3xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md border border-amber-100">{extra.tipo}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-amber-50/10 border border-dashed border-amber-200 p-5 rounded-xl flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-black text-gray-800 uppercase mb-2"> Vista de Modificadores en Comanda</h4>
                <p className="text-3xs text-gray-500 font-medium normal-case leading-relaxed">
                  Los elementos que dejes palomeados aquí aparecerán de forma automática como opciones seleccionables en las terminales de venta cuando tus meseros elijan este artículo en el panel de **Mesa** o **Para Llevar**.
                </p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-gray-100 text-3xs text-gray-400 font-mono">
                Modificadores activos a sincronizar: {extrasSeleccionados.length}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}