begin;
-- Fact/Fake starts by inserting its private match, so mark the room before insertion.
-- This passes through the same atomic readiness guard as the other engines.
create or replace function ml_private.fact_lobby_start()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 update public.rooms set status='playing',phase='answering' where id=new.room_id;
 return new;
end $$;
revoke all on function ml_private.fact_lobby_start() from public,anon,authenticated;
drop trigger if exists game_night_fact_lobby_start on ml_private.fact_matches;
create trigger game_night_fact_lobby_start before insert on ml_private.fact_matches for each row execute function ml_private.fact_lobby_start();
commit;
