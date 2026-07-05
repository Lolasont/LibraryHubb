import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { loginUsuario } from '../../data/apiService'
import {
  BookOpenIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline'

const SPINES = [
  { left: '4%',  w: '3.5%', hue: 210, sat: 55, lit: 28 },
  { left: '8%',  w: '2.5%', hue: 225, sat: 60, lit: 35 },
  { left: '11%', w: '4%',   hue: 200, sat: 50, lit: 32 },
  { left: '16%', w: '2.5%', hue: 215, sat: 65, lit: 22 },
  { left: '20%', w: '3%',   hue: 230, sat: 55, lit: 38 },
  { left: '24%', w: '2%',   hue: 205, sat: 70, lit: 26 },
  { left: '27%', w: '4.5%', hue: 220, sat: 60, lit: 30 },
  { left: '33%', w: '2.5%', hue: 210, sat: 55, lit: 42 },
  { left: '37%', w: '3%',   hue: 235, sat: 65, lit: 25 },
  { left: '41%', w: '2%',   hue: 215, sat: 50, lit: 36 },
  { left: '44%', w: '3.5%', hue: 200, sat: 60, lit: 29 },
  { left: '49%', w: '2.5%', hue: 225, sat: 55, lit: 40 },
  { left: '53%', w: '4%',   hue: 210, sat: 65, lit: 24 },
  { left: '58%', w: '2%',   hue: 220, sat: 70, lit: 33 },
  { left: '61%', w: '3%',   hue: 205, sat: 55, lit: 38 },
  { left: '65%', w: '2.5%', hue: 230, sat: 60, lit: 27 },
  { left: '69%', w: '4%',   hue: 215, sat: 65, lit: 32 },
  { left: '74%', w: '2%',   hue: 200, sat: 55, lit: 44 },
  { left: '77%', w: '3.5%', hue: 225, sat: 70, lit: 22 },
  { left: '82%', w: '2.5%', hue: 210, sat: 60, lit: 36 },
  { left: '86%', w: '3%',   hue: 220, sat: 55, lit: 28 },
  { left: '90%', w: '2%',   hue: 205, sat: 65, lit: 40 },
  { left: '93%', w: '4%',   hue: 215, sat: 60, lit: 30 },
]

const STATS = [
  { label: 'Libros',     value: '50.000+' },
  { label: 'Miembros',   value: '10.000+' },
  { label: 'Categorías', value: '5'       },
]

const DEMO_CREDS = [
  { rol: 'Miembro básico',  cedula: '12345678', pass: '12345678' },
  { rol: 'Miembro premium', cedula: '23456789', pass: '23456789' },
  { rol: 'Bibliotecario',   cedula: '00000001', pass: 'admin'    },
]

export default function Login() {
  const [cedula,       setCedula]       = useState('')
  const [password,     setPassword]     = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error,        setError]        = useState('')
  const [loading,      setLoading]      = useState(false)

  const { login } = useAuth()
  const navigate  = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Llama a la API real — reemplaza loginUsuario de mockService
    const data = await loginUsuario(cedula.trim(), password)

    if (!data) {
      setError('Cédula o contraseña incorrecta. Verifica tus datos.')
      setLoading(false)
      return
    }

    // login() ahora recibe user Y token JWT
    login(data.user, data.token)
    navigate(data.user.rol === 'bibliotecario' ? '/bibliotecario' : '/libros', { replace: true })
  }

  const fillDemo = (cred) => {
    setCedula(cred.cedula)
    setPassword(cred.pass)
    setError('')
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Panel izquierdo — decorativo ── */}
      <div className="hidden lg:flex lg:w-[48%] xl:w-1/2 bg-blue-900 relative overflow-hidden flex-col justify-between p-12 flex-shrink-0">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          {SPINES.map((s) => (
            <div key={`${s.left}-${s.hue}`} className="absolute top-0 h-full opacity-30"
              style={{ left: s.left, width: s.w, background: `hsl(${s.hue}, ${s.sat}%, ${s.lit}%)` }}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/0 via-blue-900/60 to-blue-900/90" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center shadow-lg">
              <BookOpenIcon className="w-6 h-6 text-white" />
            </div>
            <span className="text-white font-display font-bold text-2xl">LibraryHub</span>
          </div>
          <h2 className="text-white font-display font-bold text-4xl xl:text-5xl leading-tight mb-5">
            El saber,<br />al alcance de todos
          </h2>
          <p className="text-blue-200 text-lg max-w-xs leading-relaxed">
            Encuentra, reserva y gestiona tus lecturas desde cualquier lugar.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-2">
          {STATS.map(({ label, value }) => (
            <div key={label} className="text-center p-3 bg-blue-800/40 rounded-xl backdrop-blur-sm">
              <p className="text-amber-400 font-display font-bold text-2xl">{value}</p>
              <p className="text-blue-300 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Panel derecho — formulario ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-slate-50">
        <div className="w-full max-w-sm">

          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <BookOpenIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-blue-900 text-xl">LibraryHub</span>
          </div>

          <h2 className="text-2xl font-display font-bold text-slate-900 mb-1">Iniciar sesión</h2>
          <p className="text-slate-500 text-sm mb-8">Ingresa con tu número de cédula y contraseña</p>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            <div>
              <label htmlFor="cedula" className="block text-sm font-medium text-slate-700 mb-1.5">
                Número de cédula
              </label>
              <input
                id="cedula" type="text" value={cedula}
                onChange={e => { setCedula(e.target.value); setError('') }}
                placeholder="Ej: 12345678"
                className="input-field" autoComplete="username" inputMode="numeric" required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password" type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="••••••••"
                  className="input-field pr-11" autoComplete="current-password" required
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg" role="alert">
                <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading || !cedula.trim() || !password}
              className="btn-primary w-full flex items-center justify-center gap-2 text-base"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Verificando...</>
              ) : 'Ingresar'}
            </button>
          </form>

          <div className="mt-8 rounded-xl border border-blue-100 bg-blue-50 overflow-hidden">
            <div className="px-4 py-2.5 bg-blue-100/60 border-b border-blue-100">
              <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide">
                Credenciales de demostración
              </p>
            </div>
            <div className="divide-y divide-blue-100">
              {DEMO_CREDS.map(cred => (
                <button key={cred.cedula} type="button" onClick={() => fillDemo(cred)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-blue-100/60 transition-colors group"
                >
                  <div>
                    <span className="text-xs font-semibold text-blue-900">{cred.rol}</span>
                    <p className="text-xs text-blue-600 font-mono mt-0.5">{cred.cedula} / {cred.pass}</p>
                  </div>
                  <span className="text-xs text-blue-400 group-hover:text-blue-600 transition-colors pr-1">Usar →</span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
