-- DRAFT: not applied to any database. Review and run in staging after selecting account.
-- Does not change existing game-room tables or their policies.
begin;
create table public.ml_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 handle text not null unique check (handle ~ '^[a-z0-9_]{3,24}$'),
 display_name text not null check (char_length(trim(display_name)) between 1 and 40),
 created_at timestamptz not null default now()
);
create table public.ml_friendships (
 sender_id uuid not null references public.ml_profiles(user_id) on delete cascade,
 recipient_id uuid not null references public.ml_profiles(user_id) on delete cascade,
 status text not null default 'pending' check (status in ('pending','accepted')),
 created_at timestamptz not null default now(),
 primary key (sender_id,recipient_id),
 check (sender_id <> recipient_id)
);
create unique index ml_friendships_pair on public.ml_friendships
 (least(sender_id,recipient_id),greatest(sender_id,recipient_id));
create index ml_friendships_recipient on public.ml_friendships(recipient_id,status);
alter table public.ml_profiles enable row level security;
alter table public.ml_friendships enable row level security;
revoke all on public.ml_profiles,public.ml_friendships from anon,authenticated;
grant select,insert,delete on public.ml_profiles to authenticated;
grant update(handle,display_name) on public.ml_profiles to authenticated;
grant select,insert,delete on public.ml_friendships to authenticated;
grant update(status) on public.ml_friendships to authenticated;
-- Handles and display names are public to confirmed account holders. No emails stored here.
-- JWT flag, never user_metadata, distinguishes anonymous authenticated users.
create policy profiles_public_names on public.ml_profiles for select to authenticated
 using (coalesce((select auth.jwt()->>'is_anonymous'),'true')='false');
create policy profiles_insert_self on public.ml_profiles for insert to authenticated
 with check (user_id=(select auth.uid()) and coalesce((select auth.jwt()->>'is_anonymous'),'true')='false');
create policy profiles_update_self on public.ml_profiles for update to authenticated
 using (user_id=(select auth.uid()) and coalesce((select auth.jwt()->>'is_anonymous'),'true')='false')
 with check (user_id=(select auth.uid()) and coalesce((select auth.jwt()->>'is_anonymous'),'true')='false');
create policy profiles_delete_self on public.ml_profiles for delete to authenticated
 using (user_id=(select auth.uid()) and coalesce((select auth.jwt()->>'is_anonymous'),'true')='false');
create policy friendships_participants on public.ml_friendships for select to authenticated
 using ((select auth.uid()) in (sender_id,recipient_id) and coalesce((select auth.jwt()->>'is_anonymous'),'true')='false');
create policy friendships_send on public.ml_friendships for insert to authenticated
 with check (sender_id=(select auth.uid()) and status='pending' and coalesce((select auth.jwt()->>'is_anonymous'),'true')='false');
-- Only recipient can accept. Column grants keep sender/recipient immutable.
create policy friendships_accept on public.ml_friendships for update to authenticated
 using (recipient_id=(select auth.uid()) and status='pending' and coalesce((select auth.jwt()->>'is_anonymous'),'true')='false')
 with check (recipient_id=(select auth.uid()) and status='accepted' and coalesce((select auth.jwt()->>'is_anonymous'),'true')='false');
create policy friendships_remove on public.ml_friendships for delete to authenticated
 using ((select auth.uid()) in (sender_id,recipient_id) and coalesce((select auth.jwt()->>'is_anonymous'),'true')='false');
commit;
