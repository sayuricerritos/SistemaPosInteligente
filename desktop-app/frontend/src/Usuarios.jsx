import React, { useState, useEffect } from 'react'
import { useDialogo } from './components/Dialogo'
import { noNeg } from './helpers/validacion'

const IconoCandado = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)
const IconoCandadoAbierto = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" />
  </svg>
)
const IconoReloj = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
)
const IconoClave = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
)
const IconoUsuario = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
)
const IconoAcceso = ({ className = 'w-3 h-3' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)


const FORM_INICIAL = {
  id_usuario: null,
  nombre: '',
  nombre_usuario: '',
  puesto: 'Mesero',
  permisos: 'Basico',
  horas_trabajadas: '',
  pago_hora: '',
  horario: '07:00 - 15:00',
  contrasena: '',
}

export default function Usuarios() {
  const [usuarios, setUsuarios]         = useState([])
  const [mostrarModal, setMostrarModal] = useState(false)
  const [loading, setLoading]           = useState(true)
  const [rolUsuarioLogueado, setRolUsuarioLogueado] = useState('Admin')
  const [formStaff, setFormStaff]       = useState(FORM_INICIAL)
  const [errorForm, setErrorForm]       = useState('')
  const [guardandoUsuario, setGuardandoUsuario] = useState(false)
  const { notificar, confirmar, DialogoUI } = useDialogo()

  const cargarPersonal = () => {
    setLoading(true)
    fetch('http://127.0.0.1:5000/api/usuarios')
      .then(res => {
        if (!res.ok) throw new Error(`Error ${res.status}`)
        return res.json()
      })
      .then(data => { setUsuarios(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => { setUsuarios([]); setLoading(false) })
  }

  useEffect(() => { cargarPersonal() }, [])

  const abrirModalParaNuevo = () => {
    if (rolUsuarioLogueado !== 'Admin') {
      alert('Acceso denegado: se requiere rol Administrador.')
      return
    }
    setFormStaff(FORM_INICIAL)
    setErrorForm('')
    setMostrarModal(true)
  }

  const abrirModalParaEditar = (u) => {
    if (rolUsuarioLogueado !== 'Admin') {
      alert('Acceso denegado: se requiere rol Administrador.')
      return
    }
    setFormStaff({ ...u, contrasena: '' })
    setErrorForm('')
    setMostrarModal(true)
  }

  const handleEliminar = async (id) => {
    if (rolUsuarioLogueado !== 'Admin') {
      notificar('Acceso denegado: se requiere rol Administrador.')
      return
    }
    if (!await confirmar('Confirmar la baja definitiva de este colaborador?')) return
    fetch(`http://127.0.0.1:5000/api/usuarios/${id}`, { method: 'DELETE' })
      .then(res => {
        if (!res.ok) return res.json().then(d => { throw new Error(d.error || `Error ${res.status}`) })
        return res.json()
      })
      .then(() => cargarPersonal())
      .catch(err => notificar(`No se pudo eliminar: ${err.message}`))
  }

  const handleGuardarStaff = async (e) => {
    e.preventDefault()
    if (guardandoUsuario) return
    setErrorForm('')

    if (!formStaff.nombre.trim()) { setErrorForm('El nombre del trabajador es obligatorio.'); return }
    if (!formStaff.nombre_usuario.trim()) { setErrorForm('El nombre de usuario es obligatorio.'); return }

    if (!formStaff.id_usuario && !formStaff.contrasena.trim()) {
      if (!await confirmar('Sin contrasena, este usuario no podra iniciar sesion. Continuar?')) return
    }

    setGuardandoUsuario(true)
    fetch('http://127.0.0.1:5000/api/usuarios/guardar', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(formStaff),
    })
    .then(res => {
      if (!res.ok) return res.json().then(d => { throw new Error(d.error || `Error ${res.status}`) })
      return res.json()
    })
    .then(data => {
      if (data.error) { setErrorForm(data.error); return }
      cargarPersonal()
      setMostrarModal(false)
    })
    .catch(err => setErrorForm(err.message))
    .finally(() => setGuardandoUsuario(false))
  }

  const esAdmin = rolUsuarioLogueado === 'Admin'

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ENCABEZADO */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-black text-gray-800">Control de Personal y Nomina Local</h2>
          <p className="text-3xs text-gray-400 font-bold uppercase tracking-wider mt-0.5">
            Auditoria interna de horas, salarios y credenciales de acceso.
          </p>
        </div>
        <div className="bg-gray-100 p-1 rounded-xl border border-gray-200 flex gap-1 items-center">
          <span className="text-[10px] font-black text-gray-400 px-2 uppercase">Llave Rol:</span>
          <button type="button" onClick={() => setRolUsuarioLogueado('Basico')}
            className={`py-1.5 px-3 rounded-lg text-3xs font-black transition-colors flex items-center gap-1.5 ${rolUsuarioLogueado === 'Basico' ? 'bg-red-100 text-red-800' : 'bg-white text-gray-500'}`}>
            <IconoCandado />Empleado
          </button>
          <button type="button" onClick={() => setRolUsuarioLogueado('Admin')}
            className={`py-1.5 px-3 rounded-lg text-3xs font-black transition-colors flex items-center gap-1.5 ${rolUsuarioLogueado === 'Admin' ? 'bg-emerald-100 text-emerald-800' : 'bg-white text-gray-500'}`}>
            <IconoCandadoAbierto />Admin
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-200/80">
        <span className="text-xs font-bold text-gray-500">Manejo operativo de staff, credenciales y asignaciones.</span>
        <button onClick={abrirModalParaNuevo}
          className={`py-2.5 px-5 rounded-xl font-black text-xs text-white uppercase shadow tracking-wide transition-all ${esAdmin ? 'bg-[#8B5A2B] hover:bg-[#7A4F25] active:scale-95' : 'bg-gray-300 text-gray-400 cursor-not-allowed'}`}>
          + Registrar Nuevo Colaborador
        </button>
      </div>

      {/* TABLA */}
      {loading ? (
        <div className="text-center py-12 text-gray-400 text-xs font-bold">Consultando nomina...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto shadow-sm">
          <table className="w-full text-left border-collapse text-xs font-bold text-gray-600">
            <thead className="bg-gray-50 text-gray-400 text-3xs font-black uppercase tracking-wider border-b">
              <tr>
                <th className="p-4">Trabajador</th>
                <th className="p-4">Usuario</th>
                <th className="p-4">Puesto</th>
                <th className="p-4">Horario</th>
                <th className="p-4 text-center">Horas</th>
                <th className="p-4 text-right">Pago/Hr</th>
                <th className="p-4 text-center">Acceso</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y font-medium text-gray-700">
              {usuarios.length === 0 ? (
                <tr><td colSpan="8" className="p-6 text-center text-gray-400">No hay colaboradores registrados.</td></tr>
              ) : (
                usuarios.map(u => (
                  <tr key={u.id_usuario} className="hover:bg-gray-50/50">
                    <td className="p-4 font-black text-gray-900">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${u.permisos === 'Total' ? 'bg-emerald-500' : 'bg-blue-400'}`}></span>
                        {u.nombre}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="flex items-center gap-1 text-3xs font-black text-gray-500 bg-gray-100 px-2 py-1 rounded-md font-mono">
                        <IconoUsuario className="w-3 h-3" />
                        {u.nombre_usuario || '--'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-3xs font-black uppercase">{u.puesto}</span>
                    </td>
                    <td className="p-4 font-mono text-2xs text-gray-500">
                      <span className="flex items-center gap-1"><IconoReloj />{u.horario}</span>
                    </td>
                    <td className="p-4 text-center font-mono">{u.horas_trabajadas} hrs</td>
                    <td className="p-4 text-right font-mono">${parseFloat(u.pago_hora || 0).toFixed(2)}</td>
                    <td className="p-4 text-center">
                      {u.tiene_contrasena ? (
                        <span className="inline-flex items-center gap-1 text-3xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          <IconoAcceso />Activo
                        </span>
                      ) : (
                        <span className="text-3xs font-black text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded">
                          Sin acceso
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => abrirModalParaEditar(u)}
                          className={`px-3 py-1.5 text-3xs font-black rounded-lg border uppercase ${esAdmin ? 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50' : 'bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed'}`}>
                          Editar
                        </button>
                        <button onClick={() => handleEliminar(u.id_usuario)}
                          className={`px-3 py-1.5 text-3xs font-black rounded-lg uppercase ${esAdmin ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}>
                          Baja
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL ALTA / EDICION */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form onSubmit={handleGuardarStaff} className="bg-white rounded-3xl p-6 w-full max-w-md space-y-4 text-xs font-bold text-gray-500 shadow-2xl">
            <h3 className="text-base font-black text-gray-800 border-b pb-2">
              {formStaff.id_usuario ? 'Modificar Registro' : 'Alta de Nuevo Colaborador'}
            </h3>

            {/* Nombre completo del trabajador */}
            <div>
              <label className="block mb-1 text-3xs uppercase text-gray-400">Nombre Completo del Trabajador *</label>
              <input type="text" required value={formStaff.nombre}
                onChange={e => setFormStaff({...formStaff, nombre: e.target.value})}
                placeholder="Ej. Alexis Castro Martinez"
                className="w-full p-2.5 border rounded-xl font-medium text-gray-800 bg-gray-50 focus:outline-none" />
            </div>

            {/* Nombre de usuario (credencial de login, unico) */}
            <div>
              <label className="block mb-1 text-3xs uppercase text-gray-400 flex items-center gap-1">
                <IconoUsuario className="w-3 h-3" />
                Nombre de Usuario (para iniciar sesion) *
              </label>
              <input type="text" required value={formStaff.nombre_usuario}
                onChange={e => setFormStaff({...formStaff, nombre_usuario: e.target.value})}
                placeholder="Ej. alexis.castro (no se puede repetir)"
                className="w-full p-2.5 border rounded-xl font-mono text-gray-800 bg-gray-50 focus:outline-none" />
              <p className="text-3xs text-gray-400 mt-1 font-medium normal-case">
                Este sera el nombre que el colaborador ingrese en la pantalla de login. Debe ser unico en el sistema.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-3xs uppercase text-gray-400">Puesto</label>
                <select value={formStaff.puesto}
                  onChange={e => setFormStaff({...formStaff, puesto: e.target.value})}
                  className="w-full p-2.5 border rounded-xl font-medium text-gray-800 bg-gray-50 focus:outline-none">
                  <option value="Mesero">Mesero</option>
                  <option value="Cajero">Cajero</option>
                  <option value="Barista">Barista</option>
                  <option value="Administrador">Administrador</option>
                </select>
              </div>
              <div>
                <label className="block mb-1 text-3xs uppercase text-gray-400">Permisos</label>
                <select value={formStaff.permisos}
                  onChange={e => setFormStaff({...formStaff, permisos: e.target.value})}
                  className="w-full p-2.5 border rounded-xl font-medium text-gray-800 bg-gray-50 focus:outline-none">
                  <option value="Basico">Basico (Operador)</option>
                  <option value="Total">Total (Supervisor)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-3xs uppercase text-gray-400">Horas Trabajadas</label>
                <input type="number" required value={formStaff.horas_trabajadas}
                  onChange={e => setFormStaff({...formStaff, horas_trabajadas: noNeg(e.target.value, formStaff.horas_trabajadas)})}
                  placeholder="40" className="w-full p-2.5 border rounded-xl font-mono text-gray-800 bg-gray-50 focus:outline-none" />
              </div>
              <div>
                <label className="block mb-1 text-3xs uppercase text-gray-400">Sueldo por Hora ($)</label>
                <input type="number" required value={formStaff.pago_hora}
                  onChange={e => setFormStaff({...formStaff, pago_hora: noNeg(e.target.value, formStaff.pago_hora)})}
                  placeholder="45.00" className="w-full p-2.5 border rounded-xl font-mono text-gray-800 bg-gray-50 focus:outline-none" />
              </div>
            </div>

            <div>
              <label className="block mb-1 text-3xs uppercase text-gray-400">Horario de Turno</label>
              <input type="text" required value={formStaff.horario}
                onChange={e => setFormStaff({...formStaff, horario: e.target.value})}
                placeholder="07:00 - 15:00" className="w-full p-2.5 border rounded-xl font-medium text-gray-800 bg-gray-50 focus:outline-none" />
            </div>

            {/* Contrasena */}
            <div className="border-t pt-4">
              <label className="block mb-1 text-3xs uppercase text-gray-400 flex items-center gap-1.5">
                <IconoClave />
                {formStaff.id_usuario ? 'Nueva Contrasena (vacio = sin cambios)' : 'Contrasena de Acceso *'}
              </label>
              <input type="password" value={formStaff.contrasena}
                onChange={e => setFormStaff({...formStaff, contrasena: e.target.value})}
                placeholder={formStaff.id_usuario ? 'Dejar vacio para conservar la actual' : 'Minimo 6 caracteres'}
                className="w-full p-2.5 border rounded-xl font-mono text-gray-800 bg-gray-50 focus:outline-none" />
            </div>

            {/* Error en linea */}
            {errorForm && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-3xs font-bold">
                {errorForm}
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t font-black uppercase text-2xs">
              <button type="button" onClick={() => setMostrarModal(false)}
                className="w-1/3 py-2.5 border rounded-xl text-gray-400 normal-case font-bold">
                Cancelar
              </button>
              <button type="submit" disabled={guardandoUsuario}
                className={`flex-1 py-2.5 rounded-xl shadow-sm tracking-wide text-white ${guardandoUsuario ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#8B5A2B] hover:bg-[#7A4F25]'}`}>
                {guardandoUsuario ? 'Guardando...' : 'Guardar Registro'}
              </button>
            </div>
          </form>
        </div>
      )}
      <DialogoUI />
    </div>
  )
}