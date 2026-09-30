begin;
do $test$
declare u uuid:=gen_random_uuid();v uuid:=gen_random_uuid();d date:=(clock_timestamp() at time zone 'Europe/Berlin')::date;g text;i integer;q jsonb;choice text;a jsonb;b jsonb;
begin
 insert into auth.users(id,aud,role) values(u,'authenticated','authenticated'),(v,'authenticated','authenticated');
 perform set_config('request.jwt.claim.sub',u::text,true);
 foreach g in array array['moreless','estimate','facts'] loop
  a:=public.ml_daily_game('start','Three Games',null,null,null,0,g);
  if a->'question' ? 'answer' or a->'question' ? 'a' then raise exception 'answer leaked';end if;
  for i in 1..10 loop
   select payload into q from ml_private.daily_questions where day=d and game=g and no=i;
   choice:=case when g='estimate' then q->>'a' when g='facts' then q->>'a' else case when (q->>'lv')::numeric>(q->>'rv')::numeric then 'a' else 'b' end end;
   a:=public.ml_daily_game('answer',null,d,i,choice,0,g);
   b:=public.ml_daily_game('answer',null,d,i,choice,0,g);
   if a->'attempt'<>b->'attempt' then raise exception 'duplicate scoring %',g;end if;
  end loop;
  if (a->'attempt'->>'score')::integer<>(a->>'max_score')::int then raise exception 'perfect score %',g;end if;
 end loop;
 a:=public.ml_daily_game('home',null,null,null,null,0,'overall');
 if (a->>'my_score')::int<>300 or (a->>'my_rank')::int<>1 then raise exception 'overall scoring failed';end if;
 if (select count(*) from ml_private.daily_questions where day=d)<>30 then raise exception 'three game sets';end if;
 begin perform public.ml_daily_game('start','No game',null,null,null,0,'overall');raise exception 'overall playable';exception when others then if sqlerrm<>'Choose a game first' then raise;end if;end;
 perform set_config('request.jwt.claim.sub',v::text,true);
 a:=public.ml_daily_game('start','Estimate Accuracy',null,null,null,0,'estimate');
 select payload into q from ml_private.daily_questions where day=d and game='estimate' and no=1;
 a:=public.ml_daily_game('answer',null,d,1,((q->>'a')::numeric*0.9)::text,0,'estimate');
 if (a->'reveal'->>'points')::int<>90 then raise exception 'relative estimate score';end if;
 begin perform public.ml_daily_game('answer',null,d,2,'NaN',0,'estimate');raise exception 'NaN allowed';exception when others then if sqlerrm not like 'Bitte eine gültige%' then raise;end if;end;
 a:=public.ml_daily_game('start','Another Name',null,null,null,0,'facts');
 if a->'attempt'->>'name'<>'Estimate Accuracy' then raise exception 'name changed across games';end if;
 begin perform public.ml_daily_game('answer',null,d,1,'a',0,'facts');raise exception 'invalid fact choice';exception when others then if sqlerrm<>'Invalid daily answer' then raise;end if;end;
 -- The archived game/day key cannot contaminate today's list.
 insert into ml_private.daily_attempts(day,user_id,game,name,answered,score,completed_at) values(d-1,v,'moreless','Yesterday',10,10,now());
 a:=public.ml_daily_game('home',null,null,null,null,0,'moreless');
 if exists(select 1 from jsonb_array_elements(a->'leaderboard') r where r->>'name'='Yesterday') then raise exception 'day contamination';end if;
end $test$;
rollback;
select 'PASS: three game sets/scoring, estimate accuracy, validation, overall score, retries and day isolation; rolled back' as verification;
