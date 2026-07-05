import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

function Libros() {
  const navigate = useNavigate();

  const [busqueda, setBusqueda] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [listaLibros, setListaLibros] = useState([]);
  const [listaCategorias, setListaCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarDatosMongo() {
      try {
        setLoading(true);
        setError("");

        const librosMongo = await window.db.listarLibrosMongo();
        const categoriasMongo = await window.db.listarCategoriasMongo();

        setListaLibros(librosMongo);
        setListaCategorias(categoriasMongo);
      } catch (error) {
        console.error(error);
        setError("No se pudieron cargar los libros desde MongoDB.");
      } finally {
        setLoading(false);
      }
    }

    cargarDatosMongo();
  }, []);

  const obtenerNombreCategoria = (categoriaIdLibro) => {
    const categoria = listaCategorias.find(
      (cat) => cat.id === categoriaIdLibro,
    );

    return categoria ? categoria.nombre : "Categoría no encontrada";
  };

  const librosFiltrados = useMemo(() => {
    return listaLibros.filter((libro) => {
      const textoBusqueda = busqueda.toLowerCase().trim();

      const coincideBusqueda =
        !textoBusqueda ||
        libro.titulo?.toLowerCase().includes(textoBusqueda) ||
        libro.autores?.some((autor) =>
          autor.toLowerCase().includes(textoBusqueda),
        ) ||
        libro.isbn?.includes(textoBusqueda);

      const coincideCategoria =
        !categoriaId || libro.categoria_id === categoriaId;

      return coincideBusqueda && coincideCategoria;
    });
  }, [listaLibros, busqueda, categoriaId]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow p-6">
          <p className="text-slate-600">Cargando libros desde MongoDB...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto bg-red-50 border border-red-200 rounded-2xl p-6">
          <h1 className="text-xl font-bold text-red-700 mb-2">Error</h1>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Encabezado */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">
            Catálogo de Libros
          </h1>

          <p className="text-slate-600 mt-1">
            Explora los libros cargados desde MongoDB.
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-2xl shadow p-4 mb-6 flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Buscar por título, autor o ISBN..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="flex-1 border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            className="border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las categorías</option>

            {listaCategorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Cantidad de resultados */}
        <div className="mb-4 text-sm text-slate-500">
          Mostrando {librosFiltrados.length} libro(s)
        </div>

        {/* Listado */}
        <div className="grid gap-4">
          {librosFiltrados.length > 0 ? (
            librosFiltrados.map((libro) => {
              const nombreCategoria = obtenerNombreCategoria(
                libro.categoria_id,
              );
              const hayCopias = libro.cantidad_copias > 0;

              return (
                <div
                  key={libro.id}
                  className="bg-white rounded-2xl shadow p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      {libro.titulo}
                    </h2>

                    <p className="text-slate-600">
                      {libro.autores?.join(", ")}
                    </p>

                    <p className="text-sm text-slate-500 mt-1">
                      {nombreCategoria} • ISBN: {libro.isbn}
                    </p>
                  </div>

                  <div className="flex flex-col md:items-end gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        hayCopias
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {hayCopias
                        ? `${libro.cantidad_copias} copias`
                        : "Sin copias"}
                    </span>

                    <button
                      onClick={() => navigate(`/libros/${libro.id}`)}
                      className="px-4 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
                    >
                      Ver detalle
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-2xl shadow p-6 text-center text-slate-500">
              No se encontraron libros con esos filtros.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Libros;
