begin;
select set_config('ml_xp_test.uid',gen_random_uuid()::text,true);
insert into auth.users(id,aud,role,is_anonymous) values(current_setting('ml_xp_test.uid')::uuid,'authenticated','authenticated',true);
insert into ml_private.daily_attempts(day,user_id,game,name,answered,score,completed_at) values(date '2026-10-05',current_setting('ml_xp_test.uid')::uuid,'facts','XP test',5,4,clock_timestamp());
set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('ml_xp_test.uid'),'role','authenticated','is_anonymous',true)::text,true);
do $$declare p jsonb;r jsonb:=jsonb_build_object('run_id','test-xp','game','facts','mode','classic','score',30,'answered',30,'correct',30,'best_streak',30);begin
perform public.ml_player_hub('record',r);perform public.ml_player_hub('record',r);
p:=public.ml_player_hub('profile')->'progression';
if (p->>'xp')::int<>140 or (p->>'level')::int<>2 or (p->>'current')::int<>40 or (p->>'needed')::int<>125 then raise exception 'XP calculation incorrect: %',p;end if;
if public.ml_player_hub('profile')->'progression'<>p then raise exception 'Repeated reads changed XP';end if;
begin perform ml_private.player_xp(current_setting('ml_xp_test.uid')::uuid);raise exception 'Private XP getter callable directly';exception when insufficient_privilege then null;end;
end$$;
reset role;
do $$begin if ml_private.xp_level(0)->>'level'<>'1' or ml_private.xp_level(99)->>'level'<>'1' or ml_private.xp_level(100)->>'level'<>'2' or ml_private.xp_level(225)->>'level'<>'3' or ml_private.xp_level(375)->>'level'<>'4' then raise exception 'XP threshold incorrect';end if;end$$;
select 'PASS: XP/level thresholds, completed daily + saved run, duplicate/reload stability, private getter permissions' as result;
rollback;
