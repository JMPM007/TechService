import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { Register } from './Pages/Register'
import { Login } from './Pages/Login.jsx'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      {/* Barra de navegación sencilla para probar */}
      <nav style={{ display: 'flex', gap: '1rem', justifyContent: 'center', margin: '1rem 0' }}>
        <Link to="/login">Iniciar Sesión</Link>
        <Link to="/registro">Registrarse</Link>
      </nav>

      {/* Definición de Rutas */}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Register />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App