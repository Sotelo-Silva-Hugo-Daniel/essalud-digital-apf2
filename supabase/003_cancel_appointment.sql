-- APF3: cancelación segura de una reserva.
-- Mantiene el registro de la cita como "cancelled" y libera el horario para que vuelva a reservarse.

create or replace function public.cancel_appointment(p_appointment_id uuid)
returns public.appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  current_appointment public.appointments;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select * into current_appointment
  from public.appointments
  where id = p_appointment_id
    and user_id = auth.uid()
  for update;

  if not found then
    raise exception 'Appointment not found';
  end if;

  if current_appointment.status <> 'confirmed' then
    raise exception 'Appointment is not active';
  end if;

  update public.appointments
  set status = 'cancelled'
  where id = current_appointment.id
  returning * into current_appointment;

  update public.availability_slots
  set is_available = true
  where id = current_appointment.slot_id;

  return current_appointment;
end;
$$;

grant execute on function public.cancel_appointment(uuid) to authenticated;
