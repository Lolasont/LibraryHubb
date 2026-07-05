// Toast — notificacion flotante de exito o error.
// Aparece en la esquina inferior derecha y se cierra sola a los pocos segundos.
// El componente padre es responsable de manejar el estado (useToast).

import PropTypes from 'prop-types'
import { CheckCircleIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/24/outline'

export function Toast({ toast, onClose }) {
  if (!toast) return null

  // Si el tipo no es "error", asumimos exito y mostramos verde.
  const isSuccess = toast.type !== 'error'
  const Icon = isSuccess ? CheckCircleIcon : XCircleIcon

  return (
    <div
      role="alert"
      className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3.5 rounded-xl shadow-xl text-white text-sm font-medium max-w-sm
        ${isSuccess ? 'bg-green-600' : 'bg-red-600'}`}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={onClose}
        className="text-white/70 hover:text-white transition-colors ml-1"
        aria-label="Cerrar"
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
    </div>
  )
}

Toast.propTypes = {
  toast: PropTypes.shape({
    message: PropTypes.string,
    type:    PropTypes.oneOf(['success', 'error']),
    id:      PropTypes.number,
  }),
  onClose: PropTypes.func.isRequired,
}
