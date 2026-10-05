import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '../../components/AppHeader'
import { useAuth } from '../../context/useAuth'
import { supabase } from '../../lib/supabase'

export default function ResetPasswordPage() {
  const { user, isLoading, isConfigured, logout } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async event => {
    event.preventDefault()
    setError('')
    if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.')
    if (password !== confirmation) return setError('Las contraseñas no coinciden.')
    setBusy(true)
    const { error: requestError } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (requestError) return setError('No pudimos actualizar la contraseña. Solicita un nuevo enlace.')
    await logout()
    navigate('/login', { replace: true, state: { notice: 'Contraseña actualizada. Ya puedes iniciar sesión.' } })
  }

  if (isLoading) return <main className="auth-loading">Verificando el enlace de recuperación…</main>

  return <main className="login-page">
    <section className="login-panel">
      <div className="login-content">
        <div className="login-brand"><Logo /></div>
        <p className="eyebrow">PORTAL DE SALUD DIGITAL</p>
        <h1>Crear nueva contraseña</h1>
        {!user ? <>
          <p className="lead">Este enlace no es válido o ya venció. Solicita uno nuevo desde el inicio de sesión.</p>
          <Link className="primary-button inline-link-button" to="/login">Ir a iniciar sesión</Link>
        </> : <>
          <p className="lead">Crea una contraseña segura de al menos 8 caracteres para tu cuenta.</p>
          <form onSubmit={submit}>
            <label>Nueva contraseña<input value={password} onChange={event => setPassword(event.target.value)} type="password" autoComplete="new-password" /></label>
            <label>Confirmar nueva contraseña<input value={confirmation} onChange={event => setConfirmation(event.target.value)} type="password" autoComplete="new-password" /></label>
            {error && <p className="form-error">{error}</p>}
            <button className="primary-button" disabled={!isConfigured || busy} type="submit">{busy ? 'Actualizando…' : 'Guardar nueva contraseña'}</button>
          </form>
        </>}
      </div>
    </section>
    <aside className="login-aside"><div><span className="aside-icon">+</span><h2>Tu acceso, protegido</h2><p>La recuperación se realiza mediante un enlace de un solo uso enviado a tu correo.</p></div><small>Prototipo académico · EsSalud Digital</small></aside>
  </main>
}
