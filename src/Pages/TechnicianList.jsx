import { useEffect, useState } from "react";
import {getTechniciansService, updateTechnicianStatusService} from "../services/technicianService";
import "../Css/Technician.css";

export function TechnicianList() {
  const [tecnicos, setTecnicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [filterEspecialidad, setFilterEspecialidad] = useState("TODAS");
  const [filterEstado, setFilterEstado] = useState("TODOS");

  useEffect(() => {
    let isMounted = true;

    const fetchTechnicians = async () => {
      try {
        const token = localStorage.getItem("token");
        const data = await getTechniciansService(token);
        if (isMounted) {
          setTecnicos(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchTechnicians();

    return () => {
      isMounted = false;
    };
  }, []);

  // Manejador para el cambio de estado dinámico
  const handleStatusChange = async (tecnicoId, nuevoEstado) => {
    try {
      setActionMessage("");
      const token = localStorage.getItem("token");
      await updateTechnicianStatusService(tecnicoId, nuevoEstado, token);

      // Actualizar el estado localmente sin re-recargar toda la página
      setTecnicos((prev) =>
        prev.map((tec) =>
          tec.tecnico_id === tecnicoId ? { ...tec, estado: nuevoEstado } : tec
        )
      );

      setActionMessage("Estado actualizado con éxito");
      setTimeout(() => setActionMessage(""), 3000);
    } catch (err) {
      alert(`Error al actualizar estado: ${err.message}`);
    }
  };

  const especialidadesUnicas = [
    "TODAS",
    ...new Set(tecnicos.map((t) => t.especialidad).filter(Boolean))
  ];

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
        {actionMessage && (
          <span className="status-message success" style={{ fontSize: "0.9rem" }}>
            {actionMessage}
          </span>
        )}
      </div>

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
                <td>
                  <select
                    className={`select-status badge-${tec.estado.toLowerCase()}`}
                    value={tec.estado}
                    onChange={(e) => handleStatusChange(tec.tecnico_id, e.target.value)}
                  >
                    <option value="DISPONIBLE">DISPONIBLE</option>
                    <option value="OCUPADO">OCUPADO</option>
                    <option value="INACTIVO">INACTIVO</option>
                  </select>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}