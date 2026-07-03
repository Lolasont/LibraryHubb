import {useParams, useNavigate} from 'react-router-dom'
import {getLibroById, getReservasByLibro } from '../../data/mockService'

export default function LibroDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()

  const libro = getLibroById(id)
  const reservas = getReservasByLibro(id)

  if (!libro) {
    return (
      <div className="p-6">
        <h1 className="text-2x1 font-bold text-slate-900">Libro no encontrado</h1>
        <button
          onClick={() => navigate('/libros')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl"
        >
          Volver al catalogo
        </button>
      </div>
    )
  }

  const hayDisponibles = libro.copias_disponibles > 0

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
        
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="h-80 bg-slate-200 rounded-xl flex items-center justify-center text-slate-500">
            Portada
          </div>
        </div>

        <div className="md:col-span-2 bg-white rounded-2xl shadow p-6">
          <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm mb-4">
            {libro.categoria}
          </span>

          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {libro.titulo}
          </h1>

          <p className="text-slate-600 mb-6">
            {libro.autores.join(', ')}
          </p>

          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-slate-500">Editorial</p>
              <p className="font-medium">{libro.editorial}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Año</p>
              <p className="font-medium">{libro.año_publicacion}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">ISBN</p>
              <p className="font-medium">{libro.isbn}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Páginas</p>
              <p className="font-medium">{libro.paginas}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Copias disponibles</p>
              <p className={hayDisponibles ? 'font-medium text-green-600' : 'font-medium text-red-600'}>
                {libro.copias_disponibles} / {libro.cantidad_copias}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Reservas en cola</p>
              <p className="font-medium">{reservas.length}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              className={`px-5 py-3 rounded-xl text-white font-medium ${
                hayDisponibles ? 'bg-blue-600 hover:bg-blue-700' : 'bg-amber-500 hover:bg-amber-600'
              }`}
            >
              {hayDisponibles ? 'Solicitar préstamo' : 'Reservar'}
            </button>

            <button
              onClick={() => navigate('/libros')}
              className="px-5 py-3 rounded-xl border border-slate-300 font-medium"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
