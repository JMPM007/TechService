import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/authService";
import "../Css/Register.css";

export function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");

    if (formData.password !== formData.confirmPassword) {
      setMensaje("Las contraseñas no coinciden.");
      return;
    }

    try {
      const res = await registerUser({
        nombre: formData.nombre,
        email: formData.email,
        password: formData.password
      });

      if (res.error) {
        setMensaje(`Error: ${res.error}`);
      } else {
        navigate("/login");
      }
    } catch {
      setMensaje("Error al conectar con el servidor.");
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-brand">TECHSERVICE</div>

      <div className="auth-header">
        <h1>Crear cuenta</h1>
        <p>Regístrate para acceder a los servicios de TechService.</p>
      </div>

      <div className="auth-card">
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre completo</label>
            <input
              className="auth-input"
              type="text"
              name="nombre"
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Correo electrónico</label>
            <input
              className="auth-input"
              type="email"
              name="email"
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <div className="input-container">
              <input
                className="auth-input"
                type={showPassword ? "text" : "password"}
                name="password"
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Confirmar contraseña</label>
            <div className="input-container">
              <input
                className="auth-input"
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </div>

          <button className="submit-btn" type="submit">
            Crear cuenta
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login" className="auth-link">
            Ya tengo una cuenta
          </Link>
        </div>

        {mensaje && <p className="status-message">{mensaje}</p>}
      </div>
    </div>
  );
}