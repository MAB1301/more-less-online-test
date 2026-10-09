-- Private editorial access, configurable private-match rules and masked Jeopardy state.
create table if not exists ml_private.jeopardy_answers(room_id uuid primary key references public.rooms(id) on delete cascade, question_token uuid, answer text);
alter table ml_private.jeopardy_answers enable row level security;
revoke all on ml_private.jeopardy_answers from public,anon,authenticated;
insert into ml_private.jeopardy_answers select room_id,question_token,selected_answer from public.jeopardy_game_state where selected_answer is not null on conflict(room_id) do update set question_token=excluded.question_token,answer=excluded.answer;
update public.jeopardy_game_state set selected_answer=null;
create or replace function ml_private.mask_jeopardy_answer() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.selected_col is null then delete from ml_private.jeopardy_answers where room_id=new.room_id;
 elsif new.selected_answer is not null then insert into ml_private.jeopardy_answers values(new.room_id,new.question_token,new.selected_answer) on conflict(room_id) do update set question_token=excluded.question_token,answer=excluded.answer;
 end if;
 new.selected_answer:=null;return new;
end $$;
revoke all on function ml_private.mask_jeopardy_answer() from public,anon,authenticated;
drop trigger if exists mask_jeopardy_answer on public.jeopardy_game_state;
create trigger mask_jeopardy_answer before insert or update on public.jeopardy_game_state for each row execute function ml_private.mask_jeopardy_answer();
create or replace function ml_private.jeopardy_visible(s public.jeopardy_game_state,u uuid) returns public.jeopardy_game_state language plpgsql security definer set search_path='' as $$
begin
 if u is null or not ml_private.is_room_member(s.room_id,u) then raise exception 'not room member';end if;
 s.selected_answer:=null;
 if ml_private.is_room_host(s.room_id,u) or s.game_status in ('correct','wrong','passed','finished') or (s.used_cells ? (s.selected_col||':'||s.selected_row)) then
  select answer into s.selected_answer from ml_private.jeopardy_answers where room_id=s.room_id and question_token=s.question_token;
 end if;
 return s;
end $$;
revoke all on function ml_private.jeopardy_visible(public.jeopardy_game_state,uuid) from public,anon,authenticated;
create or replace function ml_private.jeopardy_snapshot(p_room uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare s public.jeopardy_game_state;
begin
 if auth.uid() is null or not ml_private.is_room_member(p_room,auth.uid()) then raise exception 'not room member';end if;
 select * into s from public.jeopardy_game_state where room_id=p_room;if not found then return null;end if;
 return to_jsonb(ml_private.jeopardy_visible(s,auth.uid()));
end $$;
revoke all on function ml_private.jeopardy_snapshot(uuid) from public,anon;
grant execute on function ml_private.jeopardy_snapshot(uuid) to authenticated;
create or replace function public.ml_jeopardy_state(p_room uuid) returns jsonb language sql security invoker set search_path='' as $$select ml_private.jeopardy_snapshot(p_room)$$;
revoke all on function public.ml_jeopardy_state(uuid) from public,anon;
grant execute on function public.ml_jeopardy_state(uuid) to authenticated;
CREATE OR REPLACE FUNCTION ml_private.jeopardy_action(p_room uuid, p_action text, p_data jsonb DEFAULT '{}'::jsonb)
 RETURNS jeopardy_game_state
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare s public.jeopardy_game_state; u uuid:=auth.uid(); t integer; delta integer; cell text;
begin
 if u is null or not ml_private.is_room_member(p_room,u) then raise exception 'Kein Mitglied dieser Lobby'; end if;
 if p_action in ('reset','open','judge','board','finish') and not ml_private.is_room_host(p_room,u) then raise exception 'Nur der Host darf das'; end if;
 insert into public.jeopardy_game_state(room_id) values(p_room) on conflict do nothing;
 select * into s from public.jeopardy_game_state where room_id=p_room for update;
 select answer into s.selected_answer from ml_private.jeopardy_answers where room_id=p_room and question_token=s.question_token;
 if p_action='reset' then
  update public.jeopardy_game_state set game_status='board',selected_col=null,selected_row=null,selected_value=null,selected_category=null,selected_question=null,selected_answer=null,buzz_user_id=null,buzz_team=null,submitted_answer=null,passed_teams='[]',answer_history='[]',used_cells='[]',team_1_score=0,team_2_score=0,team_3_score=0,team_4_score=0,team_5_score=0,team_6_score=0 where room_id=p_room;
 elsif p_action='open' then
  cell:=(p_data->>'col')||':'||(p_data->>'row');
  if s.game_status not in ('board','correct','wrong','passed') or s.used_cells ? cell then raise exception 'Frage ist bereits aktiv oder gespielt'; end if;
  if (p_data->>'col')::int not between 0 and 5 or (p_data->>'row')::int not between 0 and 4 or (p_data->>'value')::int not between 100 and 1000 then raise exception 'Ungültiges Feld'; end if;
  update public.jeopardy_game_state set game_status='question',question_token=gen_random_uuid(),selected_col=(p_data->>'col')::int,selected_row=(p_data->>'row')::int,selected_value=(p_data->>'value')::int,selected_category=p_data->>'category',selected_question=p_data->>'question',selected_answer=p_data->>'answer',buzz_user_id=null,buzz_team=null,submitted_answer=null,passed_teams='[]' where room_id=p_room;
 elsif p_action='buzz' then
  t:=(p_data->>'team')::int;
  if (p_data->>'user')::uuid is distinct from u or t not in (1,2) or not exists(select 1 from public.online_team_members where room_id=p_room and user_id=u and team_no=t) then raise exception 'Bitte zuerst deinem Team beitreten'; end if;
  if s.game_status<>'question' or s.passed_teams @> jsonb_build_array(t) then return ml_private.jeopardy_visible(s,u); end if;
  update public.jeopardy_game_state set buzz_user_id=u,buzz_team=t,game_status='buzzed' where room_id=p_room;
 elsif p_action='answer' then
  if s.game_status<>'buzzed' or s.buzz_user_id is distinct from u or s.question_token::text is distinct from p_data->>'token' or s.selected_col<>(p_data->>'col')::int or s.selected_row<>(p_data->>'row')::int then raise exception 'Diese Antwort ist nicht mehr aktiv'; end if;
  if length(btrim(p_data->>'answer')) not between 1 and 500 then raise exception 'Bitte eine Antwort eingeben (maximal 500 Zeichen)'; end if;
  update public.jeopardy_game_state set submitted_answer=btrim(p_data->>'answer'),game_status='submitted' where room_id=p_room;
 elsif p_action='judge' then
  if s.game_status not in ('buzzed','submitted') then return ml_private.jeopardy_visible(s,u); end if;
  delta:=case when (p_data->>'correct')::boolean then s.selected_value else -s.selected_value end;
  cell:=s.selected_col||':'||s.selected_row;
  if s.used_cells ? cell then return ml_private.jeopardy_visible(s,u); end if;
  update public.jeopardy_game_state set team_1_score=team_1_score+case when s.buzz_team=1 then delta else 0 end,team_2_score=team_2_score+case when s.buzz_team=2 then delta else 0 end,used_cells=used_cells||jsonb_build_array(cell),game_status=case when delta>0 then 'correct' else 'wrong' end,answer_history=answer_history||jsonb_build_array(jsonb_build_object('label',s.selected_category||' · '||s.selected_question,'detail','Team '||s.buzz_team||' · Antwort: '||coalesce(s.submitted_answer,'mündlich')||' · Lösung: '||s.selected_answer,'points',delta,'ok',delta>0)) where room_id=p_room;
 elsif p_action='pass' then
  if s.game_status<>'buzzed' or s.buzz_user_id is distinct from u or s.question_token::text is distinct from p_data->>'token' then raise exception 'Du bist nicht am Zug'; end if;
  update public.jeopardy_game_state set passed_teams=passed_teams||jsonb_build_array(s.buzz_team),buzz_team=null,buzz_user_id=null,submitted_answer=null,game_status=case when jsonb_array_length(s.passed_teams)=1 then 'passed' else 'question' end,used_cells=case when jsonb_array_length(s.passed_teams)=1 then used_cells||jsonb_build_array(s.selected_col||':'||s.selected_row) else used_cells end where room_id=p_room;
 elsif p_action='finish' then
  update public.jeopardy_game_state set game_status='finished',buzz_user_id=null,buzz_team=null where room_id=p_room;
 elsif p_action='board' then
  if s.game_status not in ('correct','wrong','passed') then raise exception 'Frage zuerst abschließen'; end if;
  update public.jeopardy_game_state set game_status='board',buzz_user_id=null,buzz_team=null,submitted_answer=null where room_id=p_room;
 elsif p_action<>'init' then raise exception 'Unbekannte Aktion';
 else return ml_private.jeopardy_visible(s,u);
 end if;
 update public.jeopardy_game_state set revision=revision+1,updated_at=now() where room_id=p_room returning * into s;
 return ml_private.jeopardy_visible(s,u);
end $function$

;

create or replace function ml_private.validate_custom_rules(p_rules jsonb) returns jsonb language plpgsql set search_path='' as $$
declare r jsonb:='{"correct_points":1,"wrong_penalty":0,"lives":3,"estimate_tolerance":35,"streak_tolerance":15,"risk_tolerance":10,"jokers":true}'; k text; lo int;hi int;v numeric;
begin
 if p_rules is not null and jsonb_typeof(p_rules)<>'object' then raise exception 'invalid rules';end if;
 r:=r||coalesce(p_rules,'{}');
 for k,lo,hi in select * from (values ('correct_points',1,5),('wrong_penalty',0,5),('lives',1,10),('estimate_tolerance',1,100),('streak_tolerance',1,50),('risk_tolerance',2,50)) t loop
  if jsonb_typeof(r->k)<>'number' then raise exception 'invalid rules';end if;v:=(r->>k)::numeric;
  if v<>trunc(v) or v not between lo and hi then raise exception 'invalid rules';end if;
 end loop;
 if jsonb_typeof(r->'jokers')<>'boolean' then raise exception 'invalid rules';end if;
 return jsonb_build_object('correct_points',r->'correct_points','wrong_penalty',r->'wrong_penalty','lives',r->'lives','estimate_tolerance',r->'estimate_tolerance','streak_tolerance',r->'streak_tolerance','risk_tolerance',r->'risk_tolerance','jokers',r->'jokers');
end $$;
revoke all on function ml_private.validate_custom_rules(jsonb) from public,anon,authenticated;
create or replace function ml_private.set_custom_rules(p_room uuid,p_rules jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.rooms; rules jsonb;
begin
 select * into r from public.rooms where id=p_room for update;
 if auth.uid() is null or not ml_private.is_room_host(p_room,auth.uid()) then raise exception 'host only';end if;
 if r.phase<>'lobby' or exists(select 1 from public.online_ml_questions where room_id=p_room) or exists(select 1 from ml_private.estimate_matches where room_id=p_room and phase<>'finished') then raise exception 'Settings locked after game start';end if;
 if coalesce(r.config->>'game','moreless') not in ('moreless','estimate') then raise exception 'Rules apply to More/Less and estimates';end if;
 rules:=ml_private.validate_custom_rules(p_rules);
 update public.rooms set config=r.config||jsonb_build_object('custom_rules',rules,'joker_enabled',(rules->>'jokers')::boolean),updated_at=now() where id=p_room returning config into rules;
 return rules;
end $$;
revoke all on function ml_private.set_custom_rules(uuid,jsonb) from public,anon;
grant execute on function ml_private.set_custom_rules(uuid,jsonb) to authenticated;
create or replace function public.ml_set_custom_rules(p_room uuid,p_rules jsonb) returns jsonb language sql security invoker set search_path='' as $$select ml_private.set_custom_rules(p_room,p_rules)$$;
revoke all on function public.ml_set_custom_rules(uuid,jsonb) from public,anon;
grant execute on function public.ml_set_custom_rules(uuid,jsonb) to authenticated;
CREATE OR REPLACE FUNCTION ml_private.create_room_impl(p_name text, p_config jsonb)
 RETURNS TABLE(room_id uuid, room_code text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare

  u uuid := auth.uid();

  rid uuid;
  c text;

  n text := btrim(p_name);

  tries integer := 0;

begin

  if u is null then
    raise exception 'Authentication required';
  end if;

  if n is null
     or char_length(n) not between 1 and 24
  then
    raise exception 'Name must be 1..24 characters';
  end if;


  loop

    tries := tries + 1;

    c := ml_private.new_room_code();

    begin

      insert into public.rooms(
        code,
        host_user_id,
        config
      )
      values(
        c,
        u,
        coalesce(p_config,'{}'::jsonb)||jsonb_build_object('custom_rules',ml_private.validate_custom_rules(p_config->'custom_rules'),'joker_enabled',coalesce((ml_private.validate_custom_rules(p_config->'custom_rules')->>'jokers')::boolean,true))
      )
      returning id
      into rid;

      exit;

    exception
      when unique_violation then

        if tries >= 20 then
          raise exception
            'Could not allocate room code';
        end if;

    end;

  end loop;


  insert into public.players(
    room_id,
    user_id,
    display_name,
    seat
  )
  values(
    rid,
    u,
    n,
    1
  );


  return query
  select rid,c;

end;
$function$

;
CREATE OR REPLACE FUNCTION public.ml_online_ml_start(p_room uuid, p_question_no integer, p_category text, p_metric text, p_prompt text, p_unit text, p_left_name text, p_left_icon text, p_left_value numeric, p_right_name text, p_right_icon text, p_right_value numeric, p_timer_seconds integer DEFAULT 45)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
 insert into ml_private.online_mode_players(room_id,user_id,lives) select p_room,user_id,coalesce((cfg->'custom_rules'->>'lives')::int,3) from public.players where room_id=p_room on conflict do nothing;
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
end $function$

;
CREATE OR REPLACE FUNCTION ml_private.online_ml_finalize_impl(p_room uuid, p_question_no integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
  delta:=case when good then case when mode_name='CHAOS' then 1 else coalesce((cfg->'custom_rules'->>'correct_points')::int,1) end else 0 end;bonus:=0;round_bonus:=0;
  if not neutral then
   if q.rule in ('king','streak') then st.streak:=case when good then st.streak+1 else 0 end;delta:=case when good then least(case when q.rule='king' then 5 else 3 end,st.streak) else 0 end;
   elsif q.rule='risk' then delta:=case when good then 1 else -1 end;
   elsif q.rule='rescue' and not good then if st.rescue_round<>rnd then st.rescue_round:=rnd;delta:=0;else delta:=-1;end if;
   elsif q.rule='double' and good then delta:=2;
   elsif q.rule='final' and good and p_question_no%5=0 then delta:=5;
   elsif q.rule='survival' and not good then st.lives:=greatest(0,st.lives-1);end if;
  end if;
  if mode_name<>'CHAOS' then
   if not good and not neutral then delta:=-coalesce((cfg->'custom_rules'->>'wrong_penalty')::int,0);
   elsif good and q.rule='king' then delta:=delta*coalesce((cfg->'custom_rules'->>'correct_points')::int,1);end if;
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
end $function$

;
CREATE OR REPLACE FUNCTION public.ml_estimate_start(p_room uuid, p_mode text, p_questions jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
 select jsonb_object_agg(user_id::text,jsonb_build_object('name',display_name,'score',case when p_mode='risk' then 500 else 0 end,'lives',coalesce((select (config->'custom_rules'->>'lives')::int from public.rooms where id=p_room),3),'streak',0)) into stats from public.players where room_id=p_room;
 insert into ml_private.estimate_matches(room_id,mode,pool,stats,starts_at,deadline) values(p_room,p_mode,p_questions,stats,start_t,case when p_mode='blitz' then start_t+interval '8 seconds' else null end)
 on conflict(room_id) do update set economy_match_id=gen_random_uuid(),mode=excluded.mode,pool=excluded.pool,position=0,question_id=gen_random_uuid(),phase='open',stats=excluded.stats,answers='{}',result=null,starts_at=excluded.starts_at,deadline=excluded.deadline;
 update public.players set score=case when p_mode='risk' then 500 else 0 end,blitz_bonus=0 where room_id=p_room;
 update public.rooms set status='playing',phase='team_estimate',config=config||jsonb_build_object('game','estimate','game_mode',p_mode) where id=p_room;
end $function$

;
CREATE OR REPLACE FUNCTION ml_private.estimate_finalize(p_room uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare m ml_private.estimate_matches;player record;st jsonb;a jsonb;truth numeric;rel numeric;base integer;delta integer;streak integer;lives integer;cur_score integer;bet integer;neutral boolean;timedout boolean;results jsonb:='[]';rules jsonb;
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
 select ml_private.validate_custom_rules(config->'custom_rules') into rules from public.rooms where id=p_room;
 truth:=(m.pool->m.position->>'a')::numeric;
 for player in select p.user_id from public.players p where p.room_id=p_room loop
  st:=m.stats->player.user_id::text;a:=m.answers->player.user_id::text;
  neutral:=coalesce((a->>'neutral')::boolean,false);timedout:=coalesce((a->>'timeout')::boolean,false);
  rel:=case when neutral or timedout then 1 else abs((a->>'guess')::numeric-truth)/greatest(abs(truth),1) end;
  base:=round(100*greatest(0,1-least(rel,1)));delta:=case when neutral or timedout then 0 else base end;
  streak:=(st->>'streak')::int;lives:=(st->>'lives')::int;cur_score:=(st->>'score')::int;
  if not neutral then
   if m.mode='risk' then bet:=least(cur_score,coalesce((a->>'bet')::int,least(10,cur_score)));delta:=case when not timedout and rel<=(rules->>'risk_tolerance')::numeric/100 then bet*(case when rel<=.02 then 2 else 1 end) else -bet end;
   elsif m.mode='king' then streak:=case when not timedout and rel<=(rules->>'streak_tolerance')::numeric/100 then least(5,streak+1) else 0 end;delta:=case when not timedout then base*greatest(1,streak) else 0 end;
   elsif m.mode='survival' and (timedout or rel>(rules->>'estimate_tolerance')::numeric/100) then lives:=greatest(0,lives-1);end if;
  end if;
  st:=st||jsonb_build_object('score',cur_score+delta,'streak',streak,'lives',lives);m.stats:=jsonb_set(m.stats,array[player.user_id::text],st);
  update public.players set score=cur_score+delta where room_id=p_room and user_id=player.user_id;
  results:=results||jsonb_build_array(jsonb_build_object('user_id',player.user_id,'name',st->>'name','guess',a->'guess','points',delta,'score',cur_score+delta,'accuracy',greatest(0,1-least(rel,1)),'lives',lives,'streak',streak,'neutral',neutral,'timeout',timedout,'correct',not neutral and not timedout and rel<=(rules->>'streak_tolerance')::numeric/100));
 end loop;
 update ml_private.estimate_matches set phase='revealed',stats=m.stats,result=jsonb_build_object('truth',truth,'answers',results) where room_id=p_room;
end $function$

;
