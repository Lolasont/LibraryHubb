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

function TarjetaReserva({ reserva, onCancelar, cancelando, onVerLibro }) {
  return (
    <div className="p-5 flex flex-col sm:flex-row sm:items-start gap-4">
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
          {reserva.posicion_cola === 1
            ? 'Serás el próximo en recibir este libro'
            : `Hay ${reserva.posicion_cola - 1} persona${reserva.posicion_cola - 1 !== 1 ? 's' : ''} antes que tú`}
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
  reserva:    PropTypes.object.isRequired,
  onCancelar: PropTypes.func.isRequired,
  cancelando: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onVerLibro: PropTypes.func.isRequired,
}

export default function MisReservas() {
  const navigate = useNavigate()
  const { toast, showToast, hideToast } = useToast()

  const [reservas,   setReservas]   = useState([])
  const [loading,    setLoading]    = useState(true)
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

  return (
    <div className="page-container">
      <Toast toast={toast} onClose={hideToast} />

      <div className="mb-6">
        <h1 className="page-title">Mis reservas</h1>
        <p className="page-subtitle">Libros que has reservado y tu posición en la cola de espera</p>
      </div>

      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-800">Reservas activas</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {loading ? 'Cargando...' : `${reservas.length} reserva${reservas.length !== 1 ? 's' : ''} pendiente${reservas.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          {!loading && reservas.length > 0 && (
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full hidden sm:inline">
              Recibirás una notificación cuando tu libro esté disponible
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" className="text-blue-500" /></div>
        ) : reservas.length === 0 ? (
          <EmptyState
            icon="🔖" title="No tienes reservas activas"
            description="Cuando reserves un libro sin copias disponibles, aparecerá aquí."
            action={<button onClick={() => navigate('/libros')} className="btn-primary text-sm">Buscar libros</button>}
          />
        ) : (
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
        )}
      </div>
    </div>
  )
}
