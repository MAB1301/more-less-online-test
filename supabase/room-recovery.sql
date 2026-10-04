-- Controlled host recovery. No score, roster or question reset. Marc / More less.
begin;
create or replace function ml_private.room_recovery(p_room uuid,p_action text default 'state')
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();r public.rooms;h public.players;me public.players;stale boolean;begin
 if u is null then raise exception 'Bitte erneut verbinden.';end if;
 if p_action is null or p_action not in ('state','claim','leave') then raise exception 'Ungültige Aktion.';end if;
 -- Serialize claim with room updates; reads need no write lock.
 if p_action='state' then select * into r from public.rooms where id=p_room;
 else select * into r from public.rooms where id=p_room for update;end if;
 if r.id is null then raise exception 'Diese Lobby existiert nicht mehr.';end if;
 select * into me from public.players where room_id=p_room and user_id=u;
 if me.id is null then raise exception 'Nur Mitspieler dieser Lobby dürfen diese Aktion ausführen.';end if;
 select * into h from public.players where room_id=p_room and user_id=r.host_user_id;
 -- An absent/null heartbeat does not permit immediate takeover of a newly created lobby.
 stale:=coalesce(h.last_seen_at,r.created_at)<=clock_timestamp()-interval '90 seconds';
 if p_action='claim' then
  if r.status='closed' then raise exception 'Diese Lobby ist geschlossen.';end if;
  if r.host_user_id<>u and not stale then raise exception 'Der Host ist noch aktiv. Bitte auf seine Rückkehr warten.';end if;
  if r.host_user_id<>u and (not coalesce(me.connected,false) or me.last_seen_at is null or me.last_seen_at<clock_timestamp()-interval '60 seconds') then raise exception 'Bitte zuerst erneut verbinden, bevor du die Leitung übernimmst.';end if;
  update public.rooms set host_user_id=u,updated_at=clock_timestamp() where id=p_room;
  update public.players set connected=true,last_seen_at=clock_timestamp() where room_id=p_room and user_id=u;
  r.host_user_id:=u;stale:=false;
 elsif p_action='leave' then
  update public.players set connected=false,last_seen_at=clock_timestamp() where room_id=p_room and user_id=u;
 end if;
 return jsonb_build_object('host_id',r.host_user_id,'host_connected',not stale and coalesce(h.connected,false) or p_action='claim',
  'can_claim',stale and r.host_user_id<>u and r.status<>'closed' and coalesce(me.connected,false) and me.last_seen_at>=clock_timestamp()-interval '60 seconds');
end $$;
revoke all on function ml_private.room_recovery(uuid,text) from public,anon,authenticated;
grant execute on function ml_private.room_recovery(uuid,text) to authenticated;
create or replace function public.ml_room_recovery(p_room uuid,p_action text default 'state')
returns jsonb language sql security invoker set search_path='' as $$select ml_private.room_recovery(p_room,p_action)$$;
revoke all on function public.ml_room_recovery(uuid,text) from public,anon;
grant execute on function public.ml_room_recovery(uuid,text) to authenticated;
commit;
