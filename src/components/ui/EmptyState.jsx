// Estado vacio reutilizable.
// Se muestra cuando una coleccion (libros, reservas, multas) esta vacia.
// Se le puede pasar un boton como action para invitar al usuario a hacer algo.

import PropTypes from 'prop-types'

export function EmptyState({ icon = '📭', title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-5xl mb-4 select-none">{icon}</span>
      <h3 className="text-base font-semibold text-slate-700 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 max-w-xs leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

EmptyState.propTypes = {
  icon:        PropTypes.string,
  title:       PropTypes.string.isRequired,
  description: PropTypes.string,
  action:      PropTypes.node,
}
