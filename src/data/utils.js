// Utilidades compartidas por varias paginas del frontend.
// Son funciones puras (no hacen fetch, no usan estado) que se
// reutilizan para formatear fechas, montos y el estado de los prestamos.

/**
 * Convierte una fecha a texto legible en espanol.
 * Por ejemplo: "2026-07-15" -> "15 de julio de 2026".
 *
 * Acepta dos formatos:
 * - "YYYY-MM-DD"              -> fecha simple (del seed o apiService)
 * - "YYYY-MM-DDTHH:mm:ss.sssZ" -> ISO completo que devuelve MongoDB
 *
 * Para fechas simples se fuerza la hora 12:00 para evitar que la zona
 * horaria desplace la fecha un dia. Para ISO completos se usa directamente.
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const esDateSimple = /^\d{4}-\d{2}-\d{2}$/.test(String(dateStr))
  const date = new Date(esDateSimple ? `${dateStr}T12:00:00` : dateStr)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Da formato a un monto como pesos chilenos.
 * Ej: 4000 -> "$ 4.000".
 */
export function formatCLP(amount) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Calcula cuantos dias faltan hasta una fecha.
 * Devuelve un numero negativo si la fecha ya paso.
 * Usa la misma logica de formatDate para manejar ambos formatos.
 */
export function getDiasRestantes(dateStr) {
  if (!dateStr) return null
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const esDateSimple = /^\d{4}-\d{2}-\d{2}$/.test(String(dateStr))
  const venc = new Date(esDateSimple ? `${dateStr}T12:00:00` : dateStr)
  if (Number.isNaN(venc.getTime())) return null
  return Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24))
}

/**
 * Calcula el estado visual de un prestamo ('vencido' | 'alerta' | 'activo')
 * segun los dias restantes hasta la fecha de devolucion esperada.
 * Reutiliza getDiasRestantes para no duplicar la logica de diferencia de fechas
 * (antes vivia en mockService.js, con su propio calculo de fechas).
 *
 * Nota: la version original tambien revisaba prestamo.estado === 'vencido'
 * y === 'devuelto' antes de mirar las fechas. Se verificó que ambas ramas
 * eran inalcanzables en la practica: el backend nunca asigna 'vencido' como
 * estado (solo 'activo'/'devuelto'), y los listados de prestamos siempre
 * excluyen los que ya tienen estado 'devuelto' antes de llegar aqui. Por eso
 * se simplifica a un calculo puro por fecha, sin cambiar el comportamiento.
 * Umbral de alerta: 5 dias o menos (igual que el original).
 */
export function getEstadoPrestamo(prestamo) {
  const dias = getDiasRestantes(prestamo?.fecha_devolucion_esperada)
  if (dias === null) return 'activo'
  if (dias < 0) return 'vencido'
  if (dias <= 5) return 'alerta'
  return 'activo'
}
