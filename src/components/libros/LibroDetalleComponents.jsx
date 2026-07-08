import PropTypes from 'prop-types'
import {
  UserGroupIcon, ClockIcon, CheckCircleIcon,
} from '@heroicons/react/24/outline'

// Fila simple de la ficha tecnica (etiqueta + valor).
export function DetalleRow({ label, value }) {
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
export function DisponibilidadBar({ copiasDisponibles, cantidadCopias }) {
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
export function PanelAccion({ libro, reservas, miReserva, onPrestamo, onReserva, loading }) {
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

