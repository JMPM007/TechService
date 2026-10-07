import { useState } from "react";
import { registerTechnician } from "../services/technicianService";
import "../Css/Technician.css"


export function RegisterTechnician() {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    cedula: "",
    telefono: "",
    especialidad: ""
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await registerTechnician(formData);
      setSuccess("Técnico registrado exitosamente.");
      setFormData({
        nombre: "",
        email: "",
        password: "",
        cedula: "",
        telefono: "",
        especialidad: ""
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <h2>Registrar Nuevo Técnico</h2>
      <p className="auth-subtitle">Crea las credenciales y perfil profesional para el personal técnico</p>

      {error && <div className="alert-error">{error}</div>}
      {success && <div className="alert-success">{success}</div>}

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label>Nombre Completo</label>
          <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required placeholder="Ej. Carlos Pérez" />
        </div>

        <div className="form-group">
          <label>Correo Electrónico</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="carlos@techservice.com" />
        </div>

        <div className="form-group">
          <label>Contraseña Inicial</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="••••••••" />
        </div>

        <div className="form-group">
          <label>Documento de Identidad (Cédula)</label>
          <input type="text" name="cedula" value={formData.cedula} onChange={handleChange} required placeholder="1098765432" />
        </div>

        <div className="form-group">
          <label>Teléfono</label>
          <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} required placeholder="3001234567" />
        </div>

        <div className="form-group">
          <label>Especialidad</label>
          <input type="text" name="especialidad" value={formData.especialidad} onChange={handleChange} required placeholder="Ej. Laptops, Microsoldadura" />
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Registrando..." : "Registrar Técnico"}
        </button>
      </form>
    </div>
  );
}