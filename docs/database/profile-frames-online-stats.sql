-- Original avatar art and durable, server-scored multiplayer results.
insert into ml_private.cosmetic_catalog(id,kind,name,price,sort) values
 ('frame-david','frame','Davidstern',80,110),('frame-kippa','frame','Kippa',80,111),
 ('frame-cross','frame','Kreuz',80,112),('frame-thorns','frame','Dornenkrone',100,113),
 ('frame-ufo','frame','UFO-Besuch',120,114),('frame-toast','frame','Toast-Modus',60,115),
 ('frame-potato','frame','Kartoffel-Profi',60,116),('frame-rocket','frame','Raketenstart',140,117),
 ('title-potato','title','Kartoffel mit Ambitionen',40,120),('title-chaos','title','Chaosbeauftragter',80,121),
 ('title-orbit','title','Im falschen Orbit',60,122),('title-guess','title','Professioneller Bauchgefühlspieler',100,123)
on conflict(id) do nothing;
create table ml_private.online_results(
 match_id uuid not null,user_id uuid not null references auth.users(id) on delete cascade,
 game text not null check(game in ('moreless','estimate','facts')),mode text not null,
 score numeric not null,rank integer not null check(rank>0),tied boolean not null,
 players integer not null check(players>=2),finished_at timestamptz not null default clock_timestamp(),
 primary key(match_id,user_id)
);
create index online_results_owner_stats_idx on ml_private.online_results(user_id,game,mode);
alter table ml_private.online_results enable row level security;
revoke all on ml_private.online_results from public,anon,authenticated;
create function ml_private.store_online_result(p_match uuid,p_game text,p_mode text,p_scores jsonb)
returns void language plpgsql security definer set search_path='' as $$
begin
 if jsonb_typeof(p_scores)<>'object' or (select count(*) from jsonb_each(p_scores))<2 then return;end if;
 with scores as(select key::uuid as user_id,(value->>'score')::numeric as score from jsonb_each(p_scores)),
 ranked as(select *,dense_rank() over(order by score desc) as rank,count(*) over(partition by score) as ties,count(*) over() as players from scores)
 insert into ml_private.online_results(match_id,user_id,game,mode,score,rank,tied,players)
 select p_match,user_id,p_game,p_mode,score,rank,ties>1,players from ranked on conflict do nothing;
end $$;
revoke all on function ml_private.store_online_result(uuid,text,text,jsonb) from public,anon,authenticated;
create function ml_private.capture_online_result() returns trigger language plpgsql security definer set search_path='' as $$
declare cfg jsonb;mid uuid;scores jsonb;begin
 if tg_table_name='online_ml_reveals' then
  select config into cfg from public.rooms where id=new.room_id;
  if coalesce(cfg->>'game','moreless')<>'moreless' then return new;end if;
  if new.question_no<coalesce((cfg->>'rounds')::integer,1)*coalesce((cfg->>'questions_per_round')::integer,10) and not coalesce((new.results->>'game_over')::boolean,false) then return new;end if;
  select question_id into mid from public.online_ml_questions where room_id=new.room_id and question_no=new.question_no;
  select jsonb_object_agg(user_id::text,jsonb_build_object('score',score+coalesce(blitz_bonus,0))) into scores from public.players where room_id=new.room_id;
  perform ml_private.store_online_result(mid,'moreless',coalesce(cfg->>'game_mode','CLASSIC'),scores);
 elsif new.phase='finished' and old.phase is distinct from 'finished' then
  if tg_table_name='estimate_matches' then perform ml_private.store_online_result(new.question_id,'estimate',new.mode,new.stats);
  else perform ml_private.store_online_result(new.question_id,'facts','classic',new.scores);end if;
 end if;
 return new;
end $$;
revoke all on function ml_private.capture_online_result() from public,anon,authenticated;
create trigger capture_moreless_result after insert on public.online_ml_reveals for each row execute function ml_private.capture_online_result();
create trigger capture_estimate_result after update of phase on ml_private.estimate_matches for each row execute function ml_private.capture_online_result();
create trigger capture_facts_result after update of phase on ml_private.fact_matches for each row execute function ml_private.capture_online_result();
create function ml_private.online_stats_impl() returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();result jsonb;begin
 if u is null then raise exception 'Authentication required';end if;
 select coalesce(jsonb_agg(to_jsonb(s)),'[]') into result from(
 select game,mode,count(*) as played,count(*) filter(where rank=1 and not tied) as wins,
 count(*) filter(where rank=1 and tied) as draws,count(*) filter(where rank>1) as losses,
 round(100.0*count(*) filter(where rank=1 and not tied)/count(*),1) as win_rate,max(score) as best_score
 from ml_private.online_results where user_id=u group by game,mode order by game,mode) s;
 return result;
end $$;
revoke all on function ml_private.online_stats_impl() from public,anon;
grant execute on function ml_private.online_stats_impl() to authenticated;
create function public.ml_online_stats() returns jsonb language sql security invoker set search_path='' as $$ select ml_private.online_stats_impl() $$;
revoke all on function public.ml_online_stats() from public,anon;
grant execute on function public.ml_online_stats() to authenticated;
