begin;
create table if not exists ml_private.wheel_rewards(user_id uuid references auth.users(id) on delete cascade,day date not null,xp integer not null check(xp in (10,20,30,50,75,100)),primary key(user_id,day));
alter table ml_private.wheel_rewards enable row level security;
revoke all on ml_private.wheel_rewards from public,anon,authenticated;
alter function ml_private.player_xp(uuid) rename to player_xp_before_wheel;
create or replace function ml_private.player_xp(p_user uuid) returns jsonb language sql stable security definer set search_path='' as $$
 with base as (select ml_private.player_xp_before_wheel(p_user) as b),wheel as (select coalesce(sum(xp),0)::bigint as x from ml_private.wheel_rewards where user_id=p_user)
 select b||ml_private.xp_level((b->>'xp')::bigint+x)||jsonb_build_object('wheel_xp',x) from base,wheel
$$;
revoke all on function ml_private.player_xp(uuid),ml_private.player_xp_before_wheel(uuid) from public,anon,authenticated;
alter function ml_private.casino_impl(text,integer,uuid,uuid) rename to casino_before_wheel;
create or replace function ml_private.casino_impl(p_action text,p_bet integer,p_request uuid,p_owner uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();today date:=(clock_timestamp() at time zone 'Europe/Berlin')::date;award integer;v integer;r jsonb;old ml_private.casino_requests;begin
 if u is null or u is distinct from p_owner then raise exception 'Spielerzugang geändert. Casino erneut öffnen.';end if;
 if p_action='wheel' then
  if p_request is null then raise exception 'Anfrage-ID fehlt.';end if;
  insert into ml_private.cosmetic_wallet(user_id) values(u) on conflict do nothing;
  perform 1 from ml_private.cosmetic_wallet where user_id=u for update;
  select * into old from ml_private.casino_requests where user_id=u and request_id=p_request;
  if found then if old.action<>'wheel' or old.bet is distinct from p_bet then raise exception 'Anfrage passt nicht zum gespeicherten Zug.';end if;return old.response;end if;
  select xp into award from ml_private.wheel_rewards where user_id=u and day=today;
  if found then raise exception 'Heute bereits gedreht. Morgen gibt es einen neuen Dreh.';end if;
  loop v:=get_byte(extensions.gen_random_bytes(1),0);exit when v<252;end loop;
  award:=(array[10,20,30,50,75,100])[v%6+1];insert into ml_private.wheel_rewards values(u,today,award);
  r:=ml_private.casino_before_wheel('home',0,null,u)||jsonb_build_object('wheel_award',award,'wheel_claimed',true,'wheel_today',award,'wheel_day',today,'progression',ml_private.player_xp(u));
  insert into ml_private.casino_requests(user_id,request_id,action,bet,response) values(u,p_request,p_action,p_bet,r);return r;
 end if;
 r:=ml_private.casino_before_wheel(p_action,p_bet,p_request,p_owner);
 return r||jsonb_build_object('wheel_claimed',exists(select 1 from ml_private.wheel_rewards where user_id=u and day=today),'wheel_today',(select xp from ml_private.wheel_rewards where user_id=u and day=today),'wheel_day',today);
end $$;
revoke all on function ml_private.casino_before_wheel(text,integer,uuid,uuid),ml_private.casino_impl(text,integer,uuid,uuid) from public,anon,authenticated;
grant execute on function ml_private.casino_impl(text,integer,uuid,uuid) to authenticated;
commit;
