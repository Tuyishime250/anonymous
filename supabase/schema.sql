create extension if not exists pgcrypto;

create type public.review_status as enum ('pending', 'approved');

create table public.moderators (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  content text not null check (char_length(content) between 10 and 5000),
  category text check (category is null or category in ('School', 'Family', 'Relationships', 'Money', 'Work', 'Health', 'Other')),
  status public.review_status not null default 'pending',
  moderation_flags text[] not null default '{}',
  reactions integer not null default 0 check (reactions >= 0),
  report_count integer not null default 0 check (report_count >= 0),
  created_at timestamptz not null default now()
);

create table public.replies (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages (id) on delete cascade,
  content text not null check (char_length(content) between 10 and 2000),
  status public.review_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages (id) on delete cascade,
  reason text not null default '' check (char_length(reason) <= 500),
  created_at timestamptz not null default now()
);

create index messages_public_wall on public.messages (created_at desc) where status = 'approved';
create index messages_review_queue on public.messages (created_at) where status = 'pending';
create index replies_parent_status on public.replies (message_id, status);

create or replace function public.is_moderator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.moderators where user_id = (select auth.uid()));
$$;

revoke all on function public.is_moderator() from public;
grant execute on function public.is_moderator() to authenticated;

alter table public.moderators enable row level security;
alter table public.messages enable row level security;
alter table public.replies enable row level security;
alter table public.reports enable row level security;
grant usage on schema public to anon, authenticated, service_role;

create policy "Anyone can read approved messages"
on public.messages for select to anon, authenticated
using (status = 'approved');

create policy "Moderators can read all messages"
on public.messages for select to authenticated
using ((select public.is_moderator()));

create policy "Moderators can review messages"
on public.messages for update to authenticated
using ((select public.is_moderator()))
with check ((select public.is_moderator()));

create policy "Moderators can delete messages"
on public.messages for delete to authenticated
using ((select public.is_moderator()));

create policy "Anyone can read approved replies"
on public.replies for select to anon, authenticated
using (
  status = 'approved' and exists (
    select 1 from public.messages m where m.id = message_id and m.status = 'approved'
  )
);

create policy "Moderators can read all replies"
on public.replies for select to authenticated
using ((select public.is_moderator()));

create policy "Moderators can review replies"
on public.replies for update to authenticated
using ((select public.is_moderator()))
with check ((select public.is_moderator()));

create policy "Moderators can delete replies"
on public.replies for delete to authenticated
using ((select public.is_moderator()));

create policy "Moderators can inspect reports"
on public.reports for select to authenticated
using ((select public.is_moderator()));

create or replace function public.send_support(message_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  reaction_total integer;
begin
  update public.messages
  set reactions = reactions + 1
  where id = message_id and status = 'approved'
  returning reactions into reaction_total;
  if reaction_total is null then
    raise exception 'Message not found or not available';
  end if;
  return reaction_total;
end;
$$;

revoke all on function public.send_support(uuid) from public;
grant execute on function public.send_support(uuid) to anon, authenticated;

create or replace function public.submit_report(target_message_id uuid, report_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.messages
  set report_count = report_count + 1
  where id = target_message_id and status = 'approved';
  if not found then
    raise exception 'Message not found or not available';
  end if;
  insert into public.reports (message_id, reason)
  values (target_message_id, left(coalesce(report_reason, ''), 500));
end;
$$;

revoke all on function public.submit_report(uuid, text) from public;
grant execute on function public.submit_report(uuid, text) to service_role;

revoke all on public.messages from anon, authenticated;
revoke all on public.replies from anon, authenticated;
revoke all on public.reports from anon, authenticated;
revoke all on public.moderators from anon, authenticated;
grant select on public.messages, public.replies to anon, authenticated;
grant select on public.reports to authenticated;
grant update (status) on public.messages, public.replies to authenticated;
grant delete on public.messages, public.replies to authenticated;
grant all on public.moderators, public.messages, public.replies, public.reports to service_role;
