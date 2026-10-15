-- Run this file in Supabase Dashboard > SQL Editor.
-- Row Level Security ensures signed-in users can only access their own notes.
create table if not exists public.clinical_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  patient_label text not null default 'Untitled visit',
  transcript text not null default '',
  subjective text not null default '',
  objective text not null default '',
  assessment text not null default '',
  plan text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.clinical_notes enable row level security;

create policy "Users can read their own clinical notes"
on public.clinical_notes for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can create their own clinical notes"
on public.clinical_notes for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own clinical notes"
on public.clinical_notes for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own clinical notes"
on public.clinical_notes for delete
to authenticated
using (auth.uid() = user_id);

create index if not exists clinical_notes_user_created_idx
on public.clinical_notes (user_id, created_at desc);

-- Optional: keep updated_at current on updates.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_clinical_notes_updated_at on public.clinical_notes;
create trigger set_clinical_notes_updated_at
before update on public.clinical_notes
for each row execute function public.set_updated_at();
