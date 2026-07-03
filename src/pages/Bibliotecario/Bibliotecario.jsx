import { useState } from "react";
import {
  getTodosPrestamos,
  getTodasReservas,
  getTodasMultas,
  getMiembros,
  registrarDevolucion,
} from "../../data/mockService";

export default function bibliotecario() {
  const [prestamos, setPrestamos] = useState(getTodosPrestamos());
  const reservas = getTodasReservas();
  const multas = getTodasMultas();
  const miembros = getMiembros();

  const handleDevolucion = (prestamoId) => {
    const resultado = registrarDevolucion(prestamoId);

    if (resultado.ok) {
      setPrestamos(getTodasPrestamos());
      alert(resultado.mensaje);
    } else {
      alert(resultado.mensaje);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Panel del Bibliotecario
        </h1>

        <p className="text-slate-600 mb-8">
          Administra préstamos, reservas, multas y miembros.
        </p>

        {/* Resumen */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow p-5">
            <h3 className="text-slate-500 text-sm">Préstamos</h3>
            <p className="text-3xl font-bold text-blue-600">
              {prestamos.length}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow p-5">
            <h3 className="text-slate-500 text-sm">Reservas</h3>
            <p className="text-3xl font-bold text-yellow-600">
              {reservas.length}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow p-5">
            <h3 className="text-slate-500 text-sm">Multas</h3>
            <p className="text-3xl font-bold text-red-600">{multas.length}</p>
          </div>

          <div className="bg-white rounded-2xl shadow p-5">
            <h3 className="text-slate-500 text-sm">Miembros</h3>
            <p className="text-3xl font-bold text-green-600">
              {miembros.length}
            </p>
          </div>
        </div>

        {/* Préstamos */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Préstamos activos</h2>

          {prestamos.map((prestamo) => (
            <div
              key={prestamo.id}
              className="border rounded-xl p-4 mb-3 flex flex-col md:flex-row md:justify-between md:items-center"
            >
              <div>
                <h3 className="font-semibold">{prestamo.libro_titulo}</h3>

                <p className="text-sm text-slate-500">
                  Miembro ID: {prestamo.miembro_id}
                </p>

                <p className="text-sm text-slate-500">
                  Estado: {prestamo.estado}
                </p>
              </div>

              <button
                onClick={() => handleDevolucion(prestamo.id)}
                className="mt-3 md:mt-0 px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700"
              >
                Registrar devolución
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
