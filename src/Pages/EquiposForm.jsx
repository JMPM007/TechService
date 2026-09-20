import { useState } from 'react';
import '../Css/EquiposForm.css';

export function EquiposForm() {
  const [formData, setFormData] = useState({
    cedula: "",
    cliente_id: "",
    tipo: "Laptop",
    marca: "",
    modelo: "",
    numero_serie: "",
    motivo_ingreso: ""
  });

  const [clienteEncontrado, setClienteEncontrado] = useState(null);
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: "", texto: ""});
  const [cargando, setCargando] = useState(false);

  const tiposEquipos = [
    "Laptop",
    "PC de Escritorio",
    "Smartphone",
    "Tablet",
    "Consola de Juegos",
    "Impresora",
    "Otro"
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleBuscarCliente = async () => {
    if (!formData.cedula.trim()) {
      setMensaje({ tipo: 'error', texto: 'Ingrese un número de cédula para buscar' });
      return;
    }

    setBuscandoCliente(true);
    setMensaje({ tipo: '', texto: '' });

    const token = localStorage.getItem('token');
    if (!token) {
      setMensaje({ tipo: 'error', texto: 'Sesión no válida. Inicie sesión nuevamente.' });
      setBuscandoCliente(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/clientes/cedula/${formData.cedula.trim()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data) {
        setClienteEncontrado(data);
        setFormData((prev) => ({ ...prev, cliente_id: data.id }));
        setMensaje({ tipo: 'exito', texto: `Cliente localizado: ${data.nombres} ${data.apellidos}` });
      } else {
        setClienteEncontrado(null);
        setMensaje({ 
          tipo: 'error', 
          texto: data.error || 'No se encontró ningún cliente con esa cédula. Debe registrarlo primero.' 
        });
      }
    } catch {
      setMensaje({ tipo: 'error', texto: 'Error al conectar con el servidor para verificar cliente' });
    } finally {
      setBuscandoCliente(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje({ tipo: '', texto: '' });

    if (!formData.cliente_id && !formData.cedula) {
      setMensaje({ tipo: 'error', texto: 'Es obligatorio asociar un cliente válido' });
      return;
    }

    setCargando(true);

    const token = localStorage.getItem('token');
    if (!token) {
      setMensaje({ tipo: 'error', texto: 'Sesión no válida. Inicie sesión nuevamente.' });
      setCargando(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/equipos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setMensaje({ 
          tipo: 'exito', 
          texto: `¡Equipo registrado con éxito! ID asignado: #${data.equipo.id}` 
        });
        
        setFormData({
          cedula: '',
          cliente_id: '',
          tipo: 'Laptop',
          marca: '',
          modelo: '',
          numero_serie: '',
          motivo_ingreso: ''
        });
        setClienteEncontrado(null);
      } else {
        setMensaje({ tipo: 'error', texto: data.error || 'Error al registrar el equipo' });
      }
    } catch {
      setMensaje({ tipo: 'error', texto: 'Error de red o servidor no disponible' });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="recepcion-container">
      <h2 className="recepcion-titulo">
        Recepción y Registro de Dispositivo
      </h2>

      {mensaje.texto && (
        <div className={`mensaje-banner ${mensaje.tipo === 'exito' ? 'mensaje-exito' : 'mensaje-error'}`}>
          {mensaje.texto}
        </div>
      )}

      <form onSubmit={handleSubmit} className="recepcion-form">
        
        <div className="seccion-cliente">
          <h3 className="seccion-subtitulo">1. Identificación del Cliente</h3>
          
          <div className="flex-row">
            <div className="flex-auto">
              <label className="form-label">
                Número de Cédula *
              </label>
              <input
                type="text"
                name="cedula"
                value={formData.cedula}
                onChange={handleChange}
                placeholder="Ej: 1005123456"
                className="form-input"
                required
              />
            </div>
            <div className="flex-end">
              <button
                type="button"
                onClick={handleBuscarCliente}
                disabled={buscandoCliente}
                className="btn-secundario"
              >
                {buscandoCliente ? 'Buscando...' : 'Verificar Cliente'}
              </button>
            </div>
          </div>

          {clienteEncontrado && (
            <div className="card-cliente font-sm">
              <p><span className="font-semibold">Nombre:</span> {clienteEncontrado.nombres} {clienteEncontrado.apellidos}</p>
              <p><span className="font-semibold">Teléfono:</span> {clienteEncontrado.telefono}</p>
              <p><span className="font-semibold">Email:</span> {clienteEncontrado.email || 'N/A'}</p>
            </div>
          )}
        </div>

        <div className="seccion-equipo">
          <h3 className="seccion-subtitulo">2. Datos del Equipo</h3>

          <div className="grid-dos-columnas">
            <div>
              <label className="form-label">
                Tipo de Dispositivo *
              </label>
              <select
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                className="form-select"
                required
              >
                {tiposEquipos.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">
                Marca *
              </label>
              <input
                type="text"
                name="marca"
                value={formData.marca}
                onChange={handleChange}
                placeholder="Ej: ASUS, Dell, Apple, Samsung"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">
                Modelo *
              </label>
              <input
                type="text"
                name="modelo"
                value={formData.modelo}
                onChange={handleChange}
                placeholder="Ej: ROG Strix, Pavilion, iPhone 13"
                className="form-input"
                required
              />
            </div>

            <div>
              <label className="form-label">
                Número de Serie (Opcional)
              </label>
              <input
                type="text"
                name="numero_serie"
                value={formData.numero_serie}
                onChange={handleChange}
                placeholder="S/N o Service Tag"
                className="form-input"
              />
            </div>
          </div>

          <div>
            <label className="form-label">
              Motivo de Ingreso y Estado Físico * 
            </label>
            <textarea
              name="motivo_ingreso" 
              value={formData.motivo_ingreso}
              onChange={handleChange}
              rows="4"
              placeholder="Describa el motivo del ingreso, fallas reportadas por el cliente, estado físico del equipo (rayones, golpes) y accesorios dejados..."
              className="form-textarea"
              required
            ></textarea>
          </div>
        </div>

        <button
          type="submit"
          disabled={cargando}
          className="btn-principal"
        >
          {cargando ? 'Registrando Dispositivo...' : 'Registrar Equipo e Ingreso'}
        </button>
      </form>
    </div>
  );
} 