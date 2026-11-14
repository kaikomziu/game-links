-- 注目のゲーム設定
-- Supabase MCPで add_featured_game_setting と allow_multiple_featured_games を適用済み。
create table if not exists public.gl_featured_games (
  slot text primary key default 'main',
  game_id text not null,
  updated_at timestamptz not null default now()
);

-- slot(featured-001...)の順番で最大20件を保存する。
-- 公開取得は gl_featured_game_get、管理者更新は gl_featured_game_set(text, text[]) を使う。
