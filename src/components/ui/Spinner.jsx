import PropTypes from 'prop-types'

export function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }
  return (
    <span
      className={`inline-block rounded-full border-2 border-current border-t-transparent animate-spin ${sizes[size]} ${className}`}
      role="status"
      aria-label="Cargando"
    />
  )
}

Spinner.propTypes = {
  size:      PropTypes.string,
  className: PropTypes.string,
}

Spinner.defaultProps = {
  size:      'md',
  className: '',
}
