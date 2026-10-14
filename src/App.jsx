import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  changeMyPassword,
  getMyProfile,
  loginUser,
  registerUser,
  updateMyProfile,
} from './services/profileService'
import { getOrderHistory } from './services/orderService'
import DiagnosisPanel from './components/DiagnosisPanel'
import QuotePanel from './components/QuotePanel'
import OperationsPanel from './components/OperationsPanel'
import ClientsPanel from './components/ClientsPanel'
import RepuestosPanel from './components/RepuestosPanel'
import EquipmentHistoryPanel from './components/EquipmentHistoryPanel'
import ReceiptPanel from './components/ReceiptPanel'
import OrderTrackingPanel from './components/OrderTrackingPanel'
import StatusDashboardPanel from './components/StatusDashboardPanel'
import GlobalSearchPanel from './components/GlobalSearchPanel'
import UsersPanel from './components/UsersPanel'
import './App.css'

const emptyPasswordForm = {
  contrasenaActual: '',
  nuevaContrasena: '',
  confirmacionContrasena: '',
}

const viewSegments = {
  perfil: 'perfil',
  clientes: 'clientes',
  historial: 'historial',
  operaciones: '',
  repuestos: 'repuestos',
  recepcion: 'recepcion',
  diagnostico: 'diagnostico',
  cotizacion: 'cotizaciones',
  seguimiento: 'seguimiento',
  dashboard: 'dashboard',
  busqueda: 'busqueda',
  usuarios: 'usuarios',
}

function getRoleBasePath(role) {
  if (role === 'ADMIN') return '/admin-panel'
  if (role === 'TECNICO') return '/tecnico-panel'
  return '/cliente-panel'
}

function getPathForView(role, view) {
  const basePath = getRoleBasePath(role)
  const segment = viewSegments[view]
  return segment ? `${basePath}/${segment}` : basePath
}

function getAllowedViews(role) {
  if (role === 'ADMIN') {
    return ['operaciones', 'perfil', 'usuarios', 'clientes', 'historial', 'repuestos', 'recepcion', 'cotizacion', 'dashboard', 'busqueda']
  }
  if (role === 'TECNICO') {
    return ['operaciones', 'perfil', 'clientes', 'historial', 'repuestos', 'recepcion', 'diagnostico', 'cotizacion', 'dashboard', 'busqueda']
  }
  return ['perfil', 'recepcion', 'cotizacion', 'seguimiento']
}

function PasswordInput({ id, name, value, onChange, autoComplete, minLength, maxLength }) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="password-field">
      <input
        id={id}
        name={name}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        minLength={minLength}
        maxLength={maxLength}
        required
      />
      <button
        className="password-toggle"
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      >
        {visible ? 'Ocultar' : 'Mostrar'}
      </button>
    </div>
  )
}

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [authenticated, setAuthenticated] = useState(
    () => Boolean(localStorage.getItem('techservice_token')),
  )
  const [profile, setProfile] = useState(null)
  const [profileForm, setProfileForm] = useState({
    nombre: '',
    email: '',
  })
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(
    () => Boolean(localStorage.getItem('techservice_token')),
  )
  const [orderId, setOrderId] = useState('')
  const [orderHistory, setOrderHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const requestedAuthView = location.pathname === '/register' ? 'register' : 'login'
  const isStaff = profile?.rol === 'ADMIN' || profile?.rol === 'TECNICO'
  const allowedViews = getAllowedViews(profile?.rol)
  const activeView = allowedViews.find((view) => getPathForView(profile?.rol, view) === location.pathname)
    ?? (profile && location.pathname === getRoleBasePath(profile.rol) ? allowedViews[0] : undefined)

  useEffect(() => {
    if (!authenticated) {
      return undefined
    }

    async function loadProfile() {
      try {
        const usuario = await getMyProfile()
        setProfile(usuario)
        setProfileForm({
          nombre: usuario.nombre,
          email: usuario.email,
        })
      } catch (requestError) {
        setError(requestError.message)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
    return undefined
  }, [authenticated])

  async function handleLogin(event) {
    event.preventDefault()
    setMessage('')
    setError('')
    setLoading(true)

    const formData = new FormData(event.currentTarget)

    try {
      const response = await loginUser({
        email: formData.get('email'),
        password: formData.get('password'),
      })
      localStorage.setItem('techservice_token', response.token)
      setAuthenticated(true)
      setProfile(response.usuario)
      setProfileForm({
        nombre: response.usuario.nombre,
        email: response.usuario.email,
      })
      navigate(getRoleBasePath(response.usuario.rol), { replace: true })
    } catch (requestError) {
      setError(requestError.message)
      setLoading(false)
    }
  }

  async function handleRegister(event) {
    event.preventDefault()
    setMessage('')
    setError('')

    const form = event.currentTarget
    const formData = new FormData(event.currentTarget)
    const password = formData.get('register-password')
    const confirmation = formData.get('register-confirmation')

    if (password !== confirmation) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)

    try {
      const response = await registerUser({
        nombre: formData.get('register-name'),
        email: formData.get('register-email'),
        password,
      })
      setMessage(response.mensaje)
      navigate('/login', { replace: true })
      form.reset()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    localStorage.removeItem('techservice_token')
    setAuthenticated(false)
    setProfile(null)
    setLoading(false)
    navigate('/login', { replace: true })
  }

  function handleProfileChange(event) {
    const { name, value } = event.target

    setProfileForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function handlePasswordChange(event) {
    const { name, value } = event.target

    setPasswordForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  async function handleProfileSubmit(event) {
    event.preventDefault()
    setMessage('')
    setError('')

    try {
      const usuario = await updateMyProfile(profileForm)
      setProfile(usuario)
      setMessage('Datos personales actualizados correctamente.')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault()
    setMessage('')
    setError('')

    try {
      const response = await changeMyPassword(passwordForm)
      setPasswordForm(emptyPasswordForm)
      setMessage(response.mensaje)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  async function handleHistorySubmit(event) {
    event.preventDefault()
    setMessage('')
    setError('')
    setHistoryLoading(true)

    try {
      setOrderHistory(await getOrderHistory(orderId))
    } catch (requestError) {
      setOrderHistory([])
      setError(requestError.message)
    } finally {
      setHistoryLoading(false)
    }
  }

  if (loading) {
    return <main className="page"><p>Cargando perfil...</p></main>
  }

  if (authenticated && profile) {
    const roleBasePath = getRoleBasePath(profile.rol)
    const isAuthPath = location.pathname === '/login' || location.pathname === '/register'

    if (isAuthPath) {
      return <Navigate to={roleBasePath} replace />
    }

    if (!activeView) {
      return <Navigate to={roleBasePath} replace />
    }
  } else if (authenticated) {
    return (
      <main className="page">
        <p className="alert error" role="alert">
          {error || 'No fue posible verificar tu sesión.'}
        </p>
        <button type="button" onClick={handleLogout}>Volver al inicio de sesión</button>
      </main>
    )
  } else if (!authenticated && location.pathname !== '/login' && location.pathname !== '/register') {
    return <Navigate to="/login" replace />
  }

  if (!authenticated) {
    return (
      <main className="page login-page">
        <header>
          <p className="eyebrow">TechService</p>
          <h1>{requestedAuthView === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</h1>
          <p>
            {requestedAuthView === 'login'
              ? 'Accede para consultar y actualizar tu perfil.'
              : 'Regístrate para acceder a los servicios de TechService.'}
          </p>
        </header>

        {message && <p className="alert success" role="status">{message}</p>}
        {error && <p className="alert error">{error}</p>}

        <section className="card login-card">
          {requestedAuthView === 'login' ? (
            <form onSubmit={handleLogin}>
              <label htmlFor="login-email">Correo electrónico</label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                required
              />

              <label htmlFor="login-password">Contraseña</label>
              <PasswordInput
                id="login-password"
                name="password"
                autoComplete="current-password"
              />

              <button type="submit" disabled={loading}>
                {loading ? 'Validando...' : 'Iniciar sesión'}
              </button>
              <button
                className="text-button"
                type="button"
                onClick={() => {
                  setError('')
                  setMessage('')
                  navigate('/register')
                }}
              >
                ¿Aún no tienes cuenta? Regístrate
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <label htmlFor="register-name">Nombre completo</label>
              <input
                id="register-name"
                name="register-name"
                minLength="2"
                maxLength="100"
                autoComplete="name"
                required
              />

              <label htmlFor="register-email">Correo electrónico</label>
              <input
                id="register-email"
                name="register-email"
                type="email"
                maxLength="100"
                autoComplete="email"
                required
              />

              <label htmlFor="register-password">Contraseña</label>
              <PasswordInput
                id="register-password"
                name="register-password"
                minLength="8"
                maxLength="72"
                autoComplete="new-password"
              />

              <label htmlFor="register-confirmation">Confirmar contraseña</label>
              <PasswordInput
                id="register-confirmation"
                name="register-confirmation"
                minLength="8"
                maxLength="72"
                autoComplete="new-password"
              />

              <button type="submit" disabled={loading}>
                {loading ? 'Creando cuenta...' : 'Crear cuenta'}
              </button>
              <button
                className="text-button"
                type="button"
                onClick={() => {
                  setError('')
                  setMessage('')
                  navigate('/login')
                }}
              >
                Ya tengo una cuenta
              </button>
            </form>
          )}
        </section>
      </main>
    )
  }

  const viewLabels = isStaff
    ? [
        ['perfil', 'Mi cuenta'],
      ['clientes', 'Clientes'],
      ['historial', 'Historial de equipos'],
        ['operaciones', 'Operaciones'],
      ['repuestos', 'Repuestos'],
      ['recepcion', 'Comprobantes'],
      ...(profile?.rol === 'TECNICO' ? [['diagnostico', 'Diagnóstico']] : []),
        ['dashboard', 'Dashboard'],
        ['busqueda', 'Búsqueda global'],
        ['cotizacion', 'Cotizaciones'],
      ]
    : [['perfil', 'Mi cuenta'], ['recepcion', 'Comprobantes'], ['historial', 'Historial de equipos'], ['cotizacion', 'Cotización'], ['seguimiento', 'Seguimiento de orden']]

  return (
    <main className="page dashboard-page">
      <header className="dashboard-header">
        <p className="eyebrow">TechService</p>
        <h1>Panel de {profile?.rol === 'ADMIN' ? 'administración' : profile?.rol === 'TECNICO' ? 'servicio técnico' : 'cliente'}</h1>
        <p className="dashboard-intro">Gestiona tu cuenta y las actividades de servicio autorizadas.</p>
        <div className="user-chip">
          <span className="user-avatar" aria-hidden="true">{profile?.nombre?.charAt(0).toUpperCase()}</span>
          <span><strong>{profile?.nombre}</strong><small>{profile?.email}</small></span>
        </div>
      </header>

      <nav className="dashboard-nav" aria-label="Módulos de TechService">
        <p className="nav-heading">Espacio de trabajo</p>
        {viewLabels.map(([view, label]) => (
          <button
            className={activeView === view ? 'nav-button active' : 'nav-button'}
            type="button"
            key={view}
            onClick={() => {
              navigate(getPathForView(profile.rol, view))
              setMessage('')
              setError('')
            }}
            aria-current={activeView === view ? 'page' : undefined}
          >
            <span className={`nav-icon nav-icon-${view}`} aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
        <button className="logout-button" type="button" onClick={handleLogout}>
          <span className="nav-icon nav-icon-logout" aria-hidden="true" />
          <span>Cerrar sesión</span>
        </button>
      </nav>

      <section className="dashboard-content">
        <div className="content-heading">
          <div>
            <p className="section-kicker">{viewLabels.find(([view]) => view === activeView)?.[1]}</p>
            <h2>{activeView === 'perfil' ? 'Tu cuenta' : activeView === 'usuarios' ? 'Administración de usuarios' : activeView === 'clientes' ? 'Directorio y registro de clientes' : activeView === 'historial' ? 'Historial de servicios del equipo' : activeView === 'operaciones' ? 'Equipos, órdenes y técnicos' : activeView === 'repuestos' ? 'Inventario de repuestos' : activeView === 'recepcion' ? 'Comprobantes de recepción' : activeView === 'diagnostico' ? 'Diagnóstico técnico' : activeView === 'seguimiento' ? 'Seguimiento de mi orden' : activeView === 'dashboard' ? 'Órdenes por estado' : activeView === 'busqueda' ? 'Búsqueda global' : activeView === 'cotizacion' && !isStaff ? 'Decisión de cotización' : 'Presupuestos de reparación'}</h2>
          </div>
          <span className="role-badge">{profile?.rol}</span>
        </div>

        {message && <p className="alert success">{message}</p>}
        {error && <p className="alert error">{error}</p>}

        <div className="grid">
        {activeView === 'perfil' && <>
        <section className="card">
          <h2>Datos personales</h2>
          {profile?.rol && <p className="role">Rol: {profile.rol}</p>}

          <form onSubmit={handleProfileSubmit}>
            <label htmlFor="nombre">Nombre completo</label>
            <input
              id="nombre"
              name="nombre"
              value={profileForm.nombre}
              onChange={handleProfileChange}
              minLength="2"
              maxLength="100"
              required
            />

            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              name="email"
              type="email"
              value={profileForm.email}
              onChange={handleProfileChange}
              maxLength="100"
              required
            />

            <button type="submit">Guardar cambios</button>
          </form>
        </section>

        <section className="card">
          <h2>Cambiar contraseña</h2>

          <form onSubmit={handlePasswordSubmit}>
            <label htmlFor="contrasenaActual">Contraseña actual</label>
            <PasswordInput
              id="contrasenaActual"
              name="contrasenaActual"
              value={passwordForm.contrasenaActual}
              onChange={handlePasswordChange}
              autoComplete="current-password"
              required
            />

            <label htmlFor="nuevaContrasena">Nueva contraseña</label>
            <PasswordInput
              id="nuevaContrasena"
              name="nuevaContrasena"
              value={passwordForm.nuevaContrasena}
              onChange={handlePasswordChange}
              minLength="8"
              maxLength="72"
              autoComplete="new-password"
              required
            />

            <label htmlFor="confirmacionContrasena">
              Confirmar nueva contraseña
            </label>
            <PasswordInput
              id="confirmacionContrasena"
              name="confirmacionContrasena"
              value={passwordForm.confirmacionContrasena}
              onChange={handlePasswordChange}
              minLength="8"
              maxLength="72"
              autoComplete="new-password"
              required
            />

            <button type="submit">Actualizar contraseña</button>
          </form>
        </section>
        </>}

        {activeView === 'historial' && isStaff && (
          <section className="card history-card">
            <h2>Historial de una orden</h2>
            <p>Consulta los cambios de estado registrados y el usuario responsable.</p>

            <form onSubmit={handleHistorySubmit}>
              <label htmlFor="order-id">ID o código de orden</label>
              <input
                id="order-id"
                type="text"
                placeholder="Ej. 2 o OS-2026-0002"
                value={orderId}
                onChange={(event) => setOrderId(event.target.value)}
                required
              />
              <button type="submit" disabled={historyLoading}>
                {historyLoading ? 'Consultando...' : 'Consultar historial'}
              </button>
            </form>

            {orderHistory.length > 0 && (
              <ol className="history-list">
                {orderHistory.map((entry) => (
                  <li key={entry.id}>
                    <strong>
                      {entry.estadoAnterior ?? 'Sin estado'} → {entry.estadoNuevo}
                    </strong>
                    <span>{entry.usuarioNombre} · {new Date(entry.creadoEn).toLocaleString()}</span>
                    {entry.observacion && <small>{entry.observacion}</small>}
                  </li>
                ))}
              </ol>
            )}
            {!historyLoading && orderHistory.length === 0 && orderId && !error && (
              <p className="empty-state">La orden existe, pero todavía no tiene cambios registrados.</p>
            )}
          </section>
        )}
        </div>

        {activeView === 'historial' && <EquipmentHistoryPanel isStaff={isStaff} />}
        {activeView === 'usuarios' && profile?.rol === 'ADMIN' && <UsersPanel />}
        {activeView === 'recepcion' && <ReceiptPanel isStaff={isStaff} />}
        {activeView === 'clientes' && isStaff && <ClientsPanel />}
        {activeView === 'repuestos' && isStaff && <RepuestosPanel />}
        {activeView === 'diagnostico' && isStaff && <DiagnosisPanel />}
        {activeView === 'cotizacion' && <QuotePanel isStaff={isStaff} isAdmin={profile?.rol === 'ADMIN'} />}
        {activeView === 'operaciones' && isStaff && <OperationsPanel profile={profile} />}
        {activeView === 'seguimiento' && !isStaff && <OrderTrackingPanel />}
        {activeView === 'dashboard' && isStaff && <StatusDashboardPanel />}
        {activeView === 'busqueda' && isStaff && <GlobalSearchPanel />}
      </section>

    </main>
  )
}

export default App