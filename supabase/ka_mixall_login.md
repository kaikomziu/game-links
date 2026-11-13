# MixAllでログイン(2026-11-13, 1.202.0)

Supabase に migration `karuwaka_account_mixall_login` として適用済み(`list_migrations` で全文を確認できる)。

- `ka_oauth_identities.provider` の許可に `mixall` を追加
- `ka_mixall_tickets`(RLS全拒否。チケットのハッシュ・MixAllのsub・表示名の候補・期限10分)
- `ka_mixall_ticket_new(sub, suggest)` … service_role だけが実行できる(Edge Function `ka-mixall` から呼ぶ)
- `ka_mixall_login(ticket)` / `ka_mixall_register(ticket, username, display, client)` / `ka_mixall_claim(ticket, username, password)` / `ka_mixall_link(token, ticket)`
- 解除は既存の `ka_oauth_unlink(token, 'mixall')`
