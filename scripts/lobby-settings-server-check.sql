begin;

do $test$
declare u uuid:=gen_random_uuid(); v uuid:=gen_random_uuid(); w uuid:=gen_random_uuid(); rid uuid; code text; cfg jsonb; result jsonb;
begin
 insert into auth.users(id,aud,role) values(u,'authenticated','authenticated'),(v,'authenticated','authenticated'),(w,'authenticated','authenticated');
 perform set_config('request.jwt.claim.sub',u::text,true);
 select room_id,room_code into rid,code from public.ml_create_room('Settings Test','{"game":"moreless","game_mode":"CHAOS"}'::jsonb);
 cfg:=public.ml_update_room_settings(rid,3,12,2);
 if (cfg->>'rounds')::int*(cfg->>'questions_per_round')::int<>15 then raise exception 'round count'; end if;
 perform set_config('request.jwt.claim.sub',v::text,true);
 perform public.ml_join_room(code,'Guest');
 begin perform public.ml_update_room_settings(rid,1,5,3);raise exception 'guest settings allowed';exception when others then if sqlerrm<>'host only' then raise;end if;end;
 perform public.ml_join_room(code,'Guest reconnect');
 perform set_config('request.jwt.claim.sub',w::text,true);
 begin perform public.ml_join_room(code,'Third');raise exception 'capacity ignored';exception when others then if sqlerrm<>'Room is full' then raise;end if;end;
 perform set_config('request.jwt.claim.sub',u::text,true);
 begin perform public.ml_update_room_settings(rid,3,12,1);raise exception 'limit below members';exception when others then if sqlerrm<>'Player limit below current players' then raise;end if;end;
 begin perform public.ml_update_room_settings(rid,3,2,2);raise exception 'invalid time';exception when others then if sqlerrm<>'Invalid settings' then raise;end if;end;
 perform public.ml_update_room_settings(rid,3,0,2);
 perform public.ml_online_ml_start(rid,1,'Test','Test','Test','m','A','',100,'B','',50,45);
 if (select deadline from public.online_ml_questions where room_id=rid and question_no=1) is not null then raise exception 'untimed deadline';end if;
 -- Restore pre-match state solely inside this rolled-back fixture.
 delete from public.online_ml_questions where room_id=rid;
 update public.rooms set phase='lobby' where id=rid;
 perform public.ml_update_room_settings(rid,3,12,2);
 perform public.ml_online_ml_start(rid,1,'Test','Test','Test','m','A','',100,'B','',50,45);
 if not exists(select 1 from public.online_ml_questions where room_id=rid and deadline between clock_timestamp()+interval '11 seconds' and clock_timestamp()+interval '13 seconds') then raise exception 'server timer did not follow config';end if;
 begin perform public.ml_update_room_settings(rid,1,5,2);raise exception 'settings unlocked';exception when others then if sqlerrm<>'Settings locked after game start' then raise;end if;end;
 begin perform public.ml_online_ml_start(rid,16,'Test','Test','Test','m','A','',100,'B','',50,45);raise exception 'round bound ignored';exception when others then if sqlerrm<>'question outside configured rounds' then raise;end if;end;
 update public.online_ml_questions set deadline=clock_timestamp()-interval '1 second' where room_id=rid;
 perform public.ml_online_ml_submit(rid,1,'a');
 select results into result from public.online_ml_reveals where room_id=rid and question_no=1;
 if jsonb_array_length(result->'answers')<>2 or exists(select 1 from jsonb_array_elements(result->'answers') a where (a->>'points')::numeric<>0) then raise exception 'Chaos timeout scores';end if;
end $test$;

rollback;
select 'PASS: lobby settings server tests; fixtures rolled back' as verification;
