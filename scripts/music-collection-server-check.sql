begin;
do $test$
declare u uuid:=gen_random_uuid();v uuid:=gen_random_uuid();item record;res jsonb;expected integer:=1000;begin
 insert into auth.users(id,aud,role) values(u,'authenticated','authenticated'),(v,'authenticated','authenticated');
 perform set_config('request.jwt.claim.sub',u::text,true);perform public.ml_cosmetics('profile');
 update ml_private.cosmetic_wallet set balance=1000 where user_id=u;
 if (select count(*) from ml_private.cosmetic_catalog where kind='music' and (id in ('music-game-night','music-night-drive','music-pixel-riot','music-moon-bounce') or sort between 200 and 207))<>12 then raise exception 'Music catalog missing tracks';end if;
 for item in select * from ml_private.cosmetic_catalog where kind='music' and sort between 200 and 207 order by sort loop
  res:=public.ml_cosmetics('buy',item.id);expected:=expected-item.price;
  if (res->>'balance')::integer<>expected or res->>'music'<>item.id then raise exception 'Purchase/equipment failed: %',item.id;end if;
  res:=public.ml_cosmetics('buy',item.id);if (res->>'balance')::integer<>expected then raise exception 'Repeat purchase charged';end if;
 end loop;
 res:=public.ml_cosmetics('equip','music-satie-lounge');if res->>'music'<>'music-satie-lounge' or (res->>'balance')::integer<>expected then raise exception 'Track equip changed balance';end if;
 perform set_config('request.jwt.claim.sub',v::text,true);res:=public.ml_cosmetics('profile');
 if (res->>'balance')::integer<>0 or res->>'music'<>'music-game-night' then raise exception 'Account state leaked';end if;
 begin perform public.ml_cosmetics('equip','music-satie-lounge');raise exception 'Unowned track equipped';exception when others then if sqlerrm='Unowned track equipped' then raise;end if;end;
end $test$;
select 'PASS: twelve catalog tracks, eight purchases, repeated purchase/equipment and owner isolation' as result;
rollback;
