begin;
alter table public.online_ml_questions add column if not exists starts_at timestamptz not null default clock_timestamp();
alter table ml_private.estimate_matches add column if not exists starts_at timestamptz not null default clock_timestamp();
create or replace function public.ml_online_ml_start(p_room uuid,p_question_no integer,p_category text,p_metric text,p_prompt text,p_unit text,p_left_name text,p_left_icon text,p_left_value numeric,p_right_name text,p_right_icon text,p_right_value numeric,p_timer_seconds integer default 45) returns void language plpgsql security definer set search_path='' as $$
declare cfg jsonb; seconds integer; rule_name text:='classic'; mode_name text; deck jsonb; rnd integer;start_time timestamptz;
begin
 if auth.uid() is null or not ml_private.is_room_host(p_room,auth.uid()) then raise exception 'host only';end if;
 select config into cfg from public.rooms where id=p_room for update;
 if p_question_no<900 and (p_left_value is null or p_right_value is null or p_left_value=p_right_value) then raise exception 'values must differ';end if;
 if p_question_no<900 and (p_question_no<1 or p_question_no>coalesce((cfg->>'rounds')::int,2)*coalesce((cfg->>'questions_per_round')::int,5)) then raise exception 'question outside configured rounds';end if;
 if exists(select 1 from public.online_ml_questions where room_id=p_room and status='open' and metric not in ('ESTIMATE_START','JEOPARDY_START')) then raise exception 'finish current question first';end if;
 if exists(select 1 from public.online_ml_questions where room_id=p_room and question_no=p_question_no) then raise exception 'question already exists; reset match first';end if;
 mode_name:=upper(coalesce(cfg->>'game_mode','CLASSIC'));rnd:=(p_question_no-1)/5+1;
 if mode_name='CHAOS' and p_question_no<900 then
  if not cfg ? 'chaos_rules' then
   select jsonb_agg(x order by random()) into deck from unnest(array['double','risk','blitz','reverse','streak','final','blind','rescue']) x;
   cfg:=cfg||jsonb_build_object('chaos_rules',deck);update public.rooms set config=cfg where id=p_room;
  end if;
  rule_name:=cfg->'chaos_rules'->>((rnd-1)%8);
 elsif mode_name='KING' then rule_name:='king';elsif mode_name='SURVIVAL' then rule_name:='survival';elsif mode_name='BLITZ' then rule_name:='blitz';end if;
 seconds:=case when cfg ? 'timer_enabled' then case when (cfg->>'timer_enabled')::boolean then (cfg->>'timer_seconds')::int else null end else greatest(coalesce(p_timer_seconds,45),1) end;
 if mode_name='BLITZ' then seconds:=greatest(5,least(15,coalesce((cfg->>'blitz_seconds')::int,p_timer_seconds,8)));elsif rule_name='blitz' then seconds:=8;end if;
 insert into ml_private.online_mode_players(room_id,user_id) select p_room,user_id from public.players where room_id=p_room on conflict do nothing;
 start_time:=clock_timestamp()+case when coalesce((cfg->>'rule_previews')::boolean,false) and p_question_no<900 and (p_question_no=1 or mode_name='CHAOS' and p_question_no%5=1) then interval '5 seconds' else interval '0 seconds' end;
 insert into public.online_ml_questions(starts_at,room_id,question_no,category,metric,prompt,unit,left_name,left_icon,left_value,right_name,right_icon,status,deadline,rule)
 values(start_time,p_room,p_question_no,p_category,p_metric,p_prompt,p_unit,p_left_name,p_left_icon,case when rule_name='blind' then null else p_left_value end,p_right_name,p_right_icon,'open',case when seconds is null then null else start_time+make_interval(secs=>seconds) end,rule_name);
 insert into ml_private.online_ml_secrets(room_id,question_no,right_value,correct_side,left_value)
 values(p_room,p_question_no,p_right_value,case when rule_name='reverse' then case when p_left_value<p_right_value then 'a' else 'b' end else case when p_left_value>p_right_value then 'a' else 'b' end end,p_left_value);
 if p_question_no<900 then
  insert into ml_private.online_ml_answers(room_id,question_no,user_id,choice,submitted_at)
  select p_room,p_question_no,p.user_id,case when s.lives<=0 and mode_name='SURVIVAL' then 'eliminated' else 'skip' end,clock_timestamp() from public.players p join ml_private.online_mode_players s on s.room_id=p.room_id and s.user_id=p.user_id where p.room_id=p_room and (p.skip_next_turn or mode_name='SURVIVAL' and s.lives<=0);
  update public.players set skip_next_turn=false where room_id=p_room;
 end if;
 update public.rooms set status='playing',phase='moreless' where id=p_room;
end $$;
create or replace function public.ml_online_answer_v2(p_room uuid,p_question_no integer,p_choice text,p_question_id uuid,p_joker text default null,p_target uuid default null) returns void language plpgsql security definer set search_path='' as $$
declare q public.online_ml_questions;cfg jsonb;received timestamptz:=clock_timestamp();j ml_private.online_joker_uses;
begin
 if auth.uid() is null or not ml_private.is_room_member(p_room,auth.uid()) then raise exception 'not room member';end if;
 select * into q from public.online_ml_questions where room_id=p_room and question_no=p_question_no for update;
 if q.question_id is distinct from p_question_id or q.status<>'open' then raise exception 'question expired or replaced';end if;
 if received<q.starts_at then raise exception 'rule preview still running';end if;
 if p_choice is null or p_choice not in ('a','b') then raise exception 'invalid choice';end if;
 select config into cfg from public.rooms where id=p_room;
 if q.deadline is not null and received>=q.deadline and (upper(coalesce(cfg->>'game_mode','CLASSIC'))='BLITZ' or q.rule='blitz' or coalesce((cfg->>'timer_enabled')::boolean,false)) then perform ml_private.online_ml_finalize_impl(p_room,p_question_no);return;end if;
 if exists(select 1 from ml_private.online_ml_answers where room_id=p_room and question_no=p_question_no and user_id=auth.uid()) then raise exception 'answer already locked';end if;
 if p_joker is not null then perform ml_private.online_joker_impl(p_room,p_question_no,p_joker,p_target);end if;
 select * into j from ml_private.online_joker_uses where room_id=p_room and question_no=p_question_no and user_id=auth.uid();
 insert into ml_private.online_ml_answers(room_id,question_no,user_id,choice,submitted_at) values(p_room,p_question_no,auth.uid(),case when j.joker='pass' then 'skip' else p_choice end,received);
 perform ml_private.online_ml_finalize_impl(p_room,p_question_no);
end $$;
create or replace function ml_private.online_joker_impl(p_room uuid,p_question_no integer,p_joker text,p_target uuid default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare q public.online_ml_questions;secret ml_private.online_ml_secrets;p public.players;cfg jsonb;cached ml_private.online_joker_uses;payload jsonb;v numeric;
begin
 if auth.uid() is null or not ml_private.is_room_member(p_room,auth.uid()) then raise exception 'not room member';end if;
 select * into q from public.online_ml_questions where room_id=p_room and question_no=p_question_no for update;
 if not found then raise exception 'question not found';end if;
 if clock_timestamp()<q.starts_at then raise exception 'rule preview still running';end if;
 if q.status<>'open' or q.metric in ('JEOPARDY_START','ESTIMATE_START') or (q.deadline is not null and clock_timestamp()>=q.deadline) then raise exception 'question not accepting jokers';end if;
 select * into p from public.players where room_id=p_room and user_id=auth.uid() for update;select config into cfg from public.rooms where id=p_room;
 if not coalesce((cfg->>'joker_enabled')::boolean,true) then raise exception 'jokers disabled';end if;
 if exists(select 1 from ml_private.online_ml_answers where room_id=p_room and question_no=p_question_no and user_id=auth.uid()) then raise exception 'answer already locked';end if;
 select * into cached from ml_private.online_joker_uses where room_id=p_room and question_no=p_question_no and user_id=auth.uid();
 if found then if cached.joker=p_joker then return cached.hint;else raise exception 'one joker per question';end if;end if;
 if p_joker not in ('four','answer','double','pass','skip') or p_joker is null then raise exception 'invalid joker';end if;
 if p_joker=any(coalesce(p.used_jokers,'{}')) then raise exception 'joker already used';end if;
 select * into secret from ml_private.online_ml_secrets where room_id=p_room and question_no=p_question_no;
 payload:=jsonb_build_object('joker',p_joker);
 if p_joker='answer' then payload:=payload||jsonb_build_object('correct_side',secret.correct_side);
 elsif p_joker='four' then v:=secret.right_value;payload:=payload||jsonb_build_object('values',(select jsonb_agg(x order by random()) from unnest(array[v,v+greatest(abs(v)*0.2,1),v-greatest(abs(v)*0.2,1),v+greatest(abs(v)*0.5,3)]) x));
 elsif p_joker='skip' then
  if p_target is null or p_target=auth.uid() or not exists(select 1 from public.players where room_id=p_room and user_id=p_target and connected) then raise exception 'select another player';end if;
  update public.players set skip_next_turn=true where room_id=p_room and user_id=p_target;
 end if;
 insert into ml_private.online_joker_uses(room_id,question_no,user_id,joker,target,hint) values(p_room,p_question_no,auth.uid(),p_joker,p_target,payload);
 update public.players set used_jokers=array_append(coalesce(used_jokers,'{}'),p_joker) where room_id=p_room and user_id=auth.uid();return payload;
end $$;
create or replace function ml_private.online_ml_finalize_impl(p_room uuid,p_question_no integer) returns jsonb language plpgsql security definer set search_path='' as $$
declare q public.online_ml_questions;cfg jsonb;secret ml_private.online_ml_secrets;mode_name text;timed boolean;seconds integer;results jsonb;rec record;st ml_private.online_mode_players;j ml_private.online_joker_uses;good boolean;delta integer;bonus numeric;neutral boolean;rnd integer;round_bonus integer;dead boolean;
begin
 if auth.uid() is null or not ml_private.is_room_member(p_room,auth.uid()) then raise exception 'not room member';end if;
 select * into q from public.online_ml_questions where room_id=p_room and question_no=p_question_no for update;
 if not found then raise exception 'question not found';end if;
 if clock_timestamp()<q.starts_at then return jsonb_build_object('waiting',true);end if;
 if q.status='revealed' then return(select r.results from public.online_ml_reveals r where r.room_id=p_room and r.question_no=p_question_no);end if;
 if q.metric in ('JEOPARDY_START','ESTIMATE_START') then raise exception 'not a comparison question';end if;
 select config into cfg from public.rooms where id=p_room;mode_name:=upper(coalesce(cfg->>'game_mode','CLASSIC'));rnd:=(p_question_no-1)/5+1;timed:=q.deadline is not null and (mode_name='BLITZ' or q.rule='blitz' or coalesce((cfg->>'timer_enabled')::boolean,false));seconds:=greatest(5,least(15,coalesce((cfg->>'blitz_seconds')::int,(cfg->>'timer_seconds')::int,8)));
 insert into ml_private.online_ml_answers(room_id,question_no,user_id,choice,submitted_at)
 select p_room,p_question_no,p.user_id,case when not p.connected or p.last_seen_at<clock_timestamp()-interval '60 seconds' then 'disconnected' else 'timeout' end,clock_timestamp() from public.players p where p.room_id=p_room and ((timed and clock_timestamp()>=q.deadline) or not p.connected or p.last_seen_at<clock_timestamp()-interval '60 seconds') on conflict do nothing;
 if exists(select 1 from public.players p where p.room_id=p_room and not exists(select 1 from ml_private.online_ml_answers a where a.room_id=p_room and a.question_no=p_question_no and a.user_id=p.user_id)) then return jsonb_build_object('waiting',true);end if;
 insert into ml_private.online_mode_players(room_id,user_id) select p_room,user_id from public.players where room_id=p_room on conflict do nothing;
 select * into secret from ml_private.online_ml_secrets where room_id=p_room and question_no=p_question_no;if not found then raise exception 'question secret missing';end if;
 results:=jsonb_build_object('left_value',coalesce(secret.left_value,q.left_value),'right_value',secret.right_value,'unit',q.unit,'correct_name',case when secret.correct_side='a' then q.left_name else q.right_name end,'correct_side',secret.correct_side,'rule',q.rule,'answers','[]'::jsonb);
 for rec in select a.*,p.display_name from ml_private.online_ml_answers a join public.players p on p.room_id=a.room_id and p.user_id=a.user_id where a.room_id=p_room and a.question_no=p_question_no loop
  select * into st from ml_private.online_mode_players where room_id=p_room and user_id=rec.user_id for update;
  select * into j from ml_private.online_joker_uses where room_id=p_room and question_no=p_question_no and user_id=rec.user_id;
  neutral:=rec.choice in ('skip','eliminated','disconnected') or coalesce(j.joker='pass',false);
  good:=not neutral and (rec.choice=secret.correct_side or coalesce(j.joker='answer',false)) and (not timed or rec.submitted_at<q.deadline);
  delta:=case when good then 1 else 0 end;bonus:=0;round_bonus:=0;
  if not neutral then
   if q.rule in ('king','streak') then st.streak:=case when good then st.streak+1 else 0 end;delta:=case when good then least(case when q.rule='king' then 5 else 3 end,st.streak) else 0 end;
   elsif q.rule='risk' then delta:=case when good then 1 else -1 end;
   elsif q.rule='rescue' and not good then if st.rescue_round<>rnd then st.rescue_round:=rnd;delta:=0;else delta:=-1;end if;
   elsif q.rule='double' and good then delta:=2;
   elsif q.rule='final' and good and p_question_no%5=0 then delta:=5;
   elsif q.rule='survival' and not good then st.lives:=greatest(0,st.lives-1);end if;
  end if;
  if j.joker='double' and good then delta:=delta*2;end if;
  if mode_name='BLITZ' and good and rec.submitted_at<=q.deadline-make_interval(secs=>seconds/2.0) then bonus:=0.5;end if;
  if mode_name='CHAOS' and p_question_no%5=0 and good and (select count(*) from public.online_ml_reveals old cross join lateral jsonb_array_elements(old.results->'answers') ans where old.room_id=p_room and old.question_no between p_question_no-4 and p_question_no-1 and ans->>'user_id'=rec.user_id::text and (ans->>'correct')::boolean)=4 then round_bonus:=1;end if;
  update ml_private.online_mode_players set lives=st.lives,streak=st.streak,rescue_round=st.rescue_round where room_id=p_room and user_id=rec.user_id;
  update public.players set score=coalesce(score,0)+delta+round_bonus,blitz_bonus=coalesce(blitz_bonus,0)+bonus where room_id=p_room and user_id=rec.user_id;
  results:=jsonb_set(results,'{answers}',results->'answers'||jsonb_build_array(jsonb_build_object('user_id',rec.user_id,'name',rec.display_name,'choice',rec.choice,'correct',good,'points',delta+bonus+round_bonus,'round_bonus',round_bonus,'lives',st.lives,'streak',st.streak,'joker',j.joker,'neutral',neutral)));
 end loop;
 dead:=mode_name='SURVIVAL' and not exists(select 1 from ml_private.online_mode_players s join public.players p on p.room_id=s.room_id and p.user_id=s.user_id where s.room_id=p_room and s.lives>0 and p.connected);
 results:=results||jsonb_build_object('game_over',dead);
 insert into public.online_ml_reveals(room_id,question_no,results) values(p_room,p_question_no,results);
 update public.online_ml_questions set status='revealed' where room_id=p_room and question_no=p_question_no;update public.rooms set phase='reveal' where id=p_room;return results;
end $$;
create or replace function public.ml_estimate_start(p_room uuid,p_mode text,p_questions jsonb) returns void language plpgsql security definer set search_path='' as $$
declare stats jsonb;item jsonb;start_t timestamptz;
begin
 if auth.uid() is null or not ml_private.is_room_host(p_room,auth.uid()) then raise exception 'host only';end if;
 perform 1 from public.rooms where id=p_room for update;
 start_t:=clock_timestamp()+case when coalesce((select (config->>'rule_previews')::boolean from public.rooms where id=p_room),false) then interval '5 seconds' else interval '0 seconds' end;
 if exists(select 1 from ml_private.estimate_matches where room_id=p_room and phase<>'finished') then raise exception 'match already running';end if;
 if p_mode not in ('classic','risk','survival','blitz','king') or p_mode is null then raise exception 'invalid mode';end if;
 if jsonb_typeof(p_questions)<>'array' or jsonb_array_length(p_questions) not in (10,15,20) then raise exception 'select 10, 15 or 20 questions';end if;
 for item in select value from jsonb_array_elements(p_questions) loop
  if jsonb_typeof(item->'a')<>'number' or char_length(item->>'q') not between 1 and 500 or item->>'u' is null then raise exception 'invalid question';end if;
 end loop;
 select jsonb_object_agg(user_id::text,jsonb_build_object('name',display_name,'score',case when p_mode='risk' then 500 else 0 end,'lives',3,'streak',0)) into stats from public.players where room_id=p_room;
 insert into ml_private.estimate_matches(room_id,mode,pool,stats,starts_at,deadline) values(p_room,p_mode,p_questions,stats,start_t,case when p_mode='blitz' then start_t+interval '8 seconds' else null end)
 on conflict(room_id) do update set mode=excluded.mode,pool=excluded.pool,position=0,question_id=gen_random_uuid(),phase='open',stats=excluded.stats,answers='{}',result=null,starts_at=excluded.starts_at,deadline=excluded.deadline;
 update public.players set score=case when p_mode='risk' then 500 else 0 end,blitz_bonus=0 where room_id=p_room;
 update public.rooms set status='playing',phase='team_estimate',config=config||jsonb_build_object('game','estimate','game_mode',p_mode) where id=p_room;
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
 return jsonb_build_object('phase',m.phase,'mode',m.mode,'index',m.position,'total',jsonb_array_length(m.pool),'question_id',m.question_id,'starts_at',m.starts_at,'deadline',m.deadline,'question',x-'a','mine',m.answers->auth.uid()::text,'stats',m.stats,'result',case when m.phase in ('revealed','finished') then m.result else null end,'last',m.position+1>=jsonb_array_length(m.pool) or all_dead);
end $$;
create or replace function public.ml_estimate_submit(p_room uuid,p_question_id uuid,p_guess numeric,p_bet integer default null) returns void language plpgsql security definer set search_path='' as $$
declare m ml_private.estimate_matches;st jsonb;
begin
 if auth.uid() is null or not ml_private.is_room_member(p_room,auth.uid()) then raise exception 'not room member';end if;
 select * into m from ml_private.estimate_matches where room_id=p_room for update;
 if not found or m.question_id<>p_question_id or m.phase<>'open' then raise exception 'question expired or replaced';end if;
 if clock_timestamp()<m.starts_at then raise exception 'rule preview still running';end if;
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
 update ml_private.estimate_matches set starts_at=clock_timestamp(),position=position+1,question_id=gen_random_uuid(),phase='open',answers='{}',result=null,deadline=case when mode='blitz' then clock_timestamp()+interval '8 seconds' else null end where room_id=p_room;
end $$;
create or replace function ml_private.estimate_finalize(p_room uuid) returns void language plpgsql security definer set search_path='' as $$
declare m ml_private.estimate_matches;player record;st jsonb;a jsonb;truth numeric;rel numeric;base integer;delta integer;streak integer;lives integer;cur_score integer;bet integer;neutral boolean;timedout boolean;results jsonb:='[]';
begin
 select * into m from ml_private.estimate_matches where room_id=p_room for update;if not found or m.phase<>'open' then return;end if;
 if clock_timestamp()<m.starts_at then return;end if;
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
create or replace function ml_private.match_waiting_impl(p_room uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare game text;q public.online_ml_questions;m ml_private.estimate_matches;players jsonb;qid uuid;active boolean;
begin
 if auth.uid() is null or not ml_private.is_room_member(p_room,auth.uid()) then raise exception 'not room member';end if;
 select config->>'game' into game from public.rooms where id=p_room;
 if game='estimate' then
  select * into m from ml_private.estimate_matches where room_id=p_room;if not found then return jsonb_build_object('active',false);end if;
  qid:=m.question_id;active:=m.phase='open' and clock_timestamp()>=m.starts_at;
  select coalesce(jsonb_agg(jsonb_build_object('user_id',p.user_id,'name',p.display_name,'answered',m.answers ? p.user_id::text,'connected',p.connected and p.last_seen_at>=clock_timestamp()-interval '60 seconds') order by p.seat),'[]') into players from public.players p where p.room_id=p_room;
 else
  select * into q from public.online_ml_questions where room_id=p_room and question_no<900 order by question_no desc limit 1;if not found then return jsonb_build_object('active',false);end if;
  qid:=q.question_id;active:=q.status='open' and clock_timestamp()>=q.starts_at;
  select coalesce(jsonb_agg(jsonb_build_object('user_id',p.user_id,'name',p.display_name,'answered',exists(select 1 from ml_private.online_ml_answers a where a.room_id=p_room and a.question_no=q.question_no and a.user_id=p.user_id),'connected',p.connected and p.last_seen_at>=clock_timestamp()-interval '60 seconds') order by p.seat),'[]') into players from public.players p where p.room_id=p_room;
 end if;
 return jsonb_build_object('question_id',qid,'active',active,'players',players);
end $$;
create or replace function public.ml_match_waiting(p_room uuid) returns jsonb language sql security invoker set search_path='' as $$select ml_private.match_waiting_impl(p_room)$$;
revoke all on function ml_private.match_waiting_impl(uuid),public.ml_match_waiting(uuid) from public,anon;
grant execute on function ml_private.match_waiting_impl(uuid),public.ml_match_waiting(uuid) to authenticated;
commit;
