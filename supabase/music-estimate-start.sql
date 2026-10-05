CREATE OR REPLACE FUNCTION public.ml_estimate_start(p_room uuid, p_mode text, p_questions jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare stats jsonb;item jsonb;start_t timestamptz;
begin
 if auth.uid() is null or not ml_private.is_room_host(p_room,auth.uid()) then raise exception 'host only';end if;
 perform 1 from public.rooms where id=p_room for update;
 start_t:=clock_timestamp()+case when coalesce((select (config->>'rule_previews')::boolean from public.rooms where id=p_room),false) then interval '5 seconds' else interval '0 seconds' end;
 if exists(select 1 from ml_private.estimate_matches where room_id=p_room and phase<>'finished') then raise exception 'match already running';end if;
 if p_mode not in ('classic','risk','survival','blitz','king') or p_mode is null then raise exception 'invalid mode';end if;
 if jsonb_typeof(p_questions)<>'array' or jsonb_array_length(p_questions) not in (10,15,20) then raise exception 'select 10, 15 or 20 questions';end if;
 for item in select value from jsonb_array_elements(p_questions) loop
  if jsonb_typeof(item->'a')<>'number' or char_length(item->>'q') not between 1 and 500 or item->>'u' is null then raise exception 'invalid question';end if;
 end loop;
 select jsonb_object_agg(user_id::text,jsonb_build_object('name',display_name,'score',case when p_mode='risk' then 500 else 0 end,'lives',3,'streak',0)) into stats from public.players where room_id=p_room;
 insert into ml_private.estimate_matches(room_id,mode,pool,stats,starts_at,deadline) values(p_room,p_mode,p_questions,stats,start_t,case when p_mode='blitz' then start_t+interval '8 seconds' else null end)
 on conflict(room_id) do update set economy_match_id=gen_random_uuid(),mode=excluded.mode,pool=excluded.pool,position=0,question_id=gen_random_uuid(),phase='open',stats=excluded.stats,answers='{}',result=null,starts_at=excluded.starts_at,deadline=excluded.deadline;
 update public.players set score=case when p_mode='risk' then 500 else 0 end,blitz_bonus=0 where room_id=p_room;
 update public.rooms set status='playing',phase='team_estimate',config=config||jsonb_build_object('game','estimate','game_mode',p_mode) where id=p_room;
end $function$;
