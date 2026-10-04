-- Reports and opt-in local outcome observations. Browser observations never change scores.
create table if not exists ml_private.question_reports (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 game text not null check(game in ('moreless','estimate','facts','quiz')), question_key text not null,
 prompt text not null, reason text not null check(reason in ('value','wording','image','source','other')),
 note text not null default '', created_at timestamptz not null default clock_timestamp(),
 unique(user_id,game,question_key,reason)
);
alter table ml_private.question_reports enable row level security;
revoke all on ml_private.question_reports from public,anon,authenticated;
create index if not exists question_reports_user_time on ml_private.question_reports(user_id,created_at);
create or replace function ml_private.question_report_impl(p_game text,p_key text,p_prompt text,p_reason text,p_note text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); found_id uuid;
begin
 if u is null then raise exception 'Bitte zuerst den Gastzugang oder Account laden.';end if;
 if p_game is null or p_game not in ('moreless','estimate','facts','quiz') or p_reason is null or p_reason not in ('value','wording','image','source','other') or p_key is null or length(p_key) not between 1 and 200 or p_prompt is null or length(p_prompt) not between 1 and 500 or p_note is null or length(p_note)>600 then raise exception 'Ungültige Meldung';end if;
 perform pg_advisory_xact_lock(hashtextextended(u::text,9281));
 select id into found_id from ml_private.question_reports where user_id=u and game=p_game and question_key=p_key and reason=p_reason;
 if found_id is not null then return jsonb_build_object('id',found_id,'duplicate',true);end if;
 if (select count(*) from ml_private.question_reports where user_id=u and created_at>clock_timestamp()-interval '1 day')>=50 then raise exception 'Heute wurden schon 50 Meldungen gesendet.';end if;
 insert into ml_private.question_reports(user_id,game,question_key,prompt,reason,note) values(u,p_game,p_key,p_prompt,p_reason,p_note) returning id into found_id;
 return jsonb_build_object('id',found_id,'duplicate',false);
end $$;
revoke all on function ml_private.question_report_impl(text,text,text,text,text) from public,anon;
grant execute on function ml_private.question_report_impl(text,text,text,text,text) to authenticated;
create or replace function public.ml_report_question(p_game text,p_key text,p_prompt text,p_reason text,p_note text default '')
returns jsonb language sql security invoker set search_path='' as $$select ml_private.question_report_impl(p_game,p_key,p_prompt,p_reason,p_note)$$;
revoke all on function public.ml_report_question(text,text,text,text,text) from public,anon;
grant execute on function public.ml_report_question(text,text,text,text,text) to authenticated;

create table if not exists ml_private.question_observations (
 user_id uuid not null references auth.users(id) on delete cascade,event_id text not null,
 game text not null check(game in ('moreless','estimate','facts','quiz')), question_key text not null,prompt text not null,
 mode text not null, accuracy numeric not null check(accuracy>=0 and accuracy<=1),created_at timestamptz not null default clock_timestamp(),
 primary key(user_id,event_id)
);
alter table ml_private.question_observations enable row level security;
revoke all on ml_private.question_observations from public,anon,authenticated;
create index if not exists question_observations_user_time on ml_private.question_observations(user_id,created_at);
create or replace function ml_private.question_observation_impl(p_event text,p_game text,p_key text,p_prompt text,p_mode text,p_accuracy numeric)
returns boolean language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();begin
 if u is null then raise exception 'Authentication required';end if;
 if p_game is null or p_game not in ('moreless','estimate','facts','quiz') or p_event is null or length(p_event) not between 1 and 160 or p_key is null or length(p_key) not between 1 and 200 or p_prompt is null or length(p_prompt) not between 1 and 500 or p_mode is null or length(p_mode) not between 1 and 40 or p_accuracy is null or not(p_accuracy>=0 and p_accuracy<=1) then raise exception 'Invalid observation';end if;
 perform pg_advisory_xact_lock(hashtextextended(u::text,9282));
 if exists(select 1 from ml_private.question_observations where user_id=u and event_id=p_event) then return true;end if;
 if (select count(*) from ml_private.question_observations where user_id=u and created_at>clock_timestamp()-interval '1 day')>=1000 then raise exception 'Observation limit';end if;
 insert into ml_private.question_observations(user_id,event_id,game,question_key,prompt,mode,accuracy) values(u,p_event,p_game,p_key,p_prompt,p_mode,p_accuracy);
 return true;end $$;
revoke all on function ml_private.question_observation_impl(text,text,text,text,text,numeric) from public,anon;
grant execute on function ml_private.question_observation_impl(text,text,text,text,text,numeric) to authenticated;
create or replace function public.ml_observe_question(p_event text,p_game text,p_key text,p_prompt text,p_mode text,p_accuracy numeric)
returns boolean language sql security invoker set search_path='' as $$select ml_private.question_observation_impl(p_event,p_game,p_key,p_prompt,p_mode,p_accuracy)$$;
revoke all on function public.ml_observe_question(text,text,text,text,text,numeric) from public,anon;
grant execute on function public.ml_observe_question(text,text,text,text,text,numeric) to authenticated;

-- Owner-only review view: no live answers, identities or raw notes are exposed through an API.
-- Daily answers are server-scored; optional browser observations are explicitly kept separate.
create or replace view ml_private.question_difficulty_review with (security_invoker=true) as
with evidence as (
 select 'server_daily'::text as evidence,a.game,md5(q.payload::text) as question_key,
 coalesce(q.payload->>'q',q.payload->>'s',(q.payload->>'l')||' / '||(q.payload->>'r')) as prompt,'daily'::text as mode,
 a.user_id,case when a.game='estimate' then a.points::numeric/100 else a.correct::int::numeric end as accuracy
 from ml_private.daily_answers a join ml_private.daily_questions q using(day,game,no)
 union all
 select 'browser_opt_in',game,question_key,prompt,mode,user_id,accuracy from ml_private.question_observations
), grouped as (
 select evidence,game,question_key,prompt,mode,count(*) as answers,count(distinct user_id) as players,
 round(avg(accuracy),3) as mean_accuracy from evidence group by 1,2,3,4,5
)
select *,case when answers<20 or players<5 then 'insufficient_sample' when mean_accuracy>=0.85 then 'review_too_easy' when mean_accuracy<0.40 then 'review_too_hard' else 'in_range' end as review_status from grouped;
revoke all on ml_private.question_difficulty_review from public,anon,authenticated;
