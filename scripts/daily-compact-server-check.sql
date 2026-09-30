begin;
do $test$
declare u uuid:=gen_random_uuid();v uuid:=gen_random_uuid();d date:=(clock_timestamp() at time zone 'Europe/Berlin')::date;g text;i integer;q jsonb;choice text;a jsonb;b jsonb;
begin
 insert into auth.users(id,aud,role) values(u,'authenticated','authenticated'),(v,'authenticated','authenticated');
 perform set_config('request.jwt.claim.sub',u::text,true);
 a:=public.ml_daily_game('start','Endless Test',null,null,null,0,'moreless');
 for i in 1..100 loop
  select payload into q from ml_private.daily_questions where day=d and game='moreless' and no=i;
  if q is null then raise exception 'missing endless question %',i;end if;
  choice:=case when (q->>'lv')::numeric>(q->>'rv')::numeric then 'a' else 'b' end;
  a:=public.ml_daily_game('answer',null,d,i,choice,0,'moreless');
  if (a->'attempt'->>'complete')::boolean then raise exception 'endless prematurely ended';end if;
 end loop;
 if (a->'attempt'->>'score')::int<>100 or (a->'question'->>'no')::int<>101 then raise exception 'endless scoring';end if;
 select payload into q from ml_private.daily_questions where day=d and game='moreless' and no=101;
 choice:=case when (q->>'lv')::numeric>(q->>'rv')::numeric then 'b' else 'a' end;
 a:=public.ml_daily_game('answer',null,d,101,choice,0,'moreless');
 if not (a->'attempt'->>'complete')::boolean or (a->'attempt'->>'score')::int<>100 or a->'question'<>'null'::jsonb then raise exception 'wrong did not end';end if;
 b:=public.ml_daily_game('answer',null,d,101,choice,0,'moreless');
 if a->'attempt'<>b->'attempt' then raise exception 'repeat changed score';end if;
 begin perform public.ml_daily_game('answer',null,d,102,'a',0,'moreless');raise exception 'continued after failure';exception when others then if sqlerrm not like 'Daily beendet%' then raise;end if;end;
 foreach g in array array['estimate','facts'] loop
  a:=public.ml_daily_game('start','Five Test',null,null,null,0,g);
  if (a->>'question_total')::int<>5 then raise exception 'not five questions';end if;
  for i in 1..5 loop
   select payload into q from ml_private.daily_questions where day=d and game=g and no=i;
   a:=public.ml_daily_game('answer',null,d,i,q->>'a',0,g);
  end loop;
  if not (a->'attempt'->>'complete')::boolean or (a->'attempt'->>'score')::int<>(case when g='estimate' then 500 else 5 end) then raise exception 'five-question max %',g;end if;
  begin perform public.ml_daily_game('answer',null,d,6,'1',0,g);raise exception 'sixth allowed';exception when others then if sqlerrm<>'Invalid daily answer' then raise;end if;end;
 end loop;
 perform set_config('request.jwt.claim.sub',v::text,true);
 b:=public.ml_daily_game('start','Shared Question',null,null,null,0,'moreless');
 select payload into q from ml_private.daily_questions where day=d and game='moreless' and no=1;
 if b->'question'->>'left_name'<>q->>'l' then raise exception 'shared order';end if;
 if b->'question' ? 'right_value' then raise exception 'solution leaked';end if;
end $test$;
rollback;
select 'PASS: 100-question endless run, first-error stop, repeat safety, shared order and five-question 500/5 maxima; rolled back' as verification;
