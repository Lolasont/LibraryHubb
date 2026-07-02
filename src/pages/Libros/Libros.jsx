import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLibros, getCategorias } from '../../data/mockService'

function Libros() {
  const navigate = useNavigate()

  const [busqueda, setBusqueda] = useState('')
  const [categoriaId, setCategoriaID] = useState('')
  const [listaLibros, setListaLibros] = useState([])
  const [listacategorias, setListaCategorias] = useState([])

  useEffect(() => {
    const categorias = getCategorias()
    setListaCategorias(categorias)
  },[])

  useEffect(() => {
  const librosFiltrados = getLibros({
    busqueda,
    categoria_id: categoriaId || null,
  })
    setListaLibros(librosFiltrados)
  }, [busqueda, categoriaId])

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">
            Catálogo de Libros
          </h1>
          <p className="text-slate-600 mt-1">
            Explora el catálogo de LibraryHub, busca por titulo, autor o ISBN y filtra por categoria.
          </p>
        </div>
<div className="bg-white rounded-2xl shadow p-4 mb-6 flex flex-col md:flex-row gap-4">
        
          <input
            type="text"
            placeholder="Buscar por titulo, autor o ISBN"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="flex-1 border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={categoriaId}
            onChange={(e) => setCategoriaID(e.target.value)}
            className="border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las categorias</option>
            {listacategorias.map((categoria)=>(
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4 text-sm text-slate-500">
          Mostrando {listaLibros.length} libro(s)
        </div>

        <div className="grid gap-4">
          {listaLibros.length > 0 ? (
            listaLibros.map((libro) => (
              <div
                key={libro.id}
                className="bg-white rounded-2xl shadow p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    {libro.titulo}
                  </h2>

                  <p className="text-slate-600">
                    {libro.autores.join(', ')}
                  </p>

                  <p className="text-sm text-slate-500 mt-1">
                    {libro.categoria} • {libro.año_publicacion} • ISBN: {libro.isbn}
                  </p>
                </div>

                <div className="flex flex-col md:items-end gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      libro.copias_disponibles > 0
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {libro.copias_disponibles > 0
                      ? `${libro.copias_disponibles} disponibles`
                      : 'Sin stock'}
                  </span>

                  <button
                    onClick={() => navigate(`/libros/${libro.id}`)}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
                  >
                    Ver detalle
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl shadow p-6 text-center text-slate-500">
              No se encontraron libros con esos filtros.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Libros