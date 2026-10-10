-- Shared readiness is private and can only be changed by the member themselves.
begin;
create table if not exists ml_private.lobby_readiness(
 room_id uuid not null references public.rooms(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 ready boolean not null default false,
 primary key(room_id,user_id)
);
alter table ml_private.lobby_readiness enable row level security;
revoke all on ml_private.lobby_readiness from public,anon,authenticated;
create or replace function ml_private.lobby_ready(p_room uuid,p_ready boolean default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();r public.rooms;members jsonb;
begin
 if u is null then raise exception 'Bitte erneut verbinden.';end if;
 select * into r from public.rooms where id=p_room for update;
 if r.id is null or not exists(select 1 from public.players where room_id=p_room and user_id=u) then raise exception 'Nur Mitspieler dieser Lobby dürfen diese Aktion ausführen.';end if;
 if p_ready is not null then
  if r.status<>'lobby' then raise exception 'Die Runde läuft bereits.';end if;
  if not coalesce((r.config->>'readiness_enabled')::boolean,false) then
   update public.rooms set config=config||'{"readiness_enabled":true}'::jsonb where id=p_room;
  end if;
  insert into ml_private.lobby_readiness(room_id,user_id,ready) values(p_room,u,p_ready)
  on conflict(room_id,user_id) do update set ready=excluded.ready;
 end if;
 select coalesce(jsonb_agg(jsonb_build_object('user_id',p.user_id,'name',p.display_name,'ready',coalesce(x.ready,false),
  'connected',p.connected and coalesce(p.last_seen_at,p.joined_at)>clock_timestamp()-interval '90 seconds') order by p.seat),'[]') into members
 from public.players p left join ml_private.lobby_readiness x on x.room_id=p.room_id and x.user_id=p.user_id where p.room_id=p_room;
 return jsonb_build_object('room',p_room,'status',r.status,'host',r.host_user_id,'members',members);
end $$;
revoke all on function ml_private.lobby_ready(uuid,boolean) from public,anon,authenticated;
grant execute on function ml_private.lobby_ready(uuid,boolean) to authenticated;
create or replace function public.ml_lobby_ready(p_room uuid,p_ready boolean default null)
returns jsonb language sql security invoker set search_path='' as $$select ml_private.lobby_ready(p_room,p_ready)$$;
revoke all on function public.ml_lobby_ready(uuid,boolean) from public,anon;
grant execute on function public.ml_lobby_ready(uuid,boolean) to authenticated;

create or replace function ml_private.lobby_setup(p_room uuid,p_game text,p_mode text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.rooms;cfg jsonb;begin
 if auth.uid() is null then raise exception 'Bitte erneut verbinden.';end if;
 select * into r from public.rooms where id=p_room for update;
 if r.host_user_id is distinct from auth.uid() then raise exception 'Nur der Host kann das Spiel ändern.';end if;
 if r.status<>'lobby' then raise exception 'Die Runde läuft bereits.';end if;
 if p_game is null or p_mode is null or not(
  p_game='moreless' and p_mode in ('CLASSIC','PARTY','BLITZ','SURVIVAL','KING','CHAOS','SORT') or
  p_game='estimate' and p_mode in ('classic','risk','survival','blitz','king') or
  p_game='quiz' and p_mode in ('standard','big','football','random','nerd','sport','geo') or
  p_game='facts' and p_mode='classic') then raise exception 'Bitte ein gültiges Spiel wählen.';end if;
 cfg:=r.config||jsonb_build_object('game',p_game,'game_mode',p_mode,'readiness_enabled',true);
 if p_game='moreless' then cfg:=cfg||jsonb_build_object('questions_per_round',5,'rounds',coalesce((cfg->>'rounds')::int,2));
 elsif p_game='estimate' then cfg:=cfg||jsonb_build_object('questions_per_round',10);end if;
 update public.rooms set config=cfg where id=p_room;
 return cfg;
end $$;
revoke all on function ml_private.lobby_setup(uuid,text,text) from public,anon,authenticated;
grant execute on function ml_private.lobby_setup(uuid,text,text) to authenticated;
create or replace function public.ml_lobby_setup(p_room uuid,p_game text,p_mode text)
returns jsonb language sql security invoker set search_path='' as $$select ml_private.lobby_setup(p_room,p_game,p_mode)$$;
revoke all on function public.ml_lobby_setup(uuid,text,text) from public,anon;
grant execute on function public.ml_lobby_setup(uuid,text,text) to authenticated;

-- Enforce readiness atomically with every engine's transition into playing.
create or replace function ml_private.lobby_guard()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if old.status='lobby' and new.status='playing' and coalesce((old.config->>'readiness_enabled')::boolean,false) then
  if not exists(select 1 from public.players where room_id=old.id) or exists(
   select 1 from public.players p left join ml_private.lobby_readiness x on x.room_id=p.room_id and x.user_id=p.user_id
   where p.room_id=old.id and (not coalesce(x.ready,false) or not coalesce(p.connected,false) or coalesce(p.last_seen_at,p.joined_at)<clock_timestamp()-interval '90 seconds')) then
   raise exception 'Noch nicht alle bereit. Prüfe die Lobby.';
  end if;
 end if;
 if new.status='lobby' and (old.status<>'lobby' or (new.config-'chaos_rules') is distinct from (old.config-'chaos_rules')) then
  delete from ml_private.lobby_readiness where room_id=old.id;
 end if;
 return new;
end $$;
revoke all on function ml_private.lobby_guard() from public,anon,authenticated;
drop trigger if exists game_night_lobby_guard on public.rooms;
create trigger game_night_lobby_guard before update of status,config on public.rooms for each row execute function ml_private.lobby_guard();
-- Leaving or changing teams requires a fresh ready confirmation.
create or replace function ml_private.lobby_member_changed()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 delete from ml_private.lobby_readiness where room_id=coalesce(new.room_id,old.room_id) and user_id=coalesce(new.user_id,old.user_id);
 return coalesce(new,old);
end $$;
revoke all on function ml_private.lobby_member_changed() from public,anon,authenticated;
drop trigger if exists game_night_ready_presence on public.players;
create trigger game_night_ready_presence after update of connected on public.players for each row when (new.connected=false) execute function ml_private.lobby_member_changed();
drop trigger if exists game_night_ready_team on public.online_team_members;
create trigger game_night_ready_team after insert or update or delete on public.online_team_members for each row execute function ml_private.lobby_member_changed();
drop trigger if exists game_night_ready_leave on public.players;
create trigger game_night_ready_leave after delete on public.players for each row execute function ml_private.lobby_member_changed();
commit;
