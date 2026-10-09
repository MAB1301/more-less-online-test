create table if not exists ml_private.sort_matches(room_id uuid primary key references public.rooms(id) on delete cascade,pool jsonb not null,position int not null default 0,question_id uuid not null default gen_random_uuid(),phase text not null default 'open',stats jsonb not null,answers jsonb not null default '{}',result jsonb,starts_at timestamptz not null,deadline timestamptz not null);
alter table ml_private.sort_matches enable row level security;
revoke all on ml_private.sort_matches from public,anon,authenticated;
create or replace function ml_private.sort_action(p_room uuid,p_action text,p_data jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
declare m ml_private.sort_matches;u uuid:=auth.uid();q jsonb;cards jsonb;item jsonb;player record;guess jsonb;points int;i int;j int;results jsonb:='[]';stats jsonb;count_cards int;start_t timestamptz;cfg jsonb;
begin
 if u is null or not ml_private.is_room_member(p_room,u) then raise exception 'not room member';end if;
 if p_action in ('start','next','reset') and not ml_private.is_room_host(p_room,u) then raise exception 'host only';end if;
 select config into cfg from public.rooms where id=p_room for update;
 if p_action='start' then
  if upper(coalesce(cfg->>'game_mode',''))<>'SORT' or (select phase from public.rooms where id=p_room)<>'lobby' then raise exception 'not a sort lobby';end if;
  if jsonb_typeof(p_data->'pool') is distinct from 'array' or jsonb_array_length(p_data->'pool') not between 1 and 20 then raise exception 'invalid pool';end if;
  for q in select value from jsonb_array_elements(p_data->'pool') loop
   if jsonb_typeof(q->'cards') is distinct from 'array' or jsonb_array_length(q->'cards')<>4 or length(coalesce(q->>'unit',''))=0 or length(coalesce(q->>'metric',''))=0 then raise exception 'four comparable cards required';end if;
   for item in select value from jsonb_array_elements(q->'cards') loop
    if jsonb_typeof(item->'value') is distinct from 'number' or length(coalesce(item->>'name','')) not between 1 and 100 then raise exception 'invalid card';end if;
   end loop;
   if (select count(distinct value->>'name') from jsonb_array_elements(q->'cards'))<>4 or (select count(distinct (value->>'value')::numeric) from jsonb_array_elements(q->'cards'))<>4 then raise exception 'no duplicate names or ties';end if;
  end loop;
  select jsonb_object_agg(user_id::text,jsonb_build_object('name',display_name,'score',0)) into stats from public.players where room_id=p_room;
  start_t:=clock_timestamp()+interval '5 seconds';
  insert into ml_private.sort_matches(room_id,pool,stats,starts_at,deadline) values(p_room,p_data->'pool',stats,start_t,start_t+interval '30 seconds') on conflict(room_id) do update set pool=excluded.pool,stats=excluded.stats,position=0,question_id=gen_random_uuid(),phase='open',answers='{}',result=null,starts_at=excluded.starts_at,deadline=excluded.deadline;
  update public.players set score=0,blitz_bonus=0 where room_id=p_room;
  update public.rooms set phase='moreless',status='playing' where id=p_room;
 end if;
 select * into m from ml_private.sort_matches where room_id=p_room for update;
 if not found then return null;end if;
 if p_action='reset' then delete from ml_private.sort_matches where room_id=p_room;return null;end if;
 if p_action='submit' then
  if m.phase<>'open' or (p_data->>'question_id')::uuid is distinct from m.question_id or clock_timestamp()<m.starts_at or clock_timestamp()>=m.deadline then raise exception 'question not accepting answers';end if;
  if m.answers ? u::text then raise exception 'answer already saved';end if;
  guess:=p_data->'order';
  if jsonb_typeof(guess) is distinct from 'array' or jsonb_array_length(guess)<>4 or (select count(distinct value) from jsonb_array_elements(guess))<>4 or exists(select 1 from jsonb_array_elements(guess) a where jsonb_typeof(a) is distinct from 'number' or a::text not in ('0','1','2','3')) then raise exception 'invalid order';end if;
  m.answers:=m.answers||jsonb_build_object(u::text,jsonb_build_object('order',guess));update ml_private.sort_matches set answers=m.answers where room_id=p_room;
 elsif p_action='next' then
  if m.phase<>'revealed' then raise exception 'reveal first';end if;
  if m.position+1>=jsonb_array_length(m.pool) then m.phase:='finished';
  else m.position:=m.position+1;m.phase:='open';m.answers:='{}';m.result:=null;m.question_id:=gen_random_uuid();m.starts_at:=clock_timestamp()+interval '3 seconds';m.deadline:=m.starts_at+interval '30 seconds';end if;
  update ml_private.sort_matches set position=m.position,phase=m.phase,answers=m.answers,result=m.result,question_id=m.question_id,starts_at=m.starts_at,deadline=m.deadline where room_id=p_room;
 elsif p_action not in ('state','start','submit') then raise exception 'unknown action';end if;
 if m.phase='open' and clock_timestamp()>=m.starts_at then
  for player in select p.user_id,p.connected,p.last_seen_at from public.players p where p.room_id=p_room loop
   if not m.answers ? player.user_id::text and (clock_timestamp()>=m.deadline or not player.connected or player.last_seen_at<clock_timestamp()-interval '60 seconds') then m.answers:=m.answers||jsonb_build_object(player.user_id::text,jsonb_build_object('neutral',clock_timestamp()<m.deadline));end if;
  end loop;
  update ml_private.sort_matches set answers=m.answers where room_id=p_room;
  if not exists(select 1 from jsonb_object_keys(m.stats) uid where not m.answers ? uid) then
   q:=m.pool->m.position;
   for player in select key as uid,value as st from jsonb_each(m.stats) loop
    guess:=m.answers->player.uid->'order';points:=0;
    if guess is not null then for i in 0..2 loop for j in i+1..3 loop
     if (q->'cards'->((guess->>i)::int)->>'value')::numeric < (q->'cards'->((guess->>j)::int)->>'value')::numeric then points:=points+1;end if;
    end loop;end loop;end if;
    m.stats:=jsonb_set(m.stats,array[player.uid,'score'],to_jsonb((player.st->>'score')::int+points));
    update public.players set score=(player.st->>'score')::int+points where room_id=p_room and user_id=player.uid::uuid;
    results:=results||jsonb_build_array(jsonb_build_object('uid',player.uid,'name',player.st->>'name','order',guess,'points',points));
   end loop;
   m.phase:='revealed';m.result:=jsonb_build_object('cards',q->'cards','answers',results);
   update ml_private.sort_matches set phase=m.phase,stats=m.stats,result=m.result where room_id=p_room;
  end if;
 end if;
 q:=m.pool->m.position;
 select jsonb_agg(jsonb_build_object('id',ord-1,'name',value->>'name') order by ord) into cards from jsonb_array_elements(q->'cards') with ordinality t(value,ord);
 return jsonb_build_object('phase',m.phase,'question_id',m.question_id,'position',m.position,'total',jsonb_array_length(m.pool),'metric',q->>'metric','unit',q->>'unit','category',q->>'category','cards',cards,'starts_at',m.starts_at,'deadline',m.deadline,'mine',m.answers->u::text,'answered',(select count(*) from jsonb_object_keys(m.answers)),'players',(select count(*) from jsonb_object_keys(m.stats)),'stats',m.stats,'result',m.result);
end $$;
revoke all on function ml_private.sort_action(uuid,text,jsonb) from public,anon;
grant execute on function ml_private.sort_action(uuid,text,jsonb) to authenticated;
create or replace function public.ml_sort_duel(p_room uuid,p_action text,p_data jsonb default '{}') returns jsonb language sql security invoker set search_path='' as $$select ml_private.sort_action(p_room,p_action,p_data)$$;
revoke all on function public.ml_sort_duel(uuid,text,jsonb) from public,anon;
grant execute on function public.ml_sort_duel(uuid,text,jsonb) to authenticated;

CREATE OR REPLACE FUNCTION public.ml_online_reset(p_room uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
 if auth.uid() is null or not ml_private.is_room_host(p_room,auth.uid()) then raise exception 'host only';end if;
 perform 1 from public.rooms where id=p_room for update;
 delete from ml_private.sort_matches where room_id=p_room;
 delete from ml_private.estimate_matches where room_id=p_room;
 delete from public.online_ml_reveals where room_id=p_room;
 delete from ml_private.online_ml_answers where room_id=p_room;
 delete from ml_private.online_ml_secrets where room_id=p_room;
 delete from public.online_ml_questions where room_id=p_room;
 delete from ml_private.online_mode_players where room_id=p_room;
 delete from ml_private.online_joker_uses where room_id=p_room;
 update public.players set score=0,blitz_bonus=0,used_jokers='{}',skip_next_turn=false where room_id=p_room;
 update public.rooms set status='lobby',phase='lobby',config=config-'chaos_rules' where id=p_room;
end $function$

;
