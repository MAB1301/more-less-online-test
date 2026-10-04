begin;
create or replace function ml_private.fact_waiting(p_room uuid,p_question uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare m ml_private.fact_matches;players jsonb;begin
 if auth.uid() is null or not ml_private.is_room_member(p_room,auth.uid()) then raise exception 'Nur Mitspieler dürfen den Wartezustand sehen.';end if;
 select * into m from ml_private.fact_matches where room_id=p_room;
 if m.room_id is null or m.phase<>'open' or m.question_id is distinct from p_question then return jsonb_build_object('active',false);end if;
 select coalesce(jsonb_agg(jsonb_build_object('user_id',p.user_id,'name',p.display_name,'answered',m.answers ? p.user_id::text,'connected',p.connected and p.last_seen_at>=clock_timestamp()-interval '60 seconds') order by p.seat),'[]'::jsonb) into players from public.players p where p.room_id=p_room and m.scores ? p.user_id::text;
 return jsonb_build_object('active',true,'question_id',m.question_id,'players',players);
end $$;
revoke all on function ml_private.fact_waiting(uuid,uuid) from public,anon;
grant execute on function ml_private.fact_waiting(uuid,uuid) to authenticated;
create or replace function public.ml_fact_game(p_room uuid,p_action text,p_question uuid default null,p_choice boolean default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare result jsonb;begin
 result:=ml_private.fact_game_impl(p_room,p_action,p_question,p_choice);
 if result->>'phase'='open' then result:=result||jsonb_build_object('waitingStatus',ml_private.fact_waiting(p_room,(result->>'question_id')::uuid));end if;
 return result;
end $$;
revoke all on function public.ml_fact_game(uuid,text,uuid,boolean) from public,anon;
grant execute on function public.ml_fact_game(uuid,text,uuid,boolean) to authenticated;
commit;
