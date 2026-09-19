import { BrowserRouter, Routes, Route, Navigate, Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Register } from './Pages/Register.jsx';
import { Login } from './Pages/Login.jsx';
import { RegisterTechnician } from './Pages/RegisterTechnician.jsx'; 
import { TechDashboard } from './Pages/TechDashboard.jsx';
import { ClientDashboard } from './Pages/ClientDashboard.jsx';
import './App.css'; 

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const rol = localStorage.getItem('rol');

  if (!token) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(rol)) return <Navigate to="/login" replace />;

  return children;
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
          <Link 
            to="/admin-panel" 
            className={`nav-link ${location.pathname === '/admin-panel' ? 'active' : ''}`}
          >
            Inicio
          </Link>
          <Link 
            to="/admin-panel/tecnicos" 
            className={`nav-link ${location.pathname === '/admin-panel/tecnicos' ? 'active' : ''}`}
          >
            Registrar Técnico
          </Link>
        </nav>
        <button onClick={handleLogout} className="btn-logout">
          Cerrar Sesión
        </button>
      </aside>

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route 
          path="/admin-panel" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminLayout />
            </ProtectedRoute>
          } 
        >
          <Route index element={
            <div style={{ width: '100%', maxWidth: '440px' }}>
              <div className="auth-header">
                <h1>Panel de Administración</h1>
                <p>Bienvenido al sistema de gestión de TechService.</p>
              </div>
            </div>
          } />
          <Route path="tecnicos" element={<RegisterTechnician />} />
        </Route>
        
        <Route 
          path="/tecnico-panel" 
          element={
            <ProtectedRoute allowedRoles={['TECNICO']}>
              <TechDashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/cliente-panel" 
          element={
            <ProtectedRoute allowedRoles={['CLIENTE']}>
              <ClientDashboard />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}