import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Register } from './Pages/Register.jsx';
import { Login } from './Pages/Login.jsx';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const rol = localStorage.getItem('rol');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(rol)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AdminDashboard = () => <h2>Panel Principal de Administración</h2>;
const ClientDashboard = () => <h2>Panel de Cliente</h2>;
const TechDashboard = () => <h2>Panel de Técnico</h2>;

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
              <AdminDashboard />
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

        <Route 
          path="/tecnico-panel" 
          element={
            <ProtectedRoute allowedRoles={['TECNICO']}>
              <TechDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}