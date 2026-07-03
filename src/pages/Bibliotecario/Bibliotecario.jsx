import { useState, useEffect, useCallback } from 'react'
import {
  getTodosPrestamos,
  getTodasReservas,
  getTodasMultas,
  getMiembros,
  registrarDevolucion,
  getEstadoPrestamo,
} from '../../data/apiService'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { Spinner } from '../../components/ui/Spinner'
import { Toast } from '../../components/ui/Toast'
import { useToast } from '../../hooks/useToast'
import { formatDate, formatCLP, getMembresiaInfo } from '../../data/utils'
import {
  ClipboardDocumentListIcon, BookmarkIcon, BanknotesIcon,
  UsersIcon, CheckIcon, ExclamationTriangleIcon, ClockIcon,
} from '@heroicons/react/24/outline'

const TABS = [
  { id: 'prestamos', label: 'Préstamos',  icon: ClipboardDocumentListIcon },
  { id: 'reservas',  label: 'Reservas',   icon: BookmarkIcon              },
  { id: 'multas',    label: 'Multas',     icon: BanknotesIcon             },
  { id: 'miembros',  label: 'Miembros',   icon: UsersIcon                 },
]

function MetricaCard({ label, value, icon: Icon, color }) {
  const colors = {
    blue:  { bg: 'bg-blue-50',  icon: 'text-blue-600',  val: 'text-blue-900'  },
    red:   { bg: 'bg-red-50',   icon: 'text-red-500',   val: 'text-red-800'   },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600', val: 'text-amber-900' },
    slate: { bg: 'bg-slate-50', icon: 'text-slate-500', val: 'text-slate-800' },
  }
  const c = colors[color] ?? colors.blue
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-10 h-10 ${c.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${c.icon}`} />
      </div>
      <div>
        <p className={`text-2xl font-display font-bold ${c.val}`}>{value}</p>
        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

function EstadoBadge({ prestamo }) {
  const estado = getEstadoPrestamo(prestamo)
  if (estado === 'vencido') return <Badge variant="danger">Vencido</Badge>
  if (estado === 'alerta')  return <Badge variant="warning">Por vencer</Badge>
  return <Badge variant="success">Al día</Badge>
}

function TabPrestamos({ prestamos, onDevolucion }) {
  if (prestamos.length === 0) return <EmptyState icon="✅" title="No hay préstamos activos" />
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            {['Libro', 'Miembro', 'Fecha préstamo', 'Vencimiento', 'Estado', ''].map(h => (
              <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide py-3 px-4">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {prestamos.map(p => {
            const estado = getEstadoPrestamo(p)
            return (
              <tr key={p.id} className={`hover:bg-slate-50 transition-colors ${estado === 'vencido' ? 'bg-red-50/30' : ''}`}>
                <td className="py-3 px-4 font-medium text-slate-800 max-w-[180px]"><span className="line-clamp-1">{p.libro_titulo}</span></td>
                <td className="py-3 px-4 text-slate-500">#{p.miembro_id}</td>
                <td className="py-3 px-4 text-slate-500">{formatDate(p.fecha_prestamo)}</td>
                <td className="py-3 px-4 text-slate-500">{formatDate(p.fecha_devolucion_esperada)}</td>
                <td className="py-3 px-4"><EstadoBadge prestamo={p} /></td>
                <td className="py-3 px-4">
                  <button onClick={() => onDevolucion(p.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <CheckIcon className="w-3.5 h-3.5" />Registrar devolución
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function TabReservas({ reservas }) {
  if (reservas.length === 0) return <EmptyState icon="🔖" title="No hay reservas activas" />
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            {['Libro', 'Miembro', 'Posición', 'Fecha reserva', 'Disponible aprox.'].map(h => (
              <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide py-3 px-4">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {reservas.map(r => (
            <tr key={r.id} className="hover:bg-slate-50 transition-colors">
              <td className="py-3 px-4 font-medium text-slate-800 max-w-[180px]"><span className="line-clamp-1">{r.libro_titulo}</span></td>
              <td className="py-3 px-4 text-slate-500">#{r.miembro_id}</td>
              <td className="py-3 px-4">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                  #{r.posicion_cola} en cola
                </span>
              </td>
              <td className="py-3 px-4 text-slate-500">{formatDate(r.fecha_reserva)}</td>
              <td className="py-3 px-4">
                <span className="flex items-center gap-1.5 text-amber-700">
                  <ClockIcon className="w-3.5 h-3.5" />{formatDate(r.fecha_estimada_disponibilidad)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TabMultas({ multas }) {
  if (multas.length === 0) return <EmptyState icon="💚" title="No hay multas pendientes" />
  const total = multas.reduce((s, m) => s + m.monto, 0)
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              {['ID Multa', 'Préstamo', 'Miembro', 'Monto (CLP)', 'Estado'].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide py-3 px-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {multas.map(m => (
              <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-3 px-4 text-slate-500">#{m.id}</td>
                <td className="py-3 px-4 text-slate-500">#{m.prestamo_id}</td>
                <td className="py-3 px-4 text-slate-500">#{m.miembro_id}</td>
                <td className="py-3 px-4 font-semibold text-red-700">{formatCLP(m.monto)}</td>
                <td className="py-3 px-4"><Badge variant="danger">Pendiente</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-slate-100 px-5 py-4 flex justify-between items-center bg-red-50/30">
        <span className="text-sm text-slate-600 font-medium">Total multas pendientes</span>
        <span className="font-bold text-red-700">{formatCLP(total)}</span>
      </div>
    </div>
  )
}

function TabMiembros({ miembros }) {
  if (miembros.length === 0) return <EmptyState icon="👥" title="No hay miembros registrados" />
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            {['Nombre', 'Cédula', 'Email', 'Membresía', 'Estado'].map(h => (
              <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide py-3 px-4">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {miembros.map(m => {
            const { label, variant } = getMembresiaInfo(m.tipo_membresia)
            return (
              <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-800">
                      {m.nombre.charAt(0)}
                    </div>
                    <span className="font-medium text-slate-800">{m.nombre}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-slate-500 font-mono text-xs">{m.cedula}</td>
                <td className="py-3 px-4 text-slate-500">{m.email ?? '—'}</td>
                <td className="py-3 px-4"><Badge variant={variant}>{label}</Badge></td>
                <td className="py-3 px-4">
                  <Badge variant={m.estado === 'activo' ? 'success' : 'danger'}>
                    {m.estado.charAt(0).toUpperCase() + m.estado.slice(1)}
                  </Badge>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function Bibliotecario() {
  const { toast, showToast, hideToast } = useToast()
  const [activeTab, setActiveTab] = useState('prestamos')

  const [datos,   setDatos]   = useState({ prestamos: [], reservas: [], multas: [], miembros: [] })
  const [loading, setLoading] = useState(true)

  const cargar = useCallback(async () => {
    try {
      const [prestamos, reservas, multas, miembros] = await Promise.all([
        getTodosPrestamos(),
        getTodasReservas(),
        getTodasMultas(),
        getMiembros(),
      ])
      setDatos({ prestamos, reservas, multas, miembros })
    } catch {
      setDatos({ prestamos: [], reservas: [], multas: [], miembros: [] })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const handleDevolucion = async (prestamoId) => {
    const result = await registrarDevolucion(prestamoId)
    showToast(result.mensaje, result.ok ? 'success' : 'error')
    if (result.ok) cargar()
  }

  const { prestamos, reservas, multas, miembros } = datos
  const vencidos = prestamos.filter(p => getEstadoPrestamo(p) === 'vencido').length

  const conteo = { prestamos: prestamos.length, reservas: reservas.length, multas: multas.length, miembros: miembros.length }

  return (
    <div className="page-container">
      <Toast toast={toast} onClose={hideToast} />

      <div className="mb-6">
        <h1 className="page-title">Panel de control</h1>
        <p className="page-subtitle">Gestión de préstamos, reservas, multas y miembros</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricaCard label="Préstamos activos"  value={loading ? '—' : prestamos.length} icon={ClipboardDocumentListIcon} color="blue"  />
        <MetricaCard label="Vencidos"            value={loading ? '—' : vencidos}         icon={ExclamationTriangleIcon}   color={vencidos > 0 ? 'red' : 'slate'} />
        <MetricaCard label="Reservas en cola"    value={loading ? '—' : reservas.length}  icon={BookmarkIcon}              color="amber" />
        <MetricaCard label="Multas pendientes"   value={loading ? '—' : multas.length}    icon={BanknotesIcon}             color={multas.length > 0 ? 'red' : 'slate'} />
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="flex border-b border-slate-100 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === id
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === id ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                {loading ? '…' : conteo[id]}
              </span>
            </button>
          ))}
        </div>

        <div className="py-2">
          {loading ? (
            <div className="flex justify-center py-16"><Spinner size="lg" className="text-blue-500" /></div>
          ) : (
            <>
              {activeTab === 'prestamos' && <TabPrestamos prestamos={prestamos} onDevolucion={handleDevolucion} />}
              {activeTab === 'reservas'  && <TabReservas  reservas={reservas} />}
              {activeTab === 'multas'    && <TabMultas    multas={multas} />}
              {activeTab === 'miembros'  && <TabMiembros  miembros={miembros} />}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
