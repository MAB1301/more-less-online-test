-- Ingame coins only. No payments, purchases of coins, cash-out or client-minted balance.
begin;
create table if not exists ml_private.casino_state(
 user_id uuid primary key references auth.users(id) on delete cascade,
 game text not null default 'slots',status text not null default 'done',bet integer not null default 0,
 deck integer[] not null default '{}',player integer[] not null default '{}',dealer integer[] not null default '{}',cursor integer not null default 5,
 slots integer[] not null default '{}',payout integer not null default 0,result text not null default '',updated_at timestamptz not null default now());
create table if not exists ml_private.casino_requests(
 user_id uuid not null references auth.users(id) on delete cascade,request_id uuid not null,action text not null,bet integer not null,response jsonb not null,created_at timestamptz not null default now(),primary key(user_id,request_id));
alter table ml_private.casino_state enable row level security;
alter table ml_private.casino_requests enable row level security;
revoke all on ml_private.casino_state,ml_private.casino_requests from public,anon,authenticated;
create or replace function ml_private.casino_total(cards integer[]) returns integer language plpgsql immutable set search_path='' as $$
declare c integer;v integer;t integer:=0;aces integer:=0;begin
 foreach c in array cards loop v:=c%13+1;if v=1 then t:=t+11;aces:=aces+1;else t:=t+least(v,10);end if;end loop;
 while t>21 and aces>0 loop t:=t-10;aces:=aces-1;end loop;return t;
end $$;
create or replace function ml_private.casino_impl(p_action text,p_bet integer,p_request uuid,p_owner uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();s ml_private.casino_state;w integer;old ml_private.casino_requests;r jsonb;cards integer[];a integer;b integer;c integer;t integer;d integer;mult integer;begin
 if u is null or p_owner is distinct from u then raise exception 'Spielerzugang geändert. Casino erneut öffnen.';end if;
 if p_action not in ('home','slots','deal','hit','stand') or p_action is null then raise exception 'Unbekannte Aktion.';end if;
 insert into ml_private.cosmetic_wallet(user_id) values(u) on conflict do nothing;
 select balance into w from ml_private.cosmetic_wallet where user_id=u for update;
 insert into ml_private.casino_state(user_id) values(u) on conflict do nothing;
 select * into s from ml_private.casino_state where user_id=u for update;
 if p_action<>'home' then
  if p_request is null then raise exception 'Anfrage-ID fehlt.';end if;
  select * into old from ml_private.casino_requests where user_id=u and request_id=p_request;
  if found then if old.action is distinct from p_action or old.bet is distinct from p_bet then raise exception 'Anfrage passt nicht zum gespeicherten Zug.';end if;return old.response;end if;
 end if;
 if p_action in ('slots','deal') then
  if s.status='playing' then raise exception 'Beende zuerst deine Blackjack-Runde.';end if;
  if p_bet is null or p_bet not in (10,20,50,100) then raise exception 'Wähle 10, 20, 50 oder 100 Münzen.';end if;
  if w<p_bet then raise exception 'Nicht genügend Münzen. Mit Dailys und im Shop kannst du weitere sammeln.';end if;
  w:=w-p_bet;update ml_private.cosmetic_wallet set balance=w where user_id=u;
  s.bet:=p_bet;s.payout:=0;s.result:='';s.player:='{}';s.dealer:='{}';s.slots:='{}';s.deck:='{}';s.status:='done';
  if p_action='slots' then
   -- Rejection sampling: each of six symbols has the same probability.
   loop a:=get_byte(extensions.gen_random_bytes(1),0);exit when a<252;end loop;
   loop b:=get_byte(extensions.gen_random_bytes(1),0);exit when b<252;end loop;
   loop c:=get_byte(extensions.gen_random_bytes(1),0);exit when c<252;end loop;
   a:=a%6;b:=b%6;c:=c%6;s.slots:=array[a,b,c];s.game:='slots';
   mult:=case when a=b and b=c then 12 when a=b or a=c or b=c then 1 else 0 end;s.payout:=p_bet*mult;
   s.result:=case when mult=12 then 'Dreier! 12× Einsatz.' when mult=1 then 'Ein Paar – Einsatz zurück.' else 'Diesmal kein Treffer.' end;
  else
   s.game:='blackjack';select array_agg(n order by extensions.gen_random_bytes(16)) into cards from generate_series(0,51) n;
   s.deck:=cards;s.player:=array[cards[1],cards[3]];s.dealer:=array[cards[2],cards[4]];s.cursor:=5;s.status:='playing';
   t:=ml_private.casino_total(s.player);d:=ml_private.casino_total(s.dealer);
   if t=21 or d=21 then s.status:='done';s.payout:=case when t=21 and d=21 then p_bet when t=21 then p_bet*5/2 else 0 end;s.result:=case when t=21 and d=21 then 'Beide Blackjack – Einsatz zurück.' when t=21 then 'Blackjack! Auszahlung 2,5× Einsatz.' else 'Dealer hat Blackjack.' end;end if;
  end if;
 elsif p_action in ('hit','stand') then
  if s.status<>'playing' or s.game<>'blackjack' then raise exception 'Keine aktive Blackjack-Runde.';end if;
  if p_action='hit' then s.player:=array_append(s.player,s.deck[s.cursor]);s.cursor:=s.cursor+1;end if;
  t:=ml_private.casino_total(s.player);
  if t>21 then s.status:='done';s.result:='Über 21 – Runde verloren.';
  elsif p_action='stand' or t=21 then
   while ml_private.casino_total(s.dealer)<17 loop s.dealer:=array_append(s.dealer,s.deck[s.cursor]);s.cursor:=s.cursor+1;end loop;
   d:=ml_private.casino_total(s.dealer);s.status:='done';s.payout:=case when d>21 or t>d then s.bet*2 when t=d then s.bet else 0 end;
   s.result:=case when d>21 then 'Dealer über 21 – gewonnen!' when t>d then 'Gewonnen!' when t=d then 'Gleichstand – Einsatz zurück.' else 'Dealer gewinnt.' end;
  end if;
 end if;
 if p_action<>'home' then
  if s.status='done' then w:=w+s.payout;update ml_private.cosmetic_wallet set balance=w where user_id=u;end if;
  update ml_private.casino_state set game=s.game,status=s.status,bet=s.bet,deck=s.deck,player=s.player,dealer=s.dealer,cursor=s.cursor,slots=s.slots,payout=s.payout,result=s.result,updated_at=now() where user_id=u;
 end if;
 r:=jsonb_build_object('balance',w,'game',s.game,'status',s.status,'bet',s.bet,'player',s.player,'dealer',case when s.status='playing' then s.dealer[1:1] else s.dealer end,'player_total',ml_private.casino_total(s.player),'dealer_total',case when s.status='playing' then null else ml_private.casino_total(s.dealer) end,'slots',s.slots,'payout',s.payout,'result',s.result);
 if p_action<>'home' then insert into ml_private.casino_requests(user_id,request_id,action,bet,response) values(u,p_request,p_action,p_bet,r);end if;
 return r;
end $$;
create or replace function public.ml_casino(p_action text default 'home',p_item text default null,p_bet integer default 0,p_request uuid default null,p_owner uuid default null)
returns jsonb language sql security invoker set search_path='' as $$select ml_private.casino_impl(p_action,p_bet,p_request,p_owner)$$;
revoke all on function ml_private.casino_total(integer[]),ml_private.casino_impl(text,integer,uuid,uuid),public.ml_casino(text,text,integer,uuid,uuid) from public,anon,authenticated;
grant execute on function ml_private.casino_impl(text,integer,uuid,uuid),public.ml_casino(text,text,integer,uuid,uuid) to authenticated;
commit;
