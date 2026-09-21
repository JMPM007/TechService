import React from 'react'

export default function Navbar({ activeTab, setActiveTab }) {
  const getEyebrow = () => {
    switch (activeTab) {
      case 'clientes':
        return 'TechService / Clientes'
      case 'fichas':
        return 'TechService / Equipos'
      case 'crear-orden':
        return 'TechService / Órdenes'
      case 'ordenes':
        return 'TechService / Órdenes'
      case 'recepcion':
        return 'TechService / Recepción'
      default:
        return 'TechService'
    }
  }

  const getTitle = () => {
    switch (activeTab) {
      case 'clientes':
        return 'Directorio de clientes'
      case 'fichas':
        return 'Ficha técnica de equipos'
      case 'crear-orden':
        return 'Creación de orden de servicio'
      case 'ordenes':
        return 'Directorio de órdenes de servicio'
      case 'recepcion':
        return 'Recepción y registro de equipos'
      default:
        return 'Gestión Técnica'
    }
  }

  return (
    <header className="topbar">
      <div className="brand-mark" aria-hidden="true" onClick={() => setActiveTab('clientes')}>
        TS
      </div>
      <div className="brand-info">
        <p className="eyebrow">{getEyebrow()}</p>
        <h1>{getTitle()}</h1>
      </div>

      <nav className="topbar-nav">
        <button
          type="button"
          className={`nav-tab-link ${activeTab === 'clientes' ? 'active' : ''}`}
          onClick={() => setActiveTab('clientes')}
        >
          Clientes
        </button>
        <button
          type="button"
          className={`nav-tab-link ${activeTab === 'fichas' ? 'active' : ''}`}
          onClick={() => setActiveTab('fichas')}
        >
          Ficha Técnica
        </button>
        <button
          type="button"
          className={`nav-tab-link ${activeTab === 'crear-orden' ? 'active' : ''}`}
          onClick={() => setActiveTab('crear-orden')}
        >
          Crear Orden
        </button>
        <button
          type="button"
          className={`nav-tab-link ${activeTab === 'ordenes' ? 'active' : ''}`}
          onClick={() => setActiveTab('ordenes')}
        >
          Órdenes de Servicio
        </button>
        <button
          type="button"
          className={`nav-tab-link ${activeTab === 'recepcion' ? 'active' : ''}`}
          onClick={() => setActiveTab('recepcion')}
        >
          Recepción Equipos
        </button>
      </nav>

      <span className="role-label">Panel operativo</span>
    </header>
  )
}
