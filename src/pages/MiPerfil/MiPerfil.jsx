import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  getPrestamosActivos,
  getMultasByMiembro,
  renovarPrestamo,
  getEstadoPrestamo,
} from '../../data/apiService'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { Spinner } from '../../components/ui/Spinner'
import { Toast } from '../../components/ui/Toast'
import { useToast } from '../../hooks/useToast'
import {
  formatDate, formatCLP, getDiasRestantes,
  getMembresiaInfo, TASAS_CAMBIO, convertirCLP,
} from '../../data/utils'
import {
  UserCircleIcon, EnvelopeIcon, PhoneIcon, MapPinIcon,
  CalendarDaysIcon, ArrowPathIcon, ExclamationTriangleIcon, BanknotesIcon,
} from '@heroicons/react/24/outline'

function EstadoPrestamoBadge({ prestamo }) {
  const estado = getEstadoPrestamo(prestamo)
  const dias   = getDiasRestantes(prestamo.fecha_devolucion_esperada)
  if (estado === 'vencido') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
      Vencido ({Math.abs(dias)} día{Math.abs(dias) !== 1 ? 's' : ''})
    </span>
  )
  if (estado === 'alerta') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
      Vence en {dias} día{dias !== 1 ? 's' : ''}
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
      {dias} días restantes
    </span>
  )
}

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <Icon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-800 mt-0.5">{value}</p>
      </div>
    </div>
  )
}

function ConvertidorMultas({ montoCLP }) {
  const [moneda, setMoneda] = useState('CLP')
  const resultado = convertirCLP(montoCLP, moneda)
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-lg font-bold text-red-600">{resultado?.formateado}</span>
      <select value={moneda} onChange={e => setMoneda(e.target.value)}
        className="text-xs border border-slate-200 rounded px-2 py-1 bg-white text-slate-600 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-400"
      >
        {Object.entries(TASAS_CAMBIO).map(([code, info]) => (
          <option key={code} value={code}>{code} — {info.nombre}</option>
        ))}
      </select>
    </div>
  )
}

export default function MiPerfil() {
  const { user } = useAuth()
  const { toast, showToast, hideToast } = useToast()

  const [prestamos, setPrestamos] = useState([])
  const [multas,    setMultas]    = useState([])
  const [loading,   setLoading]   = useState(true)

  const cargar = useCallback(async () => {
    try {
      const [p, m] = await Promise.all([
        getPrestamosActivos(),
        getMultasByMiembro(),
      ])
      setPrestamos(p)
      setMultas(m)
    } catch {
      setPrestamos([])
      setMultas([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const handleRenovar = async (prestamoId) => {
    const result = await renovarPrestamo(prestamoId)
    showToast(result.mensaje, result.ok ? 'success' : 'error')
    if (result.ok) cargar()
  }

  const { label: membresiaLabel, variant: membresiaVariant } = getMembresiaInfo(user.tipo_membresia)
  const totalMultas = multas.reduce((sum, m) => sum + m.monto, 0)

  return (
    <div className="page-container">
      <Toast toast={toast} onClose={hideToast} />

      <div className="mb-6">
        <h1 className="page-title">Mi perfil</h1>
        <p className="page-subtitle">Datos personales, préstamos activos y multas</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Columna izquierda */}
        <div className="flex flex-col gap-4">
          <div className="card p-6">
            <div className="flex flex-col items-center text-center pb-5 border-b border-slate-100">
              <div className="w-16 h-16 bg-blue-900 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-3">
                {user.nombre.charAt(0)}
              </div>
              <h2 className="font-semibold text-slate-900">{user.nombre}</h2>
              <p className="text-xs text-slate-500 mt-0.5">Cédula: {user.cedula}</p>
              <Badge variant={membresiaVariant} className="mt-2">Membresía {membresiaLabel}</Badge>
            </div>
            <div className="pt-4">
              <InfoRow icon={EnvelopeIcon}     label="Correo electrónico" value={user.email} />
              <InfoRow icon={PhoneIcon}        label="Teléfono"           value={user.telefono} />
              <InfoRow icon={MapPinIcon}       label="Dirección"          value={user.direccion} />
              <InfoRow icon={CalendarDaysIcon} label="Miembro desde"      value={formatDate(user.fecha_registro)} />
            </div>
          </div>

          {multas.length > 0 && (
            <div className="card p-5 border-red-200 bg-red-50/50">
              <div className="flex items-center gap-2 mb-3">
                <BanknotesIcon className="w-5 h-5 text-red-500" />
                <h3 className="font-semibold text-red-800 text-sm">Multas pendientes</h3>
              </div>
              <div className="space-y-3">
                {multas.map(multa => (
                  <div key={multa.id} className="bg-white rounded-lg border border-red-200 p-3">
                    <p className="text-xs text-slate-500 mb-1">Préstamo #{multa.prestamo_id}</p>
                    <ConvertidorMultas montoCLP={multa.monto} />
                  </div>
                ))}
              </div>
              {multas.length > 1 && (
                <div className="mt-3 pt-3 border-t border-red-200 flex justify-between items-center">
                  <span className="text-xs text-red-700 font-medium">Total pendiente</span>
                  <span className="font-bold text-red-700">{formatCLP(totalMultas)}</span>
                </div>
              )}
              <p className="text-xs text-red-500 mt-3">* Acércate a la biblioteca para regularizar tus multas.</p>
            </div>
          )}
        </div>

        {/* Columna derecha */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">Préstamos activos</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {loading ? 'Cargando...' : `${prestamos.length} préstamo${prestamos.length !== 1 ? 's' : ''} vigente${prestamos.length !== 1 ? 's' : ''}`}
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center py-16"><Spinner size="lg" className="text-blue-500" /></div>
            ) : prestamos.length === 0 ? (
              <EmptyState icon="📚" title="No tienes préstamos activos" description="Visita el catálogo para buscar libros y solicitar préstamos." />
            ) : (
              <div className="divide-y divide-slate-100">
                {prestamos.map(prestamo => {
                  const estadoVisual = getEstadoPrestamo(prestamo)
                  const esVencido    = estadoVisual === 'vencido'
                  return (
                    <div key={prestamo.id} className={`p-5 flex flex-col sm:flex-row sm:items-start gap-4 ${esVencido ? 'bg-red-50/40' : ''}`}>
                      <div className="flex-shrink-0">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${esVencido ? 'bg-red-100' : estadoVisual === 'alerta' ? 'bg-amber-100' : 'bg-blue-50'}`}>
                          {esVencido
                            ? <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                            : <UserCircleIcon className="w-5 h-5 text-blue-500" />}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-slate-900 leading-snug">{prestamo.libro_titulo}</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                          <span className="text-xs text-slate-500">Prestado el {formatDate(prestamo.fecha_prestamo)}</span>
                          <span className="text-xs text-slate-300">·</span>
                          <span className="text-xs text-slate-500">Vence el {formatDate(prestamo.fecha_devolucion_esperada)}</span>
                        </div>
                        <div className="mt-2"><EstadoPrestamoBadge prestamo={prestamo} /></div>
                      </div>
                      <div className="flex-shrink-0">
                        <button onClick={() => handleRenovar(prestamo.id)}
                          className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                        >
                          <ArrowPathIcon className="w-3.5 h-3.5" />Renovar
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
