import { useState } from 'react'
import {
  BrowserRouter,
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import { ClientDashboard } from './Pages/ClientDashboard.jsx'
import { Login } from './Pages/Login.jsx'
import { Register } from './Pages/Register.jsx'
import { RegisterTechnician } from './Pages/RegisterTechnician.jsx'
import { TechDashboard } from './Pages/TechDashboard.jsx'
import { TechnicianList } from './Pages/TechnicianList.jsx'
import DiagnosisPanel from './components/DiagnosisPanel.jsx'
import DirectorioClientes from './components/DirectorioClientes.jsx'
import OperationsPanel from './components/OperationsPanel.jsx'
import ProfilePanel from './components/ProfilePanel.jsx'
import QuotePanel from './components/QuotePanel.jsx'
import RegistrarEquipo from './components/RegistrarEquipo.jsx'
import { getOrderHistory } from './services/orderService.js'
import './App.css'

function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('techservice_token') || localStorage.getItem('token')
  const rol = localStorage.getItem('rol')

  if (!token) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(rol)) return <Navigate to="/login" replace />
  return children || <Outlet />
}

function useLogout() {
  const navigate = useNavigate()
  return () => {
    localStorage.removeItem('token')
    localStorage.removeItem('techservice_token')
    localStorage.removeItem('rol')
    navigate('/login')
  }
}

function SidebarLayout({ title, links }) {
  const location = useLocation()
  const logout = useLogout()

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-brand">{title}</div>
        <nav className="sidebar-nav">
          {links.map(([path, label]) => (
            <Link
              key={path}
              to={path}
              className={`nav-link ${location.pathname === path ? 'active' : ''}`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <button onClick={logout} className="btn-logout" type="button">Cerrar Sesión</button>
      </aside>
      <main className="admin-content"><Outlet /></main>
    </div>
  )
}

const adminLinks = [
  ['/admin-panel', 'Inicio'],
  ['/admin-panel/tecnicos', 'Registrar Técnico'],
  ['/admin-panel/clientes', 'Directorio de Clientes'],
  ['/admin-panel/recepcion', 'Recepción de Equipos'],
  ['/admin-panel/ordenes', 'Operaciones y órdenes'],
  ['/admin-panel/historial', 'Historial de órdenes'],
  ['/admin-panel/cotizaciones', 'Cotizaciones'],
  ['/admin-panel/perfil', 'Mi cuenta'],
]

const technicianLinks = [
  ['/tecnico-panel', 'Inicio'],
  ['/tecnico-panel/clientes', 'Directorio de Clientes'],
  ['/tecnico-panel/recepcion', 'Recepción de Equipos'],
  ['/tecnico-panel/ordenes', 'Operaciones y órdenes'],
  ['/tecnico-panel/historial', 'Historial de órdenes'],
  ['/tecnico-panel/diagnostico', 'Diagnóstico'],
  ['/tecnico-panel/cotizaciones', 'Cotizaciones'],
  ['/tecnico-panel/perfil', 'Mi cuenta'],
]

function AdminLayout() {
  return <SidebarLayout title="TechService Admin" links={adminLinks} />
}

function TechLayout() {
  return <SidebarLayout title="TechService Técnico" links={technicianLinks} />
}

function ClientLayout() {
  return (
    <SidebarLayout
      title="TechService Cliente"
      links={[
        ['/cliente-panel', 'Inicio'],
        ['/cliente-panel/perfil', 'Mi cuenta'],
      ]}
    />
  )
}

function OrderHistoryPanel() {
  const [reference, setReference] = useState('')
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function loadHistory(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      setHistory(await getOrderHistory(reference.trim()))
    } catch (requestError) {
      setHistory([])
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="card history-card">
      <h2>Historial de una orden</h2>
      <p>Consulta los cambios de estado por ID o código de orden.</p>
      <form onSubmit={loadHistory}>
        <label htmlFor="order-history-reference">ID o código de orden</label>
        <input
          id="order-history-reference"
          value={reference}
          onChange={(event) => setReference(event.target.value)}
          placeholder="Ej. 2 o OS-2026-0002"
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Consultando...' : 'Consultar historial'}
        </button>
      </form>
      {error && <p className="alert error" role="alert">{error}</p>}
      {history.length > 0 && (
        <ol className="history-list">
          {history.map((entry) => (
            <li key={entry.id}>
              <strong>{entry.estadoAnterior ?? 'Sin estado'} → {entry.estadoNuevo}</strong>
              <span>{entry.usuarioNombre} · {new Date(entry.creadoEn).toLocaleString()}</span>
              {entry.observacion && <small>{entry.observacion}</small>}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

function OrdersWorkspace() {
  const role = localStorage.getItem('rol')
  return <OperationsPanel profile={{ rol: role }} />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/admin-panel"
          element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLayout /></ProtectedRoute>}
        >
          <Route index element={<TechnicianList />} />
          <Route path="tecnicos" element={<RegisterTechnician />} />
          <Route path="clientes" element={<DirectorioClientes />} />
          <Route path="recepcion" element={<RegistrarEquipo onEquipoRegistrado={() => {}} onIrAFicha={() => {}} />} />
          <Route path="ordenes" element={<OrdersWorkspace />} />
          <Route path="historial" element={<OrderHistoryPanel />} />
          <Route path="cotizaciones" element={<QuotePanel />} />
          <Route path="perfil" element={<ProfilePanel />} />
        </Route>

        <Route
          path="/tecnico-panel"
          element={<ProtectedRoute allowedRoles={['TECNICO']}><TechLayout /></ProtectedRoute>}
        >
          <Route index element={<TechDashboard />} />
          <Route path="clientes" element={<DirectorioClientes />} />
          <Route path="recepcion" element={<RegistrarEquipo onEquipoRegistrado={() => {}} onIrAFicha={() => {}} />} />
          <Route path="ordenes" element={<OrdersWorkspace />} />
          <Route path="historial" element={<OrderHistoryPanel />} />
          <Route path="diagnostico" element={<DiagnosisPanel />} />
          <Route path="cotizaciones" element={<QuotePanel />} />
          <Route path="perfil" element={<ProfilePanel />} />
        </Route>

        <Route
          path="/cliente-panel"
          element={<ProtectedRoute allowedRoles={['CLIENTE']}><ClientLayout /></ProtectedRoute>}
        >
          <Route index element={<ClientDashboard />} />
          <Route path="perfil" element={<ProfilePanel />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
