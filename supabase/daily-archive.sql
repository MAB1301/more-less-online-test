-- Daily archive: historical runs keep separate progress and rankings.
create or replace function ml_private.daily_game_impl(p_action text,p_name text,p_day date,p_question integer,p_choice text,p_offset integer,p_game text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 g text:=coalesce(p_game,'moreless'); points integer; limitq integer; estimate_value numeric; maxscore integer;
 u uuid:=auth.uid(); today date:=(clock_timestamp() at time zone 'Europe/Berlin')::date; d date:=coalesce(p_day,today);
 a ml_private.daily_attempts; q jsonb; good boolean; reveal jsonb; board jsonb; question jsonb;
 total integer; my_rank integer; my_total integer; off integer:=greatest(0,coalesce(p_offset,0));
begin
 if u is null then raise exception 'Authentication required'; end if;
 if g not in ('moreless','estimate','facts') then raise exception 'Invalid daily game';end if;
 if g='overall' and p_action<>'home' then raise exception 'Choose a game first';end if;
 limitq:=case when g='moreless' then null else 5 end;
 maxscore:=case when g='estimate' then 500 when g='facts' then 5 else null end;
 if p_action is null or p_action not in ('home','start','answer') then raise exception 'Invalid daily action'; end if;
 if d>today then raise exception 'Zukünftige Dailys sind noch nicht verfügbar.';end if;
 if d<date '1900-01-01' then raise exception 'Datum außerhalb des Daily-Archivs.';end if;
 if p_action='answer' and p_day is null then raise exception 'Daily-Datum fehlt.';end if;
 if g<>'overall' and not exists(select 1 from ml_private.daily_questions where day=d and game=g) then
  perform pg_advisory_xact_lock(81851+case g when 'estimate' then 1 when 'facts' then 2 else 0 end,(d-date '2020-01-01')::integer);
  if not exists(select 1 from ml_private.daily_questions where day=d and game=g) then
   insert into ml_private.daily_questions(day,game,no,payload)
   select d,g,row_number() over(order by md5(d::text||id),id)::int,payload from
    (select id,payload from ml_private.daily_catalogue where game=g order by md5(d::text||id),id limit coalesce(limitq,10)) pool;
  end if;
 end if;
 if g<>'overall' and (select count(*) from ml_private.daily_questions where day=d and game=g)<coalesce(limitq,10) then raise exception 'Daily questions unavailable'; end if;
 if p_action='start' then
  if p_name is null or char_length(btrim(p_name)) not between 1 and 24 then raise exception 'Bitte einen Namen mit 1–24 Zeichen eingeben.'; end if;
  insert into ml_private.daily_attempts(day,user_id,game,name) values(d,u,g,coalesce((select name from ml_private.daily_attempts where day=d and user_id=u limit 1),btrim(p_name))) on conflict(day,user_id,game) do nothing;
 end if;
 select * into a from ml_private.daily_attempts where day=d and game=g and user_id=u for update;
 if p_action='answer' then
  if a.user_id is null then raise exception 'Daily zuerst starten'; end if;
  if p_question is null or p_question<1 or (limitq is not null and p_question>limitq) or p_choice is null or (g='moreless' and p_choice not in ('a','b')) or (g='facts' and p_choice not in ('true','false')) then raise exception 'Invalid daily answer'; end if;
  if a.completed_at is not null and p_question>a.answered then raise exception 'Daily für diesen Tag bereits beendet.';end if;
  if p_question>a.answered+1 then raise exception 'Answer questions in order'; end if;
  select payload into q from ml_private.daily_questions where day=d and game=g and no=p_question;
  if p_question=a.answered+1 then
   if g='estimate' then
    if char_length(p_choice)>30 or p_choice !~ '^[0-9]+([.][0-9]+)?([eE][+-]?[0-9]+)?$' then raise exception 'Bitte eine gültige positive Schätzung eingeben.';end if;
    estimate_value:=p_choice::numeric;
    if estimate_value>1e15 then raise exception 'Schätzung zu groß';end if;
    points:=round(100*greatest(0,1-abs(estimate_value-(q->>'a')::numeric)/greatest(abs((q->>'a')::numeric),1)))::int;
    good:=points>0;
   else
    good:=case when g='facts' then (p_choice::boolean)=(q->>'a')::boolean else (p_choice='a')=((q->>'lv')::numeric>(q->>'rv')::numeric) end;
    points:=case when good then 1 else 0 end;
   end if;
   insert into ml_private.daily_answers(day,user_id,game,no,choice,correct,points) values(d,u,g,p_question,p_choice,good,points);
   update ml_private.daily_attempts set answered=p_question,score=score+points,completed_at=case when (g='moreless' and not good) or (limitq is not null and p_question=limitq) then clock_timestamp() else null end where day=d and game=g and user_id=u returning * into a;
  else
   select choice,correct,daily_answers.points into p_choice,good,points from ml_private.daily_answers where day=d and game=g and user_id=u and no=p_question;
  end if;
  reveal:=jsonb_build_object('no',p_question,'choice',p_choice,'correct',good,'points',points,'left_value',q->'lv','right_value',q->'rv','unit',q->>'u','correct_name',case when g='moreless' then case when (q->>'lv')::numeric>(q->>'rv')::numeric then q->>'l' else q->>'r' end else null end,'answer',q->'a','explanation',q->>'e','source',q->>'source');
 end if;
 if a.user_id is not null and a.completed_at is null then
  if g='moreless' then
   insert into ml_private.daily_questions(day,game,no,payload)
   select d,g,a.answered+1,payload from ml_private.daily_catalogue where game=g
   order by md5(d::text||case when a.answered<(select count(*) from ml_private.daily_catalogue where game=g) then '' else ':cycle:'||(a.answered/(select count(*) from ml_private.daily_catalogue where game=g))::text end||id),id
   limit 1 offset (a.answered%(select count(*) from ml_private.daily_catalogue where game=g))
   on conflict(day,game,no) do nothing;
  end if;
  select jsonb_build_object('no',no,'left_name',payload->>'l','right_name',payload->>'r','left_value',payload->'lv','unit',payload->>'u','category',coalesce(payload->>'cat','Schätzduell'),'prompt',coalesce(payload->>'q',payload->>'s')) into question from ml_private.daily_questions where day=d and game=g and no=a.answered+1;
 end if;
 with scores as (select user_id,name,score,completed_at from ml_private.daily_attempts where day=d and game=g and completed_at is not null), ranked as (select *,dense_rank() over(order by score desc) as rank from scores), paged as (select * from ranked order by score desc,completed_at,user_id limit 50 offset off)
 select (select count(*) from scores),coalesce(jsonb_agg(jsonb_build_object('name',name,'score',score,'rank',rank,'mine',user_id=u) order by score desc,completed_at,user_id),'[]'::jsonb),(select rank from ranked where user_id=u),(select score from scores where user_id=u)
 into total,board,my_rank,my_total from paged;
 return jsonb_build_object('game',g,'max_score',maxscore,'question_total',limitq,'my_rank',my_rank,'my_score',my_total,'day',d,'today',today,'game_attempts',coalesce((select jsonb_object_agg(game,jsonb_build_object('score',score,'answered',answered,'complete',completed_at is not null)) from ml_private.daily_attempts where day=d and user_id=u),'{}'::jsonb),'total',total,'offset',off,'leaderboard',board,'question',question,'reveal',reveal,'attempt',case when a.user_id is null then null else jsonb_build_object('name',a.name,'answered',a.answered,'score',a.score,'complete',a.completed_at is not null,'rank',my_rank) end);
end $$;

