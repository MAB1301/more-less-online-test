CREATE OR REPLACE FUNCTION public.ml_online_mode_state(p_room uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
 if auth.uid() is null or not ml_private.is_room_member(p_room,auth.uid()) then raise exception 'not room member';end if;
 update public.players set last_seen_at=clock_timestamp(),connected=true where room_id=p_room and user_id=auth.uid();
 return (select coalesce(jsonb_agg(jsonb_build_object('user_id',p.user_id,'lives',coalesce(s.lives,3),'streak',coalesce(s.streak,0),'used_jokers',p.used_jokers,'rescue_spent',exists(select 1 from ml_private.match_rescues mr where mr.user_id=p.user_id and mr.room_id=p_room and mr.game='moreless' and mr.token=(select question_id from public.online_ml_questions where room_id=p_room order by question_no limit 1)),'answer',case when p.user_id=auth.uid() then (select jsonb_build_object('question_no',a.question_no,'question_id',q.question_id,'choice',a.choice) from ml_private.online_ml_answers a join public.online_ml_questions q on q.room_id=a.room_id and q.question_no=a.question_no where a.room_id=p_room and a.user_id=auth.uid() order by a.question_no desc limit 1) else null end)),'[]') from public.players p left join ml_private.online_mode_players s on s.room_id=p.room_id and s.user_id=p.user_id where p.room_id=p_room);
end $function$
;

