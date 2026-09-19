import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../services/authService";
import "../Css/Login.css";

export function Login() {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    email: "",
    password: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");

    try {
      const res = await loginUser(credentials);

      if (res.token) {
        localStorage.setItem("token", res.token);
        
        const rol = res.usuario?.rol;
        if (rol) {
          localStorage.setItem("rol", rol);
        }

        // Redirección condicional según el rol devuelto por el backend
        if (rol === "ADMIN") {
          navigate("/admin-panel");
        } else if (rol === "TECNICO") {
          navigate("/tecnico-panel");
        } else {
          navigate("/cliente-panel");
        }
      } else {
        setMensaje(res.message || res.error || "Credenciales incorrectas.");
      }
    } catch {
      setMensaje("Error al conectar con el servidor.");
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-brand">TECHSERVICE</div>

      <div className="auth-header">
        <h1>Iniciar sesión</h1>
        <p>Ingresa tus datos para acceder a tu cuenta.</p>
      </div>

      <div className="auth-card">
        <form className="auth-form" onSubmit={handleSubmit}>
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

          <button className="submit-btn" type="submit">
            Iniciar sesión
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/register" className="auth-link">
            ¿No tienes cuenta? Regístrate
          </Link>
        </div>

        {mensaje && <p className="status-message">{mensaje}</p>}
      </div>
    </div>
  );
}