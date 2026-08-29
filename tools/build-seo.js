#!/usr/bin/env node
/**
 * js/main.js の GAMES 配列を読み込み、index.html の
 * <!-- SEO-GAMES:START --> 〜 <!-- SEO-GAMES:END --> の間に
 * 各ゲームのタイトル・説明・タグを「生のHTML」として書き出すビルドスクリプト。
 *
 * 目的: 検索エンジンのクローラーやSNSのカード生成、JS無効環境でも
 * ゲーム一覧のテキストが読めるようにする(SSR的な静的埋め込み)。
 * JS有効時は従来どおり main.js の render() がこの中身を上書きするので、
 * 見た目・お気に入り/ダークモード/並び順の挙動は一切変わらない。
 *
 * 使い方:
 *   1. js/main.js の GAMES 配列にゲームを追加/削除/編集する
 *   2. node tools/build-seo.js を実行する
 *   3. index.html の差分(SEO-GAMESブロック)ごとコミットする
 */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const MAIN_JS_PATH = path.join(ROOT, "js", "main.js");
const INDEX_HTML_PATH = path.join(ROOT, "index.html");

const START_MARKER = "<!-- SEO-GAMES:START -->";
const END_MARKER = "<!-- SEO-GAMES:END -->";

function extractGamesArray(src) {
  const decl = "const GAMES = ";
  const declIdx = src.indexOf(decl);
  if (declIdx === -1) {
    throw new Error("js/main.js に `const GAMES = ` が見つかりません");
  }

  let i = declIdx + decl.length;
  while (/\s/.test(src[i])) i++;
  if (src[i] !== "[") {
    throw new Error("GAMES配列の開始 `[` が見つかりません");
  }

  let depth = 0;
  let inString = null;
  let escaped = false;
  let endIdx = -1;

  for (let j = i; j < src.length; j++) {
    const ch = src[j];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === inString) inString = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      inString = ch;
      continue;
    }
    if (ch === "[") depth++;
    else if (ch === "]") {
      depth--;
      if (depth === 0) {
        endIdx = j;
        break;
      }
    }
  }

  if (endIdx === -1) {
    throw new Error("GAMES配列の終端 `]` が見つかりません(括弧の対応を確認してください)");
  }

  const arrayLiteral = src.slice(i, endIdx + 1);
  // eslint-disable-next-line no-new-func
  const games = new Function(`"use strict"; return (${arrayLiteral});`)();

  if (!Array.isArray(games) || games.length === 0) {
    throw new Error("GAMES配列の読み込みに失敗しました(空、または配列ではありません)");
  }
  return games;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderCard(game) {
  const tagsHtml = (game.tags || [])
    .map((t) => `<span class="card-tag">${escapeHtml(t)}</span>`)
    .join("");
  return [
    `      <article class="game-card">`,
    `        <div class="card-top">`,
    `          <div class="card-emoji">${escapeHtml(game.emoji || "🎮")}</div>`,
    `          <button class="fav-btn" aria-label="お気に入り切替">☆</button>`,
    `        </div>`,
    `        <h2 class="card-title">${escapeHtml(game.title)}</h2>`,
    `        <p class="card-desc">${escapeHtml(game.desc)}</p>`,
    `        <div class="card-tags">${tagsHtml}</div>`,
    `        <a class="play-btn" href="${escapeHtml(game.url)}" target="_blank" rel="noopener">遊びに行く →</a>`,
    `      </article>`,
  ].join("\n");
}

function main() {
  const mainJsSrc = fs.readFileSync(MAIN_JS_PATH, "utf8");
  const games = extractGamesArray(mainJsSrc);

  // main.js の初期表示(並び順の初期値=名前順)に合わせておく。
  const sorted = [...games].sort((a, b) => a.title.localeCompare(b.title, "ja"));

  const cardsHtml = sorted.map(renderCard).join("\n");
  const block = `${START_MARKER}\n${cardsHtml}\n    ${END_MARKER}`;

  const html = fs.readFileSync(INDEX_HTML_PATH, "utf8");
  const startIdx = html.indexOf(START_MARKER);
  const endIdx = html.indexOf(END_MARKER);
  if (startIdx === -1 || endIdx === -1) {
    throw new Error(
      "index.html に SEO-GAMES マーカーが見つかりません。先に <!-- SEO-GAMES:START --> と <!-- SEO-GAMES:END --> を設置してください。"
    );
  }

  const before = html.slice(0, startIdx);
  const after = html.slice(endIdx + END_MARKER.length);
  const newHtml = before + block + after;

  fs.writeFileSync(INDEX_HTML_PATH, newHtml, "utf8");
  console.log(`✓ ${sorted.length}件のゲームをindex.htmlに静的HTMLとして埋め込みました`);
}

main();
