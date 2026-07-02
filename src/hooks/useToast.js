import { useState, useCallback } from 'react'

/**
 * Hook para manejar notificaciones toast.
 * Uso: const { toast, showToast } = useToast()
 *      showToast('Mensaje', 'success' | 'error')
 */
export function useToast() {
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() })
    setTimeout(() => setToast(null), 3500)
  }, [])

  const hideToast = useCallback(() => setToast(null), [])

  return { toast, showToast, hideToast }
}
