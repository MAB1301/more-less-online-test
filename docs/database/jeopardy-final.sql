begin;
create table if not exists ml_private.jeopardy_finals (
 room_id uuid primary key references public.rooms(id) on delete cascade,
 enabled boolean not null default false,
 phase text not null default 'ready' check(phase in ('ready','wager','answer','judge','finished','cancelled')),
 question jsonb,
 scores jsonb not null default '[0,0]',
 wagers jsonb not null default '{}',
 answers jsonb not null default '{}',
 verdicts jsonb not null default '{}',
 results jsonb,
 updated_at timestamptz not null default now()
);
alter table ml_private.jeopardy_finals enable row level security;
revoke all on ml_private.jeopardy_finals from public,anon,authenticated;
create or replace function ml_private.jeopardy_final_action(p_room uuid,p_action text,p_enabled boolean default null,p_question jsonb default null,p_wager integer default null,p_answer text default null,p_team integer default null,p_correct boolean default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); host boolean; f ml_private.jeopardy_finals; s public.jeopardy_game_state; t integer; k text; delta integer; final_scores jsonb; final_results jsonb; item jsonb;
begin
 if u is null or not ml_private.is_room_member(p_room,u) then raise exception 'Kein Mitglied dieser Lobby';end if;
 host:=ml_private.is_room_host(p_room,u);
 if p_action is null or p_action not in ('configure','start','state','wager','answer','judge','cancel') then raise exception 'Ungültige Finalaktion';end if;
 if p_action in ('configure','start','judge','cancel') and not host then raise exception 'Nur der Host darf das';end if;
 perform 1 from public.rooms where id=p_room for update;
 select * into s from public.jeopardy_game_state where room_id=p_room for update;
 if s.room_id is null then raise exception 'Jeopardy zuerst starten';end if;
 if p_action='configure' then
  if jsonb_array_length(s.used_cells)>0 or s.game_status not in ('board','finished') then raise exception 'Finale vor dem Match einstellen';end if;
  if p_enabled is null then raise exception 'Finale aktivieren oder deaktivieren';end if;
  if p_enabled and (p_question is null or coalesce(length(p_question->>'q'),0) not between 1 and 500 or coalesce(length(p_question->>'a'),0) not between 1 and 1000 or coalesce(length(p_question->>'cat'),0) not between 1 and 150) then raise exception 'Ungültige Finalfrage';end if;
  insert into ml_private.jeopardy_finals(room_id,enabled,question,scores) values(p_room,p_enabled,p_question,jsonb_build_array(s.team_1_score,s.team_2_score))
  on conflict(room_id) do update set enabled=excluded.enabled,question=excluded.question,scores=excluded.scores,phase='ready',wagers='{}',answers='{}',verdicts='{}',results=null,updated_at=now();
 end if;
 select * into f from ml_private.jeopardy_finals where room_id=p_room for update;
 if f.room_id is null or not f.enabled then return jsonb_build_object('enabled',false,'phase','ready');end if;
 if p_action='start' and f.phase='ready' then
  if (select count(distinct team_no) from public.online_team_members where room_id=p_room and team_no in (1,2))<>2 then raise exception 'Für das Finale brauchen beide Teams mindestens einen Spieler';end if;
  update ml_private.jeopardy_finals set phase='wager',scores=jsonb_build_array(s.team_1_score,s.team_2_score),updated_at=now() where room_id=p_room returning * into f;
 elsif p_action in ('wager','answer') then
  select team_no into t from public.online_team_members where room_id=p_room and user_id=u and team_no in (1,2);
  if t is null then raise exception 'Bitte Team 1 oder 2 beitreten';end if;k:=t::text;
  if p_action='wager' then
   if f.wagers ? k then null;
   elsif f.phase<>'wager' then raise exception 'Der Einsatz ist bereits geschlossen';
   elsif p_wager is null or p_wager<0 or p_wager>greatest(0,(f.scores->>(t-1))::integer) then raise exception 'Einsatz außerhalb deines Punktestands';
   else update ml_private.jeopardy_finals set wagers=wagers||jsonb_build_object(k,p_wager),updated_at=now() where room_id=p_room returning * into f;end if;
   if f.phase='wager' and f.wagers ? '1' and f.wagers ? '2' then update ml_private.jeopardy_finals set phase='answer' where room_id=p_room returning * into f;end if;
  else
   if f.answers ? k then null;
   elsif f.phase<>'answer' then raise exception 'Antwort ist noch nicht offen oder bereits geschlossen';
   elsif p_answer is null or length(btrim(p_answer)) not between 1 and 500 then raise exception 'Antwort mit 1–500 Zeichen eingeben';
   else update ml_private.jeopardy_finals set answers=answers||jsonb_build_object(k,btrim(p_answer)),updated_at=now() where room_id=p_room returning * into f;end if;
   if f.phase='answer' and f.answers ? '1' and f.answers ? '2' then update ml_private.jeopardy_finals set phase='judge' where room_id=p_room returning * into f;end if;
  end if;
 elsif p_action='judge' then
  if p_team is null or p_team not in (1,2) or p_correct is null then raise exception 'Ungültige Wertung';end if;
  if f.verdicts ? p_team::text then null;
  elsif f.phase<>'judge' then raise exception 'Beide Antworten zuerst abgeben';
  else update ml_private.jeopardy_finals set verdicts=verdicts||jsonb_build_object(p_team::text,p_correct),updated_at=now() where room_id=p_room returning * into f;end if;
  if f.phase='judge' and f.verdicts ? '1' and f.verdicts ? '2' then
   final_scores:='[]';final_results:='[]';
   for t in 1..2 loop
    delta:=case when (f.verdicts->>t::text)::boolean then 1 else -1 end*(f.wagers->>t::text)::integer;
    final_scores:=final_scores||jsonb_build_array((f.scores->>(t-1))::integer+delta);
    final_results:=final_results||jsonb_build_array(jsonb_build_object('team',t,'answer',f.answers->>t::text,'correct',(f.verdicts->>t::text)::boolean,'delta',delta));
   end loop;
   update ml_private.jeopardy_finals set scores=final_scores,results=final_results,phase='finished',updated_at=now() where room_id=p_room returning * into f;
   update public.jeopardy_game_state set team_1_score=(final_scores->>0)::integer,team_2_score=(final_scores->>1)::integer,game_status='finished',revision=revision+1,updated_at=now() where room_id=p_room;
  end if;
 elsif p_action='cancel' and f.phase not in ('finished','cancelled') then
  update ml_private.jeopardy_finals set phase='cancelled',scores=case when phase='ready' then jsonb_build_array(s.team_1_score,s.team_2_score) else scores end,updated_at=now() where room_id=p_room returning * into f;
 end if;
 select team_no into t from public.online_team_members where room_id=p_room and user_id=u and team_no in (1,2);
 return jsonb_build_object('enabled',true,'phase',f.phase,'scores',f.scores,
 'question',case when f.phase in ('answer','judge','finished') then jsonb_build_object('q',f.question->>'q','cat',f.question->>'cat')||case when host and f.phase='judge' or f.phase='finished' then jsonb_build_object('a',f.question->>'a') else '{}'::jsonb end else jsonb_build_object('cat',f.question->>'cat') end,
 'mine',jsonb_build_object('wager',f.wagers->t::text,'answer',f.answers->t::text),
 'wagers',case when host and f.phase='judge' or f.phase='finished' then f.wagers else '{}'::jsonb end,
 'answers',case when host and f.phase='judge' or f.phase='finished' then f.answers else '{}'::jsonb end,
 'verdicts',case when host and f.phase='judge' or f.phase='finished' then f.verdicts else '{}'::jsonb end,'results',case when f.phase='finished' then f.results else null end);
end $$;
revoke all on function ml_private.jeopardy_final_action(uuid,text,boolean,jsonb,integer,text,integer,boolean) from public,anon;
grant execute on function ml_private.jeopardy_final_action(uuid,text,boolean,jsonb,integer,text,integer,boolean) to authenticated;
create or replace function public.ml_jeopardy_final(p_room uuid,p_action text,p_enabled boolean default null,p_question jsonb default null,p_wager integer default null,p_answer text default null,p_team integer default null,p_correct boolean default null)
returns jsonb language sql security invoker set search_path='' as $$select ml_private.jeopardy_final_action(p_room,p_action,p_enabled,p_question,p_wager,p_answer,p_team,p_correct)$$;
revoke all on function public.ml_jeopardy_final(uuid,text,boolean,jsonb,integer,text,integer,boolean) from public,anon;
grant execute on function public.ml_jeopardy_final(uuid,text,boolean,jsonb,integer,text,integer,boolean) to authenticated;
notify pgrst,'reload schema';
commit;
