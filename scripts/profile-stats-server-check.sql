begin;
do $test$
declare u uuid:=gen_random_uuid();v uuid:=gen_random_uuid();rid uuid;mid uuid:=gen_random_uuid();res jsonb;begin
 insert into auth.users(id,aud,role) values(u,'authenticated','authenticated'),(v,'authenticated','authenticated');
 perform set_config('request.jwt.claim.sub',u::text,true);
 select room_id into rid from public.ml_create_room('Stats Test','{"game":"moreless","rounds":1,"questions_per_round":5,"timer_enabled":false}'::jsonb);
 insert into public.players(room_id,user_id,display_name,seat) values(rid,v,'Second',2);
 perform public.ml_online_ml_start(rid,5,'Test','Höhe','Test','m','A','',100,'B','',50,8);
 update public.players set score=case when user_id=u then 3 else 2 end,blitz_bonus=case when user_id=v then 1 else 0 end where room_id=rid;
 insert into public.online_ml_reveals(room_id,question_no,results) values(rid,5,'{"game_over":false}');
 res:=public.ml_online_stats();if (res->0->>'draws')::integer<>1 or (res->0->>'wins')::integer<>0 then raise exception 'Blitz bonus / tied podium failed';end if;
 perform ml_private.store_online_result(mid,'estimate','classic',jsonb_build_object(u::text,jsonb_build_object('score',10),v::text,jsonb_build_object('score',8)));
 perform ml_private.store_online_result(mid,'estimate','classic',jsonb_build_object(u::text,jsonb_build_object('score',0),v::text,jsonb_build_object('score',20)));
 if (select count(*) from ml_private.online_results where match_id=mid)<>2 then raise exception 'Duplicate result';end if;
 insert into ml_private.fact_matches(room_id,pool,scores) values(rid,'[]',jsonb_build_object(u::text,jsonb_build_object('score',3),v::text,jsonb_build_object('score',4)));
 update ml_private.fact_matches set phase='finished' where room_id=rid;
 insert into ml_private.estimate_matches(room_id,mode,pool,stats) values(rid,'classic','[]',jsonb_build_object(u::text,jsonb_build_object('score',5),v::text,jsonb_build_object('score',2)));
 update ml_private.estimate_matches set phase='finished' where room_id=rid;
 update ml_private.estimate_matches set phase='finished' where room_id=rid;
 res:=public.ml_online_stats();if (select sum((value->>'played')::integer) from jsonb_array_elements(res))<>4 then raise exception 'Finish triggers failed';end if;
 if (select (value->>'wins')::integer from jsonb_array_elements(res) where value->>'game'='estimate')<>2 then raise exception 'Wins failed';end if;
 if (select (value->>'losses')::integer from jsonb_array_elements(res) where value->>'game'='facts')<>1 then raise exception 'Losses failed';end if;
 perform set_config('request.jwt.claim.sub',v::text,true);res:=public.ml_online_stats();if (select (value->>'wins')::integer from jsonb_array_elements(res) where value->>'game'='facts')<>1 then raise exception 'Owner scope failed';end if;
 delete from public.rooms where id=rid;if (select count(*) from ml_private.online_results where user_id=u)<>4 then raise exception 'History lost on room deletion';end if;
 if has_table_privilege('authenticated','ml_private.online_results','insert') or has_function_privilege('authenticated','ml_private.store_online_result(uuid,text,text,jsonb)','execute') or has_function_privilege('anon','public.ml_online_stats()','execute') then raise exception 'Client privileges';end if;
end $test$;
select 'PASS: finished games, ties, bonus, deduplication, history and ownership' as result;
rollback;
