// Pagina de detalle de un libro.
// Muestra la informacion del libro y permite pedir prestamo o reservar.

import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  getLibroById,
  getReservasByLibro,
  getReservasByMiembro,
  solicitarPrestamo,
  hacerReserva,
} from '../../data/apiService'
import { Badge } from '../../components/ui/Badge'
import { Toast } from '../../components/ui/Toast'
import { Spinner } from '../../components/ui/Spinner'
import { useToast } from '../../hooks/useToast'
import {
  ArrowLeftIcon, BookOpenIcon, ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import {
  DetalleRow,
  DisponibilidadBar,
  PanelAccion,
} from '../../components/libros/LibroDetalleComponents'

export default function LibroDetalle() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast, showToast, hideToast } = useToast()

  // Estados de los datos y de los flags de UI.
  const [libro,    setLibro]    = useState(null)
  const [reservas, setReservas] = useState([])
  const [miReserva, setMiReserva] = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [cargando, setCargando] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Carga toda la informacion de la pagina. Se ejecuta cada vez que
  // cambia el id o el usuario (por ejemplo, despues de un prestamo).
  const cargarDatos = useCallback(async () => {
    try {
      const l = await getLibroById(id)
      if (!l) { setNotFound(true); return }
      setLibro(l)
      const res = await getReservasByLibro(l.id)
      setReservas(res)
      if (user?.rol === 'miembro') {
        // Buscamos si este socio ya tiene una reserva para este libro.
        const misRes = await getReservasByMiembro()
        setMiReserva(misRes.find(r => r.libro_id === l.id) ?? null)
      }
    } catch {
      setNotFound(true)
    } finally {
      setCargando(false)
    }
  }, [id, user])

  useEffect(() => { cargarDatos() }, [cargarDatos])

  // Maneja la solicitud de prestamo.
  const handlePrestamo = async () => {
    setLoading(true)
    const result = await solicitarPrestamo(libro.id)
    setLoading(false)
    showToast(result.mensaje, result.ok ? 'success' : 'error')
    if (result.ok) cargarDatos()
  }

  // Maneja la creacion de una reserva.
  const handleReserva = async () => {
    setLoading(true)
    const result = await hacerReserva(libro.id)
    setLoading(false)
    showToast(result.mensaje, result.ok ? 'success' : 'error')
    if (result.ok) cargarDatos()
  }

  // Mientras se carga el libro, mostramos solo el spinner.
  if (cargando) return (
    <div className="page-container flex justify-center py-24">
      <Spinner size="lg" className="text-blue-500" />
    </div>
  )

  // Si el libro no existe, mostramos un mensaje y un boton para volver.
  if (notFound) return (
    <div className="page-container">
      <div className="flex flex-col items-center justify-center py-24">
        <ExclamationTriangleIcon className="w-12 h-12 text-slate-300 mb-4" />
        <h2 className="text-lg font-semibold text-slate-600">Libro no encontrado</h2>
        <button onClick={() => navigate('/libros')} className="btn-primary mt-5 text-sm">Volver al catalogo</button>
      </div>
    </div>
  )

  const esBibliotecario = user?.rol === 'bibliotecario'

  return (
    <div className="page-container">
      <Toast toast={toast} onClose={hideToast} />

      {/* Boton "Volver". Va al historial del navegador, asi respeta la pagina anterior. */}
      <button onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors group"
      >
        <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Volver al catalogo
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Encabezado del libro. */}
          <div className="card p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-blue-900 rounded-xl flex items-center justify-center flex-shrink-0">
                <BookOpenIcon className="w-7 h-7 text-white" />
              </div>
              <div className="min-w-0">
                <Badge variant="default" className="mb-2">{libro.categoria}</Badge>
                <h1 className="text-xl font-display font-bold text-blue-900 leading-tight">{libro.titulo}</h1>
                <p className="text-slate-500 mt-1 text-sm">{libro.autores.join(', ')}</p>
              </div>
            </div>
          </div>

          {/* Ficha tecnica. */}
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-1">Ficha tecnica</h2>
            <div className="mt-2">
              <DetalleRow label="Editorial"     value={libro.editorial} />
              <DetalleRow label="Año"           value={libro.año_publicacion} />
              <DetalleRow label="Paginas"       value={libro.paginas ? `${libro.paginas} paginas` : null} />
              <DetalleRow label="ISBN"          value={libro.isbn} />
              <DetalleRow label="Categoria"     value={libro.categoria} />
              <DetalleRow label="Copias totales" value={`${libro.copias_disponibles} disponibles / ${libro.cantidad_copias} totales`} />
            </div>
          </div>
        </div>

        {/* Columna derecha: el panel de accion cambia segun el rol. */}
        <div>
          {esBibliotecario ? (
            <div className="card p-6">
              <DisponibilidadBar copiasDisponibles={libro.copias_disponibles} cantidadCopias={libro.cantidad_copias} />
              {reservas.length > 0 && (
                <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2.5 mt-4">
                  {reservas.length} persona{reservas.length === 1 ? '' : 's'} en cola
                </p>
              )}
            </div>
          ) : (
            <PanelAccion
              libro={libro} reservas={reservas} miReserva={miReserva}
              onPrestamo={handlePrestamo} onReserva={handleReserva} loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  )
}
