// 掲示板タブ: 埋め込んだ掲示板に、ログイン中のかるわかGAMESアカウントを渡す
(function () {
  const ORIGIN = "https://karuwaka-bbs.4yomaban.workers.dev";
  const frame = document.getElementById("boardFrame");
  if (!frame) return;
  // ログイン中なら、トークンとユーザー名を掲示板へ送る(送り先は掲示板のオリジンだけ)
  function send() {
    if (!frame.contentWindow) return;
    const ka = window.KaAccount;
    const u = ka && ka.user();
    frame.contentWindow.postMessage(
      { type: "ka-token", token: u ? ka.token() : null, user: u ? u.username : null },
      ORIGIN
    );
  }
  // 掲示板側から「ログイン情報をください」と言われたとき(自分の枠からの要求だけに答える)
  window.addEventListener("message", (e) => {
    if (e.origin === ORIGIN && e.source === frame.contentWindow && e.data && e.data.type === "ka-need") send();
  });
  // ログイン・ログアウトしたときも送り直す
  if (window.KaAccount) {
    window.KaAccount.ready.then(send);
    window.KaAccount.onChange(send);
  }
})();
