#!/usr/bin/env node
/**
 * 内閣府「国民の祝日」CSV(data/syukujitsu_source.csv)を読み込み、
 * data/holidays.js を生成するビルドスクリプト。
 *
 * データ更新方法(年1回程度、内閣府が新しい年を追記したら):
 *   1. 最新CSVを取得して Shift_JIS → UTF-8 変換し、
 *      data/syukujitsu_source.csv を上書きする。
 *        curl -sL "https://www8.cao.go.jp/chosei/shukujitsu/syukujitsu.csv" \
 *          | iconv -f SHIFT_JIS -t UTF-8 > data/syukujitsu_source.csv
 *   2. node tools/build-holidays.js を実行する。
 */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const CSV_PATH = path.join(ROOT, "data", "syukujitsu_source.csv");
const OUT_PATH = path.join(ROOT, "data", "holidays.js");

function main() {
  const csv = fs.readFileSync(CSV_PATH, "utf8");
  const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  lines.shift(); // ヘッダー行を捨てる

  const holidays = {};
  let minYear = Infinity;
  let maxYear = -Infinity;

  for (const line of lines) {
    const idx = line.indexOf(",");
    if (idx === -1) continue;
    const dateStr = line.slice(0, idx).trim();
    const name = line.slice(idx + 1).trim();
    const m = dateStr.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
    if (!m) continue;
    const [, y, mo, d] = m;
    const key = `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
    holidays[key] = name;
    minYear = Math.min(minYear, Number(y));
    maxYear = Math.max(maxYear, Number(y));
  }

  const count = Object.keys(holidays).length;
  const body = JSON.stringify(holidays, null, 0);

  const js = `// 内閣府「国民の祝日」CSVから生成(tools/build-holidays.js)。
// 元データ: data/syukujitsu_source.csv (${minYear}〜${maxYear}年、${count}件)
// このテーブルに無い年(${maxYear + 1}年以降など)は
// js/today.js 内の簡易計算式(固定日・ハッピーマンデー・春分/秋分の近似式)で
// フォールバックする(振替休日・国民の休日までは考慮しない簡易版)。
const HOLIDAYS_TABLE_RANGE = { min: ${minYear}, max: ${maxYear} };
const HOLIDAYS = ${body};
`;

  fs.writeFileSync(OUT_PATH, js, "utf8");
  console.log(`✓ ${count}件の祝日(${minYear}〜${maxYear}年)をdata/holidays.jsに出力しました`);
}

main();
