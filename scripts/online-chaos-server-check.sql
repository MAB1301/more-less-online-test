begin;
do $test$
declare u uuid:=gen_random_uuid();rid uuid;rule text;n integer;choice text;expected integer;actual integer;qid uuid;
begin
 insert into auth.users(id,aud,role) values(u,'authenticated','authenticated');perform set_config('request.jwt.claim.sub',u::text,true);
 select room_id into rid from public.ml_create_room('Chaos Test','{"game":"moreless","game_mode":"CHAOS","rounds":2,"questions_per_round":5,"timer_enabled":false}'::jsonb);
 foreach rule in array array['double','risk','reverse','streak','final','rescue','blind','blitz'] loop
  perform public.ml_online_reset(rid);update public.rooms set config=config||jsonb_build_object('chaos_rules',jsonb_build_array(rule)) where id=rid;
  expected:=case rule when 'double' then 11 when 'streak' then 13 when 'final' then 10 else 6 end;
  for n in 1..5 loop
   perform public.ml_online_ml_start(rid,n,'Test','Höhe','Test','m','A','',100,'B','',50,8);
   choice:=case when rule='reverse' then 'b' else 'a' end;perform public.ml_online_ml_submit(rid,n,choice);
  end loop;
  select score into actual from public.players where room_id=rid and user_id=u;
  if actual<>expected then raise exception '% scoring: expected %, got %',rule,expected,actual;end if;
  if (select (results->'answers'->0->>'round_bonus')::int from public.online_ml_reveals where room_id=rid and question_no=5)<>1 then raise exception 'perfect round bonus';end if;
 end loop;
 perform public.ml_online_reset(rid);update public.rooms set config=config||'{"chaos_rules":["rescue"]}'::jsonb where id=rid;
 for n in 1..2 loop perform public.ml_online_ml_start(rid,n,'Test','Höhe','Test','m','A','',100,'B','',50,8);perform public.ml_online_ml_submit(rid,n,'b');end loop;
 if (select score from public.players where room_id=rid and user_id=u)<>-1 then raise exception 'rescue must forgive only first mistake';end if;
 perform public.ml_online_reset(rid);update public.rooms set config=config||'{"chaos_rules":["risk"]}'::jsonb where id=rid;
 perform public.ml_online_ml_start(rid,1,'Test','Höhe','Test','m','A','',100,'B','',50,8);perform public.ml_online_ml_submit(rid,1,'b');if (select score from public.players where room_id=rid and user_id=u)<>-1 then raise exception 'risk loss';end if;
 perform public.ml_online_reset(rid);update public.rooms set config=config||'{"chaos_rules":["blitz"]}'::jsonb where id=rid;
 perform public.ml_online_ml_start(rid,1,'Test','Höhe','Test','m','A','',100,'B','',50,8);update public.online_ml_questions set deadline=clock_timestamp()-interval '1 second' where room_id=rid;
 perform public.ml_online_ml_timeout(rid,1);if (select (results->'answers'->0->>'correct')::boolean from public.online_ml_reveals where room_id=rid) then raise exception 'chaos blitz timeout scores';end if;
 perform set_config('role','authenticated',true);
 perform public.ml_online_mode_state(rid);
 begin perform 1 from ml_private.online_ml_secrets;raise exception 'authenticated can read secrets';exception when insufficient_privilege then null;end;
 perform set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
 if exists(select 1 from public.online_ml_questions where room_id=rid) then raise exception 'outsider bypasses RLS';end if;
end $test$;
rollback;
select 'PASS: eight Chaos rules, perfect-round bonus, rescue/risk losses, timed expiration, authenticated RPC and private-table/room RLS protection; rolled back.' as verification;
