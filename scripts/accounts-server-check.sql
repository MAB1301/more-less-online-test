-- All fixtures and mutations are rolled back; no test emails are sent.
begin;
select set_config('ml_test.a',gen_random_uuid()::text,true),set_config('ml_test.b',gen_random_uuid()::text,true),set_config('ml_test.c',gen_random_uuid()::text,true),set_config('ml_test.g',gen_random_uuid()::text,true);
insert into auth.users(id,aud,role,is_anonymous) select current_setting('ml_test.'||id)::uuid,'authenticated','authenticated',id='g' from unnest(array['a','b','c','g']) id;
insert into public.ml_profiles(user_id,handle,display_name) select current_setting('ml_test.'||id)::uuid,'test_'||left(replace(current_setting('ml_test.'||id),'-',''),16),'Test' from unnest(array['a','b','c']) id;
-- Handles have a 24-character limit, use fixture UUID prefixes instead.
insert into public.ml_account_settings(user_id) values(current_setting('ml_test.a')::uuid),(current_setting('ml_test.b')::uuid);
set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('ml_test.a'),'role','authenticated','is_anonymous',false)::text,true);
do $$ begin
 if (select count(*) from public.ml_profiles where user_id in (current_setting('ml_test.a')::uuid,current_setting('ml_test.b')::uuid,current_setting('ml_test.c')::uuid))<>3 then raise exception 'Public names inaccessible';end if;
 if (select count(*) from public.ml_account_settings)<>1 then raise exception 'Private settings leaked';end if;
 begin insert into public.ml_friendships values(current_setting('ml_test.b')::uuid,current_setting('ml_test.c')::uuid,'pending',now());raise exception 'Forged sender allowed';exception when insufficient_privilege then null;end;
 begin insert into public.ml_account_settings(user_id) values(current_setting('ml_test.c')::uuid);raise exception 'Foreign settings insert allowed';exception when insufficient_privilege then null;end;
 begin update public.ml_account_settings set user_id=current_setting('ml_test.c')::uuid;raise exception 'Settings ownership change allowed';exception when insufficient_privilege then null;end;
end $$;
insert into public.ml_friendships(sender_id,recipient_id) values(current_setting('ml_test.a')::uuid,current_setting('ml_test.b')::uuid);
update public.ml_friendships set status='accepted';
do $$ begin if (select status from public.ml_friendships)<>'pending' then raise exception 'Sender accepted own request';end if;end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('ml_test.b'),'role','authenticated','is_anonymous',false)::text,true);
update public.ml_friendships set status='accepted';
do $$ begin
 if (select status from public.ml_friendships)<>'accepted' then raise exception 'Recipient cannot accept';end if;
 begin update public.ml_friendships set sender_id=current_setting('ml_test.c')::uuid;raise exception 'Participant rewritten';exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('ml_test.c'),'role','authenticated','is_anonymous',false)::text,true);
do $$ begin if (select count(*) from public.ml_friendships)<>0 then raise exception 'Unrelated friend data leaked';end if;if (select count(*) from public.ml_account_settings)<>0 then raise exception 'Foreign settings leaked';end if;end $$;
delete from public.ml_friendships;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('ml_test.g'),'role','authenticated','is_anonymous',true)::text,true);
do $$ begin
 if (select count(*) from public.ml_profiles)<>0 then raise exception 'Guest reads profiles';end if;
 begin insert into public.ml_profiles(user_id,handle,display_name) values(current_setting('ml_test.g')::uuid,'guest_test','Guest');raise exception 'Guest creates profile';exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('ml_test.a'),'role','authenticated','is_anonymous',false)::text,true);
do $$ begin if (select count(*) from public.ml_friendships)<>1 then raise exception 'Unrelated delete changed friendship';end if;end $$;
delete from public.ml_friendships;
do $$ begin if (select count(*) from public.ml_friendships)<>0 then raise exception 'Participant cannot remove friendship';end if;end $$;
reset role;
select 'PASS: guest, sender, recipient, unrelated account, private settings and forged ownership' as result;
rollback;
