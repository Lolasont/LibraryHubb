// Componente raiz de la aplicacion.
// Define todas las rutas y los requisitos de autenticacion para cada una.
//
// Como esta armado:
// - "/" (sin loguearse) muestra el Login.
// - "/" (logueado) redirige segun el rol del usuario.
// - Las rutas que requieren sesion pasan por <RequireAuth>, que
//   redirige al login si no hay usuario, o a /libros si el rol
//   no tiene permiso para esa ruta.
// - <Layout> envuelve las rutas autenticadas y provee el sidebar.

import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import PropTypes from 'prop-types'
import { useAuth } from './context/AuthContext'
import { Spinner } from './components/ui/Spinner'
import Layout from './components/layout/Layout'
import Login from './pages/Login/Login'
import Libros from './pages/Libros/Libros'
import LibroDetalle from './pages/LibroDetalle/LibroDetalle'
import MiPerfil from './pages/MiPerfil/MiPerfil'
import MisReservas from './pages/MisReservas/MisReservas'
import Bibliotecario from './pages/Bibliotecario/Bibliotecario'

// Guard de autenticacion. Si no hay usuario, va al login.
// Si hay usuario pero su rol no esta en allowedRoles, va a /libros.
//
// Antes de decidir cualquiera de esas dos cosas, espera a que
// sesionLista sea true. Esto evita que una pagina protegida (por
// ejemplo Libros.jsx) se monte y dispare sus pedidos IPC mientras
// AuthContext todavia esta reconectando la sesion del lado de Electron
// (ver el efecto en AuthContext.jsx) — si no se esperara, esos pedidos
// llegarian antes de que el proceso principal supiera quien esta
// logueado, y fallarian con "No hay una sesion activa."
function RequireAuth({ allowedRoles }) {
  const { user, sesionLista } = useAuth()

  if (!sesionLista) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!user) return <Navigate to="/" replace />
  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    return <Navigate to="/libros" replace />
  }
  return <Outlet />
}

// Definimos los tipos de las props para que sea mas facil detectar errores.
RequireAuth.propTypes = {
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
}

export default function App() {
  const { user } = useAuth()

  return (
    <Routes>
      {/* Ruta raiz: muestra el Login o redirige segun si hay sesion. */}
      <Route
        path="/"
        element={
          user
            ? <Navigate to={user.rol === 'bibliotecario' ? '/bibliotecario' : '/libros'} replace />
            : <Login />
        }
      />

      {/* Rutas protegidas. RequireAuth envuelve a Layout, que muestra el sidebar. */}
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route path="/libros"     element={<Libros />} />
          <Route path="/libros/:id" element={<LibroDetalle />} />

          {/* Rutas solo para socios. */}
          <Route element={<RequireAuth allowedRoles={['miembro']} />}>
            <Route path="/mi-perfil"    element={<MiPerfil />} />
            <Route path="/mis-reservas" element={<MisReservas />} />
          </Route>

          {/* Rutas solo para el bibliotecario. */}
          <Route element={<RequireAuth allowedRoles={['bibliotecario']} />}>
            <Route path="/bibliotecario" element={<Bibliotecario />} />
          </Route>
        </Route>
      </Route>

      {/* Cualquier ruta desconocida va al inicio. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
