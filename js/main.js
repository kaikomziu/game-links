// ===== ゲーム一覧データ =====
const GAMES = [
  {
    id: "captcha-hell",
    title: "CAPTCHA地獄",
    emoji: "🤖",
    tags: ["ネタ", "パズル", "反射神経"],
    desc: "「私はロボットではありません」から始まり、理不尽なCAPTCHAを全16問ノンストップで解かされるだけのネタ系ゲーム。ゆがみ文字、カーソルから逃げるチェックボックス、信号機グリッド、アナログ時計の時刻読み、音声CAPTCHA、間違い探し、人間であることの証明、CAPTCHAのためのCAPTCHA、拒否ボタンが極小のクッキーバナー、最後は3問連続の高速ラッシュ。ライフ3・各問に制限時間つきで、全問突破すると人間証明書が発行される。実績12種。クリアタイムを記録。セーブは端末内。PC/スマホ対応。",
    url: "https://kaikomziu.github.io/captcha-hell/"
  },
  {
    id: "tetris-deluxe",
    title: "TETRIS DELUXE",
    emoji: "🟦",
    tags: ["パズル", "落ち物", "スコアアタック"],
    desc: "ガイドライン準拠のブラウザ版テトリス。7種バッグ抽選・ゴースト・ホールド・ネクスト5個表示に加え、SRS回転＋ウォールキック、ハードドロップ、ロックディレイ、T-スピン判定、B2B、REN(コンボ)、ライン消去演出まで搭載。10ラインごとにレベルアップして落下が速くなる。モードはマラソン(150ライン)、スプリント(40ライン計測)、ウルトラ(2分間スコアアタック)の3種類。スコアと各種ベストは端末内に保存。PC(矢印/Z/X/Space/C/Shift)・スマホ(画面ボタン＆スワイプ)対応。",
    url: "https://kaikomziu.github.io/tetris-deluxe/"
  },
  {
    id: "stonks",
    title: "STONKS",
    emoji: "📈",
    tags: ["投資", "RNG", "オンライン"],
    desc: "所持金100万円スタート。上がったり下がったりする7銘柄を売り買いして、40営業日でどこまで総資産を増やせるかを競うだけのシンプルな株ゲーム。株価はランダムウォーク＋ニュースによる急騰・暴落、売買手数料0.15%。アップグレード要素なしの純粋な相場勝負。40日後の総資産で世界ランキング。ベストは端末に保存。PC(↑↓/B/S/Space)/スマホ対応。",
    url: "https://kaikomziu.github.io/stonks/"
  },
  {
    id: "pixel-place",
    title: "PIXEL PLACE",
    emoji: "🎨",
    tags: ["オンライン", "お絵かき", "協力"],
    desc: "世界中の人と共有する100×100のドット絵キャンバス。1マス塗るのにチャージを1個消費し、チャージは5秒に1個・最大50個までたまる。消しゴムはなく、上から塗り直すしかない。混雑したらSERVER 0001→0002…と別サーバーを選べる(最大50個)。16色パレット、ピンチ/ホイールでズーム、ドラッグで移動、スポイトで色拾い。接続人数と累計ドット数を表示。Supabaseで全員のキャンバスをリアルタイム同期。PC/スマホ対応。",
    url: "https://kaikomziu.github.io/pixel-place/"
  },
  {
    id: "one-in-8192",
    title: "8192分の1",
    emoji: "🪙",
    tags: ["RNG", "運試し", "収集"],
    desc: "左右どちらかを選び続けるだけ。当たり(1/2)を引けば1段前進、はずれた瞬間スタートに逆戻り。13連続的中でたどり着く 1/8192 が目標で、その先の 1/16384・1/32768… にも挑める。確率のはしご表示、統計、各段の到達回数表、実績54種、1/8192達成で解禁されるオートモード。セーブは端末内。PC(←→キー)/スマホ対応。",
    url: "https://kaikomziu.github.io/one-in-8192/"
  },
  {
    id: "hold-on",
    title: "HOLD ON",
    emoji: "⏱️",
    tags: ["体内時計", "反射神経", "オンライン"],
    desc: "表示された秒数だけボタンを長押しして離すだけ。押している間は時間が表示されず、たよれるのは体内時計のみ。全5ラウンドのズレ(ミリ秒)の合計で7段階の称号を判定し、世界ランキングに登録できる。ベストは端末に保存。PC(スペースキー)/スマホ対応。",
    url: "https://kaikomziu.github.io/hold-on/"
  },
  {
    id: "battery-1percent",
    title: "電源1%サバイバル",
    emoji: "🔋",
    tags: ["サバイバル", "時間管理", "ネタ"],
    desc: "スマホのバッテリーは残り1%。明るさ・Wi-Fi・モバイル・位置情報・アプリなど8種のクイック設定を切り詰めて、待ち合わせの相手が来るまで電源を持たせるだけ。ただし相手からの電話やLINEに時間内に出ないと、はぐれて合流できなくなる。画面は5秒で自動オフ、機内モードは超節約だけど着信が届かない諸刃の剣。難易度3段階、残量に応じた称号7段階、実績20種。セーブは端末内。PC(数字キー/Space)/スマホ対応。",
    url: "https://kaikomziu.github.io/battery-1percent/"
  },
  {
    id: "gacha-life",
    title: "GACHA LIFE",
    emoji: "🎰",
    tags: ["RNG", "放置", "収集"],
    desc: "アップグレードも戦闘もない。ただ一生ガチャを引くだけのRNGゲーム。放置でジェムが貯まり、単発/10連/無料枠を回す。SSR確定の天井100連、ソフト天井、図鑑71種、ガチャ道ランク20段階、実績40種、重複を星屑に替えて交換する星屑ショップ。セーブはブラウザ内、オフライン報酬あり。PC/スマホ対応。",
    url: "https://kaikomziu.github.io/gacha-life/"
  },
  {
    id: "boss-raid",
    title: "BOSS RAID",
    emoji: "👹",
    tags: ["クリッカー", "オンライン"],
    desc: "1億HPのボスを、世界中のプレイヤーとリアルタイム協力で連打して倒す。倒すたびに少し強い次のボスが無限に出現。同時接続人数・全体DPS表示、ダメージポップ、撃破ファンファーレ＋花火。完全匿名。PC/スマホ対応。",
    url: "https://kaikomziu.github.io/boss-raid/"
  },
  {
    id: "shadow-match",
    title: "影あわせDELUXE",
    emoji: "🌓",
    tags: ["パズル"],
    desc: "ライトをドラッグして動かし、浮かぶ立体の影を壁のシルエットにぴったり重ねるパズル。位置・遠近・回転を操作して一致度を上げる。全16ステージ＋エンドレス、実績20種。PC/スマホ対応。",
    url: "https://kaikomziu.github.io/shadow-match/"
  },
  {
    id: "2d-sandbox",
    title: "POWDER SANDBOX",
    emoji: "🏖️",
    tags: ["サンドボックス"],
    desc: "火・水・砂・油・溶岩・氷・草・酸・火薬など19素材のフォーリングサンド型物理サンドボックス。燃焼の延焼、水⇄水蒸気、溶岩+水→石、酸の溶解、火薬の連鎖爆発などをセルオートマトンでシミュレート。PC/スマホ対応。",
    url: "https://kaikomziu.github.io/2d-sandbox/"
  },
  {
    id: "teiji-dash",
    title: "定時ダッシュ！",
    emoji: "🏃",
    tags: ["アクション"],
    desc: "17:00、退勤ダッシュで居酒屋を目指す3レーンのエンドレスランナー。部長・電話・書類の山をよけ、ビールチケットと有給を拾って走り抜けろ。PC/スマホ対応。",
    url: "https://kaikomziu.github.io/teiji-dash/"
  },
  {
    id: "browser-escape",
    title: "ブラウザ脱出",
    emoji: "🚪",
    tags: ["パズル"],
    desc: "タブ切替・リサイズ・ダークモード・URLバー・戻るボタンなど、ブラウザの機能そのものを鍵にして全8部屋から脱出するネタ系脱出ゲーム。",
    url: "https://kaikomziu.github.io/browser-escape/"
  },
  {
    id: "neon-raider",
    title: "NEON RAIDER",
    emoji: "🛸",
    tags: ["シューティング"],
    desc: "ネオン調の縦スクロール弾幕STG。ウェーブ制で10ウェーブごとにボス、武器5種を拾って切り替え。ボス連戦のBOSS RUSHも搭載。PC/スマホ対応。",
    url: "https://kaikomziu.github.io/neon-raider/"
  },
  {
    id: "modem-deluxe",
    title: "MODEM DELUXE",
    emoji: "📟",
    tags: ["シミュレーション"],
    desc: "90年代ダイヤルアップ接続を再現。3段階ハンドシェイクをこなして繋ぎ、300bpsから5Gまで回線を進化させる。",
    url: "https://kaikomziu.github.io/modem-deluxe/"
  },
  {
    id: "2048-deluxe",
    title: "2048 DELUXE",
    emoji: "🔢",
    tags: ["パズル"],
    desc: "定番2048を拡張したデラックス版。新モードや実績を搭載。",
    url: "https://kaikomziu.github.io/2048-deluxe/"
  },
  {
    id: "15puzzle-deluxe",
    title: "15パズル DELUXE",
    emoji: "🧩",
    tags: ["パズル"],
    desc: "スライドパズルの定番「15パズル」をデラックス化。",
    url: "https://kaikomziu.github.io/15puzzle/"
  },
  {
    id: "maze-deluxe",
    title: "迷路 DELUXE",
    emoji: "🌀",
    tags: ["パズル"],
    desc: "自動生成される迷路を探索するデラックス版迷路ゲーム。",
    url: "https://kaikomziu.github.io/maze-DELUXE/"
  },
  {
    id: "flappy-deluxe",
    title: "FLAPPY DELUXE",
    emoji: "🐤",
    tags: ["アクション"],
    desc: "フラッピーバード風の連打アクションをデラックス強化。",
    url: "https://kaikomziu.github.io/-FLAPPY_DELUXE-/"
  },
  {
    id: "easter-egg-hunter",
    title: "EGG HUNT",
    emoji: "🥚",
    tags: ["収集"],
    desc: "全50個のイースターエッグを探し出す隠し要素満載の収集ゲーム。",
    url: "https://kaikomziu.github.io/easter-egg-hunter/"
  },
  {
    id: "mogura-panic-deluxe",
    title: "モグラパニック DELUXE",
    emoji: "🐹",
    tags: ["アクション"],
    desc: "難易度30段階・実績289種を誇るモグラたたきゲーム。",
    url: "https://kaikomziu.github.io/mogura-panic-deluxe/"
  },
  {
    id: "emoji-fishing",
    title: "絵文字フィッシング",
    emoji: "🎣",
    tags: ["カジュアル"],
    desc: "絵文字を釣り上げるカジュアルゲーム。ランキング機能付き。",
    url: "https://kaikomziu.github.io/emoji-fishing/"
  },
  {
    id: "jinsei-game-deluxe",
    title: "人生ゲーム DELUXE",
    emoji: "🎲",
    tags: ["対戦", "ボード"],
    desc: "BOT対戦(1vs1/複数BOT乱闘)に対応したすごろく人生ゲーム。実績155種類以上。",
    url: "https://kaikomziu.github.io/jinsei-game-deluxe/"
  },
  {
    id: "password-hell-deluxe",
    title: "パスワード地獄 DELUXE",
    emoji: "🔐",
    tags: ["パズル"],
    desc: "The Password Game風の脱出パズル。全60ルールを攻略せよ。",
    url: "https://kaikomziu.github.io/password-hell-deluxe/"
  },
  {
    id: "suika-deluxe",
    title: "SUIKA DELUXE",
    emoji: "🍉",
    tags: ["カジュアル"],
    desc: "スイカゲーム風の物理演算パズル。合体させて高得点を狙え。",
    url: "https://kaikomziu.github.io/suika-deluxe/"
  },
  {
    id: "uranai-deluxe",
    title: "占い DELUXE",
    emoji: "🔮",
    tags: ["占い"],
    desc: "日替わりおみくじ・星座・血液型・干支占いに運試しゲームも搭載。",
    url: "https://kaikomziu.github.io/uranai-deluxe/"
  },
  {
    id: "piano-deluxe",
    title: "PIANO DELUXE",
    emoji: "🎹",
    tags: ["音楽"],
    desc: "PCキーボード/タッチで弾けるピアノ。録音・MIDI/WAV/MP3書き出し対応。",
    url: "https://kaikomziu.github.io/piano-deluxe/"
  },
  {
    id: "mejioshi-slot",
    title: "目押しマスター",
    emoji: "🎰",
    tags: ["カジュアル"],
    desc: "スロットの目押し技術を鍛えるドット絵スロットゲーム。",
    url: "https://kaikomziu.github.io/Slot-Sites-AI-GENERETE-/"
  },
  {
    id: "town-deluxe",
    title: "タウン DELUXE",
    emoji: "🏙️",
    tags: ["放置", "シミュレーション"],
    desc: "クリック&放置で町を育てる街づくりゲーム。ゴールデンビルや花火など演出も派手。",
    url: "https://kaikomziu.github.io/town-deluxe/"
  },
  {
    id: "marubatsu-deluxe",
    title: "○×DELUXE",
    emoji: "⭕",
    tags: ["対戦", "パズル"],
    desc: "3〜5並べ+ミゼール/重力/ワイルド等の特殊モードを備えた丸バツゲーム。CPU4段階と2人対戦に対応。",
    url: "https://kaikomziu.github.io/marubatsu-deluxe/"
  },
  {
    id: "rhythmer",
    title: "Rhythmer",
    emoji: "🎵",
    tags: ["音楽", "アクション"],
    desc: "上から降ってくるノーツを叩くリズムゲーム。譜面エディターで自作の譜面を作って書き出せる。",
    url: "https://kaikomziu.github.io/rhythmer/"
  },
  {
    id: "chinchiro-deluxe",
    title: "チンチロDELUXE",
    emoji: "🎲",
    tags: ["カジノ", "対戦"],
    desc: "丼にサイコロを振り込む3Dチンチロリン。CPUの親とチップを賭けて勝負する本格ルール対応。",
    url: "https://kaikomziu.github.io/chinchiro-deluxe/"
  },
  {
    id: "nandokuka-tools",
    title: "Nandokuka Tools",
    emoji: "🔐",
    tags: ["ツール"],
    desc: "IDや文章をBase64・モールス信号・ハッシュ化など19方式で難読化・復号できるツール。",
    url: "https://kaikomziu.github.io/nandokuka-tools/"
  },
  {
    id: "million-clicker",
    title: "MILLION CLICKER",
    emoji: "👆",
    tags: ["カジュアル"],
    desc: "アップグレード要素なし。ただひたすら100万回クリックするだけ。達成すると超派手な花火とファンファーレ演出。",
    url: "https://kaikomziu.github.io/million-clicker/"
  },
  {
    id: "phosphor-calc",
    title: "Phosphor Calc",
    emoji: "🧮",
    tags: ["ツール"],
    desc: "式入力・関数電卓・履歴・メモリー機能を備えたおしゃれな高機能電卓。",
    url: "https://kaikomziu.github.io/phosphor-calc/"
  },
  {
    id: "hansha-deluxe",
    title: "反射神経DELUXE",
    emoji: "⚡",
    tags: ["カジュアル"],
    desc: "緑になった瞬間にタップ!5回勝負の平均タイムで称号が決まる、反射神経を競うだけのサイト。",
    url: "https://kaikomziu.github.io/hansha-deluxe/"
  },
  {
    id: "cookie-factory",
    title: "Cookie Factory",
    emoji: "🍪",
    tags: ["音楽", "放置"],
    desc: "レーンを流れるクッキーをリズムよくタップして稼ぐクッキークリッカー。工場で自動化、リボーンでツリー強化。",
    url: "https://kaikomziu.github.io/cookie-factory/"
  },
  {
    id: "typing-deluxe",
    title: "TYPING DELUXE",
    emoji: "⌨️",
    tags: ["タイピング", "PCのみ"],
    desc: "複数ローマ字入力(shi/si、fu/hu、ん、っ 等)に対応したタイピングゲーム。タイムアタック・お題数・サドンデスの3モード、7カテゴリ約150問。KPM・正確率・コンボで称号判定、次に押すキーをキーボードでハイライト。",
    url: "https://kaikomziu.github.io/typing-deluxe/"
  },
  {
    id: "typing-deluxe-phone",
    title: "TYPING DELUXE Phone edition",
    emoji: "📱",
    tags: ["タイピング", "スマホのみ"],
    desc: "TYPING DELUXEのスマホ版。画面内QWERTYキーボードをタップしてローマ字入力、次に押すキーが常に光る。タイムアタック・お題数・サドンデスの3モード、7カテゴリ約150問。マイリストはPC版とCookie共有。",
    url: "https://kaikomziu.github.io/typing-deluxe-phone/"
  },
  {
    id: "once-a-year",
    title: "ONCE A YEAR",
    emoji: "🗝️",
    tags: ["カジュアル", "占い"],
    desc: "一年に一度しか開かない扉。その年だけの封書を読み、次に訪れる自分へ手紙を一通だけ残せる。次に読めるのは365日後。",
    url: "https://kaikomziu.github.io/once-a-year/"
  },
  {
    id: "hit-and-blow",
    title: "HIT & BLOW 対戦",
    emoji: "🔢",
    tags: ["対戦", "推理", "オンライン"],
    desc: "秘密の数字をおたがいに当て合う1vs1。各ラウンド同時提出で、予想した数字が1桁ずつ色で返る（ワードル式）＝緑はその場所で正解、橙は数字はあるが場所ちがい、灰はハズレ。先に全部緑にした人の勝ち。CPUフリー戦は よわい〜じごくの5段階＋桁数3〜5・重複あり選択。レート戦は世界中の人とレート帯マッチングしてElo変動（相手不在時はレート帯CPU）、野良戦は未ランク、合言葉ルームは友達と1対1、デイリーは全員共通の問題を最少手数で競う。定型スタンプ・候補数ヒント・リプレイ共有リンク・実績27種・統計・効果音。相手切断時は勝ち確定かCPU戦に切替。世界ランキングあり。PC(数字キー/Enter)・スマホ対応。",
    url: "https://kaikomziu.github.io/hit-and-blow/"
  }
];

// ===== Cookie ヘルパー =====
function setCookie(name, value, days) {
  // Path未指定にすることで、GitHub Pages上でもこのサイトの階層
  // (例: /game-links/)にのみCookieが閉じ、他リポジトリのゲームと
  // 名前空間が衝突しないようにする。
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; SameSite=Lax`;
}
function getCookie(name) {
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

// ===== 状態 =====
let favorites = new Set();
try {
  const raw = getCookie("favorites");
  if (raw) favorites = new Set(JSON.parse(raw));
} catch (e) { favorites = new Set(); }

let currentTag = "all";
// 初期値は「名前順」。他チャットからゲームがGAMES配列のどこに追加されても
// 表示は自動でABC/あいう順に揃うようにする。並び順の選択はCookieに保存され、
// 一度でも明示的に選び直せばその選択が次回以降も優先される。
let currentSort = getCookie("sortOrder") || "name";
let favoriteOnly = false;

// ===== 初期化: ダークモード =====
function applyTheme(theme) {
  if (theme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    document.getElementById("themeToggle").textContent = "☀️";
  } else {
    document.documentElement.removeAttribute("data-theme");
    document.getElementById("themeToggle").textContent = "🌙";
  }
}
const savedTheme = getCookie("theme") ||
  (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
applyTheme(savedTheme);

document.getElementById("themeToggle").addEventListener("click", () => {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const next = isDark ? "light" : "dark";
  applyTheme(next);
  setCookie("theme", next, 365);
});

// ===== タグフィルターの構築 =====
const tagFilterEl = document.getElementById("tagFilter");
const allTags = [...new Set(GAMES.flatMap(g => g.tags))];
allTags.forEach(tag => {
  const btn = document.createElement("button");
  btn.className = "tag-chip";
  btn.dataset.tag = tag;
  btn.textContent = tag;
  tagFilterEl.appendChild(btn);
});

tagFilterEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".tag-chip");
  if (!btn) return;
  currentTag = btn.dataset.tag;
  [...tagFilterEl.children].forEach(c => c.classList.toggle("active", c === btn));
  render();
});

// ===== 検索・並び順・お気に入りのみ =====
const searchInput = document.getElementById("searchInput");
searchInput.addEventListener("input", render);

const sortSelect = document.getElementById("sortSelect");
sortSelect.value = currentSort;
sortSelect.addEventListener("change", () => {
  currentSort = sortSelect.value;
  setCookie("sortOrder", currentSort, 365);
  render();
});

const favoriteOnlyCheck = document.getElementById("favoriteOnlyCheck");
favoriteOnlyCheck.addEventListener("change", () => {
  favoriteOnly = favoriteOnlyCheck.checked;
  render();
});

// ===== 描画 =====
const grid = document.getElementById("gameGrid");
const emptyMsg = document.getElementById("emptyMsg");
const resultCount = document.getElementById("resultCount");

// ランダム並び順は検索・タグ切替のたびに再シャッフルされると使いづらいので、
// 一度生成した乱数を保持して並び順を固定する(ページ再読み込みで再抽選)。
let randomOrder = null;
function ensureRandomOrder() {
  if (randomOrder) return;
  randomOrder = new Map();
  GAMES.forEach((g) => randomOrder.set(g.id, Math.random()));
}

function toggleFavorite(id) {
  if (favorites.has(id)) favorites.delete(id);
  else favorites.add(id);
  setCookie("favorites", JSON.stringify([...favorites]), 365);
  render();
}

function render() {
  const query = searchInput.value.trim().toLowerCase();

  let list = GAMES.filter(g => {
    const matchesTag = currentTag === "all" || g.tags.includes(currentTag);
    const matchesQuery = !query ||
      g.title.toLowerCase().includes(query) ||
      g.desc.toLowerCase().includes(query) ||
      g.tags.some(t => t.toLowerCase().includes(query));
    const matchesFavorite = !favoriteOnly || favorites.has(g.id);
    return matchesTag && matchesQuery && matchesFavorite;
  });

  const byName = (a, b) => a.title.localeCompare(b.title, "ja");
  const votesOf = (id) => (typeof GameVotes !== "undefined" ? GameVotes.getCounts(id) : { like: 0, dislike: 0 });

  if (currentSort === "name") {
    list = [...list].sort(byName);
  } else if (currentSort === "favorite") {
    list = [...list].sort((a, b) => {
      const fa = favorites.has(a.id) ? 0 : 1;
      const fb = favorites.has(b.id) ? 0 : 1;
      return fa !== fb ? fa - fb : byName(a, b); // 同グループ内も名前順
    });
  } else if (currentSort === "likes") {
    list = [...list].sort((a, b) => {
      const diff = votesOf(b.id).like - votesOf(a.id).like;
      return diff !== 0 ? diff : byName(a, b);
    });
  } else if (currentSort === "dislikes") {
    list = [...list].sort((a, b) => {
      const diff = votesOf(b.id).dislike - votesOf(a.id).dislike;
      return diff !== 0 ? diff : byName(a, b);
    });
  } else if (currentSort === "score") {
    // 評価スコア = 高評価 - 低評価。高い順(みんなの評判が良い順)。
    list = [...list].sort((a, b) => {
      const va = votesOf(a.id), vb = votesOf(b.id);
      const diff = (vb.like - vb.dislike) - (va.like - va.dislike);
      return diff !== 0 ? diff : byName(a, b);
    });
  } else if (currentSort === "votes") {
    // 投票数(高評価+低評価)が多い順 = とにかく反応が多い(注目されている)順
    list = [...list].sort((a, b) => {
      const va = votesOf(a.id), vb = votesOf(b.id);
      const diff = (vb.like + vb.dislike) - (va.like + va.dislike);
      return diff !== 0 ? diff : byName(a, b);
    });
  } else if (currentSort === "random") {
    ensureRandomOrder();
    list = [...list].sort((a, b) => randomOrder.get(a.id) - randomOrder.get(b.id));
  }
  // currentSort === "default" のときだけGAMES配列の追加順のまま表示する

  resultCount.textContent = `${list.length} 件のゲーム`;
  grid.innerHTML = "";
  emptyMsg.hidden = list.length !== 0;

  list.forEach(g => {
    const card = document.createElement("article");
    card.className = "game-card";
    const isFav = favorites.has(g.id);

    const hasVotes = typeof GameVotes !== "undefined";
    const counts = hasVotes ? GameVotes.getCounts(g.id) : { like: 0, dislike: 0 };
    const myVote = hasVotes ? GameVotes.getMyVote(g.id) : null;
    const voted = !!myVote;

    card.innerHTML = `
      <div class="card-top">
        <div class="card-emoji">${g.emoji}</div>
        <button class="fav-btn ${isFav ? "active" : ""}" aria-label="お気に入り切替">${isFav ? "★" : "☆"}</button>
      </div>
      <h2 class="card-title">${g.title}</h2>
      <p class="card-desc">${g.desc}</p>
      <div class="card-tags">${g.tags.map(t => `<span class="card-tag">${t}</span>`).join("")}</div>
      <div class="vote-row">
        <button class="vote-btn like ${myVote === "like" ? "active" : ""}" data-vote="like" ${voted ? "disabled" : ""} aria-label="高評価">
          👍 <span class="vote-count">${counts.like}</span>
        </button>
        <button class="vote-btn dislike ${myVote === "dislike" ? "active" : ""}" data-vote="dislike" ${voted ? "disabled" : ""} aria-label="低評価">
          👎 <span class="vote-count">${counts.dislike}</span>
        </button>
      </div>
      <a class="play-btn" href="${g.url}" target="_blank" rel="noopener">遊びに行く →</a>
    `;
    card.querySelector(".fav-btn").addEventListener("click", () => toggleFavorite(g.id));

    if (hasVotes) {
      card.querySelectorAll(".vote-btn").forEach((btn) => {
        btn.addEventListener("click", async () => {
          if (btn.disabled) return;
          card.querySelectorAll(".vote-btn").forEach((b) => (b.disabled = true)); // 連打での二重送信を防止
          const type = btn.dataset.vote;
          const result = await GameVotes.vote(g.id, type);
          render();
          if (!result.ok && result.reason === "error") {
            alert("投票に失敗しました。通信環境をご確認のうえ、もう一度お試しください。");
          }
        });
      });
    }

    grid.appendChild(card);
  });
}

if (typeof GameVotes !== "undefined") {
  GameVotes.onUpdate(render);
}

render();
