import { useEffect, useState } from 'react'
import {
  changeMyPassword,
  getMyProfile,
  updateMyProfile,
} from './services/profileService'
import './App.css'

const emptyPasswordForm = {
  contrasenaActual: '',
  nuevaContrasena: '',
  confirmacionContrasena: '',
}

function App() {
  const [profile, setProfile] = useState(null)
  const [profileForm, setProfileForm] = useState({
    nombre: '',
    email: '',
  })
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProfile() {
      try {
        const usuario = await getMyProfile()
        setProfile(usuario)
        setProfileForm({
          nombre: usuario.nombre,
          email: usuario.email,
        })
      } catch (requestError) {
        setError(requestError.message)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  function handleProfileChange(event) {
    const { name, value } = event.target

    setProfileForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function handlePasswordChange(event) {
    const { name, value } = event.target

    setPasswordForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  async function handleProfileSubmit(event) {
    event.preventDefault()
    setMessage('')
    setError('')

    try {
      const usuario = await updateMyProfile(profileForm)
      setProfile(usuario)
      setMessage('Datos personales actualizados correctamente.')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault()
    setMessage('')
    setError('')

    try {
      const response = await changeMyPassword(passwordForm)
      setPasswordForm(emptyPasswordForm)
      setMessage(response.mensaje)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  if (loading) {
    return <main className="page"><p>Cargando perfil...</p></main>
  }

  return (
    <main className="page">
      <header>
        <p className="eyebrow">TechService</p>
        <h1>Mi perfil</h1>
        <p>Actualiza tus datos personales y la contraseña de tu cuenta.</p>
      </header>

      {message && <p className="alert success">{message}</p>}
      {error && <p className="alert error">{error}</p>}

      <div className="grid">
        <section className="card">
          <h2>Datos personales</h2>
          {profile?.rol && <p className="role">Rol: {profile.rol}</p>}

          <form onSubmit={handleProfileSubmit}>
            <label htmlFor="nombre">Nombre completo</label>
            <input
              id="nombre"
              name="nombre"
              value={profileForm.nombre}
              onChange={handleProfileChange}
              minLength="2"
              maxLength="100"
              required
            />

            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              name="email"
              type="email"
              value={profileForm.email}
              onChange={handleProfileChange}
              maxLength="100"
              required
            />

            <button type="submit">Guardar cambios</button>
          </form>
        </section>

        <section className="card">
          <h2>Cambiar contraseña</h2>

          <form onSubmit={handlePasswordSubmit}>
            <label htmlFor="contrasenaActual">Contraseña actual</label>
            <input
              id="contrasenaActual"
              name="contrasenaActual"
              type="password"
              value={passwordForm.contrasenaActual}
              onChange={handlePasswordChange}
              required
            />

            <label htmlFor="nuevaContrasena">Nueva contraseña</label>
            <input
              id="nuevaContrasena"
              name="nuevaContrasena"
              type="password"
              value={passwordForm.nuevaContrasena}
              onChange={handlePasswordChange}
              minLength="8"
              maxLength="72"
              required
            />

            <label htmlFor="confirmacionContrasena">
              Confirmar nueva contraseña
            </label>
            <input
              id="confirmacionContrasena"
              name="confirmacionContrasena"
              type="password"
              value={passwordForm.confirmacionContrasena}
              onChange={handlePasswordChange}
              minLength="8"
              maxLength="72"
              required
            />

            <button type="submit">Actualizar contraseña</button>
          </form>
        </section>
      </div>
    </main>
  )
}

export default App