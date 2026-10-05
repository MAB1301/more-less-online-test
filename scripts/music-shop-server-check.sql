begin;
do $test$
declare u uuid:=gen_random_uuid();v uuid:=gen_random_uuid();today date:=(clock_timestamp() at time zone 'Europe/Berlin')::date;a jsonb;b jsonb;d date;
begin
 insert into auth.users(id,aud,role) values(u,'authenticated','authenticated'),(v,'authenticated','authenticated');
 for i in 1..10 loop
  d:=today-i;
  insert into ml_private.daily_attempts(day,user_id,name,answered,score,completed_at,game)
  values(d,u,'Shop fixture',10,10,(d::timestamp+interval '12 hours') at time zone 'Europe/Berlin','moreless');
 end loop;
 insert into ml_private.daily_attempts(day,user_id,name,answered,score,completed_at,game)
 values(today-1,u,'Shop fixture',10,20,((today-1)::timestamp+interval '12 hours') at time zone 'Europe/Berlin','estimate');
 perform set_config('request.jwt.claim.sub',u::text,true);
 a:=public.ml_cosmetics('profile');
 if (a->>'daily_best_streak')::int<>10 or (select coalesce(sum(amount),0) from ml_private.achievement_rewards where user_id=u)<>315 then raise exception 'Daily milestones incorrect: %',a;end if;
 if not exists(select 1 from jsonb_array_elements(a->'catalog') c where c->>'id'='title-daily-10' and (c->>'owned')::boolean) then raise exception 'title missing';end if;
 b:=public.ml_cosmetics('profile');
 if a->>'balance'<>b->>'balance' or (b->>'achievement_earned')::int<>0 then raise exception 'repeat minted coins';end if;
 b:=public.ml_cosmetics('buy','music-night-drive');
 if (a->>'balance')::int-(b->>'balance')::int<>60 or b->>'music'<>'music-night-drive' then raise exception 'music purchase failed';end if;
 a:=public.ml_cosmetics('buy','music-night-drive');
 if a->>'balance'<>b->>'balance' then raise exception 'repeat buy charged twice';end if;
 a:=public.ml_cosmetics('equip','title-daily-10');
 if a->>'title_name'<>'Daily-Profi' then raise exception 'title equip failed';end if;
 perform set_config('request.jwt.claim.sub',v::text,true);
 a:=public.ml_cosmetics('profile');
 if (a->>'balance')::int<>0 or a->>'music'<>'music-game-night' then raise exception 'wallet crossed accounts';end if;
 begin perform public.ml_cosmetics('equip','music-night-drive');raise exception 'unowned music equipped';exception when others then if sqlerrm<>'Dieses Item besitzt du noch nicht.' then raise;end if;end;
 begin perform public.ml_cosmetics('buy','music-night-drive');raise exception 'insufficient coins bypassed';exception when others then if sqlerrm<>'Noch nicht genügend Münzen.' then raise;end if;end;
 begin perform public.ml_cosmetics('equip','title-daily-10');raise exception 'locked title bypassed';exception when others then if sqlerrm<>'Diesen Titel schaltest du durch ein Achievement frei.' then raise;end if;end;
 -- Client-reported Solo records cannot mint a wallet reward.
 perform public.ml_player_hub('record',jsonb_build_object('game','moreless','run_id','shop-fixture','mode','CLASSIC','answered',20,'correct',20,'best_streak',20,'score',99999));
 for i in 1..10 loop
  insert into ml_private.daily_attempts(day,user_id,name,answered,score,completed_at,game)
  values(today-i,v,'Archive fixture',10,100,clock_timestamp(),'moreless');
 end loop;
 a:=public.ml_cosmetics('profile');
 if (a->>'balance')::int<>0 or (a->>'daily_best_streak')::int<>0 or (a->>'daily_best_score')::int<>0 then raise exception 'archive or Solo record minted coins';end if;
 if has_function_privilege('anon','public.ml_cosmetics(text,text)','execute') or has_function_privilege('anon','public.ml_player_achievements()','execute') then raise exception 'anonymous API role can mint';end if;
 if has_table_privilege('authenticated','ml_private.achievement_rewards','insert') or has_table_privilege('authenticated','ml_private.cosmetic_wallet','update') then raise exception 'client can write balance';end if;
 if not (select relrowsecurity from pg_class where oid='ml_private.achievement_rewards'::regclass) then raise exception 'RLS missing';end if;
 perform set_config('request.jwt.claim.sub','',true);
 begin perform public.ml_cosmetics('profile');raise exception 'missing identity accepted';exception when others then if sqlerrm<>'Authentication required' then raise;end if;end;
end $test$;
select 'PASS: distinct Daily days, once-only rewards, titles, purchases, account isolation, archive/Solo exclusion and permissions' as result;
rollback;
