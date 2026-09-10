-- MY GAMES LINKS: プレイ数カウンター + 汎用カウンター(訪問者数など)
-- 共有Supabaseプロジェクト(kifnzvktwbomxthzvvgy)に、このサイト専用の
-- テーブル/関数として追加する。他サイトのテーブルには一切触れない。
--
-- 実行方法: Supabaseダッシュボード → SQL Editor に貼り付けて実行(一度だけでOK)。
-- 既に game_links_votes を実行済みなら、これを追加で実行するだけ。
--
-- 設計方針:
--   - テーブルはRLS有効・SELECTのみ許可(誰でも合計を読める)。
--   - 加算は SECURITY DEFINER 関数経由でのみ可能にする(直接INSERT/UPDATE不可)
--     → 任意の値に書き換えられない。共通オリジンのセッション混線対策も兼ねる。

-- ===== プレイ数(「遊びに行く」が押された回数) =====
create table if not exists public.game_links_plays (
  game_id text primary key,
  count bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.game_links_plays enable row level security;

drop policy if exists "game_links_plays_read" on public.game_links_plays;
create policy "game_links_plays_read"
  on public.game_links_plays
  for select
  using (true);

create or replace function public.game_links_add_play(gid text)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  newcount bigint;
begin
  if gid is null or length(gid) = 0 or length(gid) > 80 then
    raise exception 'invalid gid';
  end if;
  insert into public.game_links_plays (game_id, count)
  values (gid, 1)
  on conflict (game_id)
  do update set count = public.game_links_plays.count + 1, updated_at = now()
  returning count into newcount;
  return newcount;
end;
$$;

grant execute on function public.game_links_add_play(text) to anon, authenticated;

-- ===== 汎用カウンター(訪問者数など) =====
create table if not exists public.game_links_counters (
  name text primary key,
  count bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.game_links_counters enable row level security;

drop policy if exists "game_links_counters_read" on public.game_links_counters;
create policy "game_links_counters_read"
  on public.game_links_counters
  for select
  using (true);

create or replace function public.game_links_bump_counter(cname text)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  newcount bigint;
begin
  if cname is null or length(cname) = 0 or length(cname) > 40 then
    raise exception 'invalid cname';
  end if;
  insert into public.game_links_counters (name, count)
  values (cname, 1)
  on conflict (name)
  do update set count = public.game_links_counters.count + 1, updated_at = now()
  returning count into newcount;
  return newcount;
end;
$$;

grant execute on function public.game_links_bump_counter(text) to anon, authenticated;

insert into public.game_links_counters (name, count) values ('visits', 0)
on conflict (name) do nothing;
