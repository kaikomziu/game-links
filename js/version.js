// 更新履歴
const CHANGELOG = [
  {
    version: "1.0.0",
    date: "2026-08-26",
    notes: [
      "MY GAMES LINKS 公開",
      "自作ウェブゲーム15本のリンクを掲載",
      "お気に入り登録・ダークモード・並び順をCookieで保存する機能を追加"
    ]
  },
  {
    version: "1.1.0",
    date: "2026-08-26",
    notes: [
      "めっちゃカメレオン・3D ACTION DASHを一覧から削除"
    ]
  },
  {
    version: "1.2.0",
    date: "2026-08-26",
    notes: [
      "Nandokuka Toolsを追加"
    ]
  },
  {
    version: "1.3.0",
    date: "2026-08-26",
    notes: [
      "Phosphor Calcを追加"
    ]
  },
  {
    version: "1.4.0",
    date: "2026-08-27",
    notes: [
      "反射神経DELUXEを追加"
    ]
  },
  {
    version: "1.5.0",
    date: "2026-08-27",
    notes: [
      "Cookie Factoryを追加"
    ]
  },
  {
    version: "1.6.0",
    date: "2026-08-28",
    notes: [
      "NEON RAIDERを追加"
    ]
  },
  {
    version: "1.7.0",
    date: "2026-08-28",
    notes: [
      "デフォルトの並び順を名前順(ABC/あいう順)に変更",
      "他チャットからGAMES配列のどこに新しいゲームが追加されても、開いた時に自動で正しい順序に並ぶように"
    ]
  },
  {
    version: "1.8.0",
    date: "2026-08-28",
    notes: [
      "ブラウザ脱出を追加"
    ]
  },
  {
    version: "1.9.0",
    date: "2026-08-28",
    notes: [
      "定時ダッシュ！を追加"
    ]
  },
  {
    version: "1.10.0",
    date: "2026-08-28",
    notes: [
      "TYPING DELUXEを追加",
      "新タグ「PCのみ」を追加(キーボード必須のゲーム向け)"
    ]
  },
  {
    version: "1.11.0",
    date: "2026-08-28",
    notes: [
      "ONCE A YEARを追加"
    ]
  },
  {
    version: "1.12.0",
    date: "2026-08-28",
    notes: [
      "ONCE A YEARの説明を更新(次に訪れる自分への手紙機能を追記)"
    ]
  },
  {
    version: "1.13.0",
    date: "2026-08-28",
    notes: [
      "TYPING DELUXE Phone edition(スマホ版)を追加",
      "新タグ「スマホのみ」を追加(タッチ操作前提のゲーム向け)"
    ]
  },
  {
    version: "1.14.0",
    date: "2026-08-28",
    notes: [
      "BOSS RAIDを追加",
      "新タグ「オンライン」を追加(他プレイヤーとリアルタイム連携するゲーム向け)"
    ]
  },
  {
    version: "1.15.0",
    date: "2026-08-29",
    notes: [
      "SEO改善: 各ゲームのタイトル・説明・タグをindex.htmlに静的HTMLとして直接埋め込み(tools/build-seo.jsで自動生成、検索エンジンや非JS環境でも一覧が読めるように)",
      "OGP/Twitterカード用メタタグ(og:title, og:description, og:url, twitter:card等)とcanonicalタグを追加"
    ]
  },
  {
    version: "1.16.0",
    date: "2026-08-29",
    notes: [
      "HOLD ON(長押しガマンゲーム)を追加"
    ]
  },
  {
    version: "1.17.0",
    date: "2026-08-29",
    notes: [
      "HOLD ON に世界ランキングを実装(説明文・タグを更新)"
    ]
  },
  {
    version: "1.18.0",
    date: "2026-08-30",
    notes: [
      "8192分の1(1/2を連続で勝ち抜き1/8192を目指すRNGゲーム)を追加"
    ]
  },
  {
    version: "1.19.0",
    date: "2026-08-30",
    notes: [
      "各ゲームに高評価(👍)/低評価(👎)ボタンを追加",
      "投票数は共有Supabaseで全員共有の合計数として集計、1ゲームにつき1回だけ投票可能(ブラウザCookie+DB側のUNIQUE制約で二重投票を防止)"
    ]
  },
  {
    version: "1.20.0",
    date: "2026-08-30",
    notes: [
      "並び順に「高評価が多い順」「低評価が多い順」「評価スコアが高い順(👍-👎)」「投票数が多い順」「ランダム」を追加(全8種類に)"
    ]
  },
  {
    version: "1.21.0",
    date: "2026-08-30",
    notes: [
      "STONKS(株を売買して40日で総資産を競う投資ゲーム)を追加"
    ]
  },
  {
    version: "1.23.0",
    date: "2026-08-30",
    notes: [
      "電源1%サバイバル(バッテリー残り1%で待ち合わせまで電源を持たせるゲーム)を追加"
    ]
  }
];
