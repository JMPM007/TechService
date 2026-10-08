import { useEffect, useState } from 'react'
import {
  changeMyPassword,
  getMyProfile,
  updateMyProfile,
} from '../services/profileService'

const initialPasswordForm = {
  contrasenaActual: '',
  nuevaContrasena: '',
  confirmacionContrasena: '',
}

function ProfilePanel() {
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({ nombre: '', email: '' })
  const [passwordForm, setPasswordForm] = useState(initialPasswordForm)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadProfile() {
      try {
        const usuario = await getMyProfile()
        setProfile(usuario)
        setForm({ nombre: usuario.nombre, email: usuario.email })
      } catch (requestError) {
        setError(requestError.message)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [])

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function updatePasswordField(event) {
    setPasswordForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function saveProfile(event) {
    event.preventDefault()
    setMessage('')
    setError('')
    try {
      const usuario = await updateMyProfile(form)
      setProfile(usuario)
      setMessage('Datos personales actualizados correctamente.')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  async function savePassword(event) {
    event.preventDefault()
    setMessage('')
    setError('')
    if (passwordForm.nuevaContrasena !== passwordForm.confirmacionContrasena) {
      setError('Las contraseñas nuevas no coinciden.')
      return
    }

    try {
      const response = await changeMyPassword(passwordForm)
      setPasswordForm(initialPasswordForm)
      setMessage(response.mensaje)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  if (loading) return <section className="card"><p>Cargando perfil...</p></section>

  return (
    <div className="grid profile-grid">
      {error && <p className="alert error" role="alert">{error}</p>}
      {message && <p className="alert success" role="status">{message}</p>}
      {profile && (
        <section className="card">
          <h2>Datos personales</h2>
          <p className="role">Rol: {profile.rol}</p>
          <form onSubmit={saveProfile}>
            <label htmlFor="profile-name">Nombre completo</label>
            <input id="profile-name" name="nombre" value={form.nombre} onChange={updateField} minLength="2" maxLength="100" required />
            <label htmlFor="profile-email">Correo electrónico</label>
            <input id="profile-email" name="email" type="email" value={form.email} onChange={updateField} maxLength="100" required />
            <button type="submit">Guardar cambios</button>
          </form>
        </section>
      )}
      <section className="card">
        <h2>Cambiar contraseña</h2>
        <form onSubmit={savePassword}>
          <label htmlFor="current-password">Contraseña actual</label>
          <input id="current-password" name="contrasenaActual" type="password" autoComplete="current-password" value={passwordForm.contrasenaActual} onChange={updatePasswordField} required />
          <label htmlFor="new-password">Nueva contraseña</label>
          <input id="new-password" name="nuevaContrasena" type="password" autoComplete="new-password" minLength="8" maxLength="72" value={passwordForm.nuevaContrasena} onChange={updatePasswordField} required />
          <label htmlFor="confirm-password">Confirmar nueva contraseña</label>
          <input id="confirm-password" name="confirmacionContrasena" type="password" autoComplete="new-password" minLength="8" maxLength="72" value={passwordForm.confirmacionContrasena} onChange={updatePasswordField} required />
          <button type="submit">Actualizar contraseña</button>
        </form>
      </section>
    </div>
  )
}

export default ProfilePanel
