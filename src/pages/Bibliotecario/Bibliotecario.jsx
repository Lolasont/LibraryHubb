import { useEffect, useState } from "react";
import {
  getTodosPrestamos,
  getTodasReservas,
  getTodasMultas,
  getMiembros,
  registrarDevolucion,
} from "../../data/mockService";

export default function Bibliotecario() {
  useEffect(() => {
    async function probarMongo() {
      try {
        const libros = await window.db.listarLibrosMongo();
        console.log("Libros desde Mongo:", libros);
      } catch (error) {
        console.error(error);
      }
    }

    probarMongo();
  }, []);
  const [prestamos, setPrestamos] = useState(getTodosPrestamos());

  const reservas = getTodasReservas();
  const multas = getTodasMultas();
  const miembros = getMiembros();

  const handleDevolucion = (prestamoId) => {
    const resultado = registrarDevolucion(prestamoId);

    if (resultado.ok) {
      setPrestamos(getTodosPrestamos());
      alert(resultado.mensaje);
    } else {
      alert(resultado.mensaje);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Panel del Bibliotecario
          </h1>

          <p className="text-slate-600 mt-2">
            Administra préstamos, reservas, multas y miembros registrados.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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

        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Préstamos activos</h2>

          {prestamos.length > 0 ? (
            prestamos.map((prestamo) => (
              <div
                key={prestamo.id}
                className="border border-slate-200 rounded-xl p-4 mb-3 flex flex-col md:flex-row md:justify-between md:items-center gap-4"
              >
                <div>
                  <h3 className="font-semibold">{prestamo.libro_titulo}</h3>

                  <p className="text-sm text-slate-500">
                    Miembro ID: {prestamo.miembro_id}
                  </p>

                  <p className="text-sm text-slate-500">
                    Fecha préstamo: {prestamo.fecha_prestamo}
                  </p>

                  <p className="text-sm text-slate-500">
                    Estado: {prestamo.estado}
                  </p>
                </div>

                <button
                  onClick={() => handleDevolucion(prestamo.id)}
                  className="px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 transition"
                >
                  Registrar devolución
                </button>
              </div>
            ))
          ) : (
            <p className="text-slate-500">No existen préstamos activos.</p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Reservas activas</h2>

          {reservas.length > 0 ? (
            reservas.map((reserva) => (
              <div
                key={reserva.id}
                className="border border-slate-200 rounded-xl p-4 mb-3"
              >
                <h3 className="font-semibold">{reserva.libro_titulo}</h3>

                <p className="text-sm text-slate-500">
                  Miembro ID: {reserva.miembro_id}
                </p>

                <p className="text-sm text-slate-500">
                  Posición en cola: {reserva.posicion_cola}
                </p>

                <p className="text-sm text-slate-500">
                  Fecha estimada: {reserva.fecha_estimada_disponibilidad}
                </p>
              </div>
            ))
          ) : (
            <p className="text-slate-500">No existen reservas activas.</p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Multas pendientes</h2>

          {multas.length > 0 ? (
            multas.map((multa) => (
              <div
                key={multa.id}
                className="border border-red-200 bg-red-50 rounded-xl p-4 mb-3"
              >
                <p className="font-semibold text-red-700">
                  Miembro ID: {multa.miembro_id}
                </p>

                <p className="text-red-600">
                  Monto: ${multa.monto.toLocaleString("es-CL")} CLP
                </p>

                <p className="text-red-600">Estado: Pendiente</p>
              </div>
            ))
          ) : (
            <p className="text-slate-500">No existen multas pendientes.</p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Miembros registrados</h2>

          {miembros.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {miembros.map((miembro) => (
                <div
                  key={miembro.id}
                  className="border border-slate-200 rounded-xl p-4"
                >
                  <h3 className="font-semibold text-slate-900">
                    {miembro.nombre}
                  </h3>

                  <p className="text-sm text-slate-500">
                    Cédula: {miembro.cedula}
                  </p>

                  <p className="text-sm text-slate-500">
                    Email: {miembro.email}
                  </p>

                  <p className="text-sm text-slate-500">
                    Membresía: {miembro.tipo_membresia}
                  </p>

                  <p className="text-sm text-slate-500">
                    Estado: {miembro.estado}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500">No existen miembros registrados.</p>
          )}
        </div>
      </div>
    </div>
  );
}
