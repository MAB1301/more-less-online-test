begin;
do $test$
declare u uuid:=gen_random_uuid();v uuid:=gen_random_uuid();id uuid;one jsonb;two jsonb;prev integer;now_balance integer;expected integer;award integer;i integer;n integer;begin
 insert into auth.users(id,aud,role) values(u,'authenticated','authenticated'),(v,'authenticated','authenticated');
 perform set_config('request.jwt.claim.sub',u::text,true);
 insert into ml_private.cosmetic_wallet(user_id,balance) values(u,10000);
 one:=public.ml_casino('home',null,0,null,u);assert (one->>'balance')::integer=10000;
 begin perform public.ml_casino('home',null,0,null,v);raise exception 'owner isolation failed';exception when others then assert sqlerrm='Spielerzugang geändert. Casino erneut öffnen.';end;
 begin perform public.ml_casino('slots',null,-10,gen_random_uuid(),u);raise exception 'invalid bet allowed';exception when others then assert sqlerrm='Wähle 10, 20, 50 oder 100 Münzen.';end;
 for i in 1..40 loop
  select balance into prev from ml_private.cosmetic_wallet where user_id=u;id:=gen_random_uuid();one:=public.ml_casino('slots',null,10,id,u);
  assert jsonb_array_length(one->'slots')=3;assert not(one?'deck');
  expected:=case when one->'slots'->0=one->'slots'->1 and one->'slots'->1=one->'slots'->2 then 120 when one->'slots'->0=one->'slots'->1 or one->'slots'->0=one->'slots'->2 or one->'slots'->1=one->'slots'->2 then 10 else 0 end;
  assert (one->>'payout')::integer=expected;assert (one->>'balance')::integer=prev-10+expected;
  two:=public.ml_casino('slots',null,10,id,u);assert two=one;select balance into now_balance from ml_private.cosmetic_wallet where user_id=u;assert now_balance=(one->>'balance')::integer;
 end loop;
 for i in 1..30 loop
  one:=public.ml_casino('deal',null,20,gen_random_uuid(),u);assert not(one?'deck');
  if one->>'status'='playing' then
   assert jsonb_array_length(one->'dealer')=1;assert one->>'dealer_total' is null;
   begin perform public.ml_casino('slots',null,10,gen_random_uuid(),u);raise exception 'active replacement allowed';exception when others then assert sqlerrm='Beende zuerst deine Blackjack-Runde.';end;
   if i%2=0 then one:=public.ml_casino('hit',null,0,gen_random_uuid(),u);end if;
   if one->>'status'='playing' then id:=gen_random_uuid();one:=public.ml_casino('stand',null,0,id,u);two:=public.ml_casino('stand',null,0,id,u);assert one=two;end if;
  end if;
  assert one->>'status'='done';assert jsonb_array_length(one->'dealer')>=2;
 end loop;
 -- Deterministic edge cases are injected only into synthetic test state, then rolled back.
 update ml_private.casino_state set game='blackjack',status='playing',bet=20,player=array[0,13],dealer=array[9,7],deck=array[12],cursor=1,payout=0 where user_id=u;
 one:=public.ml_casino('hit',null,0,gen_random_uuid(),u);assert (one->>'player_total')::integer=12;assert one->>'status'='playing';
 one:=public.ml_casino('stand',null,0,gen_random_uuid(),u);assert (one->>'payout')::integer=0;
 update ml_private.casino_state set status='playing',player=array[9,7],dealer=array[22,20],payout=0 where user_id=u;
 one:=public.ml_casino('stand',null,0,gen_random_uuid(),u);assert (one->>'payout')::integer=20;
 update ml_private.casino_state set status='playing',player=array[9,8],dealer=array[22,19],payout=0 where user_id=u;
 one:=public.ml_casino('stand',null,0,gen_random_uuid(),u);assert (one->>'payout')::integer=40;
 update ml_private.casino_state set status='playing',player=array[9,8],dealer=array[22,19],deck=array[12],cursor=1,payout=0 where user_id=u;
 one:=public.ml_casino('hit',null,0,gen_random_uuid(),u);assert (one->>'player_total')::integer=29;assert one->>'status'='done';assert (one->>'payout')::integer=0;
 id:=gen_random_uuid();select balance into prev from ml_private.cosmetic_wallet where user_id=u;one:=public.ml_casino('wheel',null,0,id,u);award:=(one->>'wheel_award')::integer;assert award in (10,20,30,50,75,100);
 two:=public.ml_casino('wheel',null,0,id,u);assert two=one;assert (ml_private.player_xp(u)->>'wheel_xp')::integer=award;
 select balance into now_balance from ml_private.cosmetic_wallet where user_id=u;assert prev=now_balance;
 begin perform public.ml_casino('wheel',null,0,gen_random_uuid(),u);raise exception 'extra wheel allowed';exception when others then assert sqlerrm='Heute bereits gedreht. Morgen gibt es einen neuen Dreh.';end;
 perform set_config('request.jwt.claim.sub',v::text,true);two:=public.ml_casino('home',null,0,null,v);assert (two->>'balance')::integer=0;assert not(two->>'wheel_claimed')::boolean;
 assert not has_table_privilege('authenticated','ml_private.casino_state','SELECT');assert not has_table_privilege('authenticated','ml_private.casino_requests','INSERT');assert not has_table_privilege('authenticated','ml_private.wheel_rewards','INSERT');
 assert not has_function_privilege('anon','public.ml_casino(text,text,integer,uuid,uuid)','execute');
end $test$;
select 'PASS: server bets, immutable retries, hidden cards, ace scoring, payouts, wallet isolation and one daily XP reward' as result;
rollback;
