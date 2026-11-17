-- MixAllの連携を「置き換えて保存」できるようにする(2026-11-17, migration karuwaka_account_mixall_relink)
-- 原因: MixAllが返すID(sub)はアプリ(client_id)ごとに違う。2026-11-13にMixAll側のアプリを作り直したため、
--       それより前に連携した人は、保存されているIDが今のアプリのIDと一致せず、毎回「はじめて/もうアカウントを持っている」が出ていた。
--       そこで「もうアカウントを持っている」やマイページの連携をしても、既にMixAll連携がある(already)として断られ、保存されなかった。
-- 対策: 本人確認(パスワード、またはログイン中のトークン)が通ったら、古いMixAll連携を今のIDに置き換える。
--       そのIDが別のかるわかGAMESアカウントに連携されているときは、従来どおり断る(乗っ取り防止)。

create or replace function public.ka_mixall_claim(p_ticket text, p_username text, p_password text)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'extensions'
as $function$
declare t public.ka_mixall_tickets; u text; a public.ka_accounts;
begin
  t := public._ka_mixall_ticket(p_ticket);
  if t.ticket_hash is null then return jsonb_build_object('ok', false, 'reason', 'auth'); end if;
  u := lower(btrim(coalesce(p_username, '')));
  if (select count(*) from public.ka_attempts where kind = 'fail' and k = u and at > now() - interval '10 minutes') >= 8
     or (select count(*) from public.ka_attempts where kind = 'fail' and at > now() - interval '10 minutes') >= 200 then
    return jsonb_build_object('ok', false, 'reason', 'locked');
  end if;
  select * into a from public.ka_accounts where username = u;
  if a.id is null or not a.has_password or p_password is null or char_length(p_password) > 72 or a.password_hash <> crypt(p_password, a.password_hash) then
    insert into public.ka_attempts (kind, k) values ('fail', u);
    delete from public.ka_attempts where at < now() - interval '2 days';
    perform pg_sleep(1.2);
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;
  if exists (select 1 from public.ka_oauth_identities where provider = 'mixall' and provider_uid = t.sub and ka_account_id <> a.id) then
    return jsonb_build_object('ok', false, 'reason', 'linked');
  end if;
  -- 古いMixAll連携(作り直す前のアプリのIDなど)は、今のIDに置き換える
  delete from public.ka_oauth_identities where ka_account_id = a.id and provider = 'mixall' and provider_uid <> t.sub;
  insert into public.ka_oauth_identities (provider, provider_uid, ka_account_id) values ('mixall', t.sub, a.id)
    on conflict (provider, provider_uid) do nothing;
  update public.ka_accounts set last_login_at = now() where id = a.id;
  delete from public.ka_mixall_tickets where ticket_hash = t.ticket_hash;
  return jsonb_build_object('ok', true, 'token', public._ka_new_session(a.id), 'profile', public._ka_profile(a));
end $function$;

create or replace function public.ka_mixall_link(p_token text, p_ticket text)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'extensions'
as $function$
declare t public.ka_mixall_tickets; a public.ka_accounts; owner uuid;
begin
  a := public._ka_from_token(p_token);
  if a.id is null then return jsonb_build_object('ok', false, 'reason', 'auth'); end if;
  t := public._ka_mixall_ticket(p_ticket);
  if t.ticket_hash is null then return jsonb_build_object('ok', false, 'reason', 'oauth'); end if;
  select ka_account_id into owner from public.ka_oauth_identities where provider = 'mixall' and provider_uid = t.sub;
  if owner is not null and owner <> a.id then return jsonb_build_object('ok', false, 'reason', 'taken'); end if;
  if owner is null then
    -- 古いMixAll連携は、今のIDに置き換える
    delete from public.ka_oauth_identities where ka_account_id = a.id and provider = 'mixall';
    insert into public.ka_oauth_identities (provider, provider_uid, ka_account_id) values ('mixall', t.sub, a.id);
  end if;
  delete from public.ka_mixall_tickets where ticket_hash = t.ticket_hash;
  return jsonb_build_object('ok', true, 'provider', 'mixall', 'profile', public._ka_profile(a));
end $function$;
