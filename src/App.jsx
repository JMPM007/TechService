import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Register } from './Pages/Register.jsx';
import { Login } from './Pages/Login.jsx';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redireccionar la ruta raíz al Login por defecto */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Rutas principales */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Ruta para capturar cualquier URL no encontrada */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;