begin;
do $test$
declare u uuid:=gen_random_uuid();v uuid:=gen_random_uuid();rid uuid;pool jsonb;state jsonb;qid uuid;mode text;
begin
 insert into auth.users(id,aud,role) values(u,'authenticated','authenticated'),(v,'authenticated','authenticated');perform set_config('request.jwt.claim.sub',u::text,true);
 select room_id into rid from public.ml_create_room('Schätz Test','{"game":"estimate","game_mode":"classic"}'::jsonb);
 insert into public.players(room_id,user_id,display_name,seat) values(rid,v,'Gast',2);
 select jsonb_agg(jsonb_build_object('q','Frage '||i,'a',100,'u','m')) into pool from generate_series(1,10) i;
 foreach mode in array array['classic','risk','king','survival','blitz'] loop
  perform public.ml_online_reset(rid);perform public.ml_estimate_start(rid,mode,pool);
  state:=public.ml_estimate_state(rid);qid:=(state->>'question_id')::uuid;
  if state->'question' ? 'a' or state->'result'<>'null'::jsonb then raise exception 'answer leaked before guess';end if;
  perform public.ml_estimate_submit(rid,qid,100,50);
  state:=public.ml_estimate_state(rid);if state->'result'<>'null'::jsonb or state->>'phase'<>'open' then raise exception 'premature reveal';end if;
  begin perform public.ml_estimate_submit(rid,qid,100,50);raise exception 'duplicate accepted';exception when others then if sqlerrm<>'answer already locked' then raise;end if;end;
  perform set_config('request.jwt.claim.sub',v::text,true);
  state:=public.ml_estimate_state(rid);if state->'mine'<>'null'::jsonb then raise exception 'other guess leaked';end if;
  perform public.ml_estimate_submit(rid,qid,200,50);state:=public.ml_estimate_state(rid);
  if state->>'phase'<>'revealed' or (state->'result'->>'truth')::numeric<>100 then raise exception 'no shared reveal';end if;
  if (state->'stats'->u::text->>'score')::int<>(case when mode='risk' then 600 else 100 end) then raise exception 'host score wrong for %',mode;end if;
  if mode='survival' and (state->'stats'->v::text->>'lives')::int<>2 then raise exception 'survival lives';end if;
  if mode='risk' and (state->'stats'->v::text->>'score')::int<>450 then raise exception 'risk loss';end if;
  begin perform public.ml_estimate_next(rid,qid);raise exception 'guest advances';exception when others then if sqlerrm<>'host only' then raise;end if;end;
  perform set_config('request.jwt.claim.sub',u::text,true);perform public.ml_estimate_next(rid,qid);
  state:=public.ml_estimate_state(rid);if (state->>'index')::int<>1 then raise exception 'next not synchronized';end if;
  begin perform public.ml_estimate_submit(rid,qid,100,50);raise exception 'old nonce accepted';exception when others then if sqlerrm<>'question expired or replaced' then raise;end if;end;
  if mode='king' then
   perform public.ml_estimate_submit(rid,(state->>'question_id')::uuid,100,null);perform set_config('request.jwt.claim.sub',v::text,true);perform public.ml_estimate_submit(rid,(state->>'question_id')::uuid,100,null);perform set_config('request.jwt.claim.sub',u::text,true);
   state:=public.ml_estimate_state(rid);if (state->'stats'->u::text->>'score')::int<>300 then raise exception 'king x2';end if;
  elsif mode='blitz' then
   update ml_private.estimate_matches set deadline=clock_timestamp()-interval '1 second' where room_id=rid;
   state:=public.ml_estimate_state(rid);if state->>'phase'<>'revealed' or exists(select 1 from jsonb_array_elements(state->'result'->'answers') a where (a->>'points')::int<>0) then raise exception 'blitz timeout';end if;
   state:=public.ml_estimate_state(rid);if (state->'stats'->u::text->>'score')::int<>100 then raise exception 'repeat scoring';end if;
  end if;
 end loop;
 perform set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
 begin perform public.ml_estimate_state(rid);raise exception 'outsider reads';exception when others then if sqlerrm<>'not room member' then raise;end if;end;
 if has_table_privilege('authenticated','ml_private.estimate_matches','SELECT') or has_function_privilege('anon','public.ml_estimate_state(uuid)','EXECUTE') then raise exception 'unexpected grant';end if;
end $test$;
rollback;
select 'PASS: five modes, shared question/reveal, private truth/guesses, duplicate and old answer rejection, host-only advancement, King series, Survival lives, Risk score, Blitz timeout and idempotence; rolled back.' as verification;
