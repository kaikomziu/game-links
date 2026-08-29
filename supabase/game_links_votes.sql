-- MY GAMES LINKS: ゲームごとの高評価/低評価テーブル
-- 共有Supabaseプロジェクト(kifnzvktwbomxthzvvgy)に、このサイト専用の
-- テーブルとして追加する。他サイトのテーブル(scores, mc_*, holdon_scores,
-- hansha_scores, boss_raid_* 等)には一切触れない。
--
-- 実行方法: Supabaseダッシュボード → SQL Editor に貼り付けて実行(一度だけでOK)。

create table if not exists public.game_links_votes (
  id bigint generated always as identity primary key,
  game_id text not null,
  voter_id text not null,
  vote text not null check (vote in ('like', 'dislike')),
  created_at timestamptz not null default now(),
  unique (game_id, voter_id) -- 同じ匿名voter_idは1ゲームにつき1票まで(二重投票防止)
);

alter table public.game_links_votes enable row level security;

-- kaikomziu.github.io は全ゲーム共通オリジンで、他ゲームのSupabaseログイン
-- セッション(authenticatedロール)が混線することがある(HOLD ONで実際に発生)。
-- クライアント側でセッションを持たせない対策に加え、ポリシー側も
-- 特定ロールに絞らず全ロール許可にしておく。
drop policy if exists "game_links_votes_select" on public.game_links_votes;
create policy "game_links_votes_select"
  on public.game_links_votes
  for select
  using (true);

drop policy if exists "game_links_votes_insert" on public.game_links_votes;
create policy "game_links_votes_insert"
  on public.game_links_votes
  for insert
  with check (true);

-- 投票の取り消し・変更はできない仕様のため、UPDATE/DELETEのポリシーは
-- 意図的に作らない(RLS有効・ポリシー無し = 誰も更新/削除できない)。
