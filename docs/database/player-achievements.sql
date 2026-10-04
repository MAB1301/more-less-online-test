-- Apply after player-hub.sql. Does not create tables or change scoring.
-- Daily streaks use distinct Berlin calendar days, across games.
-- Archive completions never advance the streak.
create or replace function ml_private.player_achievements_impl()
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();best integer;current_streak integer;today date:=(clock_timestamp() at time zone 'Europe/Berlin')::date;
begin
 if u is null then raise exception 'Authentication required';end if;
 with days as (
  select distinct day from ml_private.daily_attempts
  where user_id=u and completed_at is not null
   and (completed_at at time zone 'Europe/Berlin')::date=day
   and day<=today
 ), islands as (
  select day,day-(row_number() over(order by day))::integer as island from days
 ), series as (
  select count(*)::integer as length,max(day) as last_day from islands group by island
 )
 select coalesce(max(length),0),coalesce(max(length) filter(where last_day>=today-1),0)
 into best,current_streak from series;
 return jsonb_build_object('daily_best_streak',best,'daily_current_streak',current_streak);
end $$;
revoke all on function ml_private.player_achievements_impl() from public,anon;
grant execute on function ml_private.player_achievements_impl() to authenticated;
create or replace function public.ml_player_achievements()
returns jsonb language sql security invoker set search_path='' as $$
 select ml_private.player_achievements_impl()
$$;
revoke all on function public.ml_player_achievements() from public,anon;
grant execute on function public.ml_player_achievements() to authenticated;
