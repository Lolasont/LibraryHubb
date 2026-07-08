import PropTypes from 'prop-types'
import {
  ClipboardDocumentListIcon, BookmarkIcon, BanknotesIcon,
  UsersIcon, CheckIcon, ClockIcon,
} from '@heroicons/react/24/outline'
import { Badge } from '../ui/Badge'
import { EmptyState } from '../ui/EmptyState'
import { formatDate, formatCLP } from '../../data/utils'
import { getEstadoPrestamo } from '../../data/apiService'

// Definicion de las 4 pestañas del panel.
export const TABS = [
  { id: 'prestamos', label: 'Prestamos',  icon: ClipboardDocumentListIcon },
  { id: 'reservas',  label: 'Reservas',   icon: BookmarkIcon              },
  { id: 'multas',    label: 'Multas',     icon: BanknotesIcon             },
  { id: 'miembros',  label: 'Miembros',   icon: UsersIcon                 },
]

// Tarjeta pequena con una metrica (numero grande + etiqueta).
export function MetricaCard({ label, value, icon: Icon, color }) {
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

MetricaCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon:  PropTypes.elementType.isRequired,
  color: PropTypes.string,
}

// Badge de estado para un prestamo (variante del bibliotecario).
function EstadoBadge({ prestamo }) {
  const estado = getEstadoPrestamo(prestamo)
  if (estado === 'vencido') return <Badge variant="danger">Vencido</Badge>
  if (estado === 'alerta')  return <Badge variant="warning">Por vencer</Badge>
  return <Badge variant="success">Al dia</Badge>
}

EstadoBadge.propTypes = {
  prestamo: PropTypes.shape({
    estado:                    PropTypes.string,
    fecha_devolucion_esperada: PropTypes.string,
  }).isRequired,
}

// ── Pestana: Prestamos ──
export function TabPrestamos({ prestamos, onDevolucion }) {
  if (prestamos.length === 0) return <EmptyState icon="✅" title="No hay prestamos activos" />
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            {['Libro', 'Miembro', 'Fecha prestamo', 'Vencimiento', 'Estado', ''].map(h => (
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
                <td className="py-3 px-4 text-slate-700">
                  {p.miembro_nombre ?? `#${p.miembro_id}`}
                  <span className="block text-[10px] text-slate-400 font-mono">#{p.miembro_id}</span>
                </td>
                <td className="py-3 px-4 text-slate-500">{formatDate(p.fecha_prestamo)}</td>
                <td className="py-3 px-4 text-slate-500">{formatDate(p.fecha_devolucion_esperada)}</td>
                <td className="py-3 px-4"><EstadoBadge prestamo={p} /></td>
                <td className="py-3 px-4">
                  <button onClick={() => onDevolucion(p.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <CheckIcon className="w-3.5 h-3.5" />Registrar devolucion
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

TabPrestamos.propTypes = {
  prestamos: PropTypes.arrayOf(PropTypes.shape({
    id:                        PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    libro_titulo:              PropTypes.string,
    miembro_id:                PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    fecha_prestamo:            PropTypes.string,
    fecha_devolucion_esperada: PropTypes.string,
    estado:                    PropTypes.string,
  })).isRequired,
  onDevolucion: PropTypes.func.isRequired,
}

// ── Pestana: Reservas ──
export function TabReservas({ reservas }) {
  if (reservas.length === 0) return <EmptyState icon="🔖" title="No hay reservas activas" />
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            {['Libro', 'Miembro', 'Posicion', 'Fecha reserva', 'Disponible aprox.'].map(h => (
              <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide py-3 px-4">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {reservas.map(r => (
            <tr key={r.id} className="hover:bg-slate-50 transition-colors">
              <td className="py-3 px-4 font-medium text-slate-800 max-w-[180px]"><span className="line-clamp-1">{r.libro_titulo}</span></td>
              <td className="py-3 px-4 text-slate-700">
                {r.miembro_nombre ?? `#${r.miembro_id}`}
                <span className="block text-[10px] text-slate-400 font-mono">#{r.miembro_id}</span>
              </td>
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

TabReservas.propTypes = {
  reservas: PropTypes.arrayOf(PropTypes.shape({
    id:                            PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    libro_titulo:                  PropTypes.string,
    miembro_id:                    PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    posicion_cola:                 PropTypes.number,
    fecha_reserva:                 PropTypes.string,
    fecha_estimada_disponibilidad: PropTypes.string,
  })).isRequired,
}

// ── Pestana: Multas ──
export function TabMultas({ multas }) {
  if (multas.length === 0) return <EmptyState icon="💚" title="No hay multas pendientes" />
  // Total acumulado de todas las multas pendientes.
  const total = multas.reduce((s, m) => s + m.monto, 0)
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              {['ID Multa', 'Prestamo', 'Miembro', 'Monto (CLP)', 'Estado'].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide py-3 px-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {multas.map(m => (
              <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-3 px-4 text-slate-500">#{m.id}</td>
                <td className="py-3 px-4 text-slate-500">#{m.prestamo_id}</td>
                <td className="py-3 px-4 text-slate-700">
                  {m.miembro_nombre ?? `#${m.miembro_id}`}
                  <span className="block text-[10px] text-slate-400 font-mono">#{m.miembro_id}</span>
                </td>
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

TabMultas.propTypes = {
  multas: PropTypes.arrayOf(PropTypes.shape({
    id:          PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    prestamo_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    miembro_id:  PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    monto:       PropTypes.number.isRequired,
  })).isRequired,
}

// ── Pestana: Miembros ──
export function TabMiembros({ miembros }) {
  if (miembros.length === 0) return <EmptyState icon="👥" title="No hay miembros registrados" />
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            {['Nombre', 'Cedula', 'Email', 'Estado'].map(h => (
              <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide py-3 px-4">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {miembros.map(m => (
            <tr key={m.id} className="hover:bg-slate-50 transition-colors">
              <td className="py-3 px-4">
                <div className="flex items-center gap-2.5">
                  {/* Inicial del nombre como avatar. */}
                  <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-800">
                    {m.nombre.charAt(0)}
                  </div>
                  <span className="font-medium text-slate-800">{m.nombre}</span>
                </div>
              </td>
              <td className="py-3 px-4 text-slate-500 font-mono text-xs">{m.cedula}</td>
              <td className="py-3 px-4 text-slate-500">{m.email ?? '—'}</td>
              <td className="py-3 px-4">
                <Badge variant={m.estado === 'activo' ? 'success' : 'danger'}>
                  {m.estado.charAt(0).toUpperCase() + m.estado.slice(1)}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

TabMiembros.propTypes = {
  miembros: PropTypes.arrayOf(PropTypes.shape({
    id:             PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    nombre:         PropTypes.string.isRequired,
    cedula:         PropTypes.string,
    email:  PropTypes.string,
    estado: PropTypes.string.isRequired,
  })).isRequired,
}

