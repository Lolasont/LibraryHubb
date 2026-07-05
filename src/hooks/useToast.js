// Hook que maneja las notificaciones toast de toda la aplicacion.
// Un toast es un mensaje chico que aparece en una esquina y se
// cierra solo despues de unos segundos.
//
// Uso tipico:
//   const { toast, showToast, hideToast } = useToast()
//   showToast('Guardado correctamente', 'success')
//   <Toast toast={toast} onClose={hideToast} />

import { useState, useCallback } from 'react'

export function useToast() {
  // toast es null cuando no hay nada para mostrar.
  // Cuando hay algo, tiene la forma { message, type, id }.
  const [toast, setToast] = useState(null)

  // Muestra un toast nuevo. type puede ser "success" o "error".
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() })
    // A los 3.5 segundos lo cerramos automaticamente.
    setTimeout(() => setToast(null), 3500)
  }, [])

  // Cierra el toast manualmente (cuando el usuario aprieta la X).
  const hideToast = useCallback(() => setToast(null), [])

  return { toast, showToast, hideToast }
}
