#!/usr/bin/env node
/**
 * かるわかGAMES API 用の作品データ(data/api-games.json)を作るスクリプト。
 * js/main.js の GAMES 配列と、管理者が追加した作品(data/catalog.json)を合わせて、
 * API(Supabase の Edge Function kg-api)が読みやすい形にする。
 *
 * 使い方: node tools/build-api-data.js
 * 普段は GitHub Actions(.github/workflows/build-api-data.yml)が、js/main.js や data/catalog.json の変更のあと、
 * 6時間ごとに自動で実行して、変わっていたときだけコミットする。手元で作品を足したら、手で実行してもよい。
 * 中身が変わらないときはファイルを書き換えない(generated_at だけの差分で、毎回コミットされないように)。
 */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const MAIN_JS = path.join(ROOT, "js", "main.js");
const CATALOG = path.join(ROOT, "data", "catalog.json");
const OUT = path.join(ROOT, "data", "api-games.json");

// tools/build-seo.js と同じ方法で、main.js の GAMES 配列だけを取り出す
function extractGamesArray(src) {
  const decl = "const GAMES = ";
  const declIdx = src.indexOf(decl);
  if (declIdx === -1) throw new Error("js/main.js に `const GAMES = ` が見つかりません");
  let i = declIdx + decl.length;
  while (/\s/.test(src[i])) i++;
  if (src[i] !== "[") throw new Error("GAMES配列の開始 `[` が見つかりません");
  let depth = 0, inString = null, escaped = false, endIdx = -1;
  for (let j = i; j < src.length; j++) {
    const ch = src[j];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === inString) inString = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") { inString = ch; continue; }
    if (ch === "[") depth++;
    else if (ch === "]") { depth--; if (depth === 0) { endIdx = j; break; } }
  }
  if (endIdx === -1) throw new Error("GAMES配列の終端 `]` が見つかりません");
  // eslint-disable-next-line no-new-func
  const games = new Function(`"use strict"; return (${src.slice(i, endIdx + 1)});`)();
  if (!Array.isArray(games) || !games.length) throw new Error("GAMES配列の読み込みに失敗しました");
  return games;
}

const KIND = { game: "game", app: "software", mod: "mod" };

function normalize(g) {
  const kind = KIND[g.kind || "game"] || "game";
  return {
    id: String(g.id),
    title: String(g.title),
    emoji: g.emoji || (kind === "game" ? "🎮" : "🧰"),
    kind, // game / software / mod
    platform: g.platform || "",
    genres: Array.isArray(g.tags) && g.tags.length ? g.tags : ["その他"],
    description: String(g.desc || g.description || ""),
    url: String(g.url || ""),
    author: g.author || "Claude AI",
    added: String(g.added || "").slice(0, 10) || null,
    beta: !!g.beta,
    maintenance: !!g.maintenance,
    action: g.action || null,
  };
}

function main() {
  const fromMain = extractGamesArray(fs.readFileSync(MAIN_JS, "utf8"));
  let fromCatalog = [];
  try { fromCatalog = JSON.parse(fs.readFileSync(CATALOG, "utf8")); } catch (e) { /* なくてもよい */ }
  const seen = new Set();
  const games = [];
  for (const g of fromMain.concat(Array.isArray(fromCatalog) ? fromCatalog : [])) {
    if (!g || !g.id || !g.title || seen.has(String(g.id))) continue;
    seen.add(String(g.id));
    games.push(normalize(g));
  }
  let prev = null;
  try { prev = JSON.parse(fs.readFileSync(OUT, "utf8")); } catch (e) { /* 初回 */ }
  if (prev && JSON.stringify(prev.games) === JSON.stringify(games)) {
    console.log(`変更なし(${games.length}作品)`);
    return;
  }
  const out = { generated_at: new Date().toISOString(), count: games.length, games };
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + "\n", "utf8");
  console.log(`data/api-games.json を更新しました(${games.length}作品)`);
}
main();
