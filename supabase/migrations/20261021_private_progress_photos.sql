-- Apply through an authorized administrator on the existing backend.
-- Additive: does not replace Nutrio tables, policies or storage buckets.
begin;
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('calnutrifit-progress','calnutrifit-progress',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false,file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','image/webp'];
create table if not exists public.calnutrifit_progress_photos (
 id uuid primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 path text not null unique,
 taken_on date not null check (taken_on <= current_date),
 category text not null check (category in ('Front','Side','Back','Custom')),
 note text not null default '' check (char_length(note)<=300),
 created_at timestamptz not null default now(),
 constraint photo_owner_path check (path = user_id::text || '/' || id::text || '.jpg')
);
alter table public.calnutrifit_progress_photos enable row level security;
revoke all on public.calnutrifit_progress_photos from anon;
grant select,insert,delete on public.calnutrifit_progress_photos to authenticated;
create policy "calnutrifit photos owner read" on public.calnutrifit_progress_photos for select to authenticated using (auth.uid()=user_id);
create policy "calnutrifit photos owner insert" on public.calnutrifit_progress_photos for insert to authenticated with check (auth.uid()=user_id);
create policy "calnutrifit photos owner delete" on public.calnutrifit_progress_photos for delete to authenticated using (auth.uid()=user_id);
create policy "calnutrifit private image read" on storage.objects for select to authenticated using (bucket_id='calnutrifit-progress' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "calnutrifit private image upload" on storage.objects for insert to authenticated with check (bucket_id='calnutrifit-progress' and (storage.foldername(name))[1]=auth.uid()::text and lower(storage.extension(name))='jpg');
create policy "calnutrifit private image delete" on storage.objects for delete to authenticated using (bucket_id='calnutrifit-progress' and (storage.foldername(name))[1]=auth.uid()::text);
-- Restrictive policies also constrain any pre-existing broad permissive policy.
create policy "calnutrifit photo boundary" on storage.objects as restrictive for all to authenticated
using (bucket_id <> 'calnutrifit-progress' or (storage.foldername(name))[1]=auth.uid()::text)
with check (bucket_id <> 'calnutrifit-progress' or (storage.foldername(name))[1]=auth.uid()::text);
create policy "calnutrifit photo anonymous boundary" on storage.objects as restrictive for all to anon
using (bucket_id <> 'calnutrifit-progress') with check (bucket_id <> 'calnutrifit-progress');
commit;
