// お菓子(ハロウィン中のおばけからもらえる通貨)と、お菓子ショップで買ったアイテムの保存。
// お菓子が貯まるのはハロウィン期間だけだが、買ったものは通常日にもずっと使える。
const Candy = (() => {
  const KEY_CANDY = "gl_halloween_candy";
  const KEY_OWNED = "gl_hw_owned";
  const KEY_ON = "gl_hw_on";
  const listeners = [];
  const state = { candy: 0, owned: [], on: [] };

  function readList(key) {
    try {
      const a = JSON.parse(localStorage.getItem(key));
      return Array.isArray(a) ? a : [];
    } catch (e) { return []; }
  }
  function load() {
    try { state.candy = parseInt(localStorage.getItem(KEY_CANDY), 10) || 0; } catch (e) { state.candy = 0; }
    state.owned = readList(KEY_OWNED);
    state.on = readList(KEY_ON);
  }
  function notify() {
    listeners.forEach((fn) => { try { fn(); } catch (e) {} });
  }
  function save() {
    try {
      localStorage.setItem(KEY_CANDY, String(state.candy));
      localStorage.setItem(KEY_OWNED, JSON.stringify(state.owned));
      localStorage.setItem(KEY_ON, JSON.stringify(state.on));
    } catch (e) {}
    notify();
  }

  load();
  // 別タブで貯めた/買った内容にも追従する
  window.addEventListener("storage", (e) => {
    if (e.key && e.key.indexOf("gl_h") === 0) { load(); notify(); }
  });

  return {
    get: () => state.candy,
    add(n) { state.candy += n; save(); return state.candy; },
    spend(n) {
      if (state.candy < n) return false;
      state.candy -= n;
      save();
      return true;
    },
    owned: () => state.owned.slice(),
    has: (id) => state.owned.includes(id),
    isOn: (id) => state.owned.includes(id) && state.on.includes(id),
    own(id) {
      if (!state.owned.includes(id)) state.owned.push(id);
      if (!state.on.includes(id)) state.on.push(id);
      save();
    },
    setOn(id, on) {
      state.on = state.on.filter((x) => x !== id);
      if (on) state.on.push(id);
      save();
    },
    onChange: (fn) => { listeners.push(fn); },
  };
})();
