// ============================================================
// UTILIDADES DE FORMATO — compartidas entre vistas
// ============================================================

/**
 * Formatea una fecha ISO (YYYY-MM-DD) a texto legible en español.
 * Ej: "2026-07-15" → "15 de julio de 2026"
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—'
  // Forzar hora 12:00 para evitar desfases de zona horaria
  const date = new Date(dateStr + 'T12:00:00')
  return date.toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Formatea un monto en Pesos Chilenos.
 * Ej: 4000 → "$ 4.000"
 */
export function formatCLP(amount) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Calcula días restantes hasta una fecha.
 * Retorna número negativo si ya venció.
 */
export function getDiasRestantes(dateStr) {
  if (!dateStr) return null
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const venc = new Date(dateStr + 'T12:00:00')
  return Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24))
}

/**
 * Tasas de cambio aproximadas desde CLP (base).
 * NOTA: En producción reemplazar con llamada a API de tipo de cambio.
 * Ej: https://open.er-api.com/v6/latest/CLP
 */
export const TASAS_CAMBIO = {
  CLP: { simbolo: '$',  nombre: 'Peso Chileno',   tasa: 1 },
  USD: { simbolo: 'US$', nombre: 'Dólar (USD)',    tasa: 0.00105 },
  EUR: { simbolo: '€',  nombre: 'Euro (EUR)',      tasa: 0.00097 },
  ARS: { simbolo: 'AR$',nombre: 'Peso Argentino',  tasa: 1.05    },
}

/**
 * Convierte un monto CLP a otra moneda.
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
 * Etiqueta de membresía con colores.
 */
export function getMembresiaInfo(tipo) {
  const map = {
    basica:     { label: 'Básica',     variant: 'info'       },
    premium:    { label: 'Premium',    variant: 'premium'    },
    estudiante: { label: 'Estudiante', variant: 'estudiante' },
  }
  return map[tipo] ?? { label: tipo, variant: 'default' }
}
