// Servicio de conversion de moneda.
// Usa la API publica Frankfurter (gratuita, sin API key) para convertir
// montos a la moneda local (CLP) antes de persistir una multa.
// La conversion ocurre en el backend: el frontend sigue mostrando
// unicamente CLP, sin cambios.

const FRANKFURTER_BASE = 'https://api.frankfurter.dev/v2/rates'
const MONEDA_LOCAL      = 'CLP'
const TTL_MS            = 6 * 60 * 60 * 1000 // 6 horas (Frankfurter publica 1 vez al dia)
const TIMEOUT_MS        = 5000

// Cache en memoria del proceso. Se pierde al reiniciar el servidor,
// lo cual es aceptable dado el TTL corto.
let _cache = {
  tasas:     null, // Mapa { USD: 0.00107, EUR: 0.00098, ... }
  fecha:     null,
  timestamp: 0,
}

function cacheVigente() {
  return _cache.tasas !== null && (Date.now() - _cache.timestamp) < TTL_MS
}

/**
 * Obtiene las tasas de cambio con base en la moneda local, usando cache
 * si esta vigente. Nunca lanza: ante cualquier fallo devuelve {ok:false}.
 * @param {string} base - Moneda base (por defecto CLP)
 * @returns {Promise<{ok:true, tasas:object, fecha:string}|{ok:false, error:string}>}
 */
export async function obtenerTasas(base = MONEDA_LOCAL) {
  if (cacheVigente()) {
    return { ok: true, tasas: _cache.tasas, fecha: _cache.fecha }
  }

  const controller = new AbortController()
  const timeoutId  = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const url = `${FRANKFURTER_BASE}?base=${encodeURIComponent(base)}`
    const respuesta = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)

    if (!respuesta.ok) {
      return { ok: false, error: `Frankfurter respondio con estado ${respuesta.status}` }
    }

    const datos = await respuesta.json()

    // Frankfurter devuelve un array de objetos {date, base, quote, rate},
    // no un objeto con un mapa de tasas. Se transforma a mapa para uso comodo.
    if (!Array.isArray(datos)) {
      return { ok: false, error: 'Formato de respuesta inesperado de Frankfurter' }
    }

    const tasas = {}
    let fecha = null
    for (const item of datos) {
      if (item?.quote && typeof item.rate === 'number') {
        tasas[item.quote] = item.rate
        fecha = item.date ?? fecha
      }
    }

    _cache = { tasas, fecha, timestamp: Date.now() }
    return { ok: true, tasas, fecha }
  } catch (error) {
    clearTimeout(timeoutId)
    return { ok: false, error: error.message ?? 'Error desconocido al consultar Frankfurter' }
  }
}

/**
 * Convierte un monto desde una moneda de origen hacia la moneda local (CLP).
 * Si la moneda de origen ya es CLP, devuelve el monto sin hacer fetch.
 * @param {number} monto
 * @param {string} monedaOrigen
 * @returns {Promise<{ok:true, monto:number, tasa:number}|{ok:false, error:string}>}
 */
export async function convertirAmonedaLocal(monto, monedaOrigen) {
  if (monedaOrigen === MONEDA_LOCAL) {
    return { ok: true, monto, tasa: 1 }
  }

  const resultado = await obtenerTasas(MONEDA_LOCAL)
  if (!resultado.ok) {
    return { ok: false, error: resultado.error }
  }

  const tasa = resultado.tasas[monedaOrigen]
  if (typeof tasa !== 'number' || tasa <= 0) {
    return { ok: false, error: `No se encontro tasa para la moneda ${monedaOrigen}` }
  }

  // Frankfurter con base=CLP devuelve, por ejemplo, USD:0.00107
  // (1 CLP = 0.00107 USD). Para pasar de USD a CLP se divide por la tasa.
  const montoConvertido = monto / tasa
  return { ok: true, monto: Math.round(montoConvertido), tasa }
}

/**
 * Limpia la cache en memoria. Exportada para uso en tests.
 */
export function limpiarCache() {
  _cache = { tasas: null, fecha: null, timestamp: 0 }
}
