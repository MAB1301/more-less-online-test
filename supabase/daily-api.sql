create or replace function ml_private.daily_impl(p_action text,p_name text,p_day date,p_question integer,p_choice text,p_offset integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 u uuid:=auth.uid(); d date:=(clock_timestamp() at time zone 'Europe/Berlin')::date;
 a ml_private.daily_attempts; q jsonb; good boolean; reveal jsonb; board jsonb; question jsonb;
 total integer; my_rank integer; off integer:=greatest(0,coalesce(p_offset,0));
begin
 if u is null then raise exception 'Authentication required'; end if;
 if p_action is null or p_action not in ('home','start','answer') then raise exception 'Invalid daily action'; end if;
 if p_action='answer' and p_day is distinct from d then raise exception 'Ein neuer Daily-Tag hat begonnen. Bitte die Tagesseite neu laden.'; end if;
 if not exists(select 1 from ml_private.daily_questions where day=d) then
  perform pg_advisory_xact_lock(81851,(d-date '2020-01-01')::integer);
  if not exists(select 1 from ml_private.daily_questions where day=d) then
   insert into ml_private.daily_questions(day,no,payload)
   select d,row_number() over(order by md5(d::text||id),id)::int,payload from
    (select id,payload from ml_private.daily_catalogue order by md5(d::text||id),id limit 10) pool;
  end if;
 end if;
 if (select count(*) from ml_private.daily_questions where day=d)<>10 then raise exception 'Daily questions unavailable'; end if;
 if p_action='start' then
  if p_name is null or char_length(btrim(p_name)) not between 1 and 24 then raise exception 'Bitte einen Namen mit 1–24 Zeichen eingeben.'; end if;
  insert into ml_private.daily_attempts(day,user_id,name) values(d,u,btrim(p_name)) on conflict(day,user_id) do nothing;
 end if;
 select * into a from ml_private.daily_attempts where day=d and user_id=u for update;
 if p_action='answer' then
  if a.user_id is null then raise exception 'Daily zuerst starten'; end if;
  if p_question is null or p_question not between 1 and 10 or p_choice is null or p_choice not in ('a','b') then raise exception 'Invalid daily answer'; end if;
  if p_question>a.answered+1 then raise exception 'Answer questions in order'; end if;
  select payload into q from ml_private.daily_questions where day=d and no=p_question;
  if p_question=a.answered+1 then
   good:=(p_choice='a')=((q->>'lv')::numeric>(q->>'rv')::numeric);
   insert into ml_private.daily_answers(day,user_id,no,choice,correct) values(d,u,p_question,p_choice,good);
   update ml_private.daily_attempts set answered=p_question,score=score+case when good then 1 else 0 end,completed_at=case when p_question=10 then clock_timestamp() else null end where day=d and user_id=u returning * into a;
  else
   select choice,correct into p_choice,good from ml_private.daily_answers where day=d and user_id=u and no=p_question;
  end if;
  reveal:=jsonb_build_object('no',p_question,'choice',p_choice,'correct',good,'points',case when good then 1 else 0 end,'left_value',q->'lv','right_value',q->'rv','unit',q->>'u','correct_name',case when (q->>'lv')::numeric>(q->>'rv')::numeric then q->>'l' else q->>'r' end);
 end if;
 if a.user_id is not null and a.answered<10 then
  select jsonb_build_object('no',no,'left_name',payload->>'l','right_name',payload->>'r','left_value',payload->'lv','unit',payload->>'u','category',payload->>'cat') into question from ml_private.daily_questions where day=d and no=a.answered+1;
 end if;
 select count(*) into total from ml_private.daily_attempts where day=d and completed_at is not null;
 with ranked as (select name,score,user_id,dense_rank() over(order by score desc) as rank,completed_at from ml_private.daily_attempts where day=d and completed_at is not null), paged as (select * from ranked order by score desc,completed_at,user_id limit 50 offset off)
 select coalesce(jsonb_agg(jsonb_build_object('name',name,'score',score,'rank',rank,'mine',user_id=u) order by score desc,completed_at,user_id),'[]'::jsonb) into board from paged;
 if a.completed_at is not null then
  select 1+count(distinct score) into my_rank from ml_private.daily_attempts where day=d and completed_at is not null and score>a.score;
 end if;
 return jsonb_build_object('day',d,'total',total,'offset',off,'leaderboard',board,'question',question,'reveal',reveal,'attempt',case when a.user_id is null then null else jsonb_build_object('name',a.name,'answered',a.answered,'score',a.score,'complete',a.completed_at is not null,'rank',my_rank) end);
end $$;
create or replace function public.ml_daily(p_action text,p_name text default null,p_day date default null,p_question integer default null,p_choice text default null,p_offset integer default 0)
returns jsonb language sql security invoker set search_path='' as $$ select ml_private.daily_impl(p_action,p_name,p_day,p_question,p_choice,p_offset); $$;
revoke all on function ml_private.daily_impl(text,text,date,integer,text,integer),public.ml_daily(text,text,date,integer,text,integer) from public,anon;
grant execute on function ml_private.daily_impl(text,text,date,integer,text,integer),public.ml_daily(text,text,date,integer,text,integer) to authenticated;
