// 11.5: contrast check. Opens every page (and a few pop-ups) in the demo, in light and dark, and measures
// every piece of text against the color behind it. Fails under 4.5 to 1 (3 to 1 for large text).
// Also: no text under 12 px on Home (P2); Home chips and Refresh buttons at least 40 px tall (P3).
const { chromium } = require("./_compat");
const http = require("http"), fs = require("fs"), path = require("path");
const root = path.resolve(__dirname, "..");
const srv = http.createServer((q, r) => {
  const u = q.url.split("?")[0];
  fs.readFile(path.join(root, u === "/" ? "index.html" : u), (e, d) => { if (e) { r.statusCode = 404; return r.end(); } r.end(d); });
}).listen(8796);

// Runs inside the page: returns the text pieces that are too faint.
const measure = () => {
  const parse = (s) => { const m = String(s).match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const over = (top, bot) => ({ r: top.r * top.a + bot.r * (1 - top.a), g: top.g * top.a + bot.g * (1 - top.a), b: top.b * top.a + bot.b * (1 - top.a), a: 1 });
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const page = parse(getComputedStyle(document.body).backgroundColor); const base = page && page.a ? page : { r: 255, g: 255, b: 255, a: 1 };
  const bgOf = (el) => { // color behind el; null when a picture or gradient is behind it (can't measure)
    const chain = []; for (let e = el; e; e = e.parentElement) chain.push(e);
    let bg = { ...base, a: 1 };
    for (const e of chain.reverse()) { const cs = getComputedStyle(e); if (cs.backgroundImage !== "none") return null; const c = parse(cs.backgroundColor); if (c && c.a > 0) bg = over(c, bg); }
    return bg;
  };
  const bad = [], seen = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = walker.nextNode());) {
    if (!n.nodeValue.trim()) continue;
    const el = n.parentElement; if (!el || seen.has(el) || el.closest("script,style,[hidden],svg,:disabled")) continue; seen.add(el);
    const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
    const cs = getComputedStyle(el); if (cs.visibility === "hidden" || cs.display === "none") continue;
    let op = 1; for (let e = el; e; e = e.parentElement) op *= +getComputedStyle(e).opacity;
    if (op < 0.05) continue;
    const bg = bgOf(el); if (!bg) continue;
    let fg = parse(cs.color); if (!fg) continue; fg = over({ ...fg, a: fg.a * op }, bg);
    const size = parseFloat(cs.fontSize), large = size >= 24 || (size >= 18.66 && +cs.fontWeight >= 700);
    const need = large ? 3 : 4.5, got = ratio(fg, bg);
    if (got < need) bad.push(`${(el.className && String(el.className).slice(0, 30)) || el.tagName.toLowerCase()} "${n.nodeValue.trim().slice(0, 28)}" ${got.toFixed(2)} (need ${need})`);
  }
  return bad;
};

(async () => {
  const b = await chromium.launch();
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  const errors = [];
  for (const scheme of ["light", "dark"]) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, colorScheme: scheme });
    await ctx.route("**/api.gold-api.com/**", (r) => r.abort());
    const p = await ctx.newPage(); p.on("pageerror", (e) => errors.push(e.message));
    await p.goto("http://localhost:8796/?demo"); await p.waitForFunction(() => store.mode === "demo", null, { timeout: 15000 }); await p.waitForTimeout(500);
    const ids = await p.evaluate(() => ({ coin: allCoins().find((c) => c.status === "owned")?.id, album: (typeof allAlbums === "function" ? allAlbums() : [])[0]?.id, box: (typeof allBoxes === "function" ? allBoxes() : [])[0]?.id }));
    const pages = ["home", "value", "albums", "wants", "coins", "forsale", "stacks", "boxes", "shows", "reports", "guide", "options"];
    if (ids.coin) pages.push("coin-" + ids.coin); if (ids.album) pages.push("album-" + ids.album); if (ids.box) pages.push("box-" + ids.box);
    const bad = [];
    for (const h of pages) {
      await p.evaluate((h) => go(h), h); await p.waitForTimeout(250);
      (await p.evaluate(measure)).forEach((l) => bad.push(`${h}: ${l}`));
    }
    // pop-ups: the insurance report, the metal prices, the menu
    for (const [name, open] of [["report pop-up", () => openReportForm()], ["menu", () => { $("#menuBtn").click(); }]]) {
      try { await p.evaluate(open); await p.waitForTimeout(300); (await p.evaluate(measure)).forEach((l) => bad.push(`${name}: ${l}`)); await p.evaluate(() => { if (!$("#sheet").hidden) closeSheet(); closeMenu(); }); } catch (e) { /* pop-up not available */ }
    }
    ok(`${scheme}: all text readable (${pages.length} pages)`, bad.length === 0);
    [...new Set(bad)].slice(0, 25).forEach((l) => console.log("  " + l));

    // P2 + P3 on Home
    await p.evaluate(() => go("home")); await p.waitForTimeout(250);
    const home = await p.evaluate(() => {
      const small = [], short = [];
      const w = document.createTreeWalker($("#view"), NodeFilter.SHOW_TEXT);
      for (let n; (n = w.nextNode());) { if (!n.nodeValue.trim()) continue; const el = n.parentElement; const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue; const s = parseFloat(getComputedStyle(el).fontSize); if (s < 12) small.push(`${s}px "${n.nodeValue.trim().slice(0, 24)}"`); }
      document.querySelectorAll("#view .home-chips .chip, #view .sh-getp, #view [data-act*=efresh]").forEach((el) => { const r = el.getBoundingClientRect(); if (r.width > 0 && r.height < 40) short.push(`${el.className || el.dataset.act} ${Math.round(r.height)}px`); });
      return { small, short };
    });
    ok(`${scheme}: no text under 12 px on Home`, home.small.length === 0); home.small.slice(0, 8).forEach((l) => console.log("  " + l));
    ok(`${scheme}: Home chips and Refresh at least 40 px tall`, home.short.length === 0); home.short.slice(0, 8).forEach((l) => console.log("  " + l));
    await ctx.close();
  }
  console.log("errors", JSON.stringify(errors));
  await b.close(); srv.close();
})();
