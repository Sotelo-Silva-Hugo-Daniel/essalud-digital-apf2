import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const dateLabel = value => new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${value}T12:00:00`))
const timeLabel = value => new Intl.DateTimeFormat('es-PE', { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(`2026-01-01T${value}`))
const weekStart = value => { const date = new Date(`${value}T12:00:00`); date.setDate(date.getDate() - (date.getDay() + 6) % 7); return date.toLocaleDateString('en-CA') }
const shortDay = value => new Intl.DateTimeFormat('es-PE', { weekday: 'short', day: 'numeric' }).format(new Date(`${value}T12:00:00`))

export default function ReschedulePage({ Layout }) {
  const { appointmentId } = useParams()
  const navigate = useNavigate()
  const [appointment, setAppointment] = useState(null)
  const [slots, setSlots] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [weekIndex, setWeekIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [stage, setStage] = useState('select')

  useEffect(() => {
    let active = true
    async function load() {
      const { data, error: requestError } = await supabase.from('appointments')
        .select('id,status,availability_slots(id,doctor_id,appointment_date,appointment_time,doctors(full_name,specialty))')
        .eq('id', appointmentId).maybeSingle()
      if (!active) return
      if (requestError || !data || data.status !== 'confirmed' || !data.availability_slots?.doctors) {
        setError('No se encontró una cita confirmada para reprogramar.')
        setLoading(false)
        return
      }
      setAppointment(data)
      const { data: available, error: slotsError } = await supabase.from('availability_slots')
        .select('id,appointment_date,appointment_time').eq('doctor_id', data.availability_slots.doctor_id)
        .eq('is_available', true).gte('appointment_date', new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' }))
        .order('appointment_date').order('appointment_time')
      if (!active) return
      setLoading(false)
      if (slotsError) setError('No pudimos cargar los horarios. Inténtalo nuevamente.')
      else { setSlots(available || []); setSelectedDate(available?.[0]?.appointment_date || '') }
    }
    load()
    return () => { active = false }
  }, [appointmentId])

  const chosen = slots.find(slot => slot.id === selectedId)
  const weeks = [...new Set(slots.map(slot => weekStart(slot.appointment_date)))]
  const visibleDates = [...new Set(slots.filter(slot => weekStart(slot.appointment_date) === weeks[weekIndex]).map(slot => slot.appointment_date))]
  const visibleSlots = slots.filter(slot => slot.appointment_date === selectedDate)
  const changeWeek = next => { setWeekIndex(next); setSelectedDate(slots.find(slot => weekStart(slot.appointment_date) === weeks[next])?.appointment_date || ''); setSelectedId('') }
  async function confirm() {
    if (!chosen) return
    setSaving(true)
    setError('')
    const { error: requestError } = await supabase.rpc('reschedule_appointment', {
      p_appointment_id: appointmentId, p_new_slot_id: selectedId
    })
    setSaving(false)
    if (requestError) {
      setStage('select')
      setError(requestError.message.includes('no longer available') ? 'Ese horario acaba de ocuparse. Elige otro horario.' : 'No se pudo reprogramar. Verifica la conexión o la configuración de Supabase e inténtalo nuevamente.')
      return
    }
    navigate('/mis-citas', { state: { notice: 'Tu cita fue reprogramada. Comprueba abajo la nueva fecha y hora.' } })
  }

  return <Layout><main id="contenido-principal" tabIndex="-1" className="booking-page reschedule-page">
    <Link className="back-link" to="/mis-citas">← Mis citas</Link>
    <h1>Reprogramar teleconsulta</h1>
    <p className="lead">Cambia el horario y conserva al mismo médico.</p>
    {loading ? <p className="data-message" role="status">Buscando horarios disponibles…</p> : null}
    {error && <p className="data-error" role="alert">{error}</p>}
    {appointment && <section className="current-appointment" aria-label="Cita actual">
      <b>Cita actual</b><p>{appointment.availability_slots.doctors.full_name} · {appointment.availability_slots.doctors.specialty}</p>
      <p>{dateLabel(appointment.availability_slots.appointment_date)} · {timeLabel(appointment.availability_slots.appointment_time)}</p>
    </section>}
    {!loading && appointment && stage === 'select' && <>
      <h2 className="section-heading">Elige otro horario</h2>
      {slots.length === 0 ? <div className="empty-state" role="status"><h2>No hay horarios disponibles</h2><p>Conserva tu cita actual y vuelve a consultar más tarde.</p></div> : <>
        <div className="week-navigation" aria-label="Cambiar semana"><button type="button" disabled={weekIndex === 0} onClick={() => changeWeek(weekIndex - 1)} aria-label="Semana anterior">‹</button><strong>Semana del {new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'long' }).format(new Date(`${weeks[weekIndex]}T12:00:00`))}</strong><button type="button" disabled={weekIndex === weeks.length - 1} onClick={() => changeWeek(weekIndex + 1)} aria-label="Semana siguiente">›</button></div>
        <div className="reschedule-days" role="group" aria-label="Días con horarios disponibles">{visibleDates.map(date => <button type="button" key={date} className={date === selectedDate ? 'active' : ''} aria-pressed={date === selectedDate} onClick={() => { setSelectedDate(date); setSelectedId('') }}>{shortDay(date)}</button>)}</div>
        <h3 className="hours-heading">Horas disponibles · {dateLabel(selectedDate)}</h3>
        <div className="reschedule-slots" role="group" aria-label={`Horas disponibles para ${dateLabel(selectedDate)}`}>{visibleSlots.map(slot =>
          <button type="button" key={slot.id} className={slot.id === selectedId ? 'slot-choice active' : 'slot-choice'} aria-pressed={slot.id === selectedId} onClick={() => setSelectedId(slot.id)}>{timeLabel(slot.appointment_time)}</button>)}</div>
      </>}
      <div className="reschedule-bottom"><p aria-live="polite">{chosen ? `Nuevo horario: ${dateLabel(chosen.appointment_date)}, ${timeLabel(chosen.appointment_time)}` : 'Selecciona una hora para continuar.'}</p><button type="button" className="primary-button" disabled={!chosen} onClick={() => setStage('review')}>Revisar cambio</button></div>
    </>}
    {appointment && stage === 'review' && chosen && <section className="reschedule-review" aria-label="Confirmación de cambio">
      <h2>Revisa antes de confirmar</h2><p>El médico seguirá siendo <b>{appointment.availability_slots.doctors.full_name}</b>.</p>
      <p>Horario anterior: {dateLabel(appointment.availability_slots.appointment_date)} · {timeLabel(appointment.availability_slots.appointment_time)}</p>
      <p>Horario nuevo: <b>{dateLabel(chosen.appointment_date)} · {timeLabel(chosen.appointment_time)}</b></p>
      <div className="reschedule-actions"><button type="button" className="outline-button" disabled={saving} onClick={() => setStage('select')}>Cambiar elección</button><button type="button" className="primary-button" disabled={saving} onClick={confirm}>{saving ? 'Guardando cambio…' : 'Sí, reprogramar cita'}</button></div>
    </section>}
  </main></Layout>
}
