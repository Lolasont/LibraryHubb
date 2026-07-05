// Funciones de formato compartidas por los routers del backend.

/**
 * Convierte una fecha (Date o string) a formato YYYY-MM-DD.
 * Devuelve null si la fecha es nula o indefinida.
 * Asi el frontend recibe fechas simples de procesar.
 */
export function toDate(fecha) {
  return fecha ? new Date(fecha).toISOString().split('T')[0] : null
}
