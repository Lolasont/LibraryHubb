// Pagina "Mis reservas".
// Lista las reservas activas del socio con su posicion en la cola
// y le permite cancelarlas.

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getReservasByMiembro, cancelarReserva } from '../../data/apiService'
import { EmptyState } from '../../components/ui/EmptyState'
import { Spinner } from '../../components/ui/Spinner'
import { Toast } from '../../components/ui/Toast'
import { useToast } from '../../hooks/useToast'
import { formatDate } from '../../data/utils'
import PropTypes from 'prop-types'
import { BookmarkIcon, ClockIcon, XMarkIcon, ArrowRightIcon, UserGroupIcon } from '@heroicons/react/24/outline'

// Tarjeta individual de una reserva.
function TarjetaReserva({ reserva, onCancelar, cancelando, onVerLibro }) {
  return (
    <div className="p-5 flex flex-col sm:flex-row sm:items-start gap-4">
      {/* Posicion en la cola, destacada con un circulo grande. */}
      <div className="flex-shrink-0 flex flex-col items-center gap-1">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
          <span className="text-blue-800 font-bold text-sm">#{reserva.posicion_cola}</span>
        </div>
        <span className="text-xs text-slate-400">en cola</span>
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm text-slate-900 leading-snug">{reserva.libro_titulo}</h3>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <BookmarkIcon className="w-3.5 h-3.5 text-slate-400" />
            Reservado el {formatDate(reserva.fecha_reserva)}
          </div>
          {reserva.fecha_estimada_disponibilidad && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600">
              <ClockIcon className="w-3.5 h-3.5" />
              Disponible aprox. el {formatDate(reserva.fecha_estimada_disponibilidad)}
            </div>
          )}
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 rounded px-2.5 py-1.5 w-fit">
          <UserGroupIcon className="w-3.5 h-3.5" />
            {(() => {
              if (reserva.posicion_cola === 1) return 'Seras el proximo en recibir este libro'
              const personasAntes = reserva.posicion_cola - 1
              const palabraPersona = personasAntes === 1 ? 'persona' : 'personas'
              return `Hay ${personasAntes} ${palabraPersona} antes que tu`
            })()}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button onClick={() => onVerLibro(reserva.libro_id)}
          className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1"
        >
          Ver libro<ArrowRightIcon className="w-3 h-3" />
        </button>
        <button onClick={() => onCancelar(reserva.id)} disabled={cancelando === reserva.id}
          className="btn-danger text-xs py-1.5 px-3 flex items-center gap-1.5"
        >
          {cancelando === reserva.id
            ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            : <XMarkIcon className="w-3.5 h-3.5" />}
          Cancelar
        </button>
      </div>
    </div>
  )
}

TarjetaReserva.propTypes = {
  reserva: PropTypes.shape({
    id:                            PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    libro_id:                      PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    libro_titulo:                  PropTypes.string,
    posicion_cola:                 PropTypes.number.isRequired,
    fecha_reserva:                 PropTypes.string,
    fecha_estimada_disponibilidad: PropTypes.string,
  }).isRequired,
  onCancelar: PropTypes.func.isRequired,
  cancelando: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onVerLibro: PropTypes.func.isRequired,
}

export default function MisReservas() {
  const navigate = useNavigate()
  const { toast, showToast, hideToast } = useToast()

  const [reservas,   setReservas]   = useState([])
  const [loading,    setLoading]    = useState(true)
  // Guarda el id de la reserva que se esta cancelando, para mostrar un spinner solo en ella.
  const [cancelando, setCancelando] = useState(null)

  const cargar = useCallback(async () => {
    try {
      const data = await getReservasByMiembro()
      setReservas(data)
    } catch {
      setReservas([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const handleCancelar = async (reservaId) => {
    setCancelando(reservaId)
    const result = await cancelarReserva(reservaId)
    setCancelando(null)
    showToast(result.mensaje, result.ok ? 'success' : 'error')
    if (result.ok) cargar()
  }

  let contenidoReservas
  if (loading) {
    contenidoReservas = (
      <div className="flex justify-center py-16"><Spinner size="lg" className="text-blue-500" /></div>
    )
  } else if (reservas.length === 0) {
    contenidoReservas = (
      <EmptyState
        icon="🔖" title="No tienes reservas activas"
        description="Cuando reserves un libro sin copias disponibles, aparecera aqui."
        action={<button onClick={() => navigate('/libros')} className="btn-primary text-sm">Buscar libros</button>}
      />
    )
  } else {
    contenidoReservas = (
      <div className="divide-y divide-slate-100">
        {reservas.map(reserva => (
          <TarjetaReserva
            key={reserva.id}
            reserva={reserva}
            onCancelar={handleCancelar}
            cancelando={cancelando}
            onVerLibro={(id) => navigate(`/libros/${id}`)}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="page-container">
      <Toast toast={toast} onClose={hideToast} />

      <div className="mb-6">
        <h1 className="page-title">Mis reservas</h1>
        <p className="page-subtitle">Libros que has reservado y tu posicion en la cola de espera</p>
      </div>

      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-800">Reservas activas</h2>
            <p className="text-xs text-slate-500 mt-0.5">
                {(() => {
                  const isSingular = reservas.length === 1
                  if (loading) return 'Cargando...'
                  return `${reservas.length} reserva${isSingular ? '' : 's'} pendiente${isSingular ? '' : 's'}`
                })()}
            </p>
          </div>
          {!loading && reservas.length > 0 && (
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full hidden sm:inline">
              Recibiras una notificacion cuando tu libro este disponible
            </span>
          )}
        </div>

        {contenidoReservas}
      </div>
    </div>
  )
}
