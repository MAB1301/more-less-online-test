-- Music, daily login and one server-charged rescue per match. Private tables only.
alter table ml_private.cosmetic_catalog drop constraint cosmetic_catalog_kind_check;
alter table ml_private.cosmetic_catalog add constraint cosmetic_catalog_kind_check check(kind in ('frame','color','music','win','title'));
alter table ml_private.cosmetic_wallet add column if not exists win_music text not null default 'win-victory';
insert into ml_private.cosmetic_catalog(id,kind,name,price,sort) values
 ('frame-plasma','frame','Plasma Crown',320,9),('frame-ice','frame','Frost Halo',160,10),('frame-sunset','frame','Sunset Orbit',200,11),('frame-stars','frame','Stardust',280,12),
 ('color-violet','color','Ultra Violet',120,13),('color-lime','color','Laser Lime',120,14),('color-sunset','color','Sunset Orange',140,15),
 ('music-game-night','music','Game Night',0,20),('music-midnight-lounge','music','Midnight Lounge',0,21),('music-cloud-drift','music','Cloud Drift',0,22),('music-arcade-pulse','music','Arcade Pulse',0,23),
 ('music-neon-drive','music','Neon Drive · Synthwave',160,24),('music-pocket-groove','music','Pocket Groove · Lo-Fi',120,25),('music-orbit-house','music','Orbit House · House',180,26),('music-pixel-quest','music','Pixel Quest · Chiptune',140,27),
 ('win-victory','win','First Light · Sieg',0,30),('win-gold-rush','win','Gold Rush · Sieg',100,31),('win-cosmic-win','win','Cosmic Win · Sieg',140,32) on conflict(id) do nothing;
create table if not exists ml_private.login_claims(user_id uuid references auth.users(id) on delete cascade,day date,streak int not null,amount int not null,primary key(user_id,day));
create table if not exists ml_private.solo_rescues(token uuid primary key default gen_random_uuid(),user_id uuid references auth.users(id) on delete cascade,game text not null,expires_at timestamptz not null default clock_timestamp()+interval '6 hours',spent boolean not null default false);
create table if not exists ml_private.match_rescues(user_id uuid references auth.users(id) on delete cascade,token uuid,room_id uuid references public.rooms(id) on delete cascade,game text not null,primary key(user_id,token));
create table if not exists ml_private.player_achievements(user_id uuid references auth.users(id) on delete cascade,id text,unlocked_at timestamptz not null default clock_timestamp(),primary key(user_id,id));
alter table ml_private.login_claims enable row level security;
alter table ml_private.solo_rescues enable row level security;
alter table ml_private.match_rescues enable row level security;
alter table ml_private.player_achievements enable row level security;
revoke all on ml_private.login_claims,ml_private.solo_rescues,ml_private.match_rescues,ml_private.player_achievements from public,anon,authenticated;
CREATE OR REPLACE FUNCTION ml_private.cosmetics_base_impl(p_action text, p_item text)
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
  update ml_private.cosmetic_wallet set frame=case when c.kind='frame' then c.id else frame end,name_color=case when c.kind='color' then c.id else name_color end,music=case when c.kind='music' then c.id else music end,title=case when c.kind='title' then c.id else title end,win_music=case when c.kind='win' then c.id else win_music end where user_id=u returning * into w;
 end if;
 return jsonb_build_object('balance',w.balance,'music',w.music,'background_music',w.music,'win_music',w.win_music,'title',w.title,'title_name',(select name from ml_private.cosmetic_catalog where id=w.title),'achievement_earned',achievement_earned,'achievements',coalesce((select jsonb_agg(achievement_id order by achievement_id) from ml_private.achievement_rewards where user_id=u),'[]'),'daily_best_streak',state->'daily_best_streak','daily_best_score',state->'daily_best_score','frame',w.frame,'name_color',w.name_color,'earned',earned,'catalog',(select jsonb_agg(jsonb_build_object('id',id,'kind',kind,'name',name,'price',price,'unlock_achievement',unlock_achievement,'owned',(price=0 and unlock_achievement is null) or exists(select 1 from ml_private.cosmetic_inventory i where i.user_id=u and i.item_id=cat.id)) order by sort) from ml_private.cosmetic_catalog cat),'rewards',coalesce((select jsonb_agg(to_jsonb(r) order by day desc,game,kind) from (select day,game,kind,amount from ml_private.cosmetic_rewards where user_id=u order by day desc,game,kind limit 30) r),'[]'));
end $function$;


revoke all on function ml_private.cosmetics_base_impl(text,text) from public,anon,authenticated;
create or replace function ml_private.cosmetics_impl(p_action text,p_item text) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();p jsonb;today date:=(clock_timestamp() at time zone 'Europe/Berlin')::date;last_claim ml_private.login_claims;streak int;gift int:=0;daily_earned int:=0;begin
 if u is null then raise exception 'Authentication required';end if;
 if p_action not in ('profile','buy','equip','login') or p_action is null then raise exception 'Invalid cosmetic action';end if;
 p:=ml_private.cosmetics_base_impl(case when p_action='login' then 'profile' else p_action end,p_item);
 daily_earned:=coalesce((p->>'earned')::int,0);
 if p_action='login' then
  select * into last_claim from ml_private.login_claims where user_id=u order by day desc limit 1;
  streak:=case when last_claim.day=today-1 then last_claim.streak+1 when last_claim.day=today then last_claim.streak else 1 end;
  insert into ml_private.login_claims values(u,today,streak,20+case when streak%7=0 then 50 else 0 end) on conflict do nothing returning amount into gift;
  gift:=coalesce(gift,0);update ml_private.cosmetic_wallet set balance=balance+gift where user_id=u;
 end if;
 -- Verified Blitz milestones use server reveal data. No client-submitted score mints rewards.
 insert into ml_private.player_achievements(user_id,id)
 select distinct u,'blitz-'||threshold from public.rooms room cross join unnest(array[10,20]) threshold
 where upper(room.config->>'game_mode')='BLITZ' and
  (select count(*) from public.online_ml_reveals rv cross join lateral jsonb_array_elements(rv.results->'answers') a where rv.room_id=room.id and a->>'user_id'=u::text and (a->>'correct')::boolean)>=threshold
  and not exists(select 1 from ml_private.match_rescues mr where mr.user_id=u and mr.room_id=room.id and mr.token=(select q.question_id from public.online_ml_questions q where q.room_id=room.id and q.question_no=1)) on conflict do nothing;
 insert into ml_private.player_achievements(user_id,id) select u,'login-seven' where exists(select 1 from ml_private.login_claims lc where lc.user_id=u and lc.streak>=7) on conflict do nothing;
 p:=ml_private.cosmetics_base_impl('profile',null);
 return p||jsonb_build_object('login_reward',gift,'earned',daily_earned,'login',(select to_jsonb(c) from ml_private.login_claims c where c.user_id=u and c.day=today),'challenge_achievements',coalesce((select jsonb_agg(jsonb_build_object('id',a.id,'unlocked_at',a.unlocked_at)) from ml_private.player_achievements a where a.user_id=u),'[]'));
end $$;
alter table ml_private.estimate_matches add column if not exists economy_match_id uuid not null default gen_random_uuid();
-- Single atomic purchase. Request tokens make retries harmless.
create or replace function ml_private.progression_impl(p_action text,p_item text,p_room uuid,p_token uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();w ml_private.cosmetic_wallet;s ml_private.solo_rescues;room public.rooms;q public.online_ml_questions;st ml_private.online_mode_players;m ml_private.estimate_matches;v_match_token uuid;begin
 if u is null then raise exception 'Authentication required';end if;
 if p_action='start_solo' then
  if p_item not in ('moreless','estimate','facts') or p_item is null then raise exception 'Invalid game';end if;
  insert into ml_private.solo_rescues(user_id,game) values(u,p_item) returning * into s;return jsonb_build_object('token',s.token);
 elsif p_action='continue_solo' then
  select * into s from ml_private.solo_rescues where user_id=u and token=p_token for update;
  if not found or s.expires_at<clock_timestamp() then raise exception 'Der Rettungsversuch ist abgelaufen.';end if;
  if s.spent then return jsonb_build_object('rescued',true,'token',s.token,'already_paid',true);end if;
 elsif p_action in ('revive_ml','revive_estimate') then
  select * into room from public.rooms where id=p_room for update;
  if not found or not ml_private.is_room_member(p_room,u) or room.status<>'playing' then raise exception 'Kein laufendes Match für diesen Spieler.';end if;
  if p_action='revive_ml' then
   select * into q from public.online_ml_questions where room_id=p_room order by question_no desc limit 1 for update;
   select question_id into v_match_token from public.online_ml_questions where room_id=p_room and question_no=1;
   select * into st from ml_private.online_mode_players where room_id=p_room and user_id=u for update;
   if upper(room.config->>'game_mode')<>'SURVIVAL' or q.status<>'revealed' or q.question_no>=coalesce((room.config->>'rounds')::int,2)*coalesce((room.config->>'questions_per_round')::int,5) or st.user_id is null or st.lives>0 or coalesce((select (rv.results->>'game_over')::boolean from public.online_ml_reveals rv where rv.room_id=p_room and rv.question_no=q.question_no),true) then raise exception 'Rettung nur nach dem Ausscheiden zwischen laufenden Fragen.';end if;
   if p_token is distinct from q.question_id then raise exception 'Die Frage hat gewechselt. Es wurden keine Münzen ausgegeben.';end if;
  else
   select * into m from ml_private.estimate_matches where room_id=p_room for update;
   v_match_token:=m.economy_match_id;
   if m.room_id is null or m.mode<>'survival' or m.phase<>'revealed' or m.position+1>=jsonb_array_length(m.pool) or coalesce((m.stats->u::text->>'lives')::int,1)>0 or not exists(select 1 from jsonb_each(m.stats) e where (e.value->>'lives')::int>0) then raise exception 'Rettung nur nach dem Ausscheiden zwischen laufenden Fragen.';end if;
   if p_token is distinct from m.question_id then raise exception 'Die Frage hat gewechselt. Es wurden keine Münzen ausgegeben.';end if;
  end if;
  if exists(select 1 from ml_private.match_rescues where user_id=u and match_rescues.token=v_match_token) then raise exception 'Rettungsversuch in diesem Match bereits genutzt.';end if;
 else raise exception 'Invalid progression action';end if;
 insert into ml_private.cosmetic_wallet(user_id) values(u) on conflict do nothing;
 select * into w from ml_private.cosmetic_wallet where user_id=u for update;
 if w.balance<40 then raise exception 'Für den Rettungsversuch brauchst du 40 Münzen.';end if;
 update ml_private.cosmetic_wallet set balance=balance-40 where user_id=u;
 if p_action='continue_solo' then update ml_private.solo_rescues set spent=true where solo_rescues.token=s.token;
 else
  insert into ml_private.match_rescues values(u,v_match_token,p_room,case when p_action='revive_ml' then 'moreless' else 'estimate' end);
  if p_action='revive_ml' then update ml_private.online_mode_players set lives=1 where room_id=p_room and user_id=u;
  else update ml_private.estimate_matches set stats=jsonb_set(jsonb_set(stats,array[u::text,'lives'],'1'::jsonb),array[u::text,'rescue_spent'],'true'::jsonb) where room_id=p_room;end if;
 end if;
 return jsonb_build_object('rescued',true,'balance',w.balance-40,'token',coalesce(s.token,v_match_token));
end $$;
create or replace function public.ml_progression(p_action text,p_item text default null,p_room uuid default null,p_token uuid default null) returns jsonb language sql security invoker set search_path='' as $$select ml_private.progression_impl(p_action,p_item,p_room,p_token);$$;
revoke all on function ml_private.progression_impl(text,text,uuid,uuid),public.ml_progression(text,text,uuid,uuid) from public,anon;
grant execute on function ml_private.progression_impl(text,text,uuid,uuid),public.ml_progression(text,text,uuid,uuid) to authenticated;
