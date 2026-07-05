// Spinner — indicador de carga circular.
// Sirve para mostrar que una peticion a la API esta en curso.

import PropTypes from 'prop-types'

export function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }
  return (
    <output
      className={`inline-block rounded-full border-2 border-current border-t-transparent animate-spin ${sizes[size]} ${className}`}
      aria-label="Cargando"
    />
  )
}

Spinner.propTypes = {
  size:      PropTypes.string,
  className: PropTypes.string,
}
