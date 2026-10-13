import { useNavigate } from 'react-router-dom';
import '../Css/TechDashboard.css'

export function TechDashboard() {
  const navigate = useNavigate();

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Panel de Control - Técnico</h1>
        <p>
          Bienvenido al centro de gestión de servicios. Selecciona una acción.
        </p>
      </header>

      <div className="dashboard-grid">
        <div 
          className="dashboard-card"
          onClick={() => navigate('/tecnico-panel/clientes')}
        >
          <div className="card-icon">👤</div>
          <h3>Registrar Cliente</h3>
          <p>
            Registra los datos de un cliente nuevo en el sistema.
          </p>
        </div>

        <div 
          className="dashboard-card"
          onClick={() => navigate('/tecnico-panel/recepcion')}
        >
          <div className="card-icon">💻</div>
          <h3>Recepción de Equipos</h3>
          <p>
            Registra el ingreso de nuevos equipos al taller.
          </p>
        </div>
      </div>
    </div>
  );
}