#!/usr/bin/env python3
"""Supabaseの公開作品カタログだけをGitHubへ保存する。"""
import json
import os
import sys
import urllib.parse
import urllib.request

supabase_url = os.environ.get("SUPABASE_URL", "https://kifnzvktwbomxthzvvgy.supabase.co").rstrip("/")
api_key = os.environ.get("SUPABASE_ANON_KEY")
if not api_key:
    print("SUPABASE_ANON_KEY is not set", file=sys.stderr)
    sys.exit(1)

params = urllib.parse.urlencode({
    "select": "id,added,kind,platform,action,title,emoji,tags,description,url,author",
    "published": "eq.true",
    "order": "added.desc",
    "limit": "200",
})
request = urllib.request.Request(
    f"{supabase_url}/rest/v1/gl_games?{params}",
    headers={"apikey": api_key, "Authorization": f"Bearer {api_key}"},
)
with urllib.request.urlopen(request, timeout=30) as response:
    rows = json.loads(response.read().decode("utf-8"))

if not isinstance(rows, list) or len(rows) > 200:
    raise RuntimeError("Unexpected catalog response")
required = {"id", "title", "url", "description", "kind", "tags", "author"}
for row in rows:
    if not isinstance(row, dict) or not required.issubset(row):
        raise RuntimeError("Catalog row has an unexpected shape")

with open("data/catalog.json", "w", encoding="utf-8") as output:
    json.dump(rows, output, ensure_ascii=False, indent=2)
    output.write("\n")
print(f"Synced {len(rows)} published catalog entries")
