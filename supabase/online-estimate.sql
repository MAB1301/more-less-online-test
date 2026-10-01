begin;
create table if not exists ml_private.estimate_matches(room_id uuid primary key references public.rooms(id) on delete cascade,mode text not null,pool jsonb not null,position integer not null default 0,question_id uuid not null default gen_random_uuid(),deadline timestamptz,phase text not null default 'open',stats jsonb not null,answers jsonb not null default '{}',result jsonb);
alter table ml_private.estimate_matches enable row level security;
revoke all on ml_private.estimate_matches from public,anon,authenticated;
create or replace function public.ml_estimate_start(p_room uuid,p_mode text,p_questions jsonb) returns void language plpgsql security definer set search_path='' as $$
declare stats jsonb;item jsonb;
begin
 if auth.uid() is null or not ml_private.is_room_host(p_room,auth.uid()) then raise exception 'host only';end if;
 perform 1 from public.rooms where id=p_room for update;
 if exists(select 1 from ml_private.estimate_matches where room_id=p_room and phase<>'finished') then raise exception 'match already running';end if;
 if p_mode not in ('classic','risk','survival','blitz','king') or p_mode is null then raise exception 'invalid mode';end if;
 if jsonb_typeof(p_questions)<>'array' or jsonb_array_length(p_questions) not in (10,15,20) then raise exception 'select 10, 15 or 20 questions';end if;
 for item in select value from jsonb_array_elements(p_questions) loop
  if jsonb_typeof(item->'a')<>'number' or char_length(item->>'q') not between 1 and 500 or item->>'u' is null then raise exception 'invalid question';end if;
 end loop;
 select jsonb_object_agg(user_id::text,jsonb_build_object('name',display_name,'score',case when p_mode='risk' then 500 else 0 end,'lives',3,'streak',0)) into stats from public.players where room_id=p_room;
 insert into ml_private.estimate_matches(room_id,mode,pool,stats,deadline) values(p_room,p_mode,p_questions,stats,case when p_mode='blitz' then clock_timestamp()+interval '8 seconds' else null end)
 on conflict(room_id) do update set mode=excluded.mode,pool=excluded.pool,position=0,question_id=gen_random_uuid(),phase='open',stats=excluded.stats,answers='{}',result=null,deadline=excluded.deadline;
 update public.players set score=case when p_mode='risk' then 500 else 0 end,blitz_bonus=0 where room_id=p_room;
 update public.rooms set status='playing',phase='team_estimate',config=config||jsonb_build_object('game','estimate','game_mode',p_mode) where id=p_room;
end $$;
create or replace function ml_private.estimate_finalize(p_room uuid) returns void language plpgsql security definer set search_path='' as $$
declare m ml_private.estimate_matches;player record;st jsonb;a jsonb;truth numeric;rel numeric;base integer;delta integer;streak integer;lives integer;cur_score integer;bet integer;neutral boolean;timedout boolean;results jsonb:='[]';
begin
 select * into m from ml_private.estimate_matches where room_id=p_room for update;if not found or m.phase<>'open' then return;end if;
 for player in select p.user_id,p.connected,p.last_seen_at from public.players p where p.room_id=p_room loop
  st:=m.stats->player.user_id::text;
  neutral:=m.mode='survival' and (st->>'lives')::int<=0 or m.mode='risk' and (st->>'score')::int<=0 or not player.connected or player.last_seen_at<clock_timestamp()-interval '60 seconds';
  if not m.answers ? player.user_id::text and (neutral or m.deadline is not null and clock_timestamp()>=m.deadline) then m.answers:=m.answers||jsonb_build_object(player.user_id::text,jsonb_build_object('timeout',not neutral,'neutral',neutral));end if;
 end loop;
 update ml_private.estimate_matches set answers=m.answers where room_id=p_room;
 if exists(select 1 from public.players p where p.room_id=p_room and not m.answers ? p.user_id::text) then return;end if;
 truth:=(m.pool->m.position->>'a')::numeric;
 for player in select p.user_id from public.players p where p.room_id=p_room loop
  st:=m.stats->player.user_id::text;a:=m.answers->player.user_id::text;
  neutral:=coalesce((a->>'neutral')::boolean,false);timedout:=coalesce((a->>'timeout')::boolean,false);
  rel:=case when neutral or timedout then 1 else abs((a->>'guess')::numeric-truth)/greatest(abs(truth),1) end;
  base:=round(100*greatest(0,1-least(rel,1)));delta:=case when neutral or timedout then 0 else base end;
  streak:=(st->>'streak')::int;lives:=(st->>'lives')::int;cur_score:=(st->>'score')::int;
  if not neutral then
   if m.mode='risk' then bet:=least(cur_score,coalesce((a->>'bet')::int,least(10,cur_score)));delta:=case when not timedout and rel<=.1 then bet*(case when rel<=.02 then 2 else 1 end) else -bet end;
   elsif m.mode='king' then streak:=case when not timedout and rel<=.15 then least(5,streak+1) else 0 end;delta:=case when not timedout then base*greatest(1,streak) else 0 end;
   elsif m.mode='survival' and (timedout or rel>.35) then lives:=greatest(0,lives-1);end if;
  end if;
  st:=st||jsonb_build_object('score',cur_score+delta,'streak',streak,'lives',lives);m.stats:=jsonb_set(m.stats,array[player.user_id::text],st);
  update public.players set score=cur_score+delta where room_id=p_room and user_id=player.user_id;
  results:=results||jsonb_build_array(jsonb_build_object('user_id',player.user_id,'name',st->>'name','guess',a->'guess','points',delta,'score',cur_score+delta,'accuracy',greatest(0,1-least(rel,1)),'lives',lives,'streak',streak,'neutral',neutral,'timeout',timedout,'correct',not neutral and not timedout and rel<=.15));
 end loop;
 update ml_private.estimate_matches set phase='revealed',stats=m.stats,result=jsonb_build_object('truth',truth,'answers',results) where room_id=p_room;
end $$;
create or replace function public.ml_estimate_state(p_room uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare m ml_private.estimate_matches;x jsonb;all_dead boolean;
begin
 if auth.uid() is null or not ml_private.is_room_member(p_room,auth.uid()) then raise exception 'not room member';end if;
 update public.players set last_seen_at=clock_timestamp(),connected=true where room_id=p_room and user_id=auth.uid();
 perform ml_private.estimate_finalize(p_room);
 select * into m from ml_private.estimate_matches where room_id=p_room;if not found then return jsonb_build_object('waiting',true);end if;
 x:=m.pool->m.position;
 all_dead:=m.mode='survival' and not exists(select 1 from jsonb_each(m.stats) p where (p.value->>'lives')::int>0) or m.mode='risk' and not exists(select 1 from jsonb_each(m.stats) p where (p.value->>'score')::int>0);
 return jsonb_build_object('phase',m.phase,'mode',m.mode,'index',m.position,'total',jsonb_array_length(m.pool),'question_id',m.question_id,'deadline',m.deadline,'question',x-'a','mine',m.answers->auth.uid()::text,'stats',m.stats,'result',case when m.phase in ('revealed','finished') then m.result else null end,'last',m.position+1>=jsonb_array_length(m.pool) or all_dead);
end $$;
create or replace function public.ml_estimate_submit(p_room uuid,p_question_id uuid,p_guess numeric,p_bet integer default null) returns void language plpgsql security definer set search_path='' as $$
declare m ml_private.estimate_matches;st jsonb;
begin
 if auth.uid() is null or not ml_private.is_room_member(p_room,auth.uid()) then raise exception 'not room member';end if;
 select * into m from ml_private.estimate_matches where room_id=p_room for update;
 if not found or m.question_id<>p_question_id or m.phase<>'open' then raise exception 'question expired or replaced';end if;
 if m.answers ? auth.uid()::text then raise exception 'answer already locked';end if;
 if m.deadline is not null and clock_timestamp()>=m.deadline then perform ml_private.estimate_finalize(p_room);return;end if;
 if p_guess is null or abs(p_guess)>1e20 or p_guess::text in ('NaN','Infinity','-Infinity') then raise exception 'enter a finite number';end if;
 st:=m.stats->auth.uid()::text;
 if m.mode='survival' and (st->>'lives')::int<=0 or m.mode='risk' and (st->>'score')::int<=0 then raise exception 'player eliminated';end if;
 if m.mode='risk' and (p_bet is null or p_bet<1 or p_bet>(st->>'score')::int) then raise exception 'invalid bet';end if;
 update ml_private.estimate_matches set answers=answers||jsonb_build_object(auth.uid()::text,jsonb_build_object('guess',p_guess,'bet',p_bet)) where room_id=p_room;
 perform ml_private.estimate_finalize(p_room);
end $$;
create or replace function public.ml_estimate_next(p_room uuid,p_question_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare m ml_private.estimate_matches;dead boolean;
begin
 if auth.uid() is null or not ml_private.is_room_host(p_room,auth.uid()) then raise exception 'host only';end if;
 select * into m from ml_private.estimate_matches where room_id=p_room for update;
 if not found or m.question_id<>p_question_id or m.phase<>'revealed' then raise exception 'wait for all answers';end if;
 dead:=m.mode='survival' and not exists(select 1 from jsonb_each(m.stats) p where (p.value->>'lives')::int>0) or m.mode='risk' and not exists(select 1 from jsonb_each(m.stats) p where (p.value->>'score')::int>0);
 if m.position+1>=jsonb_array_length(m.pool) or dead then
  update ml_private.estimate_matches set phase='finished' where room_id=p_room;update public.rooms set phase='finished' where id=p_room;return;
 end if;
 update ml_private.estimate_matches set position=position+1,question_id=gen_random_uuid(),phase='open',answers='{}',result=null,deadline=case when mode='blitz' then clock_timestamp()+interval '8 seconds' else null end where room_id=p_room;
end $$;
revoke all on function public.ml_estimate_start(uuid,text,jsonb),public.ml_estimate_state(uuid),public.ml_estimate_submit(uuid,uuid,numeric,integer),public.ml_estimate_next(uuid,uuid),ml_private.estimate_finalize(uuid) from public,anon;
grant execute on function public.ml_estimate_start(uuid,text,jsonb),public.ml_estimate_state(uuid),public.ml_estimate_submit(uuid,uuid,numeric,integer),public.ml_estimate_next(uuid,uuid) to authenticated;
commit;
