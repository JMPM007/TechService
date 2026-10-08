import { BrowserRouter, Routes, Route, Navigate, Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Register } from './Pages/Register.jsx';
import { Login } from './Pages/Login.jsx';
import { RegisterTechnician } from './Pages/RegisterTechnician.jsx'; 
import { TechDashboard } from './Pages/TechDashboard.jsx';
import { ClientDashboard } from './Pages/ClientDashboard.jsx';
import { TechnicianList } from './Pages/TechnicianList.jsx';

import DirectorioClientes from './components/DirectorioClientes.jsx';
import OrdenesPanel from './components/OrdenesPanel.jsx'; 

import RegistrarEquipo from './components/RegistrarEquipo.jsx';

import './App.css'; 

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const rol = localStorage.getItem('rol');

  if (!token) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(rol)) return <Navigate to="/login" replace />;

  return children || <Outlet />;
};

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-brand">TechService Admin</div>
        <nav className="sidebar-nav">
          <Link to="/admin-panel" className={`nav-link ${location.pathname === '/admin-panel' ? 'active' : ''}`}>Inicio</Link>
          <Link to="/admin-panel/tecnicos" className={`nav-link ${location.pathname === '/admin-panel/tecnicos' ? 'active' : ''}`}>Registrar Técnico</Link>
          <Link to="/admin-panel/clientes" className={`nav-link ${location.pathname === '/admin-panel/clientes' ? 'active' : ''}`}>Directorio de Clientes</Link>
          <Link to="/admin-panel/recepcion" className={`nav-link ${location.pathname === '/admin-panel/recepcion' ? 'active' : ''}`}>Recepción de Equipos</Link>
          <Link to="/admin-panel/ordenes" className={`nav-link ${location.pathname === '/admin-panel/ordenes' ? 'active' : ''}`}>Órdenes de Servicio</Link>
        </nav>
        <button onClick={handleLogout} className="btn-logout">Cerrar Sesión</button>
      </aside>
      <main className="admin-content"><Outlet /></main>
    </div>
  );
};

const TechLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-brand">TechService Técnico</div>
        <nav className="sidebar-nav">
          <Link to="/tecnico-panel" className={`nav-link ${location.pathname === '/tecnico-panel' ? 'active' : ''}`}>Inicio</Link>
          <Link to="/tecnico-panel/clientes" className={`nav-link ${location.pathname === '/tecnico-panel/clientes' ? 'active' : ''}`}>Directorio de Clientes</Link>
          <Link to="/tecnico-panel/recepcion" className={`nav-link ${location.pathname === '/tecnico-panel/recepcion' ? 'active' : ''}`}>Recepción de Equipos</Link>
          <Link to="/tecnico-panel/ordenes" className={`nav-link ${location.pathname === '/tecnico-panel/ordenes' ? 'active' : ''}`}>Órdenes de Servicio</Link>
        </nav>
        <button onClick={handleLogout} className="btn-logout">Cerrar Sesión</button>
      </aside>
      <main className="admin-content"><Outlet /></main>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Rutas Protegidas de Administración */}
        <Route 
          path="/admin-panel" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminLayout />
            </ProtectedRoute>
          } 
        >
          <Route index element={<TechnicianList />} />
          <Route path="tecnicos" element={<RegisterTechnician />} />
          <Route path="clientes" element={<DirectorioClientes />} /> {/* Tu directorio optimizado */}
          <Route path="recepcion" element={<RegistrarEquipo onEquipoRegistrado={() => {}} onIrAFicha={() => {}} />} />
          <Route path="ordenes" element={<OrdenesPanel />} /> {/* Panel de órdenes global del equipo */}
        </Route>
        
        {/* Rutas Protegidas de Técnicos */}
        <Route 
          path="/tecnico-panel" 
          element={
            <ProtectedRoute allowedRoles={['TECNICO']}>
              <TechLayout />
            </ProtectedRoute>
          } 
        >
          <Route index element={<TechDashboard />} />
          <Route path="clientes" element={<DirectorioClientes />} />
          <Route path="recepcion" element={<RegistrarEquipo onEquipoRegistrado={() => {}} onIrAFicha={() => {}} />} />
          <Route path="ordenes" element={<OrdenesPanel />} />
        </Route>

        {/* Panel del Cliente Final */}
        <Route 
          path="/cliente-panel" 
          element={
            <ProtectedRoute allowedRoles={['CLIENTE']}>
              <ClientDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
