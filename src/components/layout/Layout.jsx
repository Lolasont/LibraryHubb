import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import PropTypes from 'prop-types'
import {
  BookOpenIcon,
  UserIcon,
  BookmarkIcon,
  BuildingLibraryIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline'

const MENU_MIEMBRO = [
  { path: '/libros',       label: 'Buscar Libros', icon: BookOpenIcon },
  { path: '/mi-perfil',    label: 'Mi Perfil',     icon: UserIcon },
  { path: '/mis-reservas', label: 'Mis Reservas',  icon: BookmarkIcon },
]

const MENU_BIBLIOTECARIO = [
  { path: '/libros',        label: 'Catálogo',         icon: BookOpenIcon },
  { path: '/bibliotecario', label: 'Panel de control', icon: BuildingLibraryIcon },
]

function MembresiaLabel({ tipo }) {
  const map = {
    basica:     { label: 'Básica',     color: 'text-blue-300' },
    premium:    { label: 'Premium',    color: 'text-amber-400' },
    estudiante: { label: 'Estudiante', color: 'text-cyan-400' },
  }
  const { label, color } = map[tipo] ?? { label: tipo, color: 'text-blue-300' }
  return <span className={`text-xs ${color}`}>Membresía {label}</span>
}

MembresiaLabel.propTypes = {
  tipo: PropTypes.string,
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const menu = user?.rol === 'bibliotecario' ? MENU_BIBLIOTECARIO : MENU_MIEMBRO

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  const closeSidebar = () => setSidebarOpen(false)

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-blue-800 text-white'
        : 'text-blue-200 hover:bg-blue-800/60 hover:text-white'
    }`

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      {/* ── Overlay mobile ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-blue-900 text-white z-30 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:relative lg:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-blue-800 flex-shrink-0">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <BookOpenIcon className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display font-bold text-lg leading-none text-white">LibraryHub</h1>
            <p className="text-blue-300 text-xs mt-0.5">Biblioteca Digital</p>
          </div>
          <button
            onClick={closeSidebar}
            className="ml-auto lg:hidden text-blue-300 hover:text-white p-1 rounded"
            aria-label="Cerrar menú"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* User info */}
        <div className="px-5 py-4 border-b border-blue-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              {user?.nombre?.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.nombre}</p>
              {user?.rol === 'bibliotecario'
                ? <span className="text-xs text-amber-400">Bibliotecario</span>
                : <MembresiaLabel tipo={user?.tipo_membresia} />
              }
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menu.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              onClick={closeSidebar}
              className={navLinkClass}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-5 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-blue-200 hover:bg-blue-800/60 hover:text-white transition-colors"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar mobile */}
        <header className="lg:hidden flex items-center gap-4 px-4 py-3 bg-white border-b border-slate-200 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-500 hover:text-slate-800 p-1 rounded"
            aria-label="Abrir menú"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-amber-500 rounded flex items-center justify-center">
              <BookOpenIcon className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-blue-900 text-lg">LibraryHub</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
