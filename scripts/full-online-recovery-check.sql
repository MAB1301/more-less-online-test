begin;
do $test$
declare u uuid:=gen_random_uuid();v uuid:=gen_random_uuid();rid uuid;pool jsonb;state jsonb;peer jsonb;qid uuid;match_game text;host_id uuid;i int;denied boolean;
begin
 insert into auth.users(id,aud,role,is_anonymous) values(u,'authenticated','authenticated',true),(v,'authenticated','authenticated',true);
 foreach match_game in array array['estimate','facts'] loop
  perform set_config('request.jwt.claim.sub',u::text,true);
  select room_id into rid from public.ml_create_room('Full match host',jsonb_build_object('game',match_game,'game_mode','classic','rule_previews',false));
  perform set_config('request.jwt.claim.sub',v::text,true);perform public.ml_join_room((select code from public.rooms where id=rid),'Full match guest');
  perform set_config('request.jwt.claim.sub',u::text,true);host_id:=u;
  if match_game='estimate' then
   select jsonb_agg(jsonb_build_object('q','Fixture '||n,'a',100,'u','m')) into pool from generate_series(1,10)n;
   perform public.ml_estimate_start(rid,'classic',pool);
  else
   insert into ml_private.player_seen(user_id,game,question_key)
   select player,'facts',c.payload->>'s' from unnest(array[u,v]) player cross join ml_private.daily_catalogue c
   where c.game='facts' and coalesce(c.payload->>'verified','')<>'2026-10-04'
   on conflict(user_id,game,question_key) do nothing;
   perform public.ml_fact_game(rid,'start');
   assert not exists(select 1 from ml_private.fact_matches m cross join jsonb_array_elements(m.pool) q where m.room_id=rid and q->>'verified'<>'2026-10-04'),'new sourced facts reach the live game';
  end if;
  for i in 0..9 loop
   if i=3 then
    update public.players set connected=false,last_seen_at=clock_timestamp()-interval '91 seconds' where room_id=rid and user_id=u;
    perform set_config('request.jwt.claim.sub',v::text,true);peer:=public.ml_room_recovery(rid,'claim');assert (peer->>'host_id')::uuid=v,'new host';host_id:=v;
    perform set_config('request.jwt.claim.sub',u::text,true);
    denied:=false;begin perform public.ml_room_recovery(rid,'claim');exception when others then denied:=true;end;assert denied,'old host cannot reclaim active leadership';
    -- Reconnecting player rejoins the same match, preserving prior points.
   end if;
   perform set_config('request.jwt.claim.sub',u::text,true);
   if match_game='estimate' then state:=public.ml_estimate_state(rid);else state:=public.ml_fact_game(rid,'state');end if;
   qid:=(state->>'question_id')::uuid;assert (state->>'index')::int=i,'same round on reconnect';assert state->'result'='null'::jsonb,'truth private before answers';
   if match_game='estimate' then perform public.ml_estimate_submit(rid,qid,100,null);else state:=public.ml_fact_game(rid,'answer',qid,false);end if;
   perform set_config('request.jwt.claim.sub',v::text,true);
   if match_game='estimate' then peer:=public.ml_estimate_state(rid);else peer:=public.ml_fact_game(rid,'state');end if;
   assert peer->>'question_id'=qid::text,'shared question';assert peer->'mine'='null'::jsonb,'other answer private';
   if match_game='estimate' then perform public.ml_estimate_submit(rid,qid,200,null);peer:=public.ml_estimate_state(rid);else peer:=public.ml_fact_game(rid,'answer',qid,true);end if;
   assert peer->>'phase'=case when match_game='facts' and i=9 then 'finished' else 'revealed' end,'shared reveal';
   perform set_config('request.jwt.claim.sub',host_id::text,true);
   if match_game='estimate' then perform public.ml_estimate_next(rid,qid);elsif i<9 then perform public.ml_fact_game(rid,'next',qid);end if;
  end loop;
  if match_game='estimate' then
   state:=public.ml_estimate_state(rid);assert state->>'phase'='finished','estimate complete';assert (state->'stats'->u::text->>'score')::int=1000,'host points preserved across takeover';assert (state->'stats'->v::text->>'score')::int=0,'guest score';
  else
   state:=public.ml_fact_game(rid,'state');assert state->>'phase'='finished','facts complete';assert (state->'scores'->u::text->>'score')::int=5 and (state->'scores'->v::text->>'score')::int=5,'balanced answers, no duplicated scores';
  end if;
 end loop;
end $test$;
rollback;
select 'PASS: complete 10-question estimate and Fact/Fake matches, separate identities, private answers, host absence/takeover/reconnect and preserved final scores; all fixtures rolled back.' as verification;
