begin;
create temporary table recovery_users(n integer,id uuid default gen_random_uuid());
insert into recovery_users(n) values(1),(2),(3);grant select on recovery_users to authenticated;
insert into auth.users(id,aud,role,is_anonymous) select id,'authenticated','authenticated',true from recovery_users;
select set_config('request.jwt.claim.sub',(select id::text from recovery_users where n=1),true);
create temporary table recovery_room as select room_id id from public.ml_create_room('Recovery host','{}');grant select on recovery_room to authenticated;
select set_config('request.jwt.claim.sub',(select id::text from recovery_users where n=2),true);
select public.ml_join_room((select code from public.rooms where id=(select id from recovery_room)),'Recovery guest');
set local role authenticated;
do $$declare s jsonb;blocked boolean:=false;begin
 s:=public.ml_room_recovery((select id from recovery_room),'state');assert not (s->>'can_claim')::boolean,'active host protected';
 begin perform public.ml_room_recovery((select id from recovery_room),'claim');exception when others then blocked:=true;end;assert blocked,'early claim rejected';
end $$;
reset role;
update public.players set last_seen_at=clock_timestamp()-interval '91 seconds',connected=false where user_id=(select id from recovery_users where n=1) and room_id=(select id from recovery_room);
set local role authenticated;
do $$declare s jsonb;begin
 s:=public.ml_room_recovery((select id from recovery_room),'state');assert (s->>'can_claim')::boolean,'stale host reclaimable';
 s:=public.ml_room_recovery((select id from recovery_room),'claim');assert (s->>'host_id')::uuid=(select id from recovery_users where n=2),'member becomes host';
 assert (s->>'host_connected')::boolean,'claimed host connected';
end $$;
reset role;
select set_config('request.jwt.claim.sub',(select id::text from recovery_users where n=1),true);
set local role authenticated;
do $$declare blocked boolean:=false;begin
 begin perform public.ml_room_recovery((select id from recovery_room),'claim');exception when others then blocked:=true;end;assert blocked,'returning old host cannot steal active leadership';
end $$;
reset role;
select set_config('request.jwt.claim.sub',(select id::text from recovery_users where n=3),true);
set local role authenticated;
do $$declare blocked boolean:=false;begin
 begin perform public.ml_room_recovery((select id from recovery_room),'state');exception when others then blocked:=true;end;assert blocked,'nonmember cannot inspect room';
end $$;
reset role;
select set_config('request.jwt.claim.sub',(select id::text from recovery_users where n=2),true);
set local role authenticated;
select public.ml_room_recovery((select id from recovery_room),'leave');
reset role;
do $$begin assert not (select connected from public.players where room_id=(select id from recovery_room) and user_id=(select id from recovery_users where n=2)),'explicit leave visible';assert (select count(*) from public.players where room_id=(select id from recovery_room))=2,'roster preserved';end $$;
set local role anon;
do $$declare blocked boolean:=false;begin begin perform public.ml_room_recovery(gen_random_uuid(),'state');exception when insufficient_privilege then blocked:=true;end;assert blocked,'unauthenticated access denied';end $$;
rollback;
