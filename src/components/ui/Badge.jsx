// Componentes de badges (etiquetas pequenas de estado).
// Hay dos variantes:
//   - Badge: un span con fondo de color segun el variant.
//   - DotBadge: un puntito de color + texto, ideal para indicar disponibilidad.

import PropTypes from 'prop-types'

/**
 * Badge — indicador visual de estado.
 * Variantes disponibles: success, danger, warning, info, default.
 */
export function Badge({ variant = 'default', children, className = '' }) {
  const variants = {
    success: 'bg-green-100 text-green-800',
    danger:  'bg-red-100 text-red-800',
    warning: 'bg-amber-100 text-amber-800',
    info:    'bg-blue-100 text-blue-800',
    default: 'bg-slate-100 text-slate-700',
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${variants[variant] ?? variants.default} ${className}`}
    >
      {children}
    </span>
  )
}

Badge.propTypes = {
  variant:   PropTypes.string,
  children:  PropTypes.node.isRequired,
  className: PropTypes.string,
}

/**
 * DotBadge — indicador compacto con punto de color.
 * Pensado para mostrar disponibilidad de un libro de un vistazo.
 */
export function DotBadge({ available, count }) {
  const pluralSuffix = count === 1 ? '' : 's'
  const availabilityText = available ? `${count} disponible${pluralSuffix}` : 'No disponible'

  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${available ? 'text-green-700' : 'text-red-600'}`}>
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${available ? 'bg-green-500' : 'bg-red-500'}`} />
      {availabilityText}
    </span>
  )
}

DotBadge.propTypes = {
  available: PropTypes.bool.isRequired,
  count:     PropTypes.number.isRequired,
}
