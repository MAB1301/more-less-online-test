-- Shared Jeopardy answers and authoritative estimation rounds.
-- Public RPC wrappers use the existing private room-membership boundary.
alter table public.jeopardy_game_state add column if not exists submitted_answer text;
alter table public.jeopardy_game_state add column if not exists question_token uuid not null default gen_random_uuid();
alter table public.jeopardy_game_state add column if not exists answer_history jsonb not null default '[]';
alter table public.jeopardy_game_state add column if not exists passed_teams jsonb not null default '[]';
drop policy if exists "jeopardy read" on public.jeopardy_game_state;
create policy jeopardy_members_read on public.jeopardy_game_state for select to authenticated
 using (auth.uid() is not null and ml_private.is_room_member(room_id,auth.uid()));
revoke all on public.jeopardy_game_state from anon,authenticated;
grant select on public.jeopardy_game_state to authenticated;

create or replace function ml_private.jeopardy_action(p_room uuid,p_action text,p_data jsonb default '{}')
returns public.jeopardy_game_state language plpgsql security definer set search_path='' as $$
declare s public.jeopardy_game_state; u uuid:=auth.uid(); t integer; delta integer; cell text;
begin
 if u is null or not ml_private.is_room_member(p_room,u) then raise exception 'Kein Mitglied dieser Lobby'; end if;
 if p_action in ('reset','open','judge','board','finish') and not ml_private.is_room_host(p_room,u) then raise exception 'Nur der Host darf das'; end if;
 insert into public.jeopardy_game_state(room_id) values(p_room) on conflict do nothing;
 select * into s from public.jeopardy_game_state where room_id=p_room for update;
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
  if s.game_status<>'question' or s.passed_teams @> jsonb_build_array(t) then return s; end if;
  update public.jeopardy_game_state set buzz_user_id=u,buzz_team=t,game_status='buzzed' where room_id=p_room;
 elsif p_action='answer' then
  if s.game_status<>'buzzed' or s.buzz_user_id is distinct from u or s.question_token::text is distinct from p_data->>'token' or s.selected_col<>(p_data->>'col')::int or s.selected_row<>(p_data->>'row')::int then raise exception 'Diese Antwort ist nicht mehr aktiv'; end if;
  if length(btrim(p_data->>'answer')) not between 1 and 500 then raise exception 'Bitte eine Antwort eingeben (maximal 500 Zeichen)'; end if;
  update public.jeopardy_game_state set submitted_answer=btrim(p_data->>'answer'),game_status='submitted' where room_id=p_room;
 elsif p_action='judge' then
  if s.game_status not in ('buzzed','submitted') then return s; end if;
  delta:=case when (p_data->>'correct')::boolean then s.selected_value else -s.selected_value end;
  cell:=s.selected_col||':'||s.selected_row;
  if s.used_cells ? cell then return s; end if;
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
 else return s;
 end if;
 update public.jeopardy_game_state set revision=revision+1,updated_at=now() where room_id=p_room returning * into s;
 return s;
end $$;
revoke all on function ml_private.jeopardy_action(uuid,text,jsonb) from public,anon;
grant execute on function ml_private.jeopardy_action(uuid,text,jsonb) to authenticated;
create or replace function public.jeopardy_init(p_room_id uuid) returns public.jeopardy_game_state language sql security invoker set search_path='' as $$select ml_private.jeopardy_action(p_room_id,'init')$$;
create or replace function public.jeopardy_reset(p_room_id uuid) returns public.jeopardy_game_state language sql security invoker set search_path='' as $$select ml_private.jeopardy_action(p_room_id,'reset')$$;
create or replace function public.jeopardy_back_to_board(p_room_id uuid) returns public.jeopardy_game_state language sql security invoker set search_path='' as $$select ml_private.jeopardy_action(p_room_id,'board')$$;
create or replace function public.jeopardy_open_question(p_room_id uuid,p_col int,p_row int,p_value int,p_category text,p_question text,p_answer text) returns public.jeopardy_game_state language sql security invoker set search_path='' as $$select ml_private.jeopardy_action(p_room_id,'open',jsonb_build_object('col',p_col,'row',p_row,'value',p_value,'category',p_category,'question',p_question,'answer',p_answer))$$;
create or replace function public.jeopardy_buzz(p_room_id uuid,p_user_id uuid,p_team int) returns boolean language sql security invoker set search_path='' as $$select (ml_private.jeopardy_action(p_room_id,'buzz',jsonb_build_object('user',p_user_id,'team',p_team))).buzz_user_id=p_user_id$$;
create or replace function public.jeopardy_judge(p_room_id uuid,p_correct boolean) returns public.jeopardy_game_state language sql security invoker set search_path='' as $$select ml_private.jeopardy_action(p_room_id,'judge',jsonb_build_object('correct',p_correct))$$;
create or replace function public.jeopardy_submit_answer(p_room_id uuid,p_col int,p_row int,p_answer text,p_question_token uuid) returns public.jeopardy_game_state language sql security invoker set search_path='' as $$select ml_private.jeopardy_action(p_room_id,'answer',jsonb_build_object('col',p_col,'row',p_row,'answer',p_answer,'token',p_question_token))$$;
create or replace function public.jeopardy_safe_pass(p_room_id uuid,p_question_token uuid) returns public.jeopardy_game_state language sql security invoker set search_path='' as $$select ml_private.jeopardy_action(p_room_id,'pass',jsonb_build_object('token',p_question_token))$$;

create or replace function public.jeopardy_finish(p_room_id uuid) returns public.jeopardy_game_state language sql security invoker set search_path='' as $$select ml_private.jeopardy_action(p_room_id,'finish')$$;

-- Explicit RPC grants: no unauthenticated mutations.
DO $$declare f record;begin
 for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and (p.proname like 'jeopardy_%' ) loop
 execute format('revoke all on function %s from public,anon',f.signature);
 execute format('grant execute on function %s to authenticated',f.signature);
 end loop;
end $$;
notify pgrst,'reload schema';
