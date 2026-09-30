CREATE OR REPLACE FUNCTION ml_private.join_room_impl(p_code text, p_name text)
 RETURNS TABLE(room_id uuid, seat integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare

  u uuid := auth.uid();

  rid uuid;
  s integer;

  n text := btrim(p_name);

begin

  if u is null then
    raise exception 'Authentication required';
  end if;

  if n is null
     or char_length(n) not between 1 and 24
  then
    raise exception 'Name must be 1..24 characters';
  end if;


  select r.id
  into rid
  from public.rooms r
  where r.code = upper(
    btrim(p_code)
  )
    and r.status = 'lobby'
  for update;


  if rid is null then
    raise exception
      'Room not found or already started';
  end if;


  select p.seat
  into s
  from public.players p
  where p.room_id = rid
    and p.user_id = u;


  if s is not null then

    update public.players reconnect
    set
      connected = true,
      last_seen_at = now(),
      display_name = n
    where reconnect.room_id = rid
      and reconnect.user_id = u;

    return query
    select rid,s;

    return;

  end if;


  select coalesce(
    max(p.seat),
    0
  ) + 1
  into s
  from public.players p
  where p.room_id = rid;


  if s > 32 or (select count(*) from public.players cap where cap.room_id=rid) >= coalesce((select (config->>'max_players')::int from public.rooms where id=rid),32) then
    raise exception 'Room is full';
  end if;


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
    s
  );


  return query
  select rid,s;

end;
$function$
;
CREATE OR REPLACE FUNCTION public.ml_online_ml_start(p_room uuid, p_question_no integer, p_category text, p_metric text, p_prompt text, p_unit text, p_left_name text, p_left_icon text, p_left_value numeric, p_right_name text, p_right_icon text, p_right_value numeric, p_timer_seconds integer DEFAULT 45)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'ml_private', 'pg_temp'
AS $function$
declare
    v_correct_side text;
 cfg jsonb; seconds integer;
begin

    if auth.uid() is null then
        raise exception 'not authenticated';
    end if;

    if not ml_private.is_room_host(p_room, auth.uid()) then
        raise exception 'host only';
    end if;

    select config into cfg from public.rooms where id=p_room for update;
 seconds:=case when cfg ? 'timer_enabled' then case when (cfg->>'timer_enabled')::boolean then (cfg->>'timer_seconds')::int else null end else greatest(coalesce(p_timer_seconds,45),1) end;
 if cfg ? 'timer_enabled' and p_question_no < 900 and p_question_no not between 1 and ((cfg->>'rounds')::int * (cfg->>'questions_per_round')::int) then raise exception 'question outside configured rounds'; end if;
 if p_left_value = p_right_value then
        raise exception 'values must not be equal';
    end if;


    -- A = linke Karte ist größer
    -- B = rechte Karte ist größer

    v_correct_side :=
        case
            when p_left_value > p_right_value then 'a'
            else 'b'
        end;


    -- --------------------------------------------------------
    -- Alte Daten derselben Fragennummer entfernen
    -- --------------------------------------------------------

    delete from public.online_ml_reveals
    where room_id = p_room
      and question_no = p_question_no;


    delete from ml_private.online_ml_answers
    where room_id = p_room
      and question_no = p_question_no;


    delete from ml_private.online_ml_secrets
    where room_id = p_room
      and question_no = p_question_no;


    delete from public.online_ml_questions
    where room_id = p_room
      and question_no = p_question_no;


    -- --------------------------------------------------------
    -- Öffentliche Frage
    -- rechter Wert bleibt geheim
    -- --------------------------------------------------------

    insert into public.online_ml_questions (
        room_id,
        question_no,
        category,
        metric,
        prompt,
        unit,
        left_name,
        left_icon,
        left_value,
        right_name,
        right_icon,
        status,
        deadline
    )
    values (
        p_room,
        p_question_no,
        p_category,
        p_metric,
        p_prompt,
        p_unit,
        p_left_name,
        p_left_icon,
        p_left_value,
        p_right_name,
        p_right_icon,
        'open',
        case when seconds is null then null else clock_timestamp()+make_interval(secs=>seconds) end
    );


    -- --------------------------------------------------------
    -- Lösung privat speichern
    -- --------------------------------------------------------

    insert into ml_private.online_ml_secrets (
        room_id,
        question_no,
        right_value,
        correct_side
    )
    values (
        p_room,
        p_question_no,
        p_right_value,
        v_correct_side
    );


    -- Raum befindet sich jetzt in MORE/LESS

    update public.rooms
    set phase = 'moreless'
    where id = p_room;

end;
$function$
;
CREATE OR REPLACE FUNCTION ml_private.online_ml_finalize_impl(p_room uuid, p_question_no integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 q public.online_ml_questions; cfg jsonb; secret ml_private.online_ml_secrets;
 blitz boolean; timed boolean; seconds integer; results jsonb;
begin
 if auth.uid() is null or not ml_private.is_room_member(p_room,auth.uid()) then raise exception 'not room member'; end if;
 select * into q from public.online_ml_questions where room_id=p_room and question_no=p_question_no for update;
 if not found then raise exception 'question not found'; end if;
 if q.status='revealed' then return (select r.results from public.online_ml_reveals r where r.room_id=p_room and r.question_no=p_question_no); end if;
 if q.metric in ('JEOPARDY_START','ESTIMATE_START') then raise exception 'not a comparison question'; end if;
 select config into cfg from public.rooms where id=p_room;
 blitz:=upper(coalesce(cfg->>'game_mode','CLASSIC'))='BLITZ';
 timed:=blitz or coalesce((cfg->>'timer_enabled')::boolean,false);
 seconds:=greatest(5,least(15,coalesce((cfg->>'blitz_seconds')::int,(cfg->>'timer_seconds')::int,8)));
 if timed and clock_timestamp()>=q.deadline then
  insert into ml_private.online_ml_answers(room_id,question_no,user_id,choice,submitted_at)
  select p_room,p_question_no,p.user_id,'timeout',clock_timestamp() from public.players p where p.room_id=p_room
  on conflict(room_id,question_no,user_id) do nothing;
 end if;
 if exists(select 1 from public.players p where p.room_id=p_room and not exists(select 1 from ml_private.online_ml_answers a where a.room_id=p_room and a.question_no=p_question_no and a.user_id=p.user_id)) then
  return jsonb_build_object('waiting',true);
 end if;
 select * into secret from ml_private.online_ml_secrets where room_id=p_room and question_no=p_question_no;
 if not found then raise exception 'question secret missing'; end if;
 update public.players p set
  score=coalesce(p.score,0)+case when a.choice=secret.correct_side and (not timed or a.submitted_at<=q.deadline) then 1 else 0 end,
  blitz_bonus=p.blitz_bonus+case when blitz and a.choice=secret.correct_side and a.submitted_at<=q.deadline-make_interval(secs=>seconds/2.0) then 0.5 else 0 end
 from ml_private.online_ml_answers a
 where p.room_id=p_room and a.room_id=p_room and a.question_no=p_question_no and a.user_id=p.user_id;
 select jsonb_build_object('right_value',secret.right_value,'unit',q.unit,
  'correct_name',case when secret.correct_side='a' then q.left_name else q.right_name end,'correct_side',secret.correct_side,
  'answers',coalesce(jsonb_agg(jsonb_build_object('user_id',a.user_id,'choice',a.choice,
   'correct',a.choice=secret.correct_side and (not timed or a.submitted_at<=q.deadline),
   'points',case when a.choice<>secret.correct_side or (timed and a.submitted_at>q.deadline) then 0 when blitz and a.submitted_at<=q.deadline-make_interval(secs=>seconds/2.0) then 1.5 else 1 end) order by a.user_id),'[]'::jsonb))
 into results from ml_private.online_ml_answers a where a.room_id=p_room and a.question_no=p_question_no;
 insert into public.online_ml_reveals(room_id,question_no,results) values(p_room,p_question_no,results) on conflict(room_id,question_no) do nothing;
 update public.online_ml_questions set status='revealed' where room_id=p_room and question_no=p_question_no;
 update public.rooms set phase='reveal' where id=p_room;
 return results;
end $function$
;
CREATE OR REPLACE FUNCTION ml_private.online_ml_submit_impl(p_room uuid, p_question_no integer, p_choice text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare q public.online_ml_questions; cfg jsonb; received_at timestamptz:=clock_timestamp();
begin
 if auth.uid() is null or not ml_private.is_room_member(p_room,auth.uid()) then raise exception 'not room member'; end if;
 if p_choice is null or p_choice not in ('a','b') then raise exception 'invalid choice'; end if;
 select * into q from public.online_ml_questions where room_id=p_room and question_no=p_question_no for update;
 if not found then raise exception 'question not found'; end if;
 if q.metric in ('JEOPARDY_START','ESTIMATE_START') then raise exception 'not a comparison question'; end if;
 if q.status<>'open' then raise exception 'question not open'; end if;
 select config into cfg from public.rooms where id=p_room;
 if (upper(coalesce(cfg->>'game_mode','CLASSIC'))='BLITZ' or coalesce((cfg->>'timer_enabled')::boolean,false)) and received_at>=q.deadline then
  perform ml_private.online_ml_finalize_impl(p_room,p_question_no);return;
 end if;
 if exists(select 1 from ml_private.online_ml_answers where room_id=p_room and question_no=p_question_no and user_id=auth.uid()) then raise exception 'answer already locked'; end if;
 insert into ml_private.online_ml_answers(room_id,question_no,user_id,choice,submitted_at) values(p_room,p_question_no,auth.uid(),p_choice,received_at);
 perform ml_private.online_ml_finalize_impl(p_room,p_question_no);
end $function$
;
CREATE OR REPLACE FUNCTION ml_private.online_ml_timeout_impl(p_room uuid, p_question_no integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare q public.online_ml_questions; cfg jsonb;
begin
 if auth.uid() is null or not ml_private.is_room_member(p_room,auth.uid()) then raise exception 'not room member'; end if;
 select * into q from public.online_ml_questions where room_id=p_room and question_no=p_question_no for update;
 if not found then raise exception 'question not found'; end if;
 select config into cfg from public.rooms where id=p_room;
 if q.deadline is null or (upper(coalesce(cfg->>'game_mode','CLASSIC'))<>'BLITZ' and not coalesce((cfg->>'timer_enabled')::boolean,false)) then raise exception 'timer disabled'; end if;
 if clock_timestamp()<q.deadline then return jsonb_build_object('waiting',true); end if;
 return ml_private.online_ml_finalize_impl(p_room,p_question_no);
end $function$
;
CREATE OR REPLACE FUNCTION ml_private.update_room_settings_impl(p_room uuid,p_rounds integer,p_timer_seconds integer,p_max_players integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
declare r public.rooms; cfg jsonb;
begin
 select * into r from public.rooms where id=p_room for update;
 if auth.uid() is null or r.host_user_id is distinct from auth.uid() then raise exception 'host only'; end if;
 if r.phase <> 'lobby' or exists(select 1 from public.online_ml_questions where room_id=p_room) then raise exception 'Settings locked after game start'; end if;
 if coalesce(r.config->>'game','moreless') <> 'moreless' then raise exception 'More/Less settings only'; end if;
 if p_rounds is null or p_rounds not between 1 and 10 or p_timer_seconds is null or (p_timer_seconds<>0 and p_timer_seconds not between 5 and 120) or p_max_players is null or p_max_players not between 1 and 32 then raise exception 'Invalid settings'; end if;
 if upper(coalesce(r.config->>'game_mode','CLASSIC'))='BLITZ' and p_timer_seconds not between 5 and 15 then raise exception 'Blitz requires 5–15 seconds'; end if;
 if p_max_players < (select count(*) from public.players where room_id=p_room) then raise exception 'Player limit below current players'; end if;
 cfg:=r.config || jsonb_build_object('rounds',p_rounds,'questions_per_round',5,'timer_seconds',p_timer_seconds,'timer_enabled',p_timer_seconds>0,'max_players',p_max_players);
 if upper(coalesce(cfg->>'game_mode','CLASSIC'))='BLITZ' then cfg:=cfg||jsonb_build_object('blitz_seconds',p_timer_seconds); end if;
 update public.rooms set config=cfg,updated_at=now() where id=p_room;
 return cfg;
end $$;
CREATE OR REPLACE FUNCTION public.ml_update_room_settings(p_room uuid,p_rounds integer,p_timer_seconds integer,p_max_players integer)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ select ml_private.update_room_settings_impl(p_room,p_rounds,p_timer_seconds,p_max_players); $$;
REVOKE ALL ON FUNCTION ml_private.update_room_settings_impl(uuid,integer,integer,integer),public.ml_update_room_settings(uuid,integer,integer,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION ml_private.update_room_settings_impl(uuid,integer,integer,integer),public.ml_update_room_settings(uuid,integer,integer,integer) TO authenticated;
