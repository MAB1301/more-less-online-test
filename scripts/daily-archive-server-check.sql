begin;
do $test$
declare u uuid:=gen_random_uuid();v uuid:=gen_random_uuid();today date:=(clock_timestamp() at time zone 'Europe/Berlin')::date;d date:=today-1;g text;i integer;q jsonb;a jsonb;b jsonb;firstq jsonb;
begin
 insert into auth.users(id,aud,role) values(u,'authenticated','authenticated'),(v,'authenticated','authenticated');
 perform set_config('request.jwt.claim.sub',u::text,true);
 foreach g in array array['moreless','estimate','facts'] loop
  a:=public.ml_daily_game('start','Archive Test',d,null,null,0,g);
  if (a->>'day')::date<>d or (a->>'today')::date<>today then raise exception 'wrong selected date';end if;
  if a->'question' ? 'answer' or a->'question' ? 'right_value' then raise exception 'solution leaked';end if;
  if g='moreless' then
   firstq:=a->'question';
   select payload into q from ml_private.daily_questions where day=d and game=g and no=1;
   a:=public.ml_daily_game('answer',null,d,1,case when (q->>'lv')::numeric>(q->>'rv')::numeric then 'b' else 'a' end,0,g);
  else
   for i in 1..5 loop
    select payload into q from ml_private.daily_questions where day=d and game=g and no=i;
    a:=public.ml_daily_game('answer',null,d,i,q->>'a',0,g);
   end loop;
  end if;
  if not (a->'attempt'->>'complete')::boolean then raise exception 'archive run unfinished';end if;
  if (a->'my_rank')::integer is null then raise exception 'archive ranking missing';end if;
  b:=public.ml_daily_game('start','Archive Again',d,null,null,0,g);
  if a->'attempt'<>b->'attempt' or b->'question'<>'null'::jsonb then raise exception 'archive replay changed result';end if;
  b:=public.ml_daily_game('home',null,today,null,null,0,g);
  if b->'attempt'<>'null'::jsonb then raise exception 'archive polluted current day';end if;
  begin perform public.ml_daily_game('start','Future',today+1,null,null,0,g);raise exception 'future accepted';exception when others then if sqlerrm<>'Zukünftige Dailys sind noch nicht verfügbar.' then raise;end if;end;
  begin perform public.ml_daily_game('answer',null,today+1,1,'a',0,g);raise exception 'future answer accepted';exception when others then if sqlerrm<>'Zukünftige Dailys sind noch nicht verfügbar.' then raise;end if;end;
 end loop;
 a:=public.ml_daily_game('home',null,d,null,null,0,'facts');
 if (select count(*) from jsonb_object_keys(a->'game_attempts'))<>3 then raise exception 'menu status missing';end if;
 perform set_config('request.jwt.claim.sub',v::text,true);
 b:=public.ml_daily_game('start','Same Archive',d,null,null,0,'moreless');
 if b->'question'<>firstq then raise exception 'archive order differs between players';end if;
 perform set_config('request.jwt.claim.sub','',true);
 begin perform public.ml_daily_game('home',null,d,null,null,0,'facts');raise exception 'unauthenticated accepted';exception when others then if sqlerrm<>'Authentication required' then raise;end if;end;
end $test$;
rollback;
select 'PASS: all three archived games, per-day progress/rankings, repeat protection, shared order, future rejection and auth; rolled back' as verification;
