import { useEffect, useRef, useState } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { AppHeader, BackLink, Progress } from './components/AppHeader'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext.jsx'
import { AccessibilityProvider } from './context/AccessibilityContext.jsx'
import { useAuth } from './context/useAuth'
import LoginPage from './features/auth/LoginPage'
import RegisterPage from './features/auth/RegisterPage'
import ResetPasswordPage from './features/auth/ResetPasswordPage'
import { supabase } from './lib/supabase'
import './App.css'

const emptyBooking = { specialty: 'Medicina General', doctor: null, slotId: null, date: null, time: null, consent: false }
const normalizeDoctor = row => ({ id: row.id, name: row.full_name, specialty: row.specialty, rating: row.rating, opinions: row.opinions_count, initials: row.initials, tone: row.avatar_tone })
const formatDate = value => value ? new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${value}T12:00:00`)).replace(/^./, letter => letter.toUpperCase()) : ''
const formatTime = value => { const [hour, minute] = value.slice(0, 5).split(':').map(Number); return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}` }
const dateShort = value => new Intl.DateTimeFormat('es-PE', { weekday: 'short', day: 'numeric' }).format(new Date(`${value}T12:00:00`))
const downloadCalendar = appointment => { const stamp = `${appointment.date.replaceAll('-', '')}T${appointment.time.replaceAll(':', '').slice(0, 4)}00`; const content = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nUID:${appointment.id || appointment.code}@essalud-digital\r\nDTSTAMP:${stamp}\r\nDTSTART:${stamp}\r\nSUMMARY:Teleconsulta - ${appointment.doctor.name}\r\nDESCRIPTION:Teleconsulta médica por videollamada\r\nEND:VEVENT\r\nEND:VCALENDAR`; const url = URL.createObjectURL(new Blob([content], { type: 'text/calendar;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = 'teleconsulta.ics'; link.click(); URL.revokeObjectURL(url) }
function useBooking() { return useState(emptyBooking) }
function HelpDialog({ onClose }) {
  const dialogRef = useRef(null)
  useEffect(() => {
    const firstControl = dialogRef.current?.querySelector('button')
    firstControl?.focus()
    const onKeyDown = event => {
      if (event.key === 'Escape') onClose()
      if (event.key !== 'Tab') return
      const controls = [...dialogRef.current.querySelectorAll('button:not([disabled])')]
      const first = controls[0]
      const last = controls.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])
  return <div className="modal-backdrop" role="presentation"><section ref={dialogRef} className="help-modal" role="dialog" aria-modal="true" aria-labelledby="help-title" aria-describedby="help-description"><button className="modal-close" type="button" aria-label="Cerrar ayuda" onClick={onClose}>×</button><h2 id="help-title">¿Necesitas ayuda?</h2><div id="help-description"><p>Para reservar una teleconsulta, elige un profesional, selecciona fecha y hora, revisa los datos y confirma tu cita.</p><p>Si necesitas cambiar una elección, usa “Editar” antes de confirmar.</p></div><button className="primary-button" type="button" onClick={onClose}>Entendido</button></section></div>
}
function CancelAppointmentDialog({ appointment, onClose, onConfirm, isCancelling, error }) {
  const dialogRef = useRef(null)
  useEffect(() => {
    dialogRef.current?.querySelector('[data-confirm-cancel]')?.focus()
    const onKeyDown = event => {
      if (event.key === 'Escape') onClose()
      if (event.key !== 'Tab') return
      const controls = [...dialogRef.current.querySelectorAll('button:not([disabled])')]
      const first = controls[0]
      const last = controls.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])
  return <div className="modal-backdrop" role="presentation"><section ref={dialogRef} className="help-modal cancel-dialog" role="dialog" aria-modal="true" aria-labelledby="cancel-title" aria-describedby="cancel-description"><h2 id="cancel-title">¿Cancelar esta cita?</h2><p id="cancel-description">Cancelarás la teleconsulta con {appointment.availability_slots?.doctors?.full_name}. El horario volverá a estar disponible para una nueva reserva.</p>{error && <p className="form-error booking-error" role="alert">{error}</p>}<div className="dialog-actions"><button type="button" className="outline-button" disabled={isCancelling} onClick={onClose}>Mantener cita</button><button data-confirm-cancel type="button" className="danger-button" disabled={isCancelling} onClick={onConfirm}>{isCancelling ? 'Cancelando…' : 'Sí, cancelar cita'}</button></div></section></div>
}
function Layout({ children }) { const [helpOpen,setHelpOpen]=useState(false); const triggerRef = useRef(null); const closeHelp = () => { setHelpOpen(false); window.setTimeout(() => triggerRef.current?.focus(), 0) }; return <div className="app-shell"><a className="skip-link" href="#contenido-principal">Saltar al contenido principal</a><AppHeader onHelp={event=>{ triggerRef.current = event.currentTarget; setHelpOpen(true) }} />{children}{helpOpen&&<HelpDialog onClose={closeHelp} />}</div> }
function Avatar({ person }) { return <span aria-hidden="true" className={`avatar ${person.tone}`}>{person.initials}</span> }
function SummaryRow({ label, value, onEdit }) { const accessibleLabel = `Editar ${label.toLowerCase()}`; return <div className="summary-row"><span><small>{label}</small><b>{value}</b></span>{onEdit && <button aria-label={accessibleLabel} onClick={onEdit}>Editar</button>}</div> }
function Loading({ message = 'Cargando información…' }) { return <p className="data-message" role="status" aria-live="polite">{message}</p> }
function DataError({ message }) { return <p className="data-error" role="alert">No pudimos cargar los datos. {message}</p> }

function Home() { const { user } = useAuth(); const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario'; return <Layout><main id="contenido-principal" tabIndex="-1" className="home-page"><Progress step={1} /><h1>¡Hola, {displayName}!</h1><p className="lead">Bienvenida a tu portal de salud digital.</p><Link className="appointment-hero" to="/reserva/medico"><span aria-hidden="true" className="hero-icon">▣</span><span><b>Agendar cita virtual</b><small>Recomendado para atención rápida</small><p>Reserve su consulta médica desde la comodidad de su casa. Sin colas ni traslados.</p></span><i aria-hidden="true">→</i></Link><p className="section-title">OTROS SERVICIOS</p><div className="service-list"><Link to="/mis-citas"><span aria-hidden="true">▣</span>Mis citas programadas<i aria-hidden="true">›</i></Link><button disabled aria-describedby="historial-no-disponible"><span aria-hidden="true">▤</span>Historial médico<i aria-hidden="true">›</i></button><span id="historial-no-disponible" className="sr-only">Servicio no disponible en este prototipo académico.</span></div></main></Layout> }

function DoctorPage({ booking, setBooking }) {
  const navigate = useNavigate(); const [selected, setSelected] = useState(booking.doctor); const [items, setItems] = useState([]); const [error, setError] = useState(''); const [loading, setLoading] = useState(true)
  useEffect(() => { let active = true; supabase.from('doctors').select('*').eq('is_active', true).order('full_name').then(({ data, error: requestError }) => { if (!active) return; setLoading(false); if (requestError) setError(requestError.message); else setItems(data.map(normalizeDoctor)) }); return () => { active = false } }, [])
  const specialties = [...new Set(items.map(item => item.specialty))]; const filtered = items.filter(item => item.specialty === booking.specialty)
  return <Layout><main id="contenido-principal" tabIndex="-1" className="booking-page"><BackLink>Inicio</BackLink><h1>Elija su médico</h1><Progress step={2} />{loading ? <Loading /> : error ? <DataError message={error} /> : <><label className="select-label">Especialidad médica<select value={booking.specialty} onChange={e => { setBooking({ ...booking, specialty: e.target.value, doctor: null, slotId: null, date: null, time: null }); setSelected(null) }}>{specialties.map(item => <option key={item}>{item}</option>)}</select></label><p className="section-title" id="doctores-disponibles">MÉDICOS DISPONIBLES</p><div className="doctor-options" role="radiogroup" aria-labelledby="doctores-disponibles">{filtered.map(item => <button type="button" role="radio" aria-checked={selected?.id === item.id} aria-label={`${item.name}, ${item.specialty}, calificación ${item.rating} de 5`} className={selected?.id === item.id ? 'doctor-option selected' : 'doctor-option'} key={item.id} onClick={() => setSelected(item)}><Avatar person={item} /><span><b>{item.name}</b><small>{item.specialty}</small><em>★ {item.rating} &nbsp;({item.opinions} opiniones)</em></span><strong>Disponible</strong><i aria-hidden="true">{selected?.id === item.id ? '✓' : ''}</i></button>)}</div><div className="sticky-action" aria-live="polite"><span><span aria-hidden="true">♧ </span>Seleccionado: <b>{selected ? selected.name : 'Ningún médico'}</b></span><button type="button" className="primary-button" disabled={!selected} onClick={() => { setBooking({ ...booking, doctor: selected, slotId: null, date: null, time: null }); navigate('/reserva/horario') }}>Continuar <span aria-hidden="true">→</span></button></div></>}</main></Layout>
}

function SchedulePage({ booking, setBooking }) {
  const navigate = useNavigate(); const [slots, setSlots] = useState([]); const [date, setDate] = useState(booking.date); const [time, setTime] = useState(booking.time); const [slotId, setSlotId] = useState(booking.slotId); const [error, setError] = useState(''); const [loading, setLoading] = useState(true)
  useEffect(() => { if (!booking.doctor) return undefined; let active = true; supabase.from('availability_slots').select('*').eq('doctor_id', booking.doctor.id).eq('is_available', true).order('appointment_date').order('appointment_time').then(({ data, error: requestError }) => { if (!active) return; setLoading(false); if (requestError) setError(requestError.message); else setSlots(data) }); return () => { active = false } }, [booking.doctor])
  if (!booking.doctor) return <Navigate to="/reserva/medico" replace />
  const availableDates = [...new Set(slots.map(item => item.appointment_date))]; const visibleSlots = slots.filter(item => item.appointment_date === date); const monthLabel = date ? new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric' }).format(new Date(`${date}T12:00:00`)).replace(/^./, letter => letter.toUpperCase()) : 'Fechas disponibles'
  const chooseDate = value => { setDate(value); setTime(null); setSlotId(null) }; const chooseSlot = item => { setTime(item.appointment_time); setSlotId(item.id) }
  return <Layout><main id="contenido-principal" tabIndex="-1" className="booking-page"><BackLink to="/reserva/medico">Cambiar médico</BackLink><h1>Elija fecha y hora</h1><Progress step={3} /><div className="selected-provider"><Avatar person={booking.doctor} /><span><b>{booking.doctor.name}</b><small>{booking.doctor.specialty} — Teleconsulta</small></span></div>{loading ? <Loading /> : error ? <DataError message={error} /> : availableDates.length === 0 ? <DataError message="No hay horarios disponibles para este médico." /> : <><section className="calendar" aria-labelledby="fecha-disponible"><b id="fecha-disponible">{monthLabel}</b><p className="calendar-help">Elige una de las fechas con atención disponible.</p><div className="date-row" role="radiogroup" aria-label="Fechas disponibles">{availableDates.map(item => <button type="button" role="radio" aria-checked={date === item} aria-label={formatDate(item)} className={date === item ? 'active' : ''} key={item} onClick={() => chooseDate(item)}><small aria-hidden="true">{dateShort(item).split(' ')[0]}</small><span aria-hidden="true">{new Date(`${item}T12:00:00`).getDate()}</span></button>)}</div></section><p className="section-title" id="horas-disponibles">HORAS DISPONIBLES</p><div className="time-grid" role="radiogroup" aria-labelledby="horas-disponibles">{visibleSlots.map(item => <button type="button" role="radio" aria-checked={slotId === item.id} className={slotId === item.id ? 'active' : ''} key={item.id} onClick={() => chooseSlot(item)}>{formatTime(item.appointment_time)}</button>)}</div><div className="sticky-action" aria-live="polite"><span><span aria-hidden="true">▣ </span>Seleccionado: <b>{date && time ? `${formatDate(date)} — ${formatTime(time)}` : 'Elige un horario'}</b></span><button type="button" className="primary-button" disabled={!slotId} onClick={() => { setBooking({ ...booking, slotId, date, time }); navigate('/reserva/revision') }}>Continuar <span aria-hidden="true">→</span></button></div></>}</main></Layout>
}

function ReviewPage({ booking, setBooking, setAppointment }) {
  const navigate = useNavigate(); const [error, setError] = useState(''); const [isSubmitting, setIsSubmitting] = useState(false); const [showPrivacy, setShowPrivacy] = useState(false); const [showConsentDetails, setShowConsentDetails] = useState(false)
  if (!booking.doctor || !booking.slotId || !booking.date || !booking.time) return <Navigate to="/reserva/medico" replace />
  const confirm = async () => { setError(''); setIsSubmitting(true); const { data, error: requestError } = await supabase.rpc('book_appointment', { p_slot_id: booking.slotId }); setIsSubmitting(false); if (requestError) return setError(requestError.message.includes('no longer available') ? 'Este horario acaba de ser reservado. Elige otro para continuar.' : 'No se pudo registrar la cita. Inténtalo nuevamente.'); const createdAppointment = { ...booking, code: data.confirmation_code, id: data.id }; setAppointment(createdAppointment); navigate(`/reserva/confirmacion/${data.id}`) }
  return <Layout><main id="contenido-principal" tabIndex="-1" className="booking-page review-page"><BackLink to="/reserva/horario">Cambiar horario</BackLink><h1>Revise su cita</h1><Progress step={4} /><p className="review-instruction">Por favor, confirme los datos. Verifique que todo esté correcto antes de continuar.</p><section className="summary-card" aria-label="Resumen de la cita"><SummaryRow label="MÉDICO" value={booking.doctor.name} onEdit={() => navigate('/reserva/medico')} /><SummaryRow label="ESPECIALIDAD" value={booking.specialty} onEdit={() => navigate('/reserva/medico')} /><SummaryRow label="FECHA Y HORA" value={`${formatDate(booking.date)} — ${formatTime(booking.time)}`} onEdit={() => navigate('/reserva/horario')} /><SummaryRow label="MODALIDAD" value="Teleconsulta (videollamada)" /></section><section className="consent-box" aria-labelledby="consentimiento-title"><b id="consentimiento-title">Consentimiento para teleconsulta</b><ul><li>Acepto realizar la consulta de forma virtual.</li><li>Entiendo que mis datos médicos son confidenciales.</li><li>Puedo revisar o cambiar médico, fecha u hora antes de confirmar.</li></ul><button type="button" className="consent-details-button" aria-expanded={showConsentDetails} aria-controls="detalle-consentimiento" onClick={() => setShowConsentDetails(current => !current)}>{showConsentDetails ? 'Ocultar detalles del consentimiento' : 'Leer detalles del consentimiento'}</button>{showConsentDetails && <div id="detalle-consentimiento" className="consent-details" aria-live="polite"><p>Esta es una teleconsulta de demostración. No reemplaza atención de emergencia ni se deben ingresar datos clínicos reales.</p><p>Antes de confirmar, puedes usar “Editar” para corregir la reserva. Luego podrás verla en “Mis citas” y cancelarla si ya no la necesitas.</p></div>}</section><label className="checkbox-label"><input type="checkbox" checked={booking.consent} onChange={e => setBooking({ ...booking, consent: e.target.checked })} /><span>Acepto las condiciones de la teleconsulta</span></label>{error && <p className="form-error booking-error" role="alert">{error}</p>}<p className="legal-note">Sus datos están protegidos según la Ley N.° 29733. <button type="button" aria-expanded={showPrivacy} aria-controls="informacion-privacidad" onClick={() => setShowPrivacy(current => !current)}>{showPrivacy ? 'Ocultar información' : 'Leer más'}</button></p>{showPrivacy && <section id="informacion-privacidad" className="privacy-details" aria-live="polite"><b>Uso de datos en este prototipo</b><p>La aplicación utiliza datos de demostración para registrar reservas. No se debe ingresar información clínica ni datos de terceros.</p></section>}<button type="button" className="primary-button confirm-button" disabled={!booking.consent || isSubmitting} onClick={confirm}>{isSubmitting ? 'Confirmando…' : <><span aria-hidden="true">◉ </span>Confirmar cita médica</>}</button></main></Layout>
}

function Confirmation({ appointment }) { const { appointmentId } = useParams(); const [loadedAppointment, setLoadedAppointment] = useState(appointment?.id === appointmentId ? appointment : null); const [loading, setLoading] = useState(!loadedAppointment); const [error, setError] = useState(''); useEffect(() => { if (loadedAppointment || !appointmentId) return undefined; let active = true; supabase.from('appointments').select('id,confirmation_code,availability_slots(appointment_date,appointment_time,doctors(full_name,specialty))').eq('id', appointmentId).maybeSingle().then(({ data, error: requestError }) => { if (!active) return; if (requestError || !data?.availability_slots?.doctors) { setError('No pudimos cargar la constancia de esta cita.'); setLoading(false); return } const slot = data.availability_slots; setLoadedAppointment({ id: data.id, code: data.confirmation_code, doctor: { name: slot.doctors.full_name }, specialty: slot.doctors.specialty, date: slot.appointment_date, time: slot.appointment_time }); setLoading(false) }); return () => { active = false } }, [appointmentId, loadedAppointment]); if (loading) return <Layout><main id="contenido-principal" tabIndex="-1" className="confirmation-page"><Loading message="Preparando constancia de cita…" /></main></Layout>; if (error || !loadedAppointment) return <Navigate to="/mis-citas" replace />; return <Layout><main id="contenido-principal" tabIndex="-1" className="confirmation-page"><Progress step={5} /><div className="confirm-check" aria-hidden="true">✓</div><h1 tabIndex="-1">¡Cita confirmada!</h1><p className="lead" role="status">Su cita ha sido agendada exitosamente</p><section className="receipt" aria-label="Constancia de teleconsulta"><b><span aria-hidden="true">◉ </span>CONSTANCIA DE TELECONSULTA</b><SummaryRow label="MÉDICO ASIGNADO" value={`${loadedAppointment.doctor.name} (${loadedAppointment.specialty})`} /><SummaryRow label="FECHA PROGRAMADA" value={`${formatDate(loadedAppointment.date)} — ${formatTime(loadedAppointment.time)}`} /><SummaryRow label="CANAL DE ATENCIÓN" value="Enlace de teleconsulta en la app" /></section><p className="reminder"><span aria-hidden="true">♧ </span>Recibirá un recordatorio por SMS 24 horas antes de su cita.</p><button type="button" className="outline-button" onClick={()=>downloadCalendar(loadedAppointment)}><span aria-hidden="true">▣ </span>Agregar al calendario</button><Link className="outline-button" to="/mis-citas">Ver mis citas</Link><Link className="primary-button" to="/inicio">Volver al inicio</Link></main></Layout> }

function Appointments() {
  const [items, setItems] = useState([]); const [loadError, setLoadError] = useState(''); const [cancelError, setCancelError] = useState(''); const [loading, setLoading] = useState(true); const [expandedId, setExpandedId] = useState(null); const [cancelTarget, setCancelTarget] = useState(null); const [isCancelling, setIsCancelling] = useState(false); const [notice, setNotice] = useState('')
  useEffect(() => { let active = true; supabase.from('appointments').select('id,status,confirmation_code,created_at,availability_slots(appointment_date,appointment_time,doctors(full_name,specialty))').order('created_at', { ascending: false }).then(({ data, error: requestError }) => { if (!active) return; setLoading(false); if (requestError) setLoadError(requestError.message); else setItems(data) }); return () => { active = false } }, [])
  const activeItems = items.filter(item => item.status === 'confirmed')
  const cancelAppointment = async () => {
    if (!cancelTarget) return
    setCancelError(''); setIsCancelling(true)
    const { error: requestError } = await supabase.rpc('cancel_appointment', { p_appointment_id: cancelTarget.id })
    setIsCancelling(false)
    if (requestError) return setCancelError('No se pudo cancelar la cita. Verifica que la función de cancelación esté configurada en Supabase e inténtalo nuevamente.')
    setItems(current => current.filter(item => item.id !== cancelTarget.id))
    setExpandedId(null); setCancelTarget(null)
    setNotice('La cita fue cancelada y el horario volvió a estar disponible.')
  }
  return <Layout>{cancelTarget && <CancelAppointmentDialog appointment={cancelTarget} error={cancelError} isCancelling={isCancelling} onClose={() => { setCancelError(''); setCancelTarget(null) }} onConfirm={cancelAppointment} />}<main id="contenido-principal" tabIndex="-1" className="booking-page"><BackLink>Inicio</BackLink><h1>Mis citas programadas</h1>{notice && <p className="form-success" role="status">{notice}</p>}{loading ? <Loading /> : loadError ? <DataError message={loadError} /> : activeItems.length ? activeItems.map(item => { const slot = item.availability_slots; const doctor = slot?.doctors; const isExpanded = expandedId === item.id; return <section className="appointment-card" key={item.id}><span className="status">Confirmada</span><h2>Teleconsulta médica</h2><p><b>{doctor?.full_name}</b><br />{formatDate(slot?.appointment_date)} · {formatTime(slot?.appointment_time || '00:00')}</p>{isExpanded && <div className="appointment-extra"><span>Especialidad</span><b>{doctor?.specialty}</b><span>Código de cita</span><b>{item.confirmation_code}</b><span>Modalidad</span><b>Videollamada</b></div>}<button type="button" className="outline-button" aria-expanded={isExpanded} onClick={() => setExpandedId(isExpanded ? null : item.id)}>{isExpanded ? 'Ocultar detalle' : 'Ver detalle'}</button><button type="button" className="cancel-button" onClick={() => { setCancelError(''); setCancelTarget(item) }}>Cancelar cita</button></section> }) : <div className="empty-state" role="status"><span aria-hidden="true">▣</span><h2>No tienes citas programadas</h2><p>Cuando reserves una teleconsulta, aparecerá aquí.</p><Link className="primary-button" to="/reserva/medico">Agendar teleconsulta</Link></div>}</main></Layout>
}

function RouteTitle() {
  const { pathname } = useLocation()
  useEffect(() => {
    const titles = [
      [/^\/login$/, 'Iniciar sesión'],
      [/^\/registro$/, 'Crear cuenta'],
      [/^\/restablecer-contrasena$/, 'Recuperar contraseña'],
      [/^\/inicio$/, 'Inicio'],
      [/^\/reserva\/medico$/, 'Seleccionar médico'],
      [/^\/reserva\/horario$/, 'Seleccionar fecha y hora'],
      [/^\/reserva\/revision$/, 'Revise su cita'],
      [/^\/reserva\/confirmacion/, 'Cita confirmada'],
      [/^\/mis-citas$/, 'Mis citas programadas']
    ]
    const match = titles.find(([pattern]) => pattern.test(pathname))
    document.title = `${match?.[1] || 'EsSalud Digital'} - EsSalud Digital`
  }, [pathname])
  return null
}
function AppRoutes() { const [booking, setBooking] = useBooking(); const [appointment, setAppointment] = useState(null); return <Routes><Route path="/login" element={<LoginPage />} /><Route path="/registro" element={<RegisterPage />} /><Route path="/restablecer-contrasena" element={<ResetPasswordPage />} /><Route path="/*" element={<ProtectedRoute><Routes><Route path="/inicio" element={<Home />} /><Route path="/reserva/medico" element={<DoctorPage booking={booking} setBooking={setBooking} />} /><Route path="/reserva/horario" element={<SchedulePage booking={booking} setBooking={setBooking} />} /><Route path="/reserva/revision" element={<ReviewPage booking={booking} setBooking={setBooking} setAppointment={setAppointment} />} /><Route path="/reserva/confirmacion/:appointmentId" element={<Confirmation appointment={appointment} />} /><Route path="/mis-citas" element={<Appointments />} /><Route path="*" element={<Navigate to="/inicio" replace />} /></Routes></ProtectedRoute>} /></Routes> }
export default function App() { return <AccessibilityProvider><AuthProvider><BrowserRouter><RouteTitle /><AppRoutes /></BrowserRouter></AuthProvider></AccessibilityProvider> }
