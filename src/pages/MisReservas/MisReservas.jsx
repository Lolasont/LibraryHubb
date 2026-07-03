import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getReservasByMiembro, cancelarReserva } from "../../data/mockService";

export default function MisReservas() {
  const { user } = useAuth();

  const [reservas, setReservas] = useState(() => getReservasByMiembro(user.id));

  const handleCancelar = (reservaId) => {
    const resultado = cancelarReserva(reservaId);

    if (resultado.ok) {
      setReservas(getReservasByMiembro(user.id));
      alert(resultado.mensaje);
    } else {
      alert(resultado.mensaje);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Mis Reservas</h1>

        <p className="text-slate-600 mb-6">
          Revisa tus reservas activas, posición en la cola y fecha estimada de
          disponibilidad.
        </p>

        <div className="bg-white rounded-2xl shadow p-6">
          {reservas.length > 0 ? (
            <div className="grid gap-4">
              {reservas.map((reserva) => (
                <div
                  key={reserva.id}
                  className="border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {reserva.libro_titulo}
                    </h2>

                    <p className="text-sm text-slate-500">
                      Fecha de reserva: {reserva.fecha_reserva}
                    </p>

                    <p className="text-sm text-slate-500">
                      Posición en cola: {reserva.posicion_cola}
                    </p>

                    <p className="text-sm text-slate-500">
                      Disponible aprox: {reserva.fecha_estimada_disponibilidad}
                    </p>
                  </div>

                  <div className="flex flex-col md:items-end gap-3">
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700">
                      {reserva.estado}
                    </span>

                    <button
                      onClick={() => handleCancelar(reserva.id)}
                      className="px-4 py-2 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition"
                    >
                      Cancelar reserva
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500">No tienes reservas activas.</p>
          )}
        </div>
      </div>
    </div>
  );
}
