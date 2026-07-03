import { useState } from "react";
import {useAuth} from '../../context/AuthContext'
import {
  getPrestamosActivos,
  getMultasByMiembro,
  getEstadoPrestamo,
  renovarPrestamo,
} from '../../data/mockService'

export default function MiPerfil() {
  const {user} = useAuth()

  const [prestamos, setPrestamos] = useState(() =>
  getPrestamosActivos(user.id)
)

const multas = getMultasByMiembro(user.id)

const handleRenovar = (prestamoId) => {
  const resultado = renovarPrestamo(prestamoId)

  if (resultado.ok) {
    setPrestamos(getPrestamosActivos(user.id))
    alert(resultado.mensaje)
  } else {
    alert(resultado.mensaje)
  }
}

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Mi Perfil</h1>
        <p className="text-slate-600 mb-6">
          Revisa tus datos, préstamos activos y multas pendientes.
        </p>

        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Datos personales</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <p><strong>Nombre:</strong> {user.nombre}</p>
            <p><strong>Cédula:</strong> {user.cedula}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Membresía:</strong> {user.tipo_membresia}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Préstamos activos</h2>

          {prestamos.length > 0 ? (
            <div className="grid gap-4">
              {prestamos.map((prestamo) => {
                const estadoVisual = getEstadoPrestamo(prestamo)

                return (
                  <div
                    key={prestamo.id}
                    className="border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                  >
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {prestamo.libro_titulo}
                      </h3>
                      <p className="text-sm text-slate-500">
                        Préstamo: {prestamo.fecha_prestamo}
                      </p>
                      <p className="text-sm text-slate-500">
                        Vence: {prestamo.fecha_devolucion_esperada}
                      </p>
                    </div>

                    <div className="flex flex-col md:items-end gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          estadoVisual === 'vencido'
                            ? 'bg-red-100 text-red-700'
                            : estadoVisual === 'alerta'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {estadoVisual}
                      </span>

                      <button
                        onClick={() => handleRenovar(prestamo.id)}
                        className="px-4 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
                      >
                        Renovar
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-slate-500">No tienes préstamos activos.</p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Multas pendientes</h2>

          {multas.length > 0 ? (
            multas.map((multa) => (
              <div
                key={multa.id}
                className="border border-red-200 bg-red-50 rounded-xl p-4 text-red-700"
              >
                Monto pendiente: ${multa.monto.toLocaleString('es-CL')} CLP
              </div>
            ))
          ) : (
            <p className="text-slate-500">No tienes multas pendientes.</p>
          )}
        </div>
      </div>
    </div>
  )
}