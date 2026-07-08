// Panel de control del bibliotecario.
// Gestiona prestamos, reservas, multas y miembros.
// El detalle de las tablas se separo en componentes para mantener este archivo mas ordenado.

import { useState, useEffect, useCallback } from 'react'
import {
  getTodosPrestamos,
  getTodasReservas,
  getTodasMultas,
  getMiembros,
  registrarDevolucion,
  getEstadoPrestamo,
} from '../../data/apiService'
import { Spinner } from '../../components/ui/Spinner'
import { Toast } from '../../components/ui/Toast'
import { useToast } from '../../hooks/useToast'
import {
  ClipboardDocumentListIcon, BookmarkIcon, BanknotesIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import {
  TABS,
  MetricaCard,
  TabPrestamos,
  TabReservas,
  TabMultas,
  TabMiembros,
} from '../../components/bibliotecario/BibliotecarioTabs'

export default function Bibliotecario() {
  const { toast, showToast, hideToast } = useToast()
  const [activeTab, setActiveTab] = useState('prestamos')

  // Guardamos todos los datos en un solo objeto para no tener 4 useState separados.
  const [datos,   setDatos]   = useState({ prestamos: [], reservas: [], multas: [], miembros: [] })
  const [loading, setLoading] = useState(true)

  // Carga todos los datos en paralelo. Es mas rapido que hacer 4 peticiones secuenciales.
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

  // Registramos la devolución y recargamos los datos para mantener la tabla sincronizada.
  const handleDevolucion = async (prestamoId) => {
    try {
      const result = await registrarDevolucion(prestamoId)
      showToast(result.mensaje, result.ok ? 'success' : 'error')
      if (result.ok) await cargar()
    } catch {
      showToast('Error al registrar la devolución', 'error')
    }
  }

  const { prestamos, reservas, multas, miembros } = datos
  // Contamos cuantos prestamos estan vencidos para la metrica destacada.
  const vencidos = prestamos.filter(p => getEstadoPrestamo(p) === 'vencido').length

  // Conteo por tab (lo mostramos como badge al lado de cada nombre).
  const conteo = { prestamos: prestamos.length, reservas: reservas.length, multas: multas.length, miembros: miembros.length }

  return (
    <div className="page-container">
      <Toast toast={toast} onClose={hideToast} />

      <div className="mb-6">
        <h1 className="page-title">Panel de control</h1>
        <p className="page-subtitle">Gestion de prestamos, reservas, multas y miembros</p>
      </div>

      {/* ── Fila de metricas ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricaCard label="Prestamos activos"  value={loading ? '—' : prestamos.length} icon={ClipboardDocumentListIcon} color="blue"  />
        <MetricaCard label="Vencidos"            value={loading ? '—' : vencidos}         icon={ExclamationTriangleIcon}   color={vencidos > 0 ? 'red' : 'slate'} />
        <MetricaCard label="Reservas en cola"    value={loading ? '—' : reservas.length}  icon={BookmarkIcon}              color="amber" />
        <MetricaCard label="Multas pendientes"   value={loading ? '—' : multas.length}    icon={BanknotesIcon}             color={multas.length > 0 ? 'red' : 'slate'} />
      </div>

      {/* ── Tabs ── */}
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
                {loading ? '...' : conteo[id]}
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
