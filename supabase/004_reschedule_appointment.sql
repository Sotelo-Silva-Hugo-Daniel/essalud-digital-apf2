-- Reprogramación atómica: la cita conserva su identidad y el médico.
-- Ejecutar en Supabase SQL Editor antes de activar la función en producción.
create or replace function public.reschedule_appointment(p_appointment_id uuid, p_new_slot_id uuid)
returns public.appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  current_appointment public.appointments;
  old_slot_id uuid;
  old_doctor_id uuid;
  new_doctor_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select * into current_appointment from public.appointments
  where id = p_appointment_id and user_id = auth.uid() and status = 'confirmed'
  for update;
  if not found then
    raise exception 'Appointment not found or inactive';
  end if;
  if current_appointment.slot_id = p_new_slot_id then
    raise exception 'Choose a different time slot';
  end if;
  old_slot_id := current_appointment.slot_id;

  select doctor_id into old_doctor_id from public.availability_slots
  where id = current_appointment.slot_id;
  select doctor_id into new_doctor_id from public.availability_slots
  where id = p_new_slot_id;
  if new_doctor_id is null or new_doctor_id <> old_doctor_id then
    raise exception 'The selected time slot must belong to the same doctor';
  end if;

  update public.availability_slots set is_available = false
  where id = p_new_slot_id and is_available = true
    and (appointment_date + appointment_time) > (now() at time zone 'America/Lima');
  if not found then
    raise exception 'The selected time slot is no longer available';
  end if;

  update public.appointments set slot_id = p_new_slot_id
  where id = current_appointment.id returning * into current_appointment;
  update public.availability_slots set is_available = true where id = old_slot_id;
  return current_appointment;
end;
$$;

revoke all on function public.reschedule_appointment(uuid, uuid) from public, anon;
grant execute on function public.reschedule_appointment(uuid, uuid) to authenticated;
