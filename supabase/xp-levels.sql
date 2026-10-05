-- Derived XP: no extra receipts table and no client-supplied XP amount.
create or replace function ml_private.xp_level(p_xp bigint)
returns jsonb language sql immutable security invoker set search_path=''
as $$
 with amount as (select greatest(0,p_xp) as xp),
 lvl as (select xp,1+floor((sqrt(1225+8*xp::numeric)-35)/10)::bigint as level from amount),
 bounds as (select *,((level-1)*(175+25*(level-1)))/2 as base,100+25*(level-1) as needed from lvl)
 select jsonb_build_object('xp',xp,'level',level,'current',xp-base,'needed',needed,'next_total',base+needed) from bounds
$$;
revoke all on function ml_private.xp_level(bigint) from public,anon,authenticated;

create or replace function ml_private.player_xp(p_user uuid)
returns jsonb language sql stable security invoker set search_path=''
as $$
 with runs as (
  select coalesce(sum(10+least(answered,30)+2*least(correct,30)),0)::bigint as xp
  from ml_private.player_runs where user_id=p_user and answered>=5
 ), daily as (
  select coalesce(sum(30+2*least(answered,30)),0)::bigint as xp
  from ml_private.daily_attempts where user_id=p_user and completed_at is not null and answered>0
 )
 select ml_private.xp_level(runs.xp+daily.xp)||jsonb_build_object('run_xp',runs.xp,'daily_xp',daily.xp) from runs,daily
$$;
revoke all on function ml_private.player_xp(uuid) from public,anon,authenticated;

CREATE OR REPLACE FUNCTION ml_private.player_hub_impl(p_action text, p_data jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare u uuid:=auth.uid();g text;k text;item jsonb;d date;today date:=(clock_timestamp() at time zone 'Europe/Berlin')::date;period text;scope text;startd date;endd date;board jsonb;profile jsonb;awards jsonb;total integer;off integer;begin
 if u is null then raise exception 'Authentication required';end if;
 if p_action in ('history_mark','record') then perform pg_advisory_xact_lock(hashtextextended(u::text,9921));end if;
 if p_action='history_mark' then
  if jsonb_typeof(p_data)<>'object' or pg_column_size(p_data)>250000 then raise exception 'Invalid history';end if;
  for g,item in select * from jsonb_each(p_data) loop
   if g not in ('moreless','estimate','facts','quiz') or jsonb_typeof(item)<>'array' or jsonb_array_length(item)>2000 then raise exception 'Invalid history';end if;
   for k in select jsonb_array_elements_text(item) loop
    if length(k) not between 1 and 1024 then raise exception 'Invalid key';end if;
    insert into ml_private.player_seen(user_id,game,question_key) values(u,g,k) on conflict(user_id,game,question_key) do update set seen_at=clock_timestamp();
   end loop;
  end loop;
  delete from ml_private.player_seen where user_id=u and (game,question_key) in (select game,question_key from ml_private.player_seen where user_id=u order by seen_at desc offset 2000);
 end if;
 if p_action in ('history','history_mark') then
  select coalesce(jsonb_object_agg(game,keys),'{}') into profile from (select game,jsonb_agg(question_key order by seen_at) as keys from ml_private.player_seen where user_id=u group by game) s;return profile;
 elsif p_action='record' then
  if p_data is null or not(p_data ?& array['game','run_id','mode','answered','correct','best_streak','score']) or p_data->>'game' not in ('moreless','estimate','facts','quiz') or length(p_data->>'run_id') not between 1 and 100 or length(p_data->>'mode') not between 1 and 40 or (p_data->>'answered')::integer not between 1 and 500 or (p_data->>'correct')::integer not between 0 and (p_data->>'answered')::integer or (p_data->>'best_streak')::integer not between 0 and (p_data->>'answered')::integer or not((p_data->>'score')::numeric between -10000 and 1000000) then raise exception 'Invalid personal result';end if;
  if exists(select 1 from ml_private.player_runs where user_id=u and run_id=p_data->>'run_id') then return jsonb_build_object('saved',true);end if;
  if (select count(*) from ml_private.player_runs where user_id=u and created_at>clock_timestamp()-interval '1 day')>=100 then raise exception 'Run limit';end if;
  insert into ml_private.player_runs values(u,p_data->>'run_id',p_data->>'game',p_data->>'mode',(p_data->>'score')::numeric,(p_data->>'answered')::integer,(p_data->>'correct')::integer,(p_data->>'best_streak')::integer,clock_timestamp());
  return jsonb_build_object('saved',true);
 elsif p_action='profile' then
  select coalesce(jsonb_agg(to_jsonb(s)),'[]') into profile from (select game,mode,count(*) as runs,max(score) as best_score,sum(answered) as answered,sum(correct) as correct,max(best_streak) as best_streak from ml_private.player_runs where user_id=u group by game,mode order by game,mode) s;
  with eligible as (select * from ml_private.daily_attempts where completed_at is not null and completed_at<((day+1)::timestamp at time zone 'Europe/Berlin')),
  daily as (select game,day,user_id,score,dense_rank() over(partition by game,day order by score desc) as rank from eligible where day<today),
  weekly as (select game,date_trunc('week',day::timestamp)::date as day,user_id,sum(score) as score from eligible group by 1,2,3),
  ranked_weekly as (select *,dense_rank() over(partition by game,day order by score desc) as rank from weekly where day+7<=today),
  rewards as (select 'day' as period,game,day,rank from daily where user_id=u and rank<=3 and score>0 union all select 'week',game,day,rank from ranked_weekly where user_id=u and rank<=3 and score>0)
  select coalesce(jsonb_agg(to_jsonb(r) order by r.day desc,r.period,r.game),'[]') into awards from (select * from rewards order by day desc limit 100) r;
  return jsonb_build_object('progression',ml_private.player_xp(u),'runs',profile,'rewards',awards,'daily',coalesce((select jsonb_agg(to_jsonb(s)) from (select game,count(*) as completed,max(score) as best_score,sum(answered) as answered from ml_private.daily_attempts where user_id=u and completed_at is not null group by game order by game) s),'[]'));
 elsif p_action='board' then
  d:=coalesce((p_data->>'day')::date,today);g:=coalesce(p_data->>'game','moreless');period:=coalesce(p_data->>'period','day');scope:=coalesce(p_data->>'scope','global');off:=coalesce((p_data->>'offset')::integer,0);
  if d>today or d<date '1900-01-01' or g not in ('moreless','estimate','facts') or period not in ('day','week') or scope not in ('global','friends') or off not between 0 and 100000 then raise exception 'Invalid board';end if;
  startd:=case when period='week' then date_trunc('week',d::timestamp)::date else d end;endd:=startd+case when period='week' then 7 else 1 end;
  with friends as (select u as user_id union select case when sender_id=u then recipient_id else sender_id end from public.ml_friendships where status='accepted' and (sender_id=u or recipient_id=u)),
  totals as (select a.user_id,sum(a.score) as score,max(a.completed_at) as completed_at from ml_private.daily_attempts a where a.game=g and a.day>=startd and a.day<endd and a.completed_at is not null and a.completed_at<((a.day+1)::timestamp at time zone 'Europe/Berlin') and (scope='global' or a.user_id in (select user_id from friends)) group by a.user_id),
  named as (select t.*,coalesce(p.display_name,(select name from ml_private.daily_attempts where user_id=t.user_id and game=g order by day desc limit 1),'Spieler') as name from totals t left join public.ml_profiles p on p.user_id=t.user_id),
  ranked as (select *,dense_rank() over(order by score desc) as rank from named),paged as (select * from ranked order by score desc,completed_at,user_id offset off limit 50)
  select (select count(*) from totals),coalesce(jsonb_agg(jsonb_build_object('name',name,'score',score,'rank',rank,'mine',user_id=u,'frame',coalesce(c.frame,'frame-starter'),'name_color',coalesce(c.name_color,'color-default')) order by score desc,completed_at,user_id),'[]') into total,board from paged left join ml_private.cosmetic_wallet c using(user_id);
  return jsonb_build_object('leaderboard',board,'total',total,'offset',off,'period',period,'scope',scope,'start',startd,'end',endd,'settled',endd<=today);
 else raise exception 'Invalid action';end if;
end $function$
;

