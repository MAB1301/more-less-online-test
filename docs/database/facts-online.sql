create table if not exists ml_private.fact_matches(room_id uuid primary key references public.rooms(id) on delete cascade,question_id uuid not null default gen_random_uuid(),pool jsonb not null,position integer not null default 0,phase text not null default 'open',scores jsonb not null,answers jsonb not null default '{}',result jsonb,deadline timestamptz not null default clock_timestamp()+interval '60 seconds');
alter table ml_private.fact_matches enable row level security;
revoke all on ml_private.fact_matches from public,anon,authenticated;
create or replace function ml_private.fact_game_impl(p_room uuid,p_action text,p_question uuid,p_choice boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();m ml_private.fact_matches;q jsonb;roster jsonb;pool jsonb;results jsonb;player record;good boolean;chosen boolean;host boolean;begin
 if u is null or not ml_private.is_room_member(p_room,u) then raise exception 'Not room member';end if;
 host:=ml_private.is_room_host(p_room,u);
 perform 1 from public.rooms where id=p_room for update;
 if (select config->>'game' from public.rooms where id=p_room)is distinct from 'facts' then raise exception 'Not a Fact/Fake lobby';end if;
 if p_action not in ('start','state','answer','next','reset') or p_action is null then raise exception 'Invalid action';end if;
 if p_action='reset' then if not host then raise exception 'Host only';end if;delete from ml_private.fact_matches where room_id=p_room;return jsonb_build_object('waiting',true);end if;
 select * into m from ml_private.fact_matches where room_id=p_room for update;
 if m.room_id is null then
  if p_action<>'start' then return jsonb_build_object('waiting',true);end if;
  if not host then raise exception 'Host only';end if;
  select jsonb_agg(payload order by random()) into pool from (select payload from (select payload,row_number() over(partition by (payload->>'a')::boolean order by exists(select 1 from ml_private.player_seen h where h.game='facts' and h.question_key=c.payload->>'s' and h.user_id in(select user_id from public.players where room_id=p_room)),random()) as pos from ml_private.daily_catalogue c where game='facts' and available_from<=(clock_timestamp() at time zone 'Europe/Berlin')::date and payload->>'source' like 'https://%' and length(payload->>'e')>0) s where pos<=5) balanced;
  if jsonb_array_length(pool)<>10 or pool is null then raise exception 'Ten sourced facts unavailable';end if;
  select jsonb_object_agg(user_id,jsonb_build_object('name',display_name,'score',0)) into roster from public.players where room_id=p_room;
  insert into ml_private.fact_matches(room_id,pool,scores) values(p_room,pool,roster) returning * into m;
 insert into ml_private.player_seen(user_id,game,question_key) select p.user_id,'facts',f->>'s' from public.players p cross join jsonb_array_elements(pool) f where p.room_id=p_room on conflict(user_id,game,question_key) do update set seen_at=clock_timestamp();
 end if;
 q:=m.pool->m.position;
 if p_action='answer' then
  if p_question is null or p_question<>m.question_id then raise exception 'Stale question';end if;
  if p_choice is null or not(m.scores ? u::text) then raise exception 'Invalid answer';end if;
  if m.phase='open' and clock_timestamp()<m.deadline and not(m.answers ? u::text) then
   m.answers:=m.answers||jsonb_build_object(u::text,p_choice);update ml_private.fact_matches set answers=m.answers where room_id=p_room;
  end if;
 elsif p_action='next' then
  if not host then raise exception 'Host only';end if;
  if p_question is null or p_question<>m.question_id or m.phase<>'revealed' then raise exception 'Reveal first';end if;
  m.position:=m.position+1;m.question_id:=gen_random_uuid();m.phase:='open';m.answers:='{}';m.result:=null;m.deadline:=clock_timestamp()+interval '60 seconds';
  update ml_private.fact_matches set position=m.position,question_id=m.question_id,phase=m.phase,answers=m.answers,result=null,deadline=m.deadline where room_id=p_room;q:=m.pool->m.position;
 end if;
 if m.phase='open' and (clock_timestamp()>=m.deadline or not exists(select 1 from jsonb_object_keys(m.scores) id where not(m.answers ? id))) then
  results:='[]';
  for player in select key,value from jsonb_each(m.scores) loop
   chosen:=(m.answers->>player.key)::boolean;good:=coalesce(chosen=(q->>'a')::boolean,false);
   m.scores:=jsonb_set(m.scores,array[player.key],player.value||jsonb_build_object('score',(player.value->>'score')::integer+good::integer,'streak',case when good then coalesce((player.value->>'streak')::integer,0)+1 else 0 end,'best_streak',greatest(coalesce((player.value->>'best_streak')::integer,0),case when good then coalesce((player.value->>'streak')::integer,0)+1 else 0 end)));
   results:=results||jsonb_build_array(jsonb_build_object('user_id',player.key,'name',player.value->>'name','choice',chosen,'correct',good,'timeout',not(m.answers ? player.key),'points',good::integer,'score',m.scores->player.key->'score'));
  end loop;
  m.phase:=case when m.position=9 then 'finished' else 'revealed' end;
  m.result:=jsonb_build_object('answer',q->'a','explanation',q->>'e','source',q->>'source','answers',results);
  update ml_private.fact_matches set phase=m.phase,scores=m.scores,result=m.result where room_id=p_room;
 end if;
 return jsonb_build_object('question_id',m.question_id,'index',m.position,'total',10,'phase',m.phase,'deadline',m.deadline,'question',jsonb_build_object('s',q->>'s','cat',q->>'cat'),'mine',case when m.answers ? u::text then jsonb_build_object('choice',m.answers->u::text) else null end,'scores',m.scores,'result',case when m.phase<>'open' then m.result else null end,'last',m.position=9,'spectator',not(m.scores ? u::text));
end $$;
revoke all on function ml_private.fact_game_impl(uuid,text,uuid,boolean) from public,anon;
grant execute on function ml_private.fact_game_impl(uuid,text,uuid,boolean) to authenticated;
create or replace function public.ml_fact_game(p_room uuid,p_action text,p_question uuid default null,p_choice boolean default null) returns jsonb language sql security invoker set search_path='' as $$select ml_private.fact_game_impl(p_room,p_action,p_question,p_choice)$$;
revoke all on function public.ml_fact_game(uuid,text,uuid,boolean) from public,anon;
grant execute on function public.ml_fact_game(uuid,text,uuid,boolean) to authenticated;
