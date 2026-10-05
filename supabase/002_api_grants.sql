-- Required because automatic table exposure is disabled in this project.
-- PostgreSQL privileges enable the API; RLS policies still determine which rows each user can access.

grant usage on schema public to authenticated;
grant select on public.profiles to authenticated;
grant select on public.doctors to authenticated;
grant select on public.availability_slots to authenticated;
grant select on public.appointments to authenticated;
grant execute on function public.book_appointment(uuid) to authenticated;
