-- かるわかGAMESを「OAuth提供側」にする(他のサイト・ゲームが「かるわかGAMESでログイン」を付けられる)
-- 方式: 認可コードフロー + PKCE(S256)。公開クライアント(静的サイト)は PKCE 必須、サーバーを持つアプリは client_secret も使える。
-- 渡す情報は「スコープ profile」だけ: sub(アカウントID)・ユーザー名・表示名・アイコン。パスワード・セーブ・管理者権限は渡さない。

-- ---------- テーブル(RLSで全拒否。RPCだけが触る) ----------
create table if not exists public.ka_oauth_clients (
  id uuid primary key default gen_random_uuid(),
  client_id text not null unique,
  owner_id uuid not null references public.ka_accounts(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 40),
  description text not null default '' check (char_length(description) <= 200),
  homepage text not null default '' check (char_length(homepage) <= 200),
  redirect_uris text[] not null check (cardinality(redirect_uris) between 1 and 5),
  secret_hash text,                                   -- null = 公開クライアント(PKCE必須)
  verified boolean not null default false,            -- 運営が確認したアプリ(SQLでだけ立てる)
  disabled boolean not null default false,            -- 運営が停止したアプリ
  created_at timestamptz not null default now()
);
create index if not exists ka_oauth_clients_owner on public.ka_oauth_clients (owner_id);

create table if not exists public.ka_oauth_codes (
  code_hash text primary key,
  client_pk uuid not null references public.ka_oauth_clients(id) on delete cascade,
  account_id uuid not null references public.ka_accounts(id) on delete cascade,
  redirect_uri text not null,
  challenge text,
  expires_at timestamptz not null,
  used boolean not null default false
);

create table if not exists public.ka_oauth_tokens (
  token_hash text primary key,
  client_pk uuid not null references public.ka_oauth_clients(id) on delete cascade,
  account_id uuid not null references public.ka_accounts(id) on delete cascade,
  code_hash text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists ka_oauth_tokens_acc on public.ka_oauth_tokens (account_id, client_pk);
create index if not exists ka_oauth_tokens_code on public.ka_oauth_tokens (code_hash);

create table if not exists public.ka_oauth_grants (
  account_id uuid not null references public.ka_accounts(id) on delete cascade,
  client_pk uuid not null references public.ka_oauth_clients(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (account_id, client_pk)
);

alter table public.ka_oauth_clients enable row level security;
alter table public.ka_oauth_codes   enable row level security;
alter table public.ka_oauth_tokens  enable row level security;
alter table public.ka_oauth_grants  enable row level security;
revoke all on public.ka_oauth_clients, public.ka_oauth_codes, public.ka_oauth_tokens, public.ka_oauth_grants from anon, authenticated;

-- ---------- 小物 ----------
-- リダイレクトURIとして許すか(https か、手元確認用の http://localhost / 127.0.0.1。#つき・ユーザー情報つきは不可)
create or replace function public._ka_oauth_uri_ok(p_uri text) returns boolean
language sql immutable set search_path to 'public' as $$
  select p_uri is not null and char_length(p_uri) <= 200 and (
    p_uri ~ '^https://[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?(:[0-9]{1,5})?(/[^[:space:]#]*)?(\?[^[:space:]#]*)?$'
    or p_uri ~ '^http://(localhost|127\.0\.0\.1)(:[0-9]{1,5})?(/[^[:space:]#]*)?(\?[^[:space:]#]*)?$'
  )
$$;
revoke all on function public._ka_oauth_uri_ok(text) from public, anon, authenticated;

-- 配列を整える(空白除去・重複除去)。1つでも不正なら null
create or replace function public._ka_oauth_uris_norm(p_uris text[]) returns text[]
language plpgsql immutable set search_path to 'public' as $$
declare r text[] := '{}'; u text;
begin
  if p_uris is null then return null; end if;
  foreach u in array p_uris loop
    u := btrim(coalesce(u, ''));
    if u = '' then continue; end if;
    if not public._ka_oauth_uri_ok(u) then return null; end if;
    if not (u = any(r)) then r := r || u; end if;
  end loop;
  if cardinality(r) < 1 or cardinality(r) > 5 then return null; end if;
  return r;
end $$;
revoke all on function public._ka_oauth_uris_norm(text[]) from public, anon, authenticated;

-- ---------- アプリの登録・管理(ログイン中のかるわかGAMESアカウントなら誰でも) ----------
create or replace function public.ka_oauth_app_create(p_token text, p_name text, p_desc text, p_homepage text, p_redirects text[], p_confidential boolean)
returns jsonb language plpgsql security definer set search_path to 'public', 'extensions' as $$
declare a public.ka_accounts; nm text; ds text; hp text; ur text[]; cid text; sec text;
begin
  a := public._ka_from_token(p_token);
  if a.id is null then return jsonb_build_object('ok', false, 'reason', 'auth'); end if;
  nm := btrim(coalesce(p_name, '')); ds := btrim(coalesce(p_desc, '')); hp := btrim(coalesce(p_homepage, ''));
  if char_length(nm) < 2 or char_length(nm) > 40 then return jsonb_build_object('ok', false, 'reason', 'name'); end if;
  if not a.is_admin and nm ~* '(かるわか|karuwaka|公式|official)' then return jsonb_build_object('ok', false, 'reason', 'name_reserved'); end if;
  if char_length(ds) > 200 then return jsonb_build_object('ok', false, 'reason', 'desc'); end if;
  if hp <> '' and not (hp ~ '^https?://[^[:space:]]+$' and char_length(hp) <= 200) then return jsonb_build_object('ok', false, 'reason', 'homepage'); end if;
  ur := public._ka_oauth_uris_norm(p_redirects);
  if ur is null then return jsonb_build_object('ok', false, 'reason', 'redirect'); end if;
  if (select count(*) from public.ka_oauth_clients where owner_id = a.id) >= 5 then return jsonb_build_object('ok', false, 'reason', 'limit'); end if;
  cid := 'kaoc_' || encode(gen_random_bytes(12), 'hex');
  if coalesce(p_confidential, false) then sec := 'kaos_' || encode(gen_random_bytes(24), 'hex'); end if;
  insert into public.ka_oauth_clients (client_id, owner_id, name, description, homepage, redirect_uris, secret_hash)
  values (cid, a.id, nm, ds, hp, ur, case when sec is null then null else encode(digest(sec, 'sha256'), 'hex') end);
  return jsonb_build_object('ok', true, 'client_id', cid, 'client_secret', sec);
end $$;

create or replace function public.ka_oauth_app_list(p_token text)
returns jsonb language plpgsql security definer set search_path to 'public', 'extensions' as $$
declare a public.ka_accounts;
begin
  a := public._ka_from_token(p_token);
  if a.id is null then return jsonb_build_object('ok', false, 'reason', 'auth'); end if;
  return jsonb_build_object('ok', true, 'apps', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'client_id', c.client_id, 'name', c.name, 'description', c.description, 'homepage', c.homepage,
      'redirect_uris', to_jsonb(c.redirect_uris), 'confidential', c.secret_hash is not null,
      'verified', c.verified, 'disabled', c.disabled, 'created_at', c.created_at,
      'users', (select count(*) from public.ka_oauth_grants g where g.client_pk = c.id)
    ) order by c.created_at), '[]'::jsonb)
    from public.ka_oauth_clients c where c.owner_id = a.id));
end $$;

create or replace function public.ka_oauth_app_update(p_token text, p_client_id text, p_name text, p_desc text, p_homepage text, p_redirects text[])
returns jsonb language plpgsql security definer set search_path to 'public', 'extensions' as $$
declare a public.ka_accounts; c public.ka_oauth_clients; nm text; ds text; hp text; ur text[];
begin
  a := public._ka_from_token(p_token);
  if a.id is null then return jsonb_build_object('ok', false, 'reason', 'auth'); end if;
  select * into c from public.ka_oauth_clients where client_id = p_client_id and owner_id = a.id;
  if c.id is null then return jsonb_build_object('ok', false, 'reason', 'notfound'); end if;
  nm := btrim(coalesce(p_name, '')); ds := btrim(coalesce(p_desc, '')); hp := btrim(coalesce(p_homepage, ''));
  if char_length(nm) < 2 or char_length(nm) > 40 then return jsonb_build_object('ok', false, 'reason', 'name'); end if;
  if not a.is_admin and nm ~* '(かるわか|karuwaka|公式|official)' then return jsonb_build_object('ok', false, 'reason', 'name_reserved'); end if;
  if char_length(ds) > 200 then return jsonb_build_object('ok', false, 'reason', 'desc'); end if;
  if hp <> '' and not (hp ~ '^https?://[^[:space:]]+$' and char_length(hp) <= 200) then return jsonb_build_object('ok', false, 'reason', 'homepage'); end if;
  ur := public._ka_oauth_uris_norm(p_redirects);
  if ur is null then return jsonb_build_object('ok', false, 'reason', 'redirect'); end if;
  update public.ka_oauth_clients set name = nm, description = ds, homepage = hp, redirect_uris = ur where id = c.id;
  -- 戻り先を変えたら、これまでの許可はやり直し(別のサイトに渡る可能性があるため)
  if ur is distinct from c.redirect_uris then
    delete from public.ka_oauth_grants where client_pk = c.id;
    delete from public.ka_oauth_tokens where client_pk = c.id;
    delete from public.ka_oauth_codes where client_pk = c.id;
  end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.ka_oauth_app_delete(p_token text, p_client_id text)
returns jsonb language plpgsql security definer set search_path to 'public', 'extensions' as $$
declare a public.ka_accounts; n int;
begin
  a := public._ka_from_token(p_token);
  if a.id is null then return jsonb_build_object('ok', false, 'reason', 'auth'); end if;
  delete from public.ka_oauth_clients where client_id = p_client_id and owner_id = a.id; -- コード・トークン・許可も一緒に消える
  get diagnostics n = row_count;
  return jsonb_build_object('ok', n > 0, 'reason', case when n > 0 then null else 'notfound' end);
end $$;

create or replace function public.ka_oauth_app_secret_reset(p_token text, p_client_id text)
returns jsonb language plpgsql security definer set search_path to 'public', 'extensions' as $$
declare a public.ka_accounts; c public.ka_oauth_clients; sec text;
begin
  a := public._ka_from_token(p_token);
  if a.id is null then return jsonb_build_object('ok', false, 'reason', 'auth'); end if;
  select * into c from public.ka_oauth_clients where client_id = p_client_id and owner_id = a.id;
  if c.id is null then return jsonb_build_object('ok', false, 'reason', 'notfound'); end if;
  if c.secret_hash is null then return jsonb_build_object('ok', false, 'reason', 'public'); end if;
  sec := 'kaos_' || encode(gen_random_bytes(24), 'hex');
  update public.ka_oauth_clients set secret_hash = encode(digest(sec, 'sha256'), 'hex') where id = c.id;
  return jsonb_build_object('ok', true, 'client_secret', sec);
end $$;

-- ---------- 認可画面(authorize.html)用 ----------
-- アプリの表示情報(ログイン前でも見せる。戻り先が登録と完全一致のときだけ返す)
create or replace function public.ka_oauth_app_info(p_client_id text, p_redirect_uri text)
returns jsonb language plpgsql security definer set search_path to 'public', 'extensions' as $$
declare c public.ka_oauth_clients; o public.ka_accounts;
begin
  select * into c from public.ka_oauth_clients where client_id = p_client_id;
  if c.id is null or c.disabled then return jsonb_build_object('ok', false, 'reason', 'client'); end if;
  if p_redirect_uri is null or not (p_redirect_uri = any(c.redirect_uris)) then return jsonb_build_object('ok', false, 'reason', 'redirect'); end if;
  select * into o from public.ka_accounts where id = c.owner_id;
  return jsonb_build_object('ok', true, 'name', c.name, 'description', c.description, 'homepage', c.homepage,
    'verified', c.verified, 'confidential', c.secret_hash is not null,
    'owner_name', o.display_name, 'owner_username', o.username);
end $$;

-- 認可コードを発行。初めてのアプリは p_consent=true(「許可する」を押した)でなければ 'consent' を返す
create or replace function public.ka_oauth_authorize(p_token text, p_client_id text, p_redirect_uri text, p_challenge text, p_consent boolean)
returns jsonb language plpgsql security definer set search_path to 'public', 'extensions' as $$
declare a public.ka_accounts; c public.ka_oauth_clients; code text;
begin
  a := public._ka_from_token(p_token);
  if a.id is null then return jsonb_build_object('ok', false, 'reason', 'auth'); end if;
  select * into c from public.ka_oauth_clients where client_id = p_client_id;
  if c.id is null or c.disabled then return jsonb_build_object('ok', false, 'reason', 'client'); end if;
  if p_redirect_uri is null or not (p_redirect_uri = any(c.redirect_uris)) then return jsonb_build_object('ok', false, 'reason', 'redirect'); end if;
  if p_challenge is null or p_challenge = '' then
    if c.secret_hash is null then return jsonb_build_object('ok', false, 'reason', 'challenge'); end if; -- 公開クライアントはPKCE必須
    p_challenge := null;
  elsif p_challenge !~ '^[A-Za-z0-9_-]{43}$' then
    return jsonb_build_object('ok', false, 'reason', 'challenge');
  end if;
  if not exists (select 1 from public.ka_oauth_grants where account_id = a.id and client_pk = c.id) then
    if not coalesce(p_consent, false) then return jsonb_build_object('ok', false, 'reason', 'consent'); end if;
    insert into public.ka_oauth_grants (account_id, client_pk) values (a.id, c.id) on conflict do nothing;
  end if;
  code := 'kaoa_' || encode(gen_random_bytes(24), 'hex');
  insert into public.ka_oauth_codes (code_hash, client_pk, account_id, redirect_uri, challenge, expires_at)
  values (encode(digest(code, 'sha256'), 'hex'), c.id, a.id, p_redirect_uri, p_challenge, now() + interval '5 minutes');
  delete from public.ka_oauth_codes where expires_at < now() - interval '1 day';
  delete from public.ka_oauth_tokens where expires_at < now() - interval '1 day';
  return jsonb_build_object('ok', true, 'code', code);
end $$;

-- ---------- トークン交換(Edge Function ka-oauth の /token から呼ぶ。直接呼んでも同じ検査) ----------
create or replace function public.ka_oauth_token(p_client_id text, p_secret text, p_code text, p_redirect_uri text, p_verifier text)
returns jsonb language plpgsql security definer set search_path to 'public', 'extensions' as $$
declare c public.ka_oauth_clients; k public.ka_oauth_codes; ch text; tok text; ck text;
begin
  ck := left(coalesce(p_client_id, ''), 64);
  if (select count(*) from public.ka_attempts where kind = 'oat' and k = ck and at > now() - interval '10 minutes') >= 60 then
    return jsonb_build_object('ok', false, 'error', 'temporarily_unavailable');
  end if;
  select * into c from public.ka_oauth_clients where client_id = p_client_id;
  if c.id is null or c.disabled
     or (c.secret_hash is not null and (p_secret is null or c.secret_hash <> encode(digest(p_secret, 'sha256'), 'hex'))) then
    insert into public.ka_attempts (kind, k) values ('oat', ck);
    return jsonb_build_object('ok', false, 'error', 'invalid_client');
  end if;
  select * into k from public.ka_oauth_codes where code_hash = encode(digest(coalesce(p_code, ''), 'sha256'), 'hex') for update;
  if k.code_hash is null or k.client_pk <> c.id then
    insert into public.ka_attempts (kind, k) values ('oat', ck);
    return jsonb_build_object('ok', false, 'error', 'invalid_grant');
  end if;
  if k.used then
    -- 使用済みコードの再利用は盗用の疑い。そのコードから出したトークンも失効させる
    delete from public.ka_oauth_tokens where code_hash = k.code_hash;
    return jsonb_build_object('ok', false, 'error', 'invalid_grant');
  end if;
  update public.ka_oauth_codes set used = true where code_hash = k.code_hash; -- 検証の成否にかかわらず1回きり
  if k.expires_at < now() or k.redirect_uri is distinct from p_redirect_uri then
    return jsonb_build_object('ok', false, 'error', 'invalid_grant');
  end if;
  if k.challenge is not null then
    if p_verifier is null or p_verifier !~ '^[A-Za-z0-9._~-]{43,128}$' then
      return jsonb_build_object('ok', false, 'error', 'invalid_grant');
    end if;
    ch := translate(rtrim(encode(digest(p_verifier, 'sha256'), 'base64'), '='), '+/', '-_');
    if ch <> k.challenge then return jsonb_build_object('ok', false, 'error', 'invalid_grant'); end if;
  end if;
  if not exists (select 1 from public.ka_oauth_grants where account_id = k.account_id and client_pk = c.id) then
    return jsonb_build_object('ok', false, 'error', 'invalid_grant');
  end if;
  tok := 'kaot_' || encode(gen_random_bytes(32), 'hex');
  insert into public.ka_oauth_tokens (token_hash, client_pk, account_id, code_hash, expires_at)
  values (encode(digest(tok, 'sha256'), 'hex'), c.id, k.account_id, k.code_hash, now() + interval '1 hour');
  return jsonb_build_object('ok', true, 'access_token', tok, 'token_type', 'Bearer', 'expires_in', 3600, 'scope', 'profile');
end $$;

-- ユーザー情報(アクセストークンで)。許可が取り消されていたり、アプリが停止されていたら返さない
create or replace function public.ka_oauth_userinfo(p_access_token text)
returns jsonb language plpgsql security definer set search_path to 'public', 'extensions' as $$
declare t public.ka_oauth_tokens; a public.ka_accounts;
begin
  if p_access_token is null or char_length(p_access_token) < 32 then return jsonb_build_object('ok', false); end if;
  select tk.* into t from public.ka_oauth_tokens tk join public.ka_oauth_clients c on c.id = tk.client_pk
   where tk.token_hash = encode(digest(p_access_token, 'sha256'), 'hex') and tk.expires_at > now() and not c.disabled
     and exists (select 1 from public.ka_oauth_grants g where g.account_id = tk.account_id and g.client_pk = tk.client_pk);
  if t.token_hash is null then return jsonb_build_object('ok', false); end if;
  select * into a from public.ka_accounts where id = t.account_id;
  if a.id is null then return jsonb_build_object('ok', false); end if;
  return jsonb_build_object('ok', true, 'sub', a.id::text, 'preferred_username', a.username, 'name', a.display_name, 'avatar', a.avatar);
end $$;

create or replace function public.ka_oauth_token_revoke(p_access_token text)
returns jsonb language plpgsql security definer set search_path to 'public', 'extensions' as $$
begin
  if p_access_token is not null then
    delete from public.ka_oauth_tokens where token_hash = encode(digest(p_access_token, 'sha256'), 'hex');
  end if;
  return jsonb_build_object('ok', true);
end $$;

-- ---------- 連携中のアプリ(本人が見る・取り消す) ----------
create or replace function public.ka_oauth_grants_list(p_token text)
returns jsonb language plpgsql security definer set search_path to 'public', 'extensions' as $$
declare a public.ka_accounts;
begin
  a := public._ka_from_token(p_token);
  if a.id is null then return jsonb_build_object('ok', false, 'reason', 'auth'); end if;
  return jsonb_build_object('ok', true, 'grants', (
    select coalesce(jsonb_agg(jsonb_build_object('client_id', c.client_id, 'name', c.name, 'homepage', c.homepage,
      'verified', c.verified, 'granted_at', g.created_at, 'owner_name', o.display_name) order by g.created_at desc), '[]'::jsonb)
    from public.ka_oauth_grants g join public.ka_oauth_clients c on c.id = g.client_pk join public.ka_accounts o on o.id = c.owner_id
    where g.account_id = a.id));
end $$;

create or replace function public.ka_oauth_grant_revoke(p_token text, p_client_id text)
returns jsonb language plpgsql security definer set search_path to 'public', 'extensions' as $$
declare a public.ka_accounts; cp uuid;
begin
  a := public._ka_from_token(p_token);
  if a.id is null then return jsonb_build_object('ok', false, 'reason', 'auth'); end if;
  select id into cp from public.ka_oauth_clients where client_id = p_client_id;
  if cp is null then return jsonb_build_object('ok', false, 'reason', 'notfound'); end if;
  delete from public.ka_oauth_grants where account_id = a.id and client_pk = cp;
  delete from public.ka_oauth_tokens where account_id = a.id and client_pk = cp;
  delete from public.ka_oauth_codes where account_id = a.id and client_pk = cp;
  return jsonb_build_object('ok', true);
end $$;

-- ---------- 実行権限(このプロジェクトは新しい関数に自動では anon を付けないので明示する) ----------
revoke all on function
  public.ka_oauth_app_create(text, text, text, text, text[], boolean),
  public.ka_oauth_app_list(text),
  public.ka_oauth_app_update(text, text, text, text, text, text[]),
  public.ka_oauth_app_delete(text, text),
  public.ka_oauth_app_secret_reset(text, text),
  public.ka_oauth_app_info(text, text),
  public.ka_oauth_authorize(text, text, text, text, boolean),
  public.ka_oauth_token(text, text, text, text, text),
  public.ka_oauth_userinfo(text),
  public.ka_oauth_token_revoke(text),
  public.ka_oauth_grants_list(text),
  public.ka_oauth_grant_revoke(text, text)
from public;
grant execute on function
  public.ka_oauth_app_create(text, text, text, text, text[], boolean),
  public.ka_oauth_app_list(text),
  public.ka_oauth_app_update(text, text, text, text, text, text[]),
  public.ka_oauth_app_delete(text, text),
  public.ka_oauth_app_secret_reset(text, text),
  public.ka_oauth_app_info(text, text),
  public.ka_oauth_authorize(text, text, text, text, boolean),
  public.ka_oauth_token(text, text, text, text, text),
  public.ka_oauth_userinfo(text),
  public.ka_oauth_token_revoke(text),
  public.ka_oauth_grants_list(text),
  public.ka_oauth_grant_revoke(text, text)
to anon, authenticated;
