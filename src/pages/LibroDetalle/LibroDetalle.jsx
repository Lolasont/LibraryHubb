// Pagina de detalle de un libro.
// Muestra toda la informacion del libro y permite al socio pedir
// un prestamo o anotarse en la cola de reserva segun disponibilidad.

import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  getLibroById,
  getReservasByLibro,
  getReservasByMiembro,
  solicitarPrestamo,
  hacerReserva,
} from '../../data/apiService'
import { Badge } from '../../components/ui/Badge'
import { Toast } from '../../components/ui/Toast'
import { Spinner } from '../../components/ui/Spinner'
import { useToast } from '../../hooks/useToast'
import PropTypes from 'prop-types'
import {
  ArrowLeftIcon, BookOpenIcon, UserGroupIcon,
  ClockIcon, CheckCircleIcon, ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

// Fila simple de la ficha tecnica (etiqueta + valor).
function DetalleRow({ label, value }) {
  return (
    <div className="flex justify-between items-start gap-4 py-3 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-500 flex-shrink-0 w-28">{label}</span>
      <span className="text-sm font-medium text-slate-800 text-right">{value ?? '—'}</span>
    </div>
  )
}

DetalleRow.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
}

/**
 * Barra de disponibilidad.
 * Muestra cuantas copias quedan disponibles y una barra de progreso
 * que se llena proporcionalmente. Es reutilizada por la vista del
 * socio y la del bibliotecario para no duplicar codigo.
 */
function DisponibilidadBar({ copiasDisponibles, cantidadCopias }) {
  const disponible = copiasDisponibles > 0
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Disponibilidad</p>
      <div className="flex items-end gap-2">
        <span className={`text-4xl font-display font-bold ${disponible ? 'text-green-600' : 'text-red-500'}`}>
          {copiasDisponibles}
        </span>
        <span className="text-slate-400 text-sm pb-1.5">/ {cantidadCopias} copias</span>
      </div>
      <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${disponible ? 'bg-green-500' : 'bg-red-400'}`}
          style={{ width: `${(copiasDisponibles / cantidadCopias) * 100}%` }}
        />
      </div>
    </div>
  )
}

DisponibilidadBar.propTypes = {
  copiasDisponibles: PropTypes.number.isRequired,
  cantidadCopias:    PropTypes.number.isRequired,
}

// Panel con la disponibilidad + el boton de pedir prestamo o reservar.
// Solo lo ven los socios. El bibliotecario ve una version reducida.
function PanelAccion({ libro, reservas, miReserva, onPrestamo, onReserva, loading }) {
  const disponible    = libro.copias_disponibles > 0
  const totalReservas = reservas.length

  let actionButton
  if (disponible) {
    actionButton = (
      <button onClick={onPrestamo} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
        {loading
          ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Procesando...</>
          : <><CheckCircleIcon className="w-4 h-4" />Solicitar prestamo</>}
      </button>
    )
  } else if (miReserva) {
    actionButton = (
      <button disabled className="w-full py-2.5 px-5 rounded-lg bg-slate-100 text-slate-400 font-semibold text-sm cursor-not-allowed">
        Ya tienes una reserva
      </button>
    )
  } else {
    actionButton = (
      <button onClick={onReserva} disabled={loading} className="btn-secondary w-full flex items-center justify-center gap-2">
        {loading
          ? <><span className="w-4 h-4 border-2 border-slate-400/40 border-t-slate-600 rounded-full animate-spin" />Procesando...</>
          : <><ClockIcon className="w-4 h-4" />Reservar libro</>}
      </button>
    )
  }

  return (
    <div className="card p-6 flex flex-col gap-5">
      <DisponibilidadBar copiasDisponibles={libro.copias_disponibles} cantidadCopias={libro.cantidad_copias} />

      {/* Si hay gente esperando, avisamos cuantos son. */}
      {totalReservas > 0 && (
        <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2.5">
          <UserGroupIcon className="w-4 h-4 flex-shrink-0" />
          <span>{totalReservas} persona{totalReservas === 1 ? '' : 's'} en cola de espera</span>
        </div>
      )}

      {/* Si el socio ya tiene una reserva activa para este libro, le mostramos su posicion. */}
      {miReserva && (
        <div className="flex items-start gap-2 text-sm text-blue-700 bg-blue-50 rounded-lg px-3 py-2.5">
          <ClockIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Estas en posicion #{miReserva.posicion_cola}</p>
            <p className="text-blue-600 text-xs mt-0.5">
              Disponible aprox. el {new Date(miReserva.fecha_estimada_disponibilidad + 'T12:00:00')
                .toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>
      )}

      <div className="pt-1">
        {actionButton}
        {!disponible && !miReserva && (
          <p className="text-xs text-slate-400 text-center mt-2">Te notificaremos cuando este disponible</p>
        )}
      </div>
    </div>
  )
}

PanelAccion.propTypes = {
  libro: PropTypes.shape({
    copias_disponibles: PropTypes.number.isRequired,
    cantidad_copias:    PropTypes.number.isRequired,
  }).isRequired,
  reservas: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  })),
  miReserva: PropTypes.shape({
    posicion_cola:                 PropTypes.number,
    fecha_estimada_disponibilidad: PropTypes.string,
  }),
  onPrestamo: PropTypes.func.isRequired,
  onReserva:  PropTypes.func.isRequired,
  loading:    PropTypes.bool,
}

export default function LibroDetalle() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast, showToast, hideToast } = useToast()

  // Estados de los datos y de los flags de UI.
  const [libro,    setLibro]    = useState(null)
  const [reservas, setReservas] = useState([])
  const [miReserva, setMiReserva] = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [cargando, setCargando] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Carga toda la informacion de la pagina. Se ejecuta cada vez que
  // cambia el id o el usuario (por ejemplo, despues de un prestamo).
  const cargarDatos = useCallback(async () => {
    try {
      const l = await getLibroById(id)
      if (!l) { setNotFound(true); return }
      setLibro(l)
      const res = await getReservasByLibro(l.id)
      setReservas(res)
      if (user?.rol === 'miembro') {
        // Buscamos si este socio ya tiene una reserva para este libro.
        const misRes = await getReservasByMiembro()
        setMiReserva(misRes.find(r => r.libro_id === l.id) ?? null)
      }
    } catch {
      setNotFound(true)
    } finally {
      setCargando(false)
    }
  }, [id, user])

  useEffect(() => { cargarDatos() }, [cargarDatos])

  // Maneja la solicitud de prestamo.
  const handlePrestamo = async () => {
    setLoading(true)
    const result = await solicitarPrestamo(libro.id)
    setLoading(false)
    showToast(result.mensaje, result.ok ? 'success' : 'error')
    if (result.ok) cargarDatos()
  }

  // Maneja la creacion de una reserva.
  const handleReserva = async () => {
    setLoading(true)
    const result = await hacerReserva(libro.id)
    setLoading(false)
    showToast(result.mensaje, result.ok ? 'success' : 'error')
    if (result.ok) cargarDatos()
  }

  // Mientras se carga el libro, mostramos solo el spinner.
  if (cargando) return (
    <div className="page-container flex justify-center py-24">
      <Spinner size="lg" className="text-blue-500" />
    </div>
  )

  // Si el libro no existe, mostramos un mensaje y un boton para volver.
  if (notFound) return (
    <div className="page-container">
      <div className="flex flex-col items-center justify-center py-24">
        <ExclamationTriangleIcon className="w-12 h-12 text-slate-300 mb-4" />
        <h2 className="text-lg font-semibold text-slate-600">Libro no encontrado</h2>
        <button onClick={() => navigate('/libros')} className="btn-primary mt-5 text-sm">Volver al catalogo</button>
      </div>
    </div>
  )

  const esBibliotecario = user?.rol === 'bibliotecario'

  return (
    <div className="page-container">
      <Toast toast={toast} onClose={hideToast} />

      {/* Boton "Volver". Va al historial del navegador, asi respeta la pagina anterior. */}
      <button onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors group"
      >
        <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Volver al catalogo
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Encabezado del libro. */}
          <div className="card p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-blue-900 rounded-xl flex items-center justify-center flex-shrink-0">
                <BookOpenIcon className="w-7 h-7 text-white" />
              </div>
              <div className="min-w-0">
                <Badge variant="default" className="mb-2">{libro.categoria}</Badge>
                <h1 className="text-xl font-display font-bold text-blue-900 leading-tight">{libro.titulo}</h1>
                <p className="text-slate-500 mt-1 text-sm">{libro.autores.join(', ')}</p>
              </div>
            </div>
          </div>

          {/* Ficha tecnica. */}
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-1">Ficha tecnica</h2>
            <div className="mt-2">
              <DetalleRow label="Editorial"     value={libro.editorial} />
              <DetalleRow label="Ano"           value={libro.año_publicacion} />
              <DetalleRow label="Paginas"       value={libro.paginas ? `${libro.paginas} paginas` : null} />
              <DetalleRow label="ISBN"          value={libro.isbn} />
              <DetalleRow label="Categoria"     value={libro.categoria} />
              <DetalleRow label="Copias totales" value={`${libro.copias_disponibles} disponibles / ${libro.cantidad_copias} totales`} />
            </div>
          </div>
        </div>

        {/* Columna derecha: el panel de accion cambia segun el rol. */}
        <div>
          {esBibliotecario ? (
            <div className="card p-6">
              <DisponibilidadBar copiasDisponibles={libro.copias_disponibles} cantidadCopias={libro.cantidad_copias} />
              {reservas.length > 0 && (
                <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2.5 mt-4">
                  {reservas.length} persona{reservas.length === 1 ? '' : 's'} en cola
                </p>
              )}
            </div>
          ) : (
            <PanelAccion
              libro={libro} reservas={reservas} miReserva={miReserva}
              onPrestamo={handlePrestamo} onReserva={handleReserva} loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  )
}
