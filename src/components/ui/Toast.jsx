import { CheckCircleIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/24/outline'

/**
 * Toast — notificación flotante de éxito o error.
 * Recibe el objeto { message, type } del hook useToast.
 */
export function Toast({ toast, onClose }) {
  if (!toast) return null

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
