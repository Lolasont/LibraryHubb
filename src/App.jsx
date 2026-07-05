import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import PropTypes from 'prop-types'
import { useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import Login from './pages/Login/Login'
import Libros from './pages/Libros/Libros'
import LibroDetalle from './pages/LibroDetalle/LibroDetalle'
import MiPerfil from './pages/MiPerfil/MiPerfil'
import MisReservas from './pages/MisReservas/MisReservas'
import Bibliotecario from './pages/Bibliotecario/Bibliotecario'

function RequireAuth({ allowedRoles }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/" replace />
  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    return <Navigate to="/libros" replace />
  }
  return <Outlet />
}

RequireAuth.propTypes = {
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
}

export default function App() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route
        path="/"
        element={
          user
            ? <Navigate to={user.rol === 'bibliotecario' ? '/bibliotecario' : '/libros'} replace />
            : <Login />
        }
      />

      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route path="/libros"     element={<Libros />} />
          <Route path="/libros/:id" element={<LibroDetalle />} />

          <Route element={<RequireAuth allowedRoles={['miembro']} />}>
            <Route path="/mi-perfil"    element={<MiPerfil />} />
            <Route path="/mis-reservas" element={<MisReservas />} />
          </Route>

          <Route element={<RequireAuth allowedRoles={['bibliotecario']} />}>
            <Route path="/bibliotecario" element={<Bibliotecario />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
