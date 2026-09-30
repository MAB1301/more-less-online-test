begin;
do $test$
declare u uuid:=gen_random_uuid();v uuid:=gen_random_uuid();w uuid:=gen_random_uuid();d date:=(clock_timestamp() at time zone 'Europe/Berlin')::date; a jsonb;b jsonb;q jsonb;choice text;i integer;
begin
 insert into auth.users(id,aud,role) values(u,'authenticated','authenticated'),(v,'authenticated','authenticated'),(w,'authenticated','authenticated');
 perform set_config('request.jwt.claim.sub',u::text,true);
 a:=public.ml_daily('start','Daily A');
 if a->'question' ? 'right_value' or a->'question' ? 'rv' then raise exception 'answer leaked';end if;
 perform set_config('request.jwt.claim.sub',v::text,true);
 b:=public.ml_daily('start','Daily B');
 if a->'question'<>b->'question' then raise exception 'daily question mismatch';end if;
 begin perform public.ml_daily('answer',null,d,2,'a');raise exception 'skip accepted';exception when others then if sqlerrm<>'Answer questions in order' then raise;end if;end;
 begin perform public.ml_daily('answer',null,d-1,1,'a');raise exception 'old day accepted';exception when others then if sqlerrm not like 'Ein neuer Daily-Tag%' then raise;end if;end;
 perform set_config('request.jwt.claim.sub',u::text,true);
 for i in 1..10 loop
  select payload into q from ml_private.daily_questions where day=d and game='moreless' and no=i;
  choice:=case when (q->>'lv')::numeric>(q->>'rv')::numeric then 'a' else 'b' end;
  a:=public.ml_daily('answer',null,d,i,choice);
  b:=public.ml_daily('answer',null,d,i,case when choice='a' then 'b' else 'a' end);
  if a->'attempt'<>b->'attempt' or a->'reveal'<>b->'reveal' then raise exception 'retry re-scored';end if;
 end loop;
 if (a->'attempt'->>'score')::integer<>10 or not (a->'attempt'->>'complete')::boolean then raise exception 'perfect score failed';end if;
 b:=public.ml_daily('start','Rename attempt');
 if b->'attempt'->>'name'<>'Daily A' or (b->'attempt'->>'answered')::int<>10 then raise exception 'restart reset attempt';end if;
 perform set_config('request.jwt.claim.sub',v::text,true);
 for i in 1..10 loop
  select payload into q from ml_private.daily_questions where day=d and game='moreless' and no=i;
  choice:=case when (q->>'lv')::numeric>(q->>'rv')::numeric then 'a' else 'b' end;
  if i>5 then choice:=case when choice='a' then 'b' else 'a' end;end if;
  b:=public.ml_daily('answer',null,d,i,choice);
 end loop;
 if (b->'attempt'->>'score')::int<>5 or (b->'attempt'->>'rank')::int<=1 then raise exception 'ranking failed';end if;
 if not exists(select 1 from jsonb_array_elements(b->'leaderboard') r where r->>'name'='Daily A' and (r->>'score')::int=10) then raise exception 'shared leaderboard missing result';end if;
 perform set_config('request.jwt.claim.sub',w::text,true);
 a:=public.ml_daily('start','Incomplete');
 if exists(select 1 from jsonb_array_elements(a->'leaderboard') r where r->>'name'='Incomplete') then raise exception 'incomplete ranked';end if;
 if (select count(*) from ml_private.daily_questions where day=d and game='moreless')<>10 then raise exception 'question set changed';end if;
 if has_table_privilege('authenticated','ml_private.daily_questions','SELECT') or has_table_privilege('authenticated','ml_private.daily_attempts','UPDATE') or has_function_privilege('anon','public.ml_daily(text,text,date,integer,text,integer)','EXECUTE') then raise exception 'unsafe grants';end if;
 perform set_config('request.jwt.claim.sub','',true);
 begin perform public.ml_daily('home');raise exception 'unauth accepted';exception when others then if sqlerrm<>'Authentication required' then raise;end if;end;
end $test$;
rollback;
select 'PASS: shared questions, hidden solution, scores, retries, resume, ranking, day rollover and access; fixtures rolled back' as verification;
