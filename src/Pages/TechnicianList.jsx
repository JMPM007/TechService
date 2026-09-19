import { useEffect, useState } from "react";
import { getTechniciansService } from "../services/technicianService";
import "../Css/Technician.css";

export function TechnicianList() {
  const [tecnicos, setTecnicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Estados para búsqueda y filtros (Criterio 3)
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEspecialidad, setFilterEspecialidad] = useState("TODAS");
  const [filterEstado, setFilterEstado] = useState("TODOS");

  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        const token = localStorage.getItem("token");
        const data = await getTechniciansService(token);
        setTecnicos(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTechnicians();
  }, []);

  // Obtener lista única de especialidades para el select de filtro
  const especialidadesUnicas = [
    "TODAS",
    ...new Set(tecnicos.map((t) => t.especialidad).filter(Boolean))
  ];

  // Lógica de filtrado dinámico (Criterio 3)
  const tecnicosFiltrados = tecnicos.filter((tec) => {
    const coincideBusqueda =
      tec.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tec.cedula.includes(searchTerm);

    const coincideEspecialidad =
      filterEspecialidad === "TODAS" || tec.especialidad === filterEspecialidad;

    const coincideEstado =
      filterEstado === "TODOS" || tec.estado === filterEstado;

    return coincideBusqueda && coincideEspecialidad && coincideEstado;
  });

  if (loading) return <p className="status-message">Cargando técnicos...</p>;
  if (error) return <p className="status-message error">{error}</p>;

  return (
    <div className="table-container">
      <div className="auth-header">
        <h1>Directorio de Técnicos y Disponibilidad</h1>
        <p>Gestión y monitoreo del personal operativo.</p>
      </div>

      {/* Criterio 3: Barra de Búsqueda y Filtros */}
      <div className="filter-bar">
        <input
          type="text"
          className="auth-input search-input"
          placeholder="Buscar por nombre o cédula..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select
          className="auth-input select-filter"
          value={filterEspecialidad}
          onChange={(e) => setFilterEspecialidad(e.target.value)}
        >
          {especialidadesUnicas.map((esp, index) => (
            <option key={index} value={esp}>
              {esp === "TODAS" ? "Todas las Especialidades" : esp}
            </option>
          ))}
        </select>

        <select
          className="auth-input select-filter"
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
        >
          <option value="TODOS">Todos los Estados</option>
          <option value="DISPONIBLE">Disponible</option>
          <option value="OCUPADO">Ocupado</option>
          <option value="INACTIVO">Inactivo</option>
        </select>
      </div>

      {/* Criterio 1: Tabla Parametrizada */}
      <table className="data-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Cédula</th>
            <th>Contacto</th>
            <th>Especialidad</th>
            <th>Estado Actual</th>
          </tr>
        </thead>
        <tbody>
          {tecnicosFiltrados.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ textAlign: "center" }}>
                No se encontraron técnicos con los criterios ingresados.
              </td>
            </tr>
          ) : (
            tecnicosFiltrados.map((tec) => (
              <tr key={tec.tecnico_id}>
                <td>
                  <strong>{tec.nombre}</strong>
                </td>
                <td>{tec.cedula}</td>
                <td>
                  <div>{tec.email}</div>
                  <small style={{ color: "#666" }}>{tec.telefono}</small>
                </td>
                <td>{tec.especialidad}</td>
                {/* Criterio 2: Indicador Dinámico de Estado */}
                <td>
                  <span className={`badge badge-${tec.estado.toLowerCase()}`}>
                    {tec.estado}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}