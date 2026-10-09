-- Only deliberately appointed, confirmed accounts can edit. No user_metadata or guest roles.
create or replace function ml_private.is_content_editor() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from auth.users where id=auth.uid() and not coalesce(is_anonymous,false) and email_confirmed_at is not null and raw_app_meta_data->>'content_editor'='true')
$$;
revoke all on function ml_private.is_content_editor() from public,anon;
grant execute on function ml_private.is_content_editor() to authenticated;
create table if not exists ml_private.content_edits(id text primary key,game text not null check(game in ('moreless','estimate','facts','jeopardy')),payload jsonb not null,disabled boolean not null default false,status text not null default 'draft' check(status in ('draft','published')),version int not null default 1,updated_by uuid references auth.users(id),updated_at timestamptz not null default now(),published_payload jsonb,published_disabled boolean,published_at timestamptz);
create table if not exists ml_private.content_audit(id bigint generated always as identity primary key,content_id text,actor uuid references auth.users(id),action text not null,before_data jsonb,after_data jsonb,created_at timestamptz not null default now());
create table if not exists ml_private.content_release(id boolean primary key default true check(id),revision bigint not null default 0);
insert into ml_private.content_release(id) values(true) on conflict do nothing;
alter table ml_private.content_edits enable row level security;
alter table ml_private.content_audit enable row level security;
alter table ml_private.content_release enable row level security;
revoke all on ml_private.content_edits,ml_private.content_audit,ml_private.content_release from public,anon,authenticated;
alter table ml_private.question_reports add column if not exists review_status text not null default 'open' check(review_status in ('open','reviewing','resolved','dismissed'));
alter table ml_private.question_reports add column if not exists review_note text not null default '';
alter table ml_private.question_reports add column if not exists reviewed_by uuid references auth.users(id);
alter table ml_private.question_reports add column if not exists reviewed_at timestamptz;
create or replace function ml_private.content_api(p_action text,p_data jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
declare e ml_private.content_edits;payload jsonb;game text;ident text;old jsonb;result jsonb;ver int;
begin
 if p_action='published' then
  if auth.uid() is null then raise exception 'authentication required';end if;
  return jsonb_build_object('revision',(select revision from ml_private.content_release where id),'entries',coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'game',c.game,'payload',c.published_payload,'disabled',c.published_disabled,'version',c.version)) from ml_private.content_edits c where c.published_at is not null),'[]'));
 end if;
 if not ml_private.is_content_editor() then raise exception 'Redaktionszugang erforderlich';end if;
 if p_action='list' then return jsonb_build_object('entries',coalesce((select jsonb_agg(to_jsonb(x)) from (select * from ml_private.content_edits order by updated_at desc limit 500) x),'[]'),'reports',coalesce((select jsonb_agg(to_jsonb(x)-'user_id') from (select * from ml_private.question_reports order by (review_status='open') desc,created_at desc limit 200) x),'[]'));
 elsif p_action='report' then
  if p_data->>'status' not in ('open','reviewing','resolved','dismissed') or length(coalesce(p_data->>'note',''))>1000 then raise exception 'invalid review';end if;
  select to_jsonb(q) into old from ml_private.question_reports q where id=(p_data->>'id')::uuid for update;
  if old is null then raise exception 'report not found';end if;
  update ml_private.question_reports set review_status=p_data->>'status',review_note=coalesce(p_data->>'note',''),reviewed_by=auth.uid(),reviewed_at=now() where id=(p_data->>'id')::uuid returning to_jsonb(question_reports)-'user_id' into result;
  insert into ml_private.content_audit(content_id,actor,action,before_data,after_data) values(p_data->>'id',auth.uid(),'report',old,result);return result;
 elsif p_action in ('save','publish') then
  ident:=p_data->>'id';select * into e from ml_private.content_edits where id=ident for update;
  if p_action='publish' then
   if e.id is null then raise exception 'save draft first';end if;
   if e.version is distinct from (p_data->>'version')::int then raise exception 'Entwurf wurde inzwischen geändert. Neu laden.';end if;
   update ml_private.content_edits set status='published',published_payload=content_edits.payload,published_disabled=content_edits.disabled,published_at=now(),updated_by=auth.uid() where id=ident returning to_jsonb(content_edits) into result;
   update ml_private.content_release set revision=revision+1 where id;
  else
   game:=p_data->>'game';payload:=p_data->'payload';
   if game not in ('moreless','estimate','facts','jeopardy') or ident is null or ident!~'^[a-z]+:[a-zA-Z0-9_-]{8,80}$' or jsonb_typeof(payload)<>'object' or octet_length(payload::text)>30000 then raise exception 'invalid content';end if;
   if not coalesce(payload->>'source','')~'^https://' or not coalesce(payload->>'verified','')~'^\d{4}-\d{2}-\d{2}$' then raise exception 'Quelle und Prüfdatum erforderlich';end if;
   if game='moreless' and (jsonb_typeof(payload->'lv') is distinct from 'number' or jsonb_typeof(payload->'rv') is distinct from 'number' or payload->'lv'=payload->'rv' or length(coalesce(payload->>'l',''))=0 or length(coalesce(payload->>'r',''))=0 or length(coalesce(payload->>'metric',''))=0 or length(coalesce(payload->>'u',''))=0) then raise exception 'comparison needs two different values, metric and unit';end if;
   if game='estimate' and (jsonb_typeof(payload->'a') is distinct from 'number' or length(coalesce(payload->>'q',''))=0 or length(coalesce(payload->>'u',''))=0) then raise exception 'invalid estimate';end if;
   if game='facts' and (jsonb_typeof(payload->'a') is distinct from 'boolean' or length(coalesce(payload->>'s',''))=0 or length(coalesce(payload->>'e',''))=0) then raise exception 'invalid fact';end if;
   if game='jeopardy' and (length(coalesce(payload->>'q',''))=0 or length(coalesce(payload->>'a',''))=0 or length(coalesce(payload->>'cat',''))=0) then raise exception 'invalid clue';end if;
   if e.id is not null and (e.version is distinct from (p_data->>'version')::int or e.game<>game) then raise exception 'Entwurf wurde inzwischen geändert. Neu laden.';end if;
   old:=to_jsonb(e);
   insert into ml_private.content_edits(id,game,payload,disabled,updated_by) values(ident,game,payload,coalesce((p_data->>'disabled')::boolean,false),auth.uid()) on conflict(id) do update set payload=excluded.payload,disabled=excluded.disabled,status='draft',version=content_edits.version+1,updated_at=now(),updated_by=auth.uid() returning to_jsonb(content_edits) into result;
  end if;
  insert into ml_private.content_audit(content_id,actor,action,before_data,after_data) values(ident,auth.uid(),p_action,old,result);return result;
 end if;
 raise exception 'unknown action';
end $$;
revoke all on function ml_private.content_api(text,jsonb) from public,anon;
grant execute on function ml_private.content_api(text,jsonb) to authenticated;
create or replace function public.ml_content_editor(p_action text,p_data jsonb default '{}') returns jsonb language sql security invoker set search_path='' as $$select ml_private.content_api(p_action,p_data)$$;
create or replace function public.ml_content_published() returns jsonb language sql security invoker set search_path='' as $$select ml_private.content_api('published')$$;
revoke all on function public.ml_content_editor(text,jsonb),public.ml_content_published() from public,anon;
grant execute on function public.ml_content_editor(text,jsonb),public.ml_content_published() to authenticated;
-- Publicly readable images, exclusively editor-writable. No credentials in client code.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('editorial-images','editorial-images',true,1500000,array['image/webp','image/jpeg','image/png']) on conflict(id) do nothing;
drop policy if exists editorial_images_insert on storage.objects;
create policy editorial_images_insert on storage.objects for insert to authenticated with check(bucket_id='editorial-images' and ml_private.is_content_editor());
-- Immutable random paths: publication never overwrites an image used by older matches.
-- One-time owner handoff. Only hashes are stored; an authenticated, confirmed account claims a code.
create table if not exists ml_private.editor_activation(id uuid primary key default gen_random_uuid(),code_hash text not null,expires_at timestamptz not null,claimed_by uuid references auth.users(id),claimed_at timestamptz);
alter table ml_private.editor_activation enable row level security;
revoke all on ml_private.editor_activation from public,anon,authenticated;
create or replace function ml_private.activate_editor(p_code text) returns boolean language plpgsql security definer set search_path='' as $$
declare claim ml_private.editor_activation;u uuid:=auth.uid();
begin
 if u is null or not exists(select 1 from auth.users where id=u and not coalesce(is_anonymous,false) and email_confirmed_at is not null) then raise exception 'Bitte zuerst einen festen Account mit bestätigter E-Mail anmelden.';end if;
 if length(p_code)<>48 then raise exception 'Ungültiger Freischaltcode';end if;
 select * into claim from ml_private.editor_activation where code_hash=encode(extensions.digest(p_code,'sha256'),'hex') and claimed_by is null and expires_at>now() for update;
 if not found then raise exception 'Freischaltcode ungültig, abgelaufen oder bereits verwendet.';end if;
 update auth.users set raw_app_meta_data=coalesce(raw_app_meta_data,'{}')||'{"content_editor":true}'::jsonb where id=u;
 update ml_private.editor_activation set claimed_by=u,claimed_at=now() where id=claim.id;
 insert into ml_private.content_audit(actor,action) values(u,'activate_editor');return true;
end $$;
revoke all on function ml_private.activate_editor(text) from public,anon;
grant execute on function ml_private.activate_editor(text) to authenticated;
create or replace function public.ml_activate_editor(p_code text) returns boolean language sql security invoker set search_path='' as $$select ml_private.activate_editor(p_code)$$;
revoke all on function public.ml_activate_editor(text) from public,anon;
grant execute on function public.ml_activate_editor(text) to authenticated;
