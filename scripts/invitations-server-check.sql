-- All fixtures and mutations are rolled back; no test emails are sent.
begin;
select set_config('ml_test.a',gen_random_uuid()::text,true),set_config('ml_test.b',gen_random_uuid()::text,true),set_config('ml_test.c',gen_random_uuid()::text,true),set_config('ml_test.g',gen_random_uuid()::text,true);
insert into auth.users(id,aud,role,is_anonymous) select current_setting('ml_test.'||id)::uuid,'authenticated','authenticated',id='g' from unnest(array['a','b','c','g']) id;
insert into public.ml_profiles(user_id,handle,display_name) select current_setting('ml_test.'||id)::uuid,'test_'||left(replace(current_setting('ml_test.'||id),'-',''),16),'Test' from unnest(array['a','b','c']) id;
insert into public.ml_friendships(sender_id,recipient_id,status) values(current_setting('ml_test.a')::uuid,current_setting('ml_test.b')::uuid,'accepted');
set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('ml_test.a'),'role','authenticated','is_anonymous',false)::text,true);
select set_config('ml_test.room',(select room_id::text from public.ml_create_room('Host','{"game":"moreless","game_mode":"CLASSIC","max_players":32}'::jsonb)),true);
select set_config('ml_test.invite',public.ml_send_game_invitation(current_setting('ml_test.b')::uuid,current_setting('ml_test.room')::uuid)::text,true);
do $$ begin
 begin perform public.ml_send_game_invitation(current_setting('ml_test.c')::uuid,current_setting('ml_test.room')::uuid);raise exception 'Nonfriend invitation allowed';exception when insufficient_privilege then null;end;
 begin perform public.ml_send_game_invitation(current_setting('ml_test.b')::uuid,current_setting('ml_test.room')::uuid);raise exception 'Duplicate allowed';exception when unique_violation then null;end;
 begin update public.ml_game_invitations set recipient_id=current_setting('ml_test.c')::uuid;raise exception 'Recipient rewritten';exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('ml_test.c'),'role','authenticated','is_anonymous',false)::text,true);
do $$ begin
 if (select count(*) from public.ml_game_invitations)<>0 then raise exception 'Invitations leaked';end if;
 begin perform public.ml_accept_game_invitation(current_setting('ml_test.invite')::uuid,'Other');raise exception 'Wrong recipient accepted';exception when raise_exception then if SQLERRM='Wrong recipient accepted' then raise;end if;end;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('ml_test.b'),'role','authenticated','is_anonymous',false)::text,true);
select * from public.ml_accept_game_invitation(current_setting('ml_test.invite')::uuid,'Friend');
do $$ begin
 if (select status from public.ml_game_invitations where id=current_setting('ml_test.invite')::uuid)<>'accepted' then raise exception 'Invite not accepted';end if;
 if not exists(select 1 from public.players where room_id=current_setting('ml_test.room')::uuid and user_id=current_setting('ml_test.b')::uuid) then raise exception 'No room membership';end if;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('ml_test.a'),'role','authenticated','is_anonymous',false)::text,true);
select set_config('ml_test.invite2',public.ml_send_game_invitation(current_setting('ml_test.b')::uuid,current_setting('ml_test.room')::uuid)::text,true);
reset role;
update public.ml_game_invitations set expires_at=now()-interval '1 second' where id=current_setting('ml_test.invite2')::uuid;
set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('ml_test.b'),'role','authenticated','is_anonymous',false)::text,true);
do $$ begin
 begin perform public.ml_accept_game_invitation(current_setting('ml_test.invite2')::uuid,'Friend');raise exception 'Expired accepted';exception when raise_exception then if SQLERRM='Expired accepted' then raise;end if;end;
end $$;
reset role;
update public.ml_game_invitations set expires_at=now()+interval '15 minutes' where id=current_setting('ml_test.invite2')::uuid;
update public.rooms set status='playing' where id=current_setting('ml_test.room')::uuid;
set local role authenticated;
do $$ begin
 begin perform public.ml_accept_game_invitation(current_setting('ml_test.invite2')::uuid,'Friend');raise exception 'Started room accepted';exception when raise_exception then if SQLERRM='Started room accepted' then raise;end if;end;
 if (select status from public.ml_game_invitations where id=current_setting('ml_test.invite2')::uuid)<>'pending' then raise exception 'Failed join consumed invitation';end if;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('ml_test.a'),'role','authenticated','is_anonymous',false)::text,true);
select set_config('ml_test.fullroom',(select room_id::text from public.ml_create_room('Host','{"game":"quiz","game_mode":"standard","max_players":1}'::jsonb)),true);
select set_config('ml_test.fullinvite',public.ml_send_game_invitation(current_setting('ml_test.b')::uuid,current_setting('ml_test.fullroom')::uuid)::text,true);
select set_config('request.jwt.claims',json_build_object('sub',current_setting('ml_test.b'),'role','authenticated','is_anonymous',false)::text,true);
do $$ begin
 begin perform public.ml_accept_game_invitation(current_setting('ml_test.fullinvite')::uuid,'Friend');raise exception 'Full room accepted';exception when raise_exception then if SQLERRM='Full room accepted' then raise;end if;end;
end $$;
update public.ml_game_invitations set status='declined' where id=current_setting('ml_test.fullinvite')::uuid;
do $$ begin if (select status from public.ml_game_invitations where id=current_setting('ml_test.fullinvite')::uuid)<>'declined' then raise exception 'Decline failed';end if;end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('ml_test.g'),'role','authenticated','is_anonymous',true)::text,true);
do $$ begin if (select count(*) from public.ml_game_invitations)<>0 then raise exception 'Guest reads invites';end if;end $$;
reset role;
select 'PASS: friend invitation, atomic join, nonfriend, wrong recipient, expiry, started/full room, decline, guest, duplicate and immutable recipient' as result;
rollback;
