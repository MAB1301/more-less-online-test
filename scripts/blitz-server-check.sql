-- Run through an administrator SQL connection. All fixture data is rolled back.
begin;
do $test$
declare u uuid:=gen_random_uuid(); v uuid:=gen_random_uuid(); rid uuid; result jsonb; total numeric;
begin
 insert into auth.users(id,aud,role) values(u,'authenticated','authenticated'),(v,'authenticated','authenticated');
 perform set_config('request.jwt.claim.sub',u::text,true);
 select room_id into rid from public.ml_create_room('Timer Test','{"game":"moreless","game_mode":"BLITZ","blitz_seconds":8,"timer_seconds":8}'::jsonb);
 insert into public.players(room_id,user_id,display_name,seat) values(rid,v,'Gast Test',2);
 perform public.ml_online_ml_start(rid,1,'Test','Test','Test','m','A','',100,'B','',50,8);
 perform public.ml_online_ml_submit(rid,1,'a');
 if exists(select 1 from public.online_ml_reveals where room_id=rid) then raise exception 'premature reveal'; end if;
 update public.online_ml_questions set deadline=clock_timestamp()+interval '2 seconds' where room_id=rid and question_no=1;
 update ml_private.online_ml_answers set submitted_at=clock_timestamp()-interval '3 seconds' where room_id=rid and question_no=1;
 perform set_config('request.jwt.claim.sub',v::text,true);
 perform public.ml_online_ml_submit(rid,1,'a');
 select results into result from public.online_ml_reveals where room_id=rid and question_no=1;
 if not exists(select 1 from jsonb_array_elements(result->'answers') a where a->>'user_id'=u::text and (a->>'points')::numeric=1.5) then raise exception 'fast bonus failed'; end if;
 if not exists(select 1 from jsonb_array_elements(result->'answers') a where a->>'user_id'=v::text and (a->>'points')::numeric=1) then raise exception 'late points failed'; end if;
 select sum(score+blitz_bonus) into total from public.players where room_id=rid;
 if total<>2.5 then raise exception 'score sum failed'; end if;
 perform set_config('request.jwt.claim.sub',u::text,true);
 perform public.ml_online_ml_start(rid,2,'Test','Test','Test','m','A','',100,'B','',50,8);
 update public.online_ml_questions set deadline=clock_timestamp()-interval '1 second' where room_id=rid and question_no=2;
 perform public.ml_online_ml_timeout(rid,2);
 perform public.ml_online_ml_timeout(rid,2);
 select results into result from public.online_ml_reveals where room_id=rid and question_no=2;
 if jsonb_array_length(result->'answers')<>2 or exists(select 1 from jsonb_array_elements(result->'answers') a where (a->>'points')::numeric<>0) then raise exception 'timeout failed'; end if;
 if (select sum(score+blitz_bonus) from public.players where room_id=rid)<>2.5 then raise exception 'duplicate scoring'; end if;
 perform set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
 begin
  perform public.ml_online_ml_timeout(rid,2);
  raise exception 'nonmember accepted';
 exception when others then
  if sqlerrm<>'not room member' then raise; end if;
 end;
end $test$;
rollback;
select 'PASS: 1.5 fast, 1 late, 0 timeout, idempotent finalize, membership check; fixtures rolled back' as verification;
