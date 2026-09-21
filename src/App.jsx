import React, { useState } from 'react'
import Navbar from './components/Navbar'
import DirectorioClientes from './components/DirectorioClientes'
import FichaTecnica from './components/FichaTecnica'
import CrearOrdenServicio from './components/CrearOrdenServicio'
import ListaOrdenes from './components/ListaOrdenes'
import RegistrarEquipo from './components/RegistrarEquipo'
import './App.css'

export default function App() {
  // Iniciar en 'clientes' para ver el directorio de clientes integrado
  const [activeTab, setActiveTab] = useState('clientes')
  const [preselectedEquipo, setPreselectedEquipo] = useState(null)
  const [highlightOrdenId, setHighlightOrdenId] = useState(null)

  const handleCrearOrdenConEquipo = (equipo) => {
    setPreselectedEquipo(equipo)
    setActiveTab('crear-orden')
  }

  const handleOrdenCreada = (orden) => {
    setHighlightOrdenId(orden.id)
  }

  const handleIrAOrdenes = () => {
    setActiveTab('ordenes')
  }

  const handleIrAFicha = (equipoId) => {
    setActiveTab('fichas')
  }

  return (
    <main className="app-shell">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === 'clientes' && (
        <DirectorioClientes />
      )}

      {activeTab === 'fichas' && (
        <FichaTecnica onCrearOrdenConEquipo={handleCrearOrdenConEquipo} />
      )}

      {activeTab === 'crear-orden' && (
        <CrearOrdenServicio
          preselectedEquipo={preselectedEquipo}
          onOrdenCreada={handleOrdenCreada}
          onIrAOrdenes={handleIrAOrdenes}
        />
      )}

      {activeTab === 'ordenes' && (
        <ListaOrdenes
          onNuevaOrden={() => {
            setPreselectedEquipo(null)
            setActiveTab('crear-orden')
          }}
          highlightOrdenId={highlightOrdenId}
        />
      )}

      {activeTab === 'recepcion' && (
        <RegistrarEquipo
          onEquipoRegistrado={() => {}}
          onIrAFicha={handleIrAFicha}
        />
      )}
    </main>
  )
}
