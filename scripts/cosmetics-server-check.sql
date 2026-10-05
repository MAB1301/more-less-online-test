-- Transactional fixtures: every user, attempt, coin and purchase is rolled back.
begin;
select set_config('ml_cosmetic_test.a',gen_random_uuid()::text,true),set_config('ml_cosmetic_test.b',gen_random_uuid()::text,true);
insert into auth.users(id,aud,role,is_anonymous) select current_setting('ml_cosmetic_test.'||id)::uuid,'authenticated','authenticated',true from unnest(array['a','b']) id;
insert into ml_private.daily_attempts(day,user_id,game,name,answered,score,completed_at)
select date '2026-10-04',current_setting('ml_cosmetic_test.'||id)::uuid,'estimate','Cosmetic test',5,500,timestamp '2026-10-04 20:00' at time zone 'Europe/Berlin' from unnest(array['a','b']) id;
insert into ml_private.daily_attempts(day,user_id,game,name,answered,score,completed_at) values
 ((clock_timestamp() at time zone 'Europe/Berlin')::date,current_setting('ml_cosmetic_test.a')::uuid,'facts','Cosmetic test',5,0,clock_timestamp()),
 (date '2026-10-04',current_setting('ml_cosmetic_test.a')::uuid,'facts','Late archive test',5,5,clock_timestamp());
set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('ml_cosmetic_test.a'),'role','authenticated','is_anonymous',true)::text,true);
do $$ declare p jsonb;b jsonb;begin
 p:=public.ml_cosmetics();if (p->>'balance')::int<>120 then raise exception 'Completion/rank/archive balance incorrect: %',p;end if;
 if (public.ml_cosmetics()->>'earned')::int<>0 then raise exception 'Duplicate claim';end if;
 p:=public.ml_cosmetics('buy','frame-neon');if p->>'frame'<>'frame-neon' or (p->>'balance')::int<>40 then raise exception 'Purchase incorrect';end if;
 if (public.ml_cosmetics('buy','frame-neon')->>'balance')::int<>40 then raise exception 'Owned item charged twice';end if;
 begin perform public.ml_cosmetics('buy','frame-gold');raise exception 'Overspend allowed';exception when others then if sqlerrm<>'Noch nicht genügend Münzen.' then raise;end if;end;
 begin perform public.ml_cosmetics('equip','color-cyan');raise exception 'Unowned item equipped';exception when others then if sqlerrm<>'Dieses Item besitzt du noch nicht.' then raise;end if;end;
 begin perform public.ml_cosmetics('record','fake');raise exception 'Fake client reward accepted';exception when others then if sqlerrm<>'Invalid cosmetic action' then raise;end if;end;
 begin update ml_private.cosmetic_wallet set balance=100000;raise exception 'Client writes wallet';exception when insufficient_privilege then null;end;
 begin select count(*) into b from ml_private.cosmetic_inventory;raise exception 'Client reads inventory';exception when insufficient_privilege then null;end;
 perform public.ml_cosmetics('equip','frame-starter');perform public.ml_cosmetics('equip','frame-neon');
 b:=public.ml_player_hub('board',jsonb_build_object('game','estimate','day','2026-10-04'));
 if not exists(select 1 from jsonb_array_elements(b->'leaderboard') e where (e->>'mine')::boolean and e->>'frame'='frame-neon') then raise exception 'Extended board missing equipped frame';end if;
 b:=public.ml_daily_game('home',null,date '2026-10-04',null,null,0,'estimate');
 if not exists(select 1 from jsonb_array_elements(b->'leaderboard') e where (e->>'mine')::boolean and e->>'frame'='frame-neon') then raise exception 'Daily board missing frame';end if;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('ml_cosmetic_test.b'),'role','authenticated','is_anonymous',true)::text,true);
do $$ declare p jsonb;begin
 p:=public.ml_cosmetics();if (p->>'balance')::int<>110 then raise exception 'Tie reward differs';end if;
 begin perform public.ml_cosmetics('equip','frame-neon');raise exception 'Foreign ownership accepted';exception when others then if sqlerrm<>'Dieses Item besitzt du noch nicht.' then raise;end if;end;
end $$;
set local role anon;
do $$ begin begin perform public.ml_cosmetics();raise exception 'Unauthenticated wallet access';exception when insufficient_privilege then null;end;end $$;
reset role;
select 'PASS: server rewards, tie rank, archive exclusion, repeat claims/purchases, insufficient funds, ownership, RLS/privileges and both leaderboard decorations' as result;
rollback;
