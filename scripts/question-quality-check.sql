begin;
create temp table quality_test_users(id uuid primary key);
insert into quality_test_users select gen_random_uuid() from generate_series(1,5);
insert into auth.users(id,aud,role,is_anonymous) select id,'authenticated','authenticated',true from quality_test_users;
grant select on quality_test_users to authenticated;
select set_config('request.jwt.claim.sub',(select id::text from quality_test_users order by id limit 1),true);
set local role authenticated;
do $$declare a jsonb;b jsonb;blocked boolean;begin
 a:=public.ml_report_question('moreless','fixture','A / B','value','Hint');
 b:=public.ml_report_question('moreless','fixture','A / B','value','Retry');
 assert a->>'id'=b->>'id' and (b->>'duplicate')::boolean,'idempotent retry';
 blocked:=false;begin perform public.ml_report_question('moreless','fixture2','A / B','value',repeat('x',601));exception when others then blocked:=true;end;assert blocked,'bounded notes';
 blocked:=false;begin perform public.ml_report_question(null,'fixture','A','value','');exception when others then blocked:=true;end;assert blocked,'null game rejected';
 blocked:=false;begin perform * from ml_private.question_reports;exception when insufficient_privilege then blocked:=true;end;assert blocked,'no raw reports access';
 blocked:=false;begin perform * from ml_private.question_difficulty_review;exception when insufficient_privilege then blocked:=true;end;assert blocked,'no hidden question/analytics access';
 assert public.ml_observe_question('event','facts','fixture','Some claim','classic',1),'observation accepts';
 assert public.ml_observe_question('event','facts','fixture','Some claim','classic',0),'observation retry accepts';
 blocked:=false;begin perform public.ml_observe_question('event2','facts','fixture','Some claim','classic',2);exception when others then blocked:=true;end;assert blocked,'invalid accuracy rejected';
 for i in 1..49 loop perform public.ml_report_question('facts','rate-'||i,'A','wording','');end loop;
 blocked:=false;begin perform public.ml_report_question('facts','rate-over','A','wording','');exception when others then blocked:=true;end;assert blocked,'report rate limit';
end $$;
reset role;
do $$begin assert (select count(*) from ml_private.question_observations where event_id='event' and user_id=auth.uid())=1,'one observation';assert (select accuracy from ml_private.question_observations where event_id='event' and user_id=auth.uid())=1,'retry does not alter original result';end $$;
-- A second identity gets its own report and cannot read the first identity's data.
select set_config('request.jwt.claim.sub',(select id::text from quality_test_users order by id offset 1 limit 1),true);
set local role authenticated;
do $$begin assert not (public.ml_report_question('moreless','fixture','A / B','value','Other user')->>'duplicate')::boolean,'separate caller ownership';end $$;
reset role;
insert into ml_private.question_observations(user_id,event_id,game,question_key,prompt,mode,accuracy)
select id,'sample-'||n,'quiz','calibration','Calibration','standard',1 from quality_test_users cross join generate_series(1,4) n;
do $$begin assert (select review_status from ml_private.question_difficulty_review where game='quiz' and question_key='calibration')='review_too_easy','twenty observations from five players';assert (select review_status from ml_private.question_difficulty_review where game='facts' and question_key='fixture')='insufficient_sample','small sample withheld';end $$;
set local role anon;
do $$declare blocked boolean:=false;begin begin perform public.ml_report_question('facts','fixture','A','value','');exception when insufficient_privilege then blocked:=true;end;assert blocked,'anon cannot call report endpoint';end $$;
reset role;
select 'question_quality_assertions_passed' as result;
rollback;
