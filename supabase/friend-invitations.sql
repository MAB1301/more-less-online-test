begin;
create table public.ml_game_invitations (
 id uuid primary key default gen_random_uuid(),
 sender_id uuid not null references public.ml_profiles(user_id) on delete cascade,
 recipient_id uuid not null references public.ml_profiles(user_id) on delete cascade,
 room_id uuid not null references public.rooms(id) on delete cascade,
 room_code text not null,
 game text not null check(game in ('moreless','estimate','quiz')),
 game_mode text not null check(char_length(game_mode) between 1 and 30),
 status text not null default 'pending' check(status in ('pending','accepted','declined','cancelled')),
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default now()+interval '15 minutes',
 check(sender_id<>recipient_id)
);
create index ml_invites_recipient on public.ml_game_invitations(recipient_id,status,expires_at);
create index ml_invites_sender on public.ml_game_invitations(sender_id);
create index ml_invites_room on public.ml_game_invitations(room_id);
create unique index ml_invites_pending on public.ml_game_invitations(sender_id,recipient_id,room_id) where status='pending';
alter table public.ml_game_invitations enable row level security;
revoke all on public.ml_game_invitations from anon,authenticated;
grant select,insert on public.ml_game_invitations to authenticated;
grant update(status) on public.ml_game_invitations to authenticated;
create policy invites_read on public.ml_game_invitations for select to authenticated using
 ((select auth.uid()) in (sender_id,recipient_id) and coalesce((select auth.jwt()->>'is_anonymous'),'true')='false');
create policy invites_send on public.ml_game_invitations for insert to authenticated with check (
 sender_id=(select auth.uid()) and coalesce((select auth.jwt()->>'is_anonymous'),'true')='false'
 and status='pending' and created_at=now() and expires_at=now()+interval '15 minutes'
 and exists(select 1 from public.ml_friendships f where f.status='accepted' and
 ((f.sender_id=ml_game_invitations.sender_id and f.recipient_id=ml_game_invitations.recipient_id) or (f.recipient_id=ml_game_invitations.sender_id and f.sender_id=ml_game_invitations.recipient_id)))
 and exists(select 1 from public.rooms r where r.id=room_id and r.host_user_id=(select auth.uid()) and r.status='lobby'
 and r.code=room_code and r.config->>'game'=game and r.config->>'game_mode'=game_mode)
);
create policy invites_recipient_update on public.ml_game_invitations for update to authenticated
 using(recipient_id=(select auth.uid()) and status='pending' and expires_at>now() and coalesce((select auth.jwt()->>'is_anonymous'),'true')='false')
 with check(recipient_id=(select auth.uid()) and status in ('accepted','declined'));
create policy invites_sender_cancel on public.ml_game_invitations for update to authenticated
 using(sender_id=(select auth.uid()) and status='pending' and coalesce((select auth.jwt()->>'is_anonymous'),'true')='false')
 with check(sender_id=(select auth.uid()) and status='cancelled');
create function public.ml_send_game_invitation(p_recipient uuid,p_room uuid) returns uuid
 language plpgsql security invoker set search_path='' as $$
declare r public.rooms; result uuid;
begin
 select * into r from public.rooms where id=p_room and host_user_id=auth.uid() and status='lobby';
 if r.id is null then raise exception 'Erstelle zuerst eine offene Lobby als Host.';end if;
 update public.ml_game_invitations set status='cancelled' where sender_id=auth.uid() and recipient_id=p_recipient and room_id=p_room and status='pending' and expires_at<=now();
 insert into public.ml_game_invitations(sender_id,recipient_id,room_id,room_code,game,game_mode)
 values(auth.uid(),p_recipient,r.id,r.code,r.config->>'game',r.config->>'game_mode') returning id into result;
 return result;
end $$;
create function public.ml_accept_game_invitation(p_invitation uuid,p_name text)
 returns table(room_id uuid,room_code text,game text,game_mode text)
 language plpgsql security invoker set search_path='' as $$
declare i public.ml_game_invitations;
begin
 select * into i from public.ml_game_invitations where id=p_invitation and recipient_id=auth.uid() and status='pending' and expires_at>now() for update;
 if i.id is null then raise exception 'Diese Einladung ist abgelaufen oder nicht mehr verfügbar.';end if;
 if not exists(select 1 from public.ml_friendships f where f.status='accepted' and
 ((f.sender_id=i.sender_id and f.recipient_id=i.recipient_id) or (f.recipient_id=i.sender_id and f.sender_id=i.recipient_id))) then raise exception 'Diese Freundschaft besteht nicht mehr.';end if;
 perform public.ml_join_room(i.room_code,p_name);
 update public.ml_game_invitations set status='accepted' where id=i.id;
 return query select i.room_id,i.room_code,i.game,i.game_mode;
end $$;
revoke all on function public.ml_send_game_invitation(uuid,uuid),public.ml_accept_game_invitation(uuid,text) from public,anon;
grant execute on function public.ml_send_game_invitation(uuid,uuid),public.ml_accept_game_invitation(uuid,text) to authenticated;
commit;
