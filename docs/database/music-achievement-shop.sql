-- Extends the installed wallet; balances, inventory and old reward history remain intact.
-- Apply player-achievements.sql first. Only server-scored Daily evidence mints coins.
alter table ml_private.cosmetic_catalog drop constraint cosmetic_catalog_kind_check;
alter table ml_private.cosmetic_catalog add constraint cosmetic_catalog_kind_check check(kind in ('frame','color','music','title'));
alter table ml_private.cosmetic_catalog add column if not exists unlock_achievement text;
insert into ml_private.cosmetic_catalog(id,kind,name,price,sort,unlock_achievement) values
 ('music-game-night','music','Game Night',0,20,null),
 ('music-night-drive','music','Night Drive · House',60,21,null),
 ('music-pixel-riot','music','Pixel Riot · Breakbeat',100,22,null),
 ('music-moon-bounce','music','Moon Bounce · Glitch',140,23,null),
 ('title-none','title','Ohne Titel',0,30,null),
 ('title-daily-5','title','Dranbleiber',0,31,'daily-5'),
 ('title-daily-10','title','Daily-Profi',0,32,'daily-10'),
 ('title-daily-30','title','Daily-Legende',0,33,'daily-30'),
 ('title-score-20','title','Punktejäger',0,34,'daily-score-20')
on conflict(id) do nothing;
alter table ml_private.cosmetic_wallet add column if not exists music text not null default 'music-game-night' references ml_private.cosmetic_catalog(id);
alter table ml_private.cosmetic_wallet add column if not exists title text not null default 'title-none' references ml_private.cosmetic_catalog(id);
create table if not exists ml_private.achievement_rewards(
 user_id uuid not null references auth.users(id) on delete cascade,
 achievement_id text not null,
 amount integer not null check(amount>0),
 earned_at timestamptz not null default clock_timestamp(),
 primary key(user_id,achievement_id)
);
alter table ml_private.achievement_rewards enable row level security;
revoke all on ml_private.achievement_rewards from public,anon,authenticated;
CREATE OR REPLACE FUNCTION ml_private.cosmetics_impl(p_action text, p_item text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare u uuid:=auth.uid();today date:=(clock_timestamp() at time zone 'Europe/Berlin')::date;c ml_private.cosmetic_catalog;earned integer:=0;w ml_private.cosmetic_wallet;state jsonb;achievement_earned integer:=0;begin
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
 state:=ml_private.player_achievements_impl();
 with goals(id,metric,target,amount) as (values
 ('daily-3','daily_best_streak',3,20),('daily-5','daily_best_streak',5,40),
 ('daily-7','daily_best_streak',7,60),('daily-10','daily_best_streak',10,100),('daily-30','daily_best_streak',30,300),
 ('daily-score-5','daily_best_score',5,15),('daily-score-10','daily_best_score',10,30),('daily-score-20','daily_best_score',20,50)
 ),added as (
 insert into ml_private.achievement_rewards(user_id,achievement_id,amount)
 select u,id,amount from goals where (state->>metric)::integer>=target
 on conflict(user_id,achievement_id) do nothing returning amount
 ) select coalesce(sum(amount),0)::integer into achievement_earned from added;
 update ml_private.cosmetic_wallet set balance=balance+achievement_earned where user_id=u returning * into w;
 insert into ml_private.cosmetic_inventory(user_id,item_id)
 select u,catalog_item.id from ml_private.cosmetic_catalog catalog_item where catalog_item.unlock_achievement is not null
 and exists(select 1 from ml_private.achievement_rewards a where a.user_id=u and a.achievement_id=catalog_item.unlock_achievement)
 on conflict do nothing;
 if p_action in ('buy','equip') then
  select * into c from ml_private.cosmetic_catalog where id=p_item;
  if c.id is null then raise exception 'Unbekanntes Item.';end if;
  if c.unlock_achievement is not null and not exists(select 1 from ml_private.cosmetic_inventory where user_id=u and item_id=c.id) then raise exception 'Diesen Titel schaltest du durch ein Achievement frei.';end if;
  if c.price>0 and not exists(select 1 from ml_private.cosmetic_inventory where user_id=u and item_id=c.id) then
   if p_action='equip' then raise exception 'Dieses Item besitzt du noch nicht.';end if;
   if w.balance<c.price then raise exception 'Noch nicht genügend Münzen.';end if;
   update ml_private.cosmetic_wallet set balance=balance-c.price where user_id=u;
   insert into ml_private.cosmetic_inventory(user_id,item_id) values(u,c.id);
  end if;
  update ml_private.cosmetic_wallet set frame=case when c.kind='frame' then c.id else frame end,name_color=case when c.kind='color' then c.id else name_color end,music=case when c.kind='music' then c.id else music end,title=case when c.kind='title' then c.id else title end where user_id=u returning * into w;
 end if;
 return jsonb_build_object('balance',w.balance,'music',w.music,'title',w.title,'title_name',(select name from ml_private.cosmetic_catalog where id=w.title),'achievement_earned',achievement_earned,'achievements',coalesce((select jsonb_agg(achievement_id order by achievement_id) from ml_private.achievement_rewards where user_id=u),'[]'),'daily_best_streak',state->'daily_best_streak','daily_best_score',state->'daily_best_score','frame',w.frame,'name_color',w.name_color,'earned',earned,'catalog',(select jsonb_agg(jsonb_build_object('id',id,'kind',kind,'name',name,'price',price,'unlock_achievement',unlock_achievement,'owned',(price=0 and unlock_achievement is null) or exists(select 1 from ml_private.cosmetic_inventory i where i.user_id=u and i.item_id=cat.id)) order by sort) from ml_private.cosmetic_catalog cat),'rewards',coalesce((select jsonb_agg(to_jsonb(r) order by day desc,game,kind) from (select day,game,kind,amount from ml_private.cosmetic_rewards where user_id=u order by day desc,game,kind limit 30) r),'[]'));
end $function$;


revoke all on function ml_private.cosmetics_impl(text,text) from public,anon;
grant execute on function ml_private.cosmetics_impl(text,text) to authenticated;
