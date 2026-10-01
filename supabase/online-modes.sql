begin;
alter table ml_private.online_ml_answers drop constraint online_ml_answers_choice_check;
alter table ml_private.online_ml_answers add constraint online_ml_answers_choice_check check(choice in ('a','b','timeout','skip','eliminated','disconnected'));
alter table public.online_ml_questions add column if not exists rule text not null default 'classic';
alter table public.online_ml_questions add column if not exists question_id uuid not null default gen_random_uuid();
alter table public.online_ml_questions alter column left_value drop not null;
alter table ml_private.online_ml_secrets add column if not exists left_value numeric;
create table if not exists ml_private.online_mode_players(room_id uuid references public.rooms(id) on delete cascade,user_id uuid references auth.users(id) on delete cascade,lives integer not null default 3,streak integer not null default 0,rescue_round integer not null default 0,primary key(room_id,user_id));
create table if not exists ml_private.online_joker_uses(room_id uuid references public.rooms(id) on delete cascade,question_no integer,user_id uuid references auth.users(id) on delete cascade,joker text not null,target uuid,hint jsonb,primary key(room_id,question_no,user_id));
alter table ml_private.online_mode_players enable row level security;
alter table ml_private.online_joker_uses enable row level security;
revoke all on ml_private.online_mode_players,ml_private.online_joker_uses from public,anon,authenticated;
create or replace function public.ml_online_mode_state(p_room uuid) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not ml_private.is_room_member(p_room,auth.uid()) then raise exception 'not room member';end if;
 update public.players set last_seen_at=clock_timestamp(),connected=true where room_id=p_room and user_id=auth.uid();
 return (select coalesce(jsonb_agg(jsonb_build_object('user_id',p.user_id,'lives',coalesce(s.lives,3),'streak',coalesce(s.streak,0),'used_jokers',p.used_jokers,'answer',case when p.user_id=auth.uid() then (select jsonb_build_object('question_no',a.question_no,'question_id',q.question_id,'choice',a.choice) from ml_private.online_ml_answers a join public.online_ml_questions q on q.room_id=a.room_id and q.question_no=a.question_no where a.room_id=p_room and a.user_id=auth.uid() order by a.question_no desc limit 1) else null end)),'[]') from public.players p left join ml_private.online_mode_players s on s.room_id=p.room_id and s.user_id=p.user_id where p.room_id=p_room);
end $$;
create or replace function public.ml_online_reset(p_room uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not ml_private.is_room_host(p_room,auth.uid()) then raise exception 'host only';end if;
 perform 1 from public.rooms where id=p_room for update;
 delete from ml_private.estimate_matches where room_id=p_room;
 delete from public.online_ml_reveals where room_id=p_room;
 delete from ml_private.online_ml_answers where room_id=p_room;
 delete from ml_private.online_ml_secrets where room_id=p_room;
 delete from public.online_ml_questions where room_id=p_room;
 delete from ml_private.online_mode_players where room_id=p_room;
 delete from ml_private.online_joker_uses where room_id=p_room;
 update public.players set score=0,blitz_bonus=0,used_jokers='{}',skip_next_turn=false where room_id=p_room;
 update public.rooms set status='lobby',phase='lobby',config=config-'chaos_rules' where id=p_room;
end $$;
create or replace function public.ml_online_ml_start(p_room uuid,p_question_no integer,p_category text,p_metric text,p_prompt text,p_unit text,p_left_name text,p_left_icon text,p_left_value numeric,p_right_name text,p_right_icon text,p_right_value numeric,p_timer_seconds integer default 45) returns void language plpgsql security definer set search_path='' as $$
declare cfg jsonb; seconds integer; rule_name text:='classic'; mode_name text; deck jsonb; rnd integer;
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
 insert into public.online_ml_questions(room_id,question_no,category,metric,prompt,unit,left_name,left_icon,left_value,right_name,right_icon,status,deadline,rule)
 values(p_room,p_question_no,p_category,p_metric,p_prompt,p_unit,p_left_name,p_left_icon,case when rule_name='blind' then null else p_left_value end,p_right_name,p_right_icon,'open',case when seconds is null then null else clock_timestamp()+make_interval(secs=>seconds) end,rule_name);
 insert into ml_private.online_ml_secrets(room_id,question_no,right_value,correct_side,left_value)
 values(p_room,p_question_no,p_right_value,case when rule_name='reverse' then case when p_left_value<p_right_value then 'a' else 'b' end else case when p_left_value>p_right_value then 'a' else 'b' end end,p_left_value);
 if p_question_no<900 then
  insert into ml_private.online_ml_answers(room_id,question_no,user_id,choice,submitted_at)
  select p_room,p_question_no,p.user_id,case when s.lives<=0 and mode_name='SURVIVAL' then 'eliminated' else 'skip' end,clock_timestamp() from public.players p join ml_private.online_mode_players s on s.room_id=p.room_id and s.user_id=p.user_id where p.room_id=p_room and (p.skip_next_turn or mode_name='SURVIVAL' and s.lives<=0);
  update public.players set skip_next_turn=false where room_id=p_room;
 end if;
 update public.rooms set status='playing',phase='moreless' where id=p_room;
end $$;
create or replace function ml_private.online_ml_finalize_impl(p_room uuid,p_question_no integer) returns jsonb language plpgsql security definer set search_path='' as $$
declare q public.online_ml_questions;cfg jsonb;secret ml_private.online_ml_secrets;mode_name text;timed boolean;seconds integer;results jsonb;rec record;st ml_private.online_mode_players;j ml_private.online_joker_uses;good boolean;delta integer;bonus numeric;neutral boolean;rnd integer;round_bonus integer;dead boolean;
begin
 if auth.uid() is null or not ml_private.is_room_member(p_room,auth.uid()) then raise exception 'not room member';end if;
 select * into q from public.online_ml_questions where room_id=p_room and question_no=p_question_no for update;
 if not found then raise exception 'question not found';end if;
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
create or replace function ml_private.online_joker_impl(p_room uuid,p_question_no integer,p_joker text,p_target uuid default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare q public.online_ml_questions;secret ml_private.online_ml_secrets;p public.players;cfg jsonb;cached ml_private.online_joker_uses;payload jsonb;v numeric;
begin
 if auth.uid() is null or not ml_private.is_room_member(p_room,auth.uid()) then raise exception 'not room member';end if;
 select * into q from public.online_ml_questions where room_id=p_room and question_no=p_question_no for update;
 if not found then raise exception 'question not found';end if;
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
create or replace function public.ml_online_joker(p_room uuid,p_question_no integer,p_joker text,p_target uuid default null) returns jsonb language sql security invoker set search_path='' as $$select ml_private.online_joker_impl(p_room,p_question_no,p_joker,p_target)$$;
create or replace function public.ml_online_answer_v2(p_room uuid,p_question_no integer,p_choice text,p_question_id uuid,p_joker text default null,p_target uuid default null) returns void language plpgsql security definer set search_path='' as $$
declare q public.online_ml_questions;cfg jsonb;received timestamptz:=clock_timestamp();j ml_private.online_joker_uses;
begin
 if auth.uid() is null or not ml_private.is_room_member(p_room,auth.uid()) then raise exception 'not room member';end if;
 select * into q from public.online_ml_questions where room_id=p_room and question_no=p_question_no for update;
 if q.question_id is distinct from p_question_id or q.status<>'open' then raise exception 'question expired or replaced';end if;
 if p_choice is null or p_choice not in ('a','b') then raise exception 'invalid choice';end if;
 select config into cfg from public.rooms where id=p_room;
 if q.deadline is not null and received>=q.deadline and (upper(coalesce(cfg->>'game_mode','CLASSIC'))='BLITZ' or q.rule='blitz' or coalesce((cfg->>'timer_enabled')::boolean,false)) then perform ml_private.online_ml_finalize_impl(p_room,p_question_no);return;end if;
 if exists(select 1 from ml_private.online_ml_answers where room_id=p_room and question_no=p_question_no and user_id=auth.uid()) then raise exception 'answer already locked';end if;
 if p_joker is not null then perform ml_private.online_joker_impl(p_room,p_question_no,p_joker,p_target);end if;
 select * into j from ml_private.online_joker_uses where room_id=p_room and question_no=p_question_no and user_id=auth.uid();
 insert into ml_private.online_ml_answers(room_id,question_no,user_id,choice,submitted_at) values(p_room,p_question_no,auth.uid(),case when j.joker='pass' then 'skip' else p_choice end,received);
 perform ml_private.online_ml_finalize_impl(p_room,p_question_no);
end $$;
create or replace function ml_private.online_ml_timeout_impl(p_room uuid,p_question_no integer) returns jsonb language plpgsql security definer set search_path='' as $$
declare q public.online_ml_questions;
begin
 if auth.uid() is null or not ml_private.is_room_member(p_room,auth.uid()) then raise exception 'not room member';end if;
 select * into q from public.online_ml_questions where room_id=p_room and question_no=p_question_no for update;
 if q.deadline is null then return ml_private.online_ml_finalize_impl(p_room,p_question_no);end if;
 if clock_timestamp()<q.deadline then return jsonb_build_object('waiting',true);end if;
 return ml_private.online_ml_finalize_impl(p_room,p_question_no);
end $$;
create or replace function ml_private.online_ml_submit_impl(p_room uuid,p_question_no integer,p_choice text) returns void language plpgsql security definer set search_path='' as $$
declare qid uuid;
begin
 if auth.uid() is null or not ml_private.is_room_member(p_room,auth.uid()) then raise exception 'not room member';end if;
 select question_id into qid from public.online_ml_questions where room_id=p_room and question_no=p_question_no;
 perform public.ml_online_answer_v2(p_room,p_question_no,p_choice,qid);
end $$;
create or replace function ml_private.join_room_impl(p_code text,p_name text) returns table(room_id uuid,seat integer) language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();rid uuid;s integer;n text:=btrim(p_name);room_status text;
begin
 if u is null then raise exception 'Authentication required';end if;
 if n is null or char_length(n) not between 1 and 24 then raise exception 'Name must be 1..24 characters';end if;
 select r.id,r.status into rid,room_status from public.rooms r where r.code=upper(btrim(p_code)) for update;
 if rid is null then raise exception 'Room not found';end if;
 select p.seat into s from public.players p where p.room_id=rid and p.user_id=u;
 if s is not null then
  update public.players p set connected=true,last_seen_at=clock_timestamp(),display_name=n where p.room_id=rid and p.user_id=u;
  return query select rid,s;return;
 end if;
 if room_status<>'lobby' then raise exception 'Room already started';end if;
 select coalesce(max(p.seat),0)+1 into s from public.players p where p.room_id=rid;
 if s>32 or (select count(*) from public.players p where p.room_id=rid)>=coalesce((select (r.config->>'max_players')::int from public.rooms r where r.id=rid),32) then raise exception 'Room is full';end if;
 insert into public.players(room_id,user_id,display_name,seat) values(rid,u,n,s);return query select rid,s;
end $$;
revoke all on function public.ml_online_mode_state(uuid),public.ml_online_reset(uuid),public.ml_online_joker(uuid,integer,text,uuid),public.ml_online_answer_v2(uuid,integer,text,uuid,text,uuid),ml_private.online_joker_impl(uuid,integer,text,uuid) from public,anon;
grant execute on function public.ml_online_mode_state(uuid),public.ml_online_reset(uuid),public.ml_online_joker(uuid,integer,text,uuid),public.ml_online_answer_v2(uuid,integer,text,uuid,text,uuid),ml_private.online_joker_impl(uuid,integer,text,uuid) to authenticated;
commit;
