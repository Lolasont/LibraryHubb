// ============================================================
// UTILIDADES COMPARTIDAS DE FORMATO — usadas por varios routers
// ============================================================

/**
 * Convierte una fecha (Date o string) a formato YYYY-MM-DD.
 * Retorna null si la fecha es nula/indefinida.
 */
export function toDate(fecha) {
  return fecha ? new Date(fecha).toISOString().split('T')[0] : null
}
