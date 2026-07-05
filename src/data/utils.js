// Utilidades compartidas por varias paginas del frontend.
// Son funciones puras (no hacen fetch, no usan estado) que se
// reutilizan para formatear fechas, montos y membresias.

/**
 * Convierte una fecha en formato ISO (YYYY-MM-DD) a un texto legible
 * en espanol. Por ejemplo: "2026-07-15" -> "15 de julio de 2026".
 *
 * Se fuerza la hora 12:00 para evitar que la zona horaria mueva
 * la fecha un dia antes o despues.
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const date = new Date(dateStr + 'T12:00:00')
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
 */
export function getDiasRestantes(dateStr) {
  if (!dateStr) return null
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const venc = new Date(dateStr + 'T12:00:00')
  return Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24))
}

// Tasas de cambio aproximadas desde CLP.
// NOTA: en produccion conviene reemplazarlas por una llamada real
// a una API de cotizacion (por ejemplo open.er-api.com).
export const TASAS_CAMBIO = {
  CLP: { simbolo: '$',   nombre: 'Peso Chileno',   tasa: 1       },
  USD: { simbolo: 'US$', nombre: 'Dolar (USD)',    tasa: 0.00105 },
  EUR: { simbolo: '€',   nombre: 'Euro (EUR)',     tasa: 0.00097 },
  ARS: { simbolo: 'AR$', nombre: 'Peso Argentino', tasa: 1.05    },
}

/**
 * Convierte un monto en CLP a otra moneda.
 * Devuelve un objeto con el monto convertido y su representacion formateada.
 */
export function convertirCLP(montoCLP, codigoDestino) {
  const info = TASAS_CAMBIO[codigoDestino]
  if (!info) return null
  const convertido = montoCLP * info.tasa
  return {
    monto: convertido,
    formateado:
      codigoDestino === 'CLP'
        ? formatCLP(montoCLP)
        : `${info.simbolo} ${convertido.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    nombre: info.nombre,
  }
}

/**
 * Devuelve la etiqueta y la variante de color para mostrar
 * el tipo de membresia de un socio.
 */
export function getMembresiaInfo(tipo) {
  const map = {
    basica:     { label: 'Basica',     variant: 'info'       },
    premium:    { label: 'Premium',    variant: 'premium'    },
    estudiante: { label: 'Estudiante', variant: 'estudiante' },
  }
  return map[tipo] ?? { label: tipo, variant: 'default' }
}
