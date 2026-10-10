begin;
create or replace function ml_private.lobby_remove(p_room uuid,p_user uuid)
returns void language plpgsql security definer set search_path='' as $$
declare r public.rooms;p public.players;
begin
 if auth.uid() is null then raise exception 'Bitte erneut verbinden.';end if;
 select * into r from public.rooms where id=p_room for update;
 if r.host_user_id is distinct from auth.uid() then raise exception 'Nur der Host kann Mitspieler entfernen.';end if;
 if r.status<>'lobby' then raise exception 'Die Runde läuft bereits.';end if;
 if p_user is null or p_user=r.host_user_id then raise exception 'Den Host kannst du nicht entfernen.';end if;
 select * into p from public.players where room_id=p_room and user_id=p_user for update;
 if p.id is null then return;end if;
 if coalesce(p.connected,false) and coalesce(p.last_seen_at,p.joined_at)>clock_timestamp()-interval '90 seconds' then raise exception 'Dieser Mitspieler ist noch verbunden.';end if;
 delete from public.online_team_members where room_id=p_room and user_id=p_user;
 delete from public.players where room_id=p_room and user_id=p_user;
end $$;
revoke all on function ml_private.lobby_remove(uuid,uuid) from public,anon,authenticated;
grant execute on function ml_private.lobby_remove(uuid,uuid) to authenticated;
create or replace function public.ml_lobby_remove(p_room uuid,p_user uuid)
returns void language sql security invoker set search_path='' as $$select ml_private.lobby_remove(p_room,p_user)$$;
revoke all on function public.ml_lobby_remove(uuid,uuid) from public,anon;
grant execute on function public.ml_lobby_remove(uuid,uuid) to authenticated;
commit;
