import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import ClienteForm from './components/ClienteForm'
import OrdenesPanel from './components/OrdenesPanel'
import './App.css'

function Inicio() {
  return (
    <div style={{ textAlign: 'center', marginTop: '3rem' }}>
      <h1>TechService</h1>
      <p>Selecciona una opción del menú para comenzar.</p>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <nav className="navbar">
        <Link to="/">Inicio</Link>
        <Link to="/clientes">Registrar cliente</Link>
        <Link to="/ordenes">Órdenes de servicio</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/clientes" element={<ClienteForm />} />
        <Route path="/ordenes" element={<OrdenesPanel />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App