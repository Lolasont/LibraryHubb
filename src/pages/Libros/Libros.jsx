import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLibros, getCategorias } from '../../data/apiService'
import { DotBadge, Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { Spinner } from '../../components/ui/Spinner'
import PropTypes from 'prop-types'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  BookOpenIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

function LibroCard({ libro, onClick }) {
  const disponible = libro.copias_disponibles > 0
  return (
    <button onClick={onClick}
      className="card text-left p-5 hover:shadow-md hover:border-blue-200 transition-all duration-200 group flex flex-col gap-3 w-full"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="w-10 h-10 bg-blue-50 group-hover:bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
          <BookOpenIcon className="w-5 h-5 text-blue-600" />
        </div>
        <DotBadge available={disponible} count={libro.copias_disponibles} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-blue-800 transition-colors">
          {libro.titulo}
        </h3>
        <p className="text-xs text-slate-500 mt-1 truncate">{libro.autores.join(', ')}</p>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <Badge variant="default">{libro.categoria}</Badge>
        <span className="text-xs text-slate-400">{libro.año_publicacion}</span>
      </div>
    </button>
  )
}

LibroCard.propTypes = {
  libro: PropTypes.shape({
    id:                  PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    titulo:              PropTypes.string.isRequired,
    autores:             PropTypes.arrayOf(PropTypes.string).isRequired,
    categoria:           PropTypes.string,
    año_publicacion:     PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    copias_disponibles:  PropTypes.number.isRequired,
  }).isRequired,
  onClick: PropTypes.func.isRequired,
}

export default function Libros() {
  const [busqueda,    setBusqueda]    = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [libros,      setLibros]      = useState([])
  const [categorias,  setCategorias]  = useState([])
  const [loading,     setLoading]     = useState(true)
  const navigate = useNavigate()

  // Carga categorías una sola vez
  useEffect(() => {
    getCategorias().then(setCategorias).catch(() => setCategorias([]))
  }, [])

  // Búsqueda con debounce — async
  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const data = await getLibros({ busqueda, categoria_id: categoriaId || null })
        setLibros(data)
      } catch {
        setLibros([])
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [busqueda, categoriaId])

  const limpiarFiltros = () => { setBusqueda(''); setCategoriaId('') }
  const hayFiltros = busqueda.trim() !== '' || categoriaId !== ''

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="page-title">Catálogo de libros</h1>
        <p className="page-subtitle">Busca por título, autor o ISBN y filtra por categoría</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input type="text" value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por título, autor o ISBN..."
            className="input-field pl-10 pr-10"
          />
          {busqueda && (
            <button onClick={() => setBusqueda('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Limpiar búsqueda"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="relative sm:w-52">
          <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select value={categoriaId} onChange={e => setCategoriaId(e.target.value)} className="select-field pl-9">
            <option value="">Todas las categorías</option>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-slate-500">
          {loading ? 'Buscando...' : <><span className="font-semibold text-slate-700">{libros.length}</span> libro{libros.length !== 1 ? 's' : ''} encontrado{libros.length !== 1 ? 's' : ''}</>}
        </p>
        {hayFiltros && !loading && (
          <button onClick={limpiarFiltros} className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
            <XMarkIcon className="w-3.5 h-3.5" />Limpiar filtros
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" className="text-blue-500" />
        </div>
      ) : libros.length === 0 ? (
        <EmptyState
          icon="🔍" title="No se encontraron libros"
          description={hayFiltros ? 'Prueba con otro término o cambia la categoría.' : 'El catálogo está vacío.'}
          action={hayFiltros && <button onClick={limpiarFiltros} className="btn-secondary text-sm">Ver todos los libros</button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {libros.map(libro => (
            <LibroCard key={libro.id} libro={libro} onClick={() => navigate(`/libros/${libro.id}`)} />
          ))}
        </div>
      )}
    </div>
  )
}
