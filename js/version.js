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
      "めっちゃカメレオン・3D ACTION DASHを一覧から削除(ユーザー指示)"
    ]
  },
  {
    version: "1.2.0",
    date: "2026-08-26",
    notes: [
      "タウンDELUXEを追加"
    ]
  },
  {
    version: "1.3.0",
    date: "2026-08-26",
    notes: [
      "○×DELUXEを追加"
    ]
  },
  {
    version: "1.4.0",
    date: "2026-08-26",
    notes: [
      "Rhythmerを追加"
    ]
  },
  {
    version: "1.5.0",
    date: "2026-08-26",
    notes: [
      "ちんちろDELUXEを追加"
    ]
  },
  {
    version: "1.6.0",
    date: "2026-08-26",
    notes: [
      "ちんちろDELUXEの表記をチンチロDELUXE(カタカナ)に修正"
    ]
  },
  {
    version: "1.7.0",
    date: "2026-08-26",
    notes: [
      "Nandokuka Toolsを追加"
    ]
  },
  {
    version: "1.8.0",
    date: "2026-08-26",
    notes: [
      "MILLION CLICKERを追加"
    ]
  },
  {
    version: "1.9.0",
    date: "2026-08-26",
    notes: [
      "Phosphor Calcを追加"
    ]
  },
  {
    version: "1.10.0",
    date: "2026-08-27",
    notes: [
      "反射神経DELUXEを追加"
    ]
  },
  {
    version: "1.11.0",
    date: "2026-08-27",
    notes: [
      "Cookie Factoryを追加"
    ]
  },
  {
    version: "1.12.0",
    date: "2026-08-28",
    notes: [
      "MODEM DELUXEを追加"
    ]
  },
  {
    version: "1.13.0",
    date: "2026-08-28",
    notes: [
      "NEON RAIDERを追加"
    ]
  },
  {
    version: "1.14.0",
    date: "2026-08-28",
    notes: [
      "デフォルトの並び順を名前順(ABC/あいう順)に変更",
      "他チャットからGAMES配列のどこに新しいゲームが追加されても、開いた時に自動で正しい順序に並ぶように"
    ]
  },
  {
    version: "1.15.0",
    date: "2026-08-28",
    notes: [
      "NEON RAIDERの説明にBOSS RUSHモードを追記"
    ]
  },
  {
    version: "1.16.0",
    date: "2026-08-28",
    notes: [
      "ブラウザ脱出を追加"
    ]
  },
  {
    version: "1.17.0",
    date: "2026-08-28",
    notes: [
      "ブラウザ脱出のカード説明文を他カードの文体・文字数に合わせて短縮"
    ]
  },
  {
    version: "1.18.0",
    date: "2026-08-28",
    notes: [
      "定時ダッシュ！を追加"
    ]
  },
  {
    version: "1.19.0",
    date: "2026-08-28",
    notes: [
      "TYPING DELUXEを追加",
      "新タグ「PCのみ」を追加(キーボード必須のゲーム向け)"
    ]
  },
  {
    version: "1.20.0",
    date: "2026-08-28",
    notes: [
      "POWDER SANDBOXを追加"
    ]
  },
  {
    version: "1.21.0",
    date: "2026-08-28",
    notes: [
      "ONCE A YEARを追加"
    ]
  },
  {
    version: "1.22.0",
    date: "2026-08-28",
    notes: [
      "ONCE A YEARの説明を更新(次に訪れる自分への手紙機能を追記)"
    ]
  },
  {
    version: "1.23.0",
    date: "2026-08-28",
    notes: [
      "TYPING DELUXE Phone edition(スマホ版)を追加"
    ]
  },
  {
    version: "1.24.0",
    date: "2026-08-28",
    notes: [
      "新タグ「スマホのみ」を追加(タッチ操作前提のゲーム向け)、Phone editionのタグを修正"
    ]
  },
  {
    version: "1.25.0",
    date: "2026-08-28",
    notes: [
      "影あわせDELUXEを追加"
    ]
  },
  {
    version: "1.26.0",
    date: "2026-08-28",
    notes: [
      "BOSS RAIDを追加",
      "新タグ「オンライン」を追加(他プレイヤーとリアルタイム連携するゲーム向け)"
    ]
  },
  {
    version: "1.27.0",
    date: "2026-08-28",
    notes: [
      "GACHA LIFEを追加"
    ]
  },
  {
    version: "1.28.0",
    date: "2026-08-29",
    notes: [
      "Google Search Console確認用ファイル(google638b82f251e650ee.html)を追加"
    ]
  },
  {
    version: "1.29.0",
    date: "2026-08-29",
    notes: [
      "SEO改善: 各ゲームのタイトル・説明・タグをindex.htmlに静的HTMLとして直接埋め込み(tools/build-seo.jsで自動生成、検索エンジンや非JS環境でも一覧が読めるように)",
      "OGP/Twitterカード用メタタグ(og:title, og:description, og:url, twitter:card等)とcanonicalタグを追加"
    ]
  },
  {
    version: "1.30.0",
    date: "2026-08-29",
    notes: [
      "HOLD ON(長押しガマンゲーム)を追加"
    ]
  },
  {
    version: "1.31.0",
    date: "2026-08-29",
    notes: [
      "HOLD ON に世界ランキングを実装(説明文・タグを更新)"
    ]
  },
  {
    version: "1.32.0",
    date: "2026-08-30",
    notes: [
      "8192分の1(1/2を連続で勝ち抜き1/8192を目指すRNGゲーム)を追加"
    ]
  },
  {
    version: "1.33.0",
    date: "2026-08-30",
    notes: [
      "8192分の1の説明を左右選択方式に更新"
    ]
  },
  {
    version: "1.34.0",
    date: "2026-08-30",
    notes: [
      "各ゲームに高評価(👍)/低評価(👎)ボタンを追加",
      "投票数は共有Supabaseで全員共有の合計数として集計、1ゲームにつき1回だけ投票可能(ブラウザCookie+DB側のUNIQUE制約で二重投票を防止)"
    ]
  },
  {
    version: "1.35.0",
    date: "2026-08-30",
    notes: [
      "並び順に「高評価が多い順」「低評価が多い順」「評価スコアが高い順(👍-👎)」「投票数が多い順」「ランダム」を追加"
    ]
  },
  {
    version: "1.36.0",
    date: "2026-08-30",
    notes: [
      "STONKS(株を売買して40日で総資産を競う投資ゲーム)を追加"
    ]
  },
  {
    version: "1.37.0",
    date: "2026-08-30",
    notes: [
      "電源1%サバイバル(バッテリー残り1%で待ち合わせまで電源を持たせるゲーム)を追加"
    ]
  },
  {
    version: "1.38.0",
    date: "2026-08-30",
    notes: [
      "build-seo.jsがGAMES配列から全ゲームURLを列挙したsitemap.xmlを出力するように",
      "ルートのrobots.txtから参照される"
    ]
  },
  {
    version: "1.39.0",
    date: "2026-08-30",
    notes: [
      "TETRIS DELUXE(ガイドライン準拠のブラウザ版テトリス。SRS回転・T-スピン・3モード)を追加"
    ]
  },
  {
    version: "1.40.0",
    date: "2026-09-01",
    notes: [
      "PIXEL PLACE(世界共有の100×100ドット絵キャンバス。5秒に1マス塗れる協力お絵かき)を追加"
    ]
  },
  {
    version: "1.41.0",
    date: "2026-09-01",
    notes: [
      "PIXEL PLACEの説明をマルチサーバー+チャージ制に更新"
    ]
  },
  {
    version: "1.42.0",
    date: "2026-09-01",
    notes: [
      "HIT & BLOW 対戦を追加"
    ]
  },
  {
    version: "1.43.0",
    date: "2026-09-01",
    notes: [
      "HIT & BLOWの説明をワードル式の色判定に更新"
    ]
  },
  {
    version: "1.44.0",
    date: "2026-09-02",
    notes: [
      "HIT & BLOWの説明をv1.3の内容に更新"
    ]
  },
  {
    version: "1.45.0",
    date: "2026-09-03",
    notes: [
      "CAPTCHA地獄を追加"
    ]
  },
  {
    version: "1.46.0",
    date: "2026-09-04",
    notes: [
      "BACKROOMS ─ レベル移動を追加"
    ]
  },
  {
    version: "1.47.0",
    date: "2026-09-04",
    notes: [
      "BACKROOMSの説明を危険度非表示の仕様に合わせて更新"
    ]
  },
  {
    version: "1.48.0",
    date: "2026-09-04",
    notes: [
      "BACKROOMSの説明を収録レベル数に合わせて更新"
    ]
  },
  {
    version: "1.49.0",
    date: "2026-09-04",
    notes: [
      "BACKROOMSの説明をη層追加に合わせて更新"
    ]
  },
  {
    version: "1.50.0",
    date: "2026-09-04",
    notes: [
      "本を棚に戻すゲーム(友達と部屋番号でつながるマルチプレイ協力3Dゲーム)を追加"
    ]
  },
  {
    version: "1.51.0",
    date: "2026-09-06",
    notes: [
      "AMT -Abnormality monitoring tasks- を追加"
    ]
  },
  {
    version: "1.52.0",
    date: "2026-09-07",
    notes: [
      "「今日はなんの日」バナーを追加",
      "誕生花・記念日などをランダムに1つ表示、日替わりで内容が変わる"
    ]
  },
  {
    version: "1.53.0",
    date: "2026-09-07",
    notes: [
      "「3時44分」を追加"
    ]
  },
  {
    version: "1.54.0",
    date: "2026-09-07",
    notes: [
      "イライラアクション -IRAIRA ACTION- を追加"
    ]
  },
  {
    version: "1.55.0",
    date: "2026-09-07",
    notes: [
      "「3時44分」の説明を更新(マップ拡張版)"
    ]
  },
  {
    version: "1.56.0",
    date: "2026-09-07",
    notes: [
      "イライラアクションの説明を全8ステージ化に合わせて更新"
    ]
  },
  {
    version: "1.57.0",
    date: "2026-09-09",
    notes: [
      "爆弾解除ゲーム(KTANE風・一人用)を追加"
    ]
  },
  {
    version: "1.58.0",
    date: "2026-09-09",
    notes: [
      "VISUAL CODE DELUXEを追加"
    ]
  },
  {
    version: "1.59.0",
    date: "2026-09-09",
    notes: [
      "MONEY CLICKERを追加"
    ]
  },
  {
    version: "1.60.0",
    date: "2026-09-09",
    notes: [
      "MONEY CLICKERの説明に転生・アップグレードツリーを反映"
    ]
  },
  {
    version: "1.61.0",
    date: "2026-09-09",
    notes: [
      "MONEY CLICKERの説明にv1.2.0の内容(建物20種・実績237種・金貨)を反映"
    ]
  },
  {
    version: "1.62.0",
    date: "2026-09-10",
    notes: [
      "TYPING DELUXEがスマホ対応(画面内キーボードをタップして入力)。別サイトだったPhone editionは本体に統合したため一覧から削除",
      "未使用になった「PCのみ」「スマホのみ」タグを整理"
    ]
  },
  {
    version: "1.63.0",
    date: "2026-09-10",
    notes: [
      "METRO TYCOON(駅を買い路線をつないで走る電車で稼ぐMini Metro風の鉄道経営ゲーム)を追加"
    ]
  },
  {
    version: "1.64.0",
    date: "2026-09-10",
    notes: [
      "一生二択を追加"
    ]
  },
  {
    version: "1.65.0",
    date: "2026-09-10",
    notes: [
      "一生二択の説明を521問・ランダム/一覧モードに更新"
    ]
  },
  {
    version: "1.66.0",
    date: "2026-09-10",
    notes: [
      "ランダムピック・複数タグ絞り込み・共有ボタン・プレイ数カウント・統計ダッシュボード・レトロ風訪問者カウンター・PWA対応・Konamiコマンドを追加"
    ]
  },
  {
    version: "1.67.0",
    date: "2026-09-10",
    notes: [
      "METRO TYCOONの説明を更新(線路ネットワーク化)"
    ]
  },
  {
    version: "1.68.0",
    date: "2026-09-12",
    notes: [
      "タグを整理・統合(46種→37種)",
      "表記ゆれや類似タグをまとめて絞り込みやすく"
    ]
  },
  {
    version: "1.69.0",
    date: "2026-09-12",
    notes: [
      "LOBOTOMY DELUXE(ロボトミーコーポレーション風の収容体管理シミュレーター)を追加"
    ]
  },
  {
    version: "1.70.0",
    date: "2026-09-12",
    notes: [
      "8192分の1に世界ランキング(歴代最高連勝)が追加されたのに合わせ、説明文とタグ(オンライン追加)を更新"
    ]
  },
  {
    version: "1.71.0",
    date: "2026-09-12",
    notes: [
      "TAIKO SIM(TJA譜面プレイヤー)を追加"
    ]
  },
  {
    version: "1.72.0",
    date: "2026-09-12",
    notes: [
      "音楽/リズムのタグを整理: リズム判定ゲームは「リズム」、演奏・作曲系ツールは「音楽」に統一(Rhythmer・Cookie Factoryを「リズム」に変更)"
    ]
  },
  {
    version: "1.73.0",
    date: "2026-09-12",
    notes: [
      "新作「SMASH DELUXE」(スマブラ風対戦アクション、オリジナルファイター8体・最大4人対戦)を追加"
    ]
  },
  {
    version: "1.74.0",
    date: "2026-09-12",
    notes: [
      "SMASH DELUXEがスマホのタッチ操作・オンライン対戦(1対1)に対応したのに合わせ、説明文とタグ(オンライン追加)を更新"
    ]
  },
  {
    version: "1.75.0",
    date: "2026-09-12",
    notes: [
      "新作「TOWER CLASH」(防衛vs侵略の非対称タワーディフェンス対戦、5桁ルームコードでPC・スマホのクロスプレイ対応)を追加"
    ]
  },
  {
    version: "1.76.0",
    date: "2026-09-12",
    notes: [
      "TOWER CLASHがガチャ収集×全5ステージのキャンペーンモードをメインに大型アップデートしたのに合わせ、説明文とタグを更新"
    ]
  },
  {
    version: "1.77.0",
    date: "2026-09-12",
    notes: [
      "TOWER CLASHがオンライン対戦をサブ機能化・編成キャラをオンラインにも持ち込めるよう改修したのに合わせ、説明文を更新"
    ]
  },
  {
    version: "1.78.0",
    date: "2026-09-13",
    notes: [
      "BRAWL DELUXE(ブロスタ風見下ろし型対戦アクション、オリジナルファイター10体)を追加"
    ]
  },
  {
    version: "1.79.0",
    date: "2026-09-13",
    notes: [
      "RING JUMP DELUXE(輪くぐりジャンプ)を追加"
    ]
  },
  {
    version: "1.80.0",
    date: "2026-09-13",
    notes: [
      "無限スキルツリー ～折れた世界樹～(8系統×60階層+隠し系統のスキルツリー放置ゲーム)を追加"
    ]
  },
  {
    version: "1.81.0",
    date: "2026-09-13",
    notes: [
      "「正しいノック -THE RIGHT KNOCK-」(心理ホラー)を追加"
    ]
  },
  {
    version: "1.82.0",
    date: "2026-09-14",
    notes: [
      "MONEY CLICKERの説明に世界ランキング機能(v1.3.0)を反映"
    ]
  },
  {
    version: "1.83.0",
    date: "2026-09-14",
    notes: [
      "MONEY CLICKERのタグを固定11ジャンルに合わせて修正(クリッカー・放置のみに)"
    ]
  },
  {
    version: "1.84.0",
    date: "2026-09-14",
    notes: [
      "ドットバトルを追加"
    ]
  },
  {
    version: "1.85.0",
    date: "2026-09-14",
    notes: [
      "「既読、しないで。」(LINEチャット形式の心理ホラー)を追加"
    ]
  },
  {
    version: "1.86.0",
    date: "2026-09-14",
    notes: [
      "小ネタ機能を追加: 各ゲームカードに裏話💭ボタン、隠しコマンド2種"
    ]
  },
  {
    version: "1.87.0",
    date: "2026-09-14",
    notes: [
      "隠しコマンドを大量追加(12種)+ヒントを各所に散りばめ"
    ]
  },
  {
    version: "1.88.0",
    date: "2026-09-14",
    notes: [
      "サイト名を「MY GAMES LINKS」から「かるわか GAMES」に変更(実在の企業「MY.GAMES」との検索衝突を避けるため)"
    ]
  },
  {
    version: "1.89.0",
    date: "2026-09-14",
    notes: [
      "一覧を見やすく: 各カードの説明文を1文だけ表示し、「もっと見る」で全文展開する仕組みに変更"
    ]
  },
  {
    version: "1.90.0",
    date: "2026-09-15",
    notes: [
      "PARADOX LOOP(時間ループの中で『過去の自分』の分身を利用して脱出する因果ループ脱出パズル)を追加"
    ]
  },
  {
    version: "1.91.0",
    date: "2026-09-15",
    notes: [
      "CONVENI DELUXE(おにぎり1個だけの小さなコンビニから始まる経営シミュレーション)を追加"
    ]
  },
  {
    version: "1.92.0",
    date: "2026-09-15",
    notes: [
      "MESSAGE DELUXE(友達コードでつながるシンプルなメッセージアプリ)を追加"
    ]
  },
  {
    version: "1.93.0",
    date: "2026-09-15",
    notes: [
      "STACK DELUXE(左右に動くブロックを落として積み上げていくタワーゲーム)を追加"
    ]
  },
  {
    version: "1.94.0",
    date: "2026-09-16",
    notes: [
      "PHYSICS LAB DELUXE(表示2D・内部3D物理エンジンの物理法則プレイグラウンド)を追加"
    ]
  },
  {
    version: "1.95.0",
    date: "2026-09-16",
    notes: [
      "INSPECTOR DELUXE(架空の「中央書類管理局」で申請書と身分証明書を見比べて承認・却下する書類審査シミュレーター)を追加"
    ]
  },
  {
    version: "1.96.0",
    date: "2026-09-16",
    notes: [
      "HAMMER CLIMB DELUXE(Getting Over It風の物理登りゲーム)を追加"
    ]
  },
  {
    version: "1.97.0",
    date: "2026-09-17",
    notes: [
      "ATTACK ATTACK BATTLE(オリジナルファイターで殴り合うリアルタイム格闘アクション)を追加"
    ]
  },
  {
    version: "1.98.0",
    date: "2026-09-17",
    notes: [
      "UNDERTALE BATTLE EMULATOR(Undertale風の弾幕バトルを自作できるブラウザ製エディタ)を追加"
    ]
  },
  {
    version: "1.99.0",
    date: "2026-09-17",
    notes: [
      "SCRATCH DELUXE(スクラッチくじゲーム)を追加"
    ]
  },
  {
    version: "1.100.0",
    date: "2026-09-18",
    notes: [
      "SIGNAL FLOW DELUXE(信号タイミング調整の渋滞パズルシム)を追加"
    ]
  },
  {
    version: "1.101.0",
    date: "2026-09-18",
    notes: [
      "JOO-J(異常観測機構日本支部、SCP風投稿型Wiki)を追加"
    ]
  },
  {
    version: "1.102.0",
    date: "2026-09-19",
    notes: [
      "4月1日限定(またはURLに?0401)のエイプリルフールモードを追加",
      "サイト全体の見た目が変わる特別演出とジョークカードを実装"
    ]
  },
  {
    version: "1.103.0",
    date: "2026-09-19",
    notes: [
      "エイプリルフールモードをさらに派手に強化"
    ]
  },
  {
    version: "1.104.0",
    date: "2026-09-19",
    notes: [
      "エイプリルフールのジョークカードを本物のミニゲーム「🔐本人確認センター」に差し替え"
    ]
  },
  {
    version: "1.105.0",
    date: "2026-09-19",
    notes: [
      "🔐本人確認センターに更新履歴管理とバージョン表示を追加"
    ]
  },
  {
    version: "1.106.0",
    date: "2026-09-19",
    notes: [
      "🔐本人確認センターのCHANGELOGを実装順に8バージョン(v1.0.0〜v1.7.0)に細分化"
    ]
  }
];
