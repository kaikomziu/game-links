// ===== ゲーム一覧データ =====
const GAMES = [
  {
    id: "metro-tycoon",
    title: "METRO TYCOON",
    emoji: "🚇",
    tags: ["シミュレーション", "放置"],
    desc: "初期資金¥100で駅を買い、駅と駅を線路でつないで、走る電車で稼ぐ Mini Metro 風の鉄道経営ゲーム。駅をタップして選択→別の駅をタップで線路を敷設。同じ駅からさらに別方向へつなげば枝分かれ自由(1駅→2駅、3駅→1駅と2駅…)、線路をタップすれば撤去。線路がつながると列車が自動で走り出し、分岐点では乗せている客の目的地や待ち客のいる方向へ自動で進む。乗客(行き先を示す図形マークつき)を運ぶたびに運賃が入り、区間が長いほど割り増し、運行するだけでも少額の営業収入。線路を増やすと列車も自動で増発。マップ上の点線の丸は購入できる駅で、買うほど価格が上がり乗客の発生も増える。乗客が溢れた駅を放置すると赤いリングが一周してダイヤ崩壊(ゲームオーバー)。アップグレードは6種——運賃改定(運賃+50%)、車両大型化(定員+3)、加速性能(速度+22%)、増発(全路線の列車+1)、沿線開発(乗客+35%)、新規開業(路線スロット+1)。最大5路線・色分けされた別ネットワークを運営でき、路線網を広げるほど乗客と収入が伸びる。進行はブラウザに自動保存。PC/スマホ対応。",
    url: "https://kaikomziu.github.io/metro-tycoon/"
  },
  {
    id: "money-clicker",
    title: "MONEY CLICKER",
    emoji: "💰",
    tags: ["クリッカー", "放置"],
    desc: "中央のコインをクリックしてお金を稼ぐCookie Clicker風クリッカー。全20種の建物(レモネードスタンド〜銀河コングロマリット)で自動収入を増やし、全8種のクリック強化で1クリックの額を上げる。価格は買うたび1.15倍、まとめ買いx1/x10/x100対応、数字はK/M/B/T…表記。画面にランダムで出現する金貨をクリックすると『ラッキー(即時ボーナス)』『フィーバー(生産×7)』『連打フィーバー(クリック×777)』『大当たり(全体×2)』が発動。実績は237種(建物・クリック回数・総資産・転生・ゴールドバー・ツリー・金貨・プレイ時間など)、解除1個につき全生産+1%で無限に伸びる。今回の獲得額が$100万を超えると転生でき、額に応じてゴールドバー🥇を獲得→全19ノードのアップグレードツリー(クリック/自動収入倍率・購入価格減・開始資金・オフライン強化・🥇獲得量・転生スケール・金貨強化・実績ボーナス2倍)で永久強化。ツリーは🥇全額返却で振り直し可。ニュースティッカー・獲得中バフ表示つき。離席中も収入継続、セーブは自動(localStorage)。PC/スマホ対応。",
    url: "https://kaikomziu.github.io/money-clicker/"
  },
  {
    id: "visual-code-deluxe",
    title: "VISUAL CODE DELUXE",
    emoji: "🧩",
    tags: ["ツール", "プログラミング"],
    desc: "コードを一切書かずに、ブロックを組み立ててゲーム・アニメ・ツールを作れるScratch風のビジュアルプログラミング環境。左のパレットから右のキャンバスへブロックをドラッグすると近くのブロックに吸着し、C型ブロックの中や入力欄にも入れ子にできる。▶で実行、ブロック単体クリックでも動作、パレットに戻すと削除。マルチスレッド実行エンジンでイベント(旗・キー・クリック・メッセージ・背景切替・数値超え)、クローン、ずっと/繰り返し/条件/待機に対応。480x360ステージに複数スプライト(絵文字/図形/文字/画像コスチューム)、吹き出し、回転方法、画像効果。標準10カテゴリ(動き・見た目・音・イベント・制御・調べる・演算・変数・リスト・ペン)に加え、音楽/文字/音声合成(TTS)/保存/時間/デバッグ/画面演出まで大幅拡張し全226ブロック。変数・リストのステージ表示(スライダー対応)、引数つき自作ブロック(再帰OK)、WebAudio合成の効果音・楽器、音声/画像アップロード。作品は.vcd.jsonで保存/読み込み、自動保存、サンプル8種。ターボ/ダークモード/プレゼン表示。PC・タブレット推奨。",
    url: "https://kaikomziu.github.io/visual-code-deluxe/"
  },
  {
    id: "bomb-defusal-game",
    title: "爆弾解除ゲーム",
    emoji: "💣",
    tags: ["パズル", "時間制限"],
    desc: "『Keep Talking and Nobody Explodes』(KTANE)にインスパイアされた一人用の爆弾解除ゲーム。相方はいない——アプリ内の取扱説明書だけが頼り。配線(色と本数で切る1本が決まる)、ボタン(色・文字・電池・インジケーターでタップか長押しか、長押しならタイマーの数字を見て離す)、キーパッド(4つの記号が全部そろう列を探し上から順に押す)、記憶(表示された数字と前ステージの記録から押すボタンを決める全5段階・間違えると最初から)、サイモン(光る色をシリアルの母音とストライク数で別の色に変換して押し返す)、モールス信号(点滅する単語を読んで対応周波数を送信)の6モジュール。爆弾ごとにシリアルナンバー・電池・インジケーター・ポートが変化し、ルールの分岐に絡む。難易度4段階(かんたん3〜エキスパート6モジュール)。ミスするとストライク、ストライクが増えるとタイマーが加速し、規定回数で爆発。答えは一切表示されない。説明書は印刷対応。PC/スマホ対応。",
    url: "https://kaikomziu.github.io/bomb-defusal-game/"
  },
  {
    id: "iraira-action",
    title: "イライラアクション -IRAIRA ACTION-",
    emoji: "😤",
    tags: ["アクション", "ネタ", "高難度"],
    desc: "飛び乗った瞬間に前へすっ飛んで穴に落ちる——そんな理不尽トラップだらけの意地悪アクション。『しょぼんのアクション』『I Wanna Be The Guy』系オマージュ。偽の床、消える足場、見えないブロック、天井から予告つきで降ってくる敵、押した方向と逆に進む操作反転ゾーン、床がトゲになったら天井を歩く重力反転、触ると全部台無しの偽ゴール旗など、見た目どおりに動かない仕掛けが全8ステージ(さかさま/みえない/ぜんぶ/さいご ほか)に散りばめられている。落ち着いて、あわてて飛ばず、光るものに釣られなければ必ずクリアできる設計。チェックポイント・死亡回数・タイムあり。← →/A D移動、Space/↑/Zジャンプ(長押しで高い)、Rでステージやり直し。スマホはタッチボタン(横向き推奨)。セーブなし・一本勝負。PC/スマホ対応。",
    url: "https://kaikomziu.github.io/iraira-action/"
  },
  {
    id: "sanji44",
    title: "3時44分",
    emoji: "🕓",
    tags: ["ホラー", "探索", "ノベル"],
    desc: "いなくなった弟の家を、一人称で歩きまわる一晩だけのホラー。矢印キーや画面端で見まわし、ドアや通路をクリックして弟の部屋・廊下・居間・お母さんの部屋・玄関を行き来する。日記、窓の外の人影、顔を塗りつぶされた家族写真、止まったまま3時44分をさす時計、仏壇の遺影、姿見に映る自分でない誰か——調べて動くほど家の時計が進み、真夜中が近づくほど画面が侵食され心音が近づく。3時44分、玄関の扉がノックされたら『音のする方へ行く／動かない』、たどり着いた扉で『開ける／のぞく／うずくまる』。集めた手がかりの数と選択でエンド3種に分岐。canvas描画・セーブは端末内。テスト用 ?3:40 等で開始時刻指定。PC/スマホ対応。",
    url: "https://kaikomziu.github.io/sanji44/"
  },
  {
    id: "amt-corp",
    title: "AMT -Abnormality monitoring tasks-",
    emoji: "🗂️",
    tags: ["推理", "ホラー", "ノベル"],
    desc: "高時給のバイト求人に応募したら、AMT社の『観測補助(夜勤)』だった。アブノーマリティ(異常)の観察レポートを読み、点線付きの記述の中から『おかしいところ』——本文内の矛盾、前の資料との食い違い、あとから書き換えられた一文と崩れた日本語——を見つけてクリックしていく調査ゲーム。1日1体を3択から選び、資料3枚を読み解いて小推理3問に答えるとキーワードを入手。最終日はコルクボードでキーワードを線で結び、A〜Iの穴埋めで会社が何をしていたかを推理する。誤クリックのペナルティなし。エンドはバッド/通常/トゥルー(全ケース観測+2周目以降)の3種。緑文字CRT端末風。セーブは端末内。PC/スマホ対応。",
    url: "https://kaikomziu.github.io/amt-corp/"
  },
  {
    id: "book-shelf-party",
    title: "本を棚に戻すゲーム",
    emoji: "📚",
    tags: ["オンライン", "協力", "3D"],
    desc: "友達と部屋番号を入力してつながるマルチプレイ協力3Dゲーム。床一面に散らばった本を拾う(インタラクトボタンまたはEキー)と本来の場所(本棚)が光るので、そこまで運んで棚に収める。全冊を棚に戻せばクリア。誰でも自由に出入りできる公開ルームもあり、部屋を新規に作るときは本の冊数を500・1000・2000から選べる。進捗・プレイヤー同士の位置はリアルタイムで共有される。PC操作(W/S移動、A/D回転)対応。",
    url: "https://kaikomziu.github.io/book-shelf-party/"
  },
  {
    id: "backrooms",
    title: "BACKROOMS ─ レベル移動",
    emoji: "🟨",
    tags: ["ネタ", "RNG", "ローグライト"],
    desc: "Level 0 から、行き先のレベル番号だけが書かれたボタンを選んで潜っていくBackrooms移動ゲーム。Backrooms Wiki(日本語版)の実レベルを収録し、無印通常階層とη(エータ)層あわせて63階層。ルートは各レベルの「出口」「入口」から採取。景色も音も危険度表示もなく、たよれるのは番号と自分の記憶だけ。危険なレベルほどSANITYが大きく減り、0になると振り出し。どの番号が危ないかはSANITYの増減から自分で覚えるしかない。到達記録には行ったレベルの番号と名前・回数だけが残り、死んでも消えない。Level 0→0ηがη層への入口、Level 3999から「現実」へ帰還できればクリア。レベルとルートはlevelコマンドで自由に組み替え可能。セーブは端末内。PC/スマホ対応。",
    url: "https://kaikomziu.github.io/backrooms/"
  },
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
    id: "nibutaku",
    title: "一生二択",
    emoji: "🤔",
    tags: ["二択", "ネタ"],
    desc: "「一生、学校に行かなくていい。ただし宿題は毎日5倍」か「一生、学校には通う。ただし宿題ゼロ」か——。一生に関わる絶妙に悩む二択を、ひたすら選ぶだけ。全521問・12カテゴリ。未回答からランダムに出題されるほか、『質問一覧』でカテゴリ絞り込み・キーワード検索して気になる質問を自分で選ぶこともできる。選ぶたびに、世界の何%が同じ方を選んだかが割合バーで表示され、多数派か少数派かのバッジがつく。投票は共有サーバーで集計。最後に自分の選択と多数派/少数派の数をまとめて振り返れる。回答は端末に保存され、途中からでも続けられる。正解はなし。PC/スマホ対応。",
    url: "https://kaikomziu.github.io/nibutaku/"
  },
  {
    id: "one-in-8192",
    title: "8192分の1",
    emoji: "🪙",
    tags: ["RNG", "収集"],
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
    tags: ["サバイバル", "時間制限", "ネタ"],
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
    tags: ["タイピング"],
    desc: "複数ローマ字入力(shi/si、fu/hu、ん、っ 等)に対応したタイピングゲーム。タイムアタック・お題数・サドンデスの3モード、14カテゴリ約600問。KPM・正確率・コンボで称号判定、次に押すキーをキーボードでハイライト。スマホは画面内キーボードをタップして入力。",
    url: "https://kaikomziu.github.io/typing-deluxe/"
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

// タグは複数選択できる。selectedTags が空なら「すべて」。
// tagMode は "and"(全部含む) / "or"(どれか含む)。モードだけCookieに保存する。
let selectedTags = new Set();
let tagMode = getCookie("tagMode") === "and" ? "and" : "or";
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

// ===== タグフィルターの構築(複数選択 + AND/OR) =====
const tagFilterEl = document.getElementById("tagFilter");
const allTags = [...new Set(GAMES.flatMap(g => g.tags))].sort((a, b) => a.localeCompare(b, "ja"));

const tagModeBtn = document.createElement("button");
tagModeBtn.className = "tag-mode-btn";
tagModeBtn.type = "button";
tagModeBtn.hidden = true; // 2個以上選ばれたときだけ意味があるので、その時に出す

function updateTagModeBtn() {
  tagModeBtn.textContent = tagMode === "and" ? "AND（全部含む）" : "OR（どれか含む）";
  tagModeBtn.hidden = selectedTags.size < 2;
}
tagModeBtn.addEventListener("click", () => {
  tagMode = tagMode === "and" ? "or" : "and";
  setCookie("tagMode", tagMode, 365);
  updateTagModeBtn();
  render();
});

allTags.forEach(tag => {
  const btn = document.createElement("button");
  btn.className = "tag-chip";
  btn.dataset.tag = tag;
  btn.textContent = tag;
  tagFilterEl.appendChild(btn);
});
tagFilterEl.appendChild(tagModeBtn);

function syncTagChips() {
  [...tagFilterEl.querySelectorAll(".tag-chip")].forEach((c) => {
    if (c.dataset.tag === "all") {
      c.classList.toggle("active", selectedTags.size === 0);
    } else {
      c.classList.toggle("active", selectedTags.has(c.dataset.tag));
    }
  });
  updateTagModeBtn();
}

tagFilterEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".tag-chip");
  if (!btn) return;
  const tag = btn.dataset.tag;
  if (tag === "all") {
    selectedTags.clear();
  } else if (selectedTags.has(tag)) {
    selectedTags.delete(tag);
  } else {
    selectedTags.add(tag);
  }
  syncTagChips();
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
    const matchesTag = selectedTags.size === 0 ||
      (tagMode === "and"
        ? [...selectedTags].every(t => g.tags.includes(t))
        : g.tags.some(t => selectedTags.has(t)));
    const matchesQuery = !query ||
      g.title.toLowerCase().includes(query) ||
      g.desc.toLowerCase().includes(query) ||
      g.tags.some(t => t.toLowerCase().includes(query));
    const matchesFavorite = !favoriteOnly || favorites.has(g.id);
    return matchesTag && matchesQuery && matchesFavorite;
  });

  const byName = (a, b) => a.title.localeCompare(b.title, "ja");
  const votesOf = (id) => (typeof GameVotes !== "undefined" ? GameVotes.getCounts(id) : { like: 0, dislike: 0 });
  const playsOf = (id) => (typeof GameStats !== "undefined" ? GameStats.getPlays(id) : 0);

  if (currentSort === "plays") {
    list = [...list].sort((a, b) => {
      const diff = playsOf(b.id) - playsOf(a.id);
      return diff !== 0 ? diff : byName(a, b);
    });
  } else if (currentSort === "name") {
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
    const plays = typeof GameStats !== "undefined" ? GameStats.getPlays(g.id) : 0;

    card.innerHTML = `
      <div class="card-top">
        <div class="card-emoji">${g.emoji}</div>
        <div class="card-top-btns">
          <button class="share-btn" aria-label="このゲームを共有">🔗</button>
          <button class="fav-btn ${isFav ? "active" : ""}" aria-label="お気に入り切替">${isFav ? "★" : "☆"}</button>
        </div>
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
      <span class="play-count" ${plays > 0 ? "" : "hidden"}>▶ ${plays.toLocaleString()} 回プレイ</span>
    `;
    card.querySelector(".fav-btn").addEventListener("click", () => toggleFavorite(g.id));
    card.querySelector(".share-btn").addEventListener("click", () => {
      if (typeof GameExtras !== "undefined") GameExtras.shareGame(g.title, g.url);
    });
    card.querySelector(".play-btn").addEventListener("click", () => {
      if (typeof GameStats !== "undefined") GameStats.recordPlay(g.id);
    });

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
if (typeof GameStats !== "undefined") {
  GameStats.onUpdate(render);
}

syncTagChips();
render();
