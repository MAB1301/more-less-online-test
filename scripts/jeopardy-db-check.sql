-- Run inside a transaction; fixtures are rolled back.
DO $$
declare h uuid:=gen_random_uuid(); g uuid:=gen_random_uuid(); outsider uuid:=gen_random_uuid(); rid uuid; code text; s public.jeopardy_game_state; token uuid; denied boolean;
begin
 insert into auth.users(id,aud,role) values(h,'authenticated','authenticated'),(g,'authenticated','authenticated'),(outsider,'authenticated','authenticated');
 perform set_config('request.jwt.claim.sub',h::text,true);
 select room_id,room_code into rid,code from public.ml_create_room('QA Host','{}');
 perform public.ml_set_team(rid,1);
 perform public.jeopardy_reset(rid);
 s:=public.jeopardy_open_question(rid,0,0,100,'Test','Goldsymbol?','Au');token:=s.question_token;
 perform set_config('request.jwt.claim.sub',g::text,true);
 perform public.ml_join_room(code,'QA Gast');perform public.ml_set_team(rid,2);
 if public.jeopardy_buzz(rid,g,2) is not true then raise exception 'Guest buzz failed';end if;
 s:=public.jeopardy_submit_answer(rid,0,0,'Au',token);
 if s.submitted_answer<>'Au' or s.game_status<>'submitted' then raise exception 'Guest answer not shared';end if;
 denied:=false;begin perform public.jeopardy_judge(rid,true);exception when others then denied:=true;end;
 if not denied then raise exception 'Guest was allowed to judge';end if;
 perform set_config('request.jwt.claim.sub',h::text,true);
 s:=public.jeopardy_judge(rid,true);
 if s.team_2_score<>100 then raise exception 'Wrong guest score';end if;
 s:=public.jeopardy_judge(rid,true);
 if s.team_2_score<>100 then raise exception 'Duplicate points';end if;
 s:=public.jeopardy_open_question(rid,1,0,100,'Test','Neue Frage','Nein');
 perform set_config('request.jwt.claim.sub',g::text,true);
 perform public.jeopardy_buzz(rid,g,2);
 denied:=false;begin perform public.jeopardy_submit_answer(rid,0,0,'stale',token);exception when others then denied:=true;end;
 if not denied then raise exception 'Stale answer accepted';end if;
 s:=public.jeopardy_safe_pass(rid,s.question_token);
 if s.game_status<>'question' or not (s.passed_teams @> '[2]'::jsonb) then raise exception 'Safe pass not shared';end if;
 perform set_config('request.jwt.claim.sub',outsider::text,true);
 denied:=false;begin perform public.jeopardy_init(rid);exception when others then denied:=true;end;
 if not denied then raise exception 'Outsider accessed room';end if;
 perform set_config('request.jwt.claim.sub',h::text,true);
 s:=public.jeopardy_finish(rid);
 if s.game_status<>'finished' then raise exception 'Shared finish failed';end if;
 s:=public.jeopardy_reset(rid);
 if s.team_2_score<>0 or s.answer_history<>'[]' or s.game_status<>'board' then raise exception 'Restart failed';end if;
 raise notice 'PASS: guest answer, host-only judging, duplicate/stale rejection, safe pass, room access, shared finish, restart';
end $$;
