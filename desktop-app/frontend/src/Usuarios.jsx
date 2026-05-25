import React, { useState, useEffect } from 'react'

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [mostrarModal, setMostrarModal] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // SIMULADOR DE PERMISOS DE USUARIO ACTUAL EN CAJA
  const [rolUsuarioLogueado, setRolUsuarioLogueado] = useState('Admin') 

  // Estado para el formulario de Alta / Edición
  const [formStaff, setFormStaff] = useState({
    id_usuario: null,
    nombre: '',
    puesto: 'Mesero',
    permisos: 'Basico',
    horas_trabajadas: '',
    pago_hora: '',
    horario: '07:00 - 15:00'
  })

  const cargarPersonal = () => {
    setLoading(true)
    fetch('http://127.0.0.1:5000/api/usuarios')
      .then(res => res.json())
      .then(data => {
        setUsuarios(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    cargarPersonal()
  }, [])

  const abrirModalParaNuevo = () => {
    if (rolUsuarioLogueado !== 'Admin') {
      alert('❌ ACCESO DENEGADO: Solo el personal con rol de ADMINISTRADOR puede dar de alta nuevos usuarios.')
      return
    }
    setFormStaff({ id_usuario: null, nombre: '', puesto: 'Mesero', permisos: 'Basico', horas_trabajadas: '', pago_hora: '', horario: '07:00 - 15:00' })
    setMostrarModal(true)
  }

  const abrirModalParaEditar = (u) => {
    if (rolUsuarioLogueado !== 'Admin') {
      alert('❌ ACCESO DENEGADO: Solo un administrador puede modificar los salarios y datos de nómina del personal.')
      return
    }
    setFormStaff({ ...u })
    setMostrarModal(true)
  }

  const handleEliminar = (id) => {
    if (rolUsuarioLogueado !== 'Admin') {
      alert('❌ ACCESO DENEGADO: Seguridad del Sistema bloqueada. No puedes eliminar personal sin credenciales de Administrador.')
      return
    }
    if (window.confirm('¿Confirmas la baja definitiva de este colaborador del sistema POS?')) {
      fetch(`http://127.0.0.1:5000/api/usuarios/eliminar/${id}`, { method: 'DELETE' })
        .then(() => cargarPersonal())
    }
  }

  const handleGuardarStaff = (e) => {
    e.preventDefault()
    fetch('http://127.0.0.1:5000/api/usuarios/guardar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formStaff)
    }).then(() => {
      cargarPersonal()
      setMostrarModal(false)
    })
  }

  const esAdmin = rolUsuarioLogueado === 'Admin'

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* SECCIÓN SUPERIOR CON SIMULADOR DE LLAVE DE SEGURIDAD */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-black text-gray-800">Control de Personal y Nómina Local</h2>
          <p className="text-3xs text-gray-400 font-bold uppercase tracking-wider mt-0.5">Auditoría interna de horas y salarios devengados.</p>
        </div>
        
        <div className="bg-gray-100 p-1 rounded-xl border border-gray-200 flex gap-1 items-center">
          <span className="text-[10px] font-black text-gray-400 px-2 uppercase">Llave Rol:</span>
          <button 
            type="button" 
            onClick={() => setRolUsuarioLogueado('Basico')}
            className={`py-1.5 px-3 rounded-lg text-3xs font-black transition-colors ${rolUsuarioLogueado === 'Basico' ? 'bg-red-200 text-red-800' : 'bg-white text-gray-500'}`}
          >
            🔒 Empleado
          </button>
          <button 
            type="button" 
            onClick={() => setRolUsuarioLogueado('Admin')}
            className={`py-1.5 px-3 rounded-lg text-3xs font-black transition-colors ${rolUsuarioLogueado === 'Admin' ? 'bg-emerald-200 text-emerald-800' : 'bg-white text-gray-500'}`}
          >
            🔓 Admin
          </button>
        </div>
      </div>

      {/* RECUADRO INFORMATIVO TÁCTIL */}
      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-200/80">
        <span className="text-xs font-bold text-gray-500">Manejo operativo de staff y asignaciones.</span>
        <button 
          onClick={abrirModalParaNuevo}
          className={`py-2.5 px-5 rounded-xl font-black text-xs text-white uppercase shadow tracking-wide transition-all ${
            esAdmin ? 'bg-[#8B5A2B] active:scale-95' : 'bg-gray-300 text-gray-400 cursor-not-allowed'
          }`}
        >
          + Registrar Nuevo Colaborador
        </button>
      </div>

      {/* TABLA DE NÓMINA */}
      {loading ? (
        <div className="text-center py-12 text-gray-400 text-xs font-bold">Consultando nómina en base de datos local...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-xs font-bold text-gray-600">
            <thead className="bg-gray-50 text-gray-400 text-3xs font-black uppercase tracking-wider border-b">
              <tr>
                <th className="p-4">Colaborador</th>
                <th className="p-4">Puesto Operativo</th>
                <th className="p-4">Horario Sucursal</th>
                <th className="p-4 text-center">Horas Semanales</th>
                <th className="p-4 text-right">Pago por Hora</th>
                <th className="p-4 text-right">Salario Estimado</th>
                <th className="p-4 text-center">Acciones Táctiles</th>
              </tr>
            </thead>
            <tbody className="divide-y font-medium text-gray-700">
              {usuarios.map(u => {
                const salarioTotal = (u.horas_trabajadas || 0) * (u.pago_hora || 0)
                return (
                  <tr key={u.id_usuario} className="hover:bg-gray-50/50">
                    <td className="p-4 font-black text-gray-900">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${u.permisos === 'Admin' ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                        {u.nombre}
                      </div>
                    </td>
                    <td className="p-4"><span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-3xs font-black uppercase">{u.puesto}</span></td>
                    <td className="p-4 font-mono text-2xs text-gray-500">⏰ {u.horario}</td>
                    <td className="p-4 text-center font-mono font-bold">{u.horas_trabajadas} hrs</td>
                    <td className="p-4 text-right font-mono">${parseFloat(u.pago_hora || 0).toFixed(2)}</td>
                    <td className="p-4 text-right font-mono text-gray-900 font-black">${salarioTotal.toFixed(2)}</td>
                    <td className="p-4 text-center">
                      <div className="flex gap-2 justify-center">
                        <button 
                          onClick={() => abrirModalParaEditar(u)}
                          className={`px-3 py-1.5 text-3xs font-black rounded-lg border uppercase ${
                            esAdmin ? 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50' : 'bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed'
                          }`}
                        >
                          Editar
                        </button>
                        <button 
                          onClick={() => handleEliminar(u.id_usuario)}
                          className={`px-3 py-1.5 text-3xs font-black rounded-lg uppercase ${
                            esAdmin ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                          }`}
                        >
                          Baja
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL DE ALTA Y NÓMINA */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form onSubmit={handleGuardarStaff} className="bg-white rounded-3xl p-6 w-full max-w-md space-y-4 text-xs font-bold text-gray-500 shadow-2xl">
            <h3 className="text-base font-black text-gray-800 border-b pb-2">
              {formStaff.id_usuario ? 'Modificar Registro de Personal' : 'Dar de Alta Nuevo Colaborador'}
            </h3>

            <div>
              <label className="block mb-1 text-3xs uppercase text-gray-400">Nombre Completo del Empleado:</label>
              <input type="text" required value={formStaff.nombre} onChange={e => setFormStaff({...formStaff, nombre: e.target.value})} placeholder="Ej. Carlos Mendoza" className="w-full p-2.5 border rounded-xl font-medium text-gray-800 bg-gray-50" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-3xs uppercase text-gray-400">Puesto Operativo:</label>
                <select value={formStaff.puesto} onChange={e => setFormStaff({...formStaff, puesto: e.target.value})} className="w-full p-2.5 border rounded-xl font-medium text-gray-800 bg-gray-50">
                  <option value="Mesero">Mesero</option>
                  <option value="Cajero">Cajero</option>
                  <option value="Barista">Barista</option>
                  <option value="Administrador">Administrador</option>
                </select>
              </div>
              <div>
                <label className="block mb-1 text-3xs uppercase text-gray-400">Permisos del Sistema:</label>
                <select value={formStaff.permisos} onChange={e => setFormStaff({...formStaff, permisos: e.target.value})} className="w-full p-2.5 border rounded-xl font-medium text-gray-800 bg-gray-50">
                  <option value="Basico">🔒 Básico (Operador)</option>
                  <option value="Admin">🔓 Admin (Supervisor)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-3xs uppercase text-gray-400">Horas Trabajadas:</label>
                <input type="number" required value={formStaff.horas_trabajadas} onChange={e => setFormStaff({...formStaff, horas_trabajadas: e.target.value})} placeholder="Ej. 40" className="w-full p-2.5 border rounded-xl font-mono text-gray-800 bg-gray-50" />
              </div>
              <div>
                <label className="block mb-1 text-3xs uppercase text-gray-400">Sueldo por Hora ($):</label>
                <input type="number" required value={formStaff.pago_hora} onChange={e => setFormStaff({...formStaff, pago_hora: e.target.value})} placeholder="Ej. 45.00" className="w-full p-2.5 border rounded-xl font-mono text-gray-800 bg-gray-50" />
              </div>
            </div>

            <div>
              <label className="block mb-1 text-3xs uppercase text-gray-400">Horario de Turno:</label>
              <input type="text" required value={formStaff.horario} onChange={e => setFormStaff({...formStaff, horario: e.target.value})} placeholder="Ej. 07:00 - 15:00" className="w-full p-2.5 border rounded-xl font-medium text-gray-800 bg-gray-50" />
            </div>

            <div className="flex gap-2 pt-2 border-t font-black uppercase text-2xs">
              <button type="button" onClick={() => setMostrarModal(false)} className="w-1/3 py-2.5 border rounded-xl text-gray-400 normal-case font-bold">Cancelar</button>
              <button type="submit" className="flex-1 py-2.5 bg-[#8B5A2B] text-white rounded-xl shadow-sm tracking-wide text-center">
                Guardar Registro
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  )
}