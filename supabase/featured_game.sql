-- 注目のゲーム設定
-- Supabase MCPで add_featured_game_setting として適用済み。
create table if not exists public.gl_featured_games (
  slot text primary key default 'main' check (slot = 'main'),
  game_id text not null,
  updated_at timestamptz not null default now()
);

alter table public.gl_featured_games enable row level security;
create policy gl_featured_games_public_read on public.gl_featured_games for select using (true);

-- 実際の管理者認証とRPC本体は、既存の _gl_admin_from_token を利用するため、
-- Supabase上の migration add_featured_game_setting を正とする。
