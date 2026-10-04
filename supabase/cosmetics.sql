-- Earned cosmetics. Client scores and archived completions never mint coins.
create table if not exists ml_private.cosmetic_catalog(
 id text primary key,kind text not null check(kind in ('frame','color')),name text not null,price integer not null check(price>=0),sort integer not null);
insert into ml_private.cosmetic_catalog values
 ('frame-starter','frame','Orbit',0,1),('frame-neon','frame','Neon Pulse',80,2),('frame-emerald','frame','Emerald Circuit',140,3),('frame-gold','frame','Podium Gold',240,4),
 ('color-default','color','Mondlicht',0,5),('color-cyan','color','Electric Cyan',60,6),('color-rose','color','Cosmic Rose',100,7),('color-gold','color','Champion Gold',180,8)
 on conflict(id) do nothing;
create table if not exists ml_private.cosmetic_wallet(
 user_id uuid primary key references auth.users(id) on delete cascade,
 balance integer not null default 0 check(balance>=0),
 frame text not null default 'frame-starter' references ml_private.cosmetic_catalog(id),
 name_color text not null default 'color-default' references ml_private.cosmetic_catalog(id));
create table if not exists ml_private.cosmetic_inventory(
 user_id uuid not null references auth.users(id) on delete cascade,item_id text not null references ml_private.cosmetic_catalog(id),primary key(user_id,item_id));
create table if not exists ml_private.cosmetic_rewards(
 user_id uuid not null references auth.users(id) on delete cascade,day date not null,game text not null,kind text not null check(kind in ('complete','placement')),
 amount integer not null check(amount>0),primary key(user_id,day,game,kind));
alter table ml_private.cosmetic_catalog enable row level security;
alter table ml_private.cosmetic_wallet enable row level security;
alter table ml_private.cosmetic_inventory enable row level security;
alter table ml_private.cosmetic_rewards enable row level security;
revoke all on ml_private.cosmetic_catalog,ml_private.cosmetic_wallet,ml_private.cosmetic_inventory,ml_private.cosmetic_rewards from public,anon,authenticated;
create index if not exists daily_cosmetic_rank on ml_private.daily_attempts(day,game,score desc) where completed_at is not null;
create or replace function ml_private.cosmetics_impl(p_action text,p_item text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();today date:=(clock_timestamp() at time zone 'Europe/Berlin')::date;c ml_private.cosmetic_catalog;earned integer:=0;w ml_private.cosmetic_wallet;begin
 if u is null then raise exception 'Authentication required';end if;
 if p_action is null or p_action not in ('profile','buy','equip') then raise exception 'Invalid cosmetic action';end if;
 insert into ml_private.cosmetic_wallet(user_id) values(u) on conflict do nothing;
 select * into w from ml_private.cosmetic_wallet where user_id=u for update;
 -- Serialize claims/purchases with the wallet lock. Unique reward keys prevent repeat claims.
 with eligible as (
 select * from ml_private.daily_attempts where user_id=u and day>=date '2026-10-04' and day<=today and completed_at>=day::timestamp at time zone 'Europe/Berlin' and completed_at<(day+1)::timestamp at time zone 'Europe/Berlin'
 ),own_ranks as (
 select a.*,1+(select count(distinct b.score) from ml_private.daily_attempts b where b.day=a.day and b.game=a.game and b.score>a.score and b.completed_at>=b.day::timestamp at time zone 'Europe/Berlin' and b.completed_at<(b.day+1)::timestamp at time zone 'Europe/Berlin') as rank from eligible a where a.day<today and a.score>0
 ),rewards as (
 select day,game,'complete' as kind,10 as amount from eligible
 union all select day,game,'placement',case rank when 1 then 100 when 2 then 60 else 40 end from own_ranks where rank<=3
 ),added as (
 insert into ml_private.cosmetic_rewards(user_id,day,game,kind,amount) select u,day,game,kind,amount from rewards on conflict do nothing returning amount
 ) select coalesce(sum(amount),0)::integer into earned from added;
 update ml_private.cosmetic_wallet set balance=balance+earned where user_id=u returning * into w;
 if p_action in ('buy','equip') then
  select * into c from ml_private.cosmetic_catalog where id=p_item;
  if c.id is null then raise exception 'Unbekanntes Item.';end if;
  if c.price>0 and not exists(select 1 from ml_private.cosmetic_inventory where user_id=u and item_id=c.id) then
   if p_action='equip' then raise exception 'Dieses Item besitzt du noch nicht.';end if;
   if w.balance<c.price then raise exception 'Noch nicht genügend Münzen.';end if;
   update ml_private.cosmetic_wallet set balance=balance-c.price where user_id=u;
   insert into ml_private.cosmetic_inventory(user_id,item_id) values(u,c.id);
  end if;
  update ml_private.cosmetic_wallet set frame=case when c.kind='frame' then c.id else frame end,name_color=case when c.kind='color' then c.id else name_color end where user_id=u returning * into w;
 end if;
 return jsonb_build_object('balance',w.balance,'frame',w.frame,'name_color',w.name_color,'earned',earned,'catalog',(select jsonb_agg(jsonb_build_object('id',id,'kind',kind,'name',name,'price',price,'owned',price=0 or exists(select 1 from ml_private.cosmetic_inventory i where i.user_id=u and i.item_id=cat.id)) order by sort) from ml_private.cosmetic_catalog cat),'rewards',coalesce((select jsonb_agg(to_jsonb(r) order by day desc,game,kind) from (select day,game,kind,amount from ml_private.cosmetic_rewards where user_id=u order by day desc,game,kind limit 30) r),'[]'));
end $$;
create or replace function public.ml_cosmetics(p_action text default 'profile',p_item text default null)
returns jsonb language sql security invoker set search_path='' as $$select ml_private.cosmetics_impl(p_action,p_item);$$;
revoke all on function ml_private.cosmetics_impl(text,text),public.ml_cosmetics(text,text) from public,anon;
grant execute on function ml_private.cosmetics_impl(text,text),public.ml_cosmetics(text,text) to authenticated;
