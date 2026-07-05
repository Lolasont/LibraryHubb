// Utilidades compartidas por varias paginas del frontend.
// Son funciones puras (no hacen fetch, no usan estado) que se
// reutilizan para formatear fechas, montos y membresias.

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
