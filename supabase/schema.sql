-- EsSalud Digital APF2
-- Datos exclusivamente ficticios para el prototipo académico.

create extension if not exists pgcrypto;

create type public.appointment_status as enum ('confirmed', 'cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) >= 2),
  created_at timestamptz not null default now()
);

create table public.doctors (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  specialty text not null,
  rating numeric(2,1) not null default 4.8 check (rating between 0 and 5),
  opinions_count integer not null default 0 check (opinions_count >= 0),
  initials text not null,
  avatar_tone text not null default 'blue' check (avatar_tone in ('blue', 'peach', 'mint')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.availability_slots (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  appointment_date date not null,
  appointment_time time not null,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  unique (doctor_id, appointment_date, appointment_time)
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  slot_id uuid not null references public.availability_slots(id) on delete restrict,
  status public.appointment_status not null default 'confirmed',
  modality text not null default 'Teleconsulta' check (modality = 'Teleconsulta'),
  confirmation_code text not null unique default ('TC-' || lpad((floor(random() * 90000) + 10000)::text, 5, '0')),
  created_at timestamptz not null default now()
);

-- Un horario no puede tener dos reservas activas, incluso si dos usuarios intentan reservarlo a la vez.
create unique index one_active_appointment_per_slot
  on public.appointments (slot_id)
  where status = 'confirmed';

create index availability_slots_doctor_date_idx
  on public.availability_slots (doctor_id, appointment_date);
create index appointments_user_created_at_idx
  on public.appointments (user_id, created_at desc);

-- Crear automáticamente el perfil cuando Supabase Auth registra un usuario.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', 'Usuario'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.doctors enable row level security;
alter table public.availability_slots enable row level security;
alter table public.appointments enable row level security;

create policy "Profiles: users read their profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);
create policy "Profiles: users update their profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Doctors: authenticated users read active doctors"
  on public.doctors for select to authenticated
  using (is_active = true);
create policy "Slots: authenticated users read available slots"
  on public.availability_slots for select to authenticated
  using (
    is_available = true
    or exists (
      select 1 from public.appointments
      where appointments.slot_id = availability_slots.id
        and appointments.user_id = (select auth.uid())
    )
  );
create policy "Appointments: users read their appointments"
  on public.appointments for select to authenticated
  using ((select auth.uid()) = user_id);

-- Reserva atómica: bloquea el cupo y crea la cita en una única operación.
-- La interfaz debe llamar a esta función RPC, no insertar directamente en appointments.
create or replace function public.book_appointment(p_slot_id uuid)
returns public.appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  new_appointment public.appointments;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  update public.availability_slots
  set is_available = false
  where id = p_slot_id and is_available = true;

  if not found then
    raise exception 'The selected time slot is no longer available';
  end if;

  insert into public.appointments (user_id, slot_id)
  values (auth.uid(), p_slot_id)
  returning * into new_appointment;

  return new_appointment;
end;
$$;

grant execute on function public.book_appointment(uuid) to authenticated;

-- Datos de demostración: no corresponden a personal médico real.
insert into public.doctors (full_name, specialty, rating, opinions_count, initials, avatar_tone) values
  ('Dr. Carlos Pérez', 'Medicina General', 4.9, 124, 'CP', 'blue'),
  ('Dra. Ana Torres', 'Medicina General', 4.8, 98, 'AT', 'peach'),
  ('Dra. Carmen Flores', 'Medicina Familiar', 4.9, 83, 'CF', 'mint');

insert into public.availability_slots (doctor_id, appointment_date, appointment_time)
select d.id, dates.appointment_date, times.appointment_time
from public.doctors d
cross join (values (date '2026-10-06'), (date '2026-10-07'), (date '2026-10-08')) as dates(appointment_date)
cross join (values (time '09:00'), (time '09:30'), (time '10:00'), (time '10:30'), (time '11:00'), (time '11:30')) as times(appointment_time);
