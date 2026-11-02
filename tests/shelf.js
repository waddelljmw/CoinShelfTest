// Step 4.2: the Home shelf, its two styles, and tapping things to open them.
const { chromium } = require("./_compat");
const ok = (name, v) => console.log((v ? "ok   " : "FAIL ") + name);
const shots = process.argv.includes("--shots");
(async () => {
  const b = await chromium.launch();
  const run = async (dark) => {
    const p = await b.newPage({ viewport: { width: 390, height: 844 }, colorScheme: dark ? "dark" : "light" });
    const errors = []; p.on("pageerror", (e) => errors.push(e.message));
    await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
    return { p, errors };
  };
  const { p, errors } = await run(false);
  // Empty cabinet still draws, with hints
  ok("empty shelf drawn", !!(await p.$(".sh-cab.wood")) && (await p.$$(".sh-ghost")).length === 2);
  ok("bookcase by default, no safe class", !(await p.evaluate(() => document.body.classList.contains("safe"))));
  await p.evaluate(() => {
    saveSettings({ spot: { gold: 2680, silver: 30, platinum: null, copper: null }, spotUpdated: "2026-11-02T16:11:00Z" });
    const mk = (id, o) => put("c_" + id, { ...blankCoin(), id, typeName: "Test", year: "1990", value: "10", qty: 1, status: "owned", ...o });
    mk("m1", { metal: "Silver", oz: "0.77344", value: "50" });
    mk("g1", { metal: "Gold", oz: "0.12094", value: "400" });
    mk("bar", { item: "bullion", bShape: "Bar", bWeight: "10", bPurity: "0.999", metal: "Silver", oz: "9.99", stack: "My Silver Stack" });
    mk("roll", { item: "roll", metal: "Silver", value: "" });
    mk("set", { item: "set", year: "1964", typeName: "Proof set", value: "60" });
    put("a_al1", { kind: "album", id: "al1", name: "Franklin 1948–63", typeId: "franklin", start: 1948, end: 1963 });
    put("b_bx1", { kind: "box", id: "bx1", name: "Black box 1", rows: 10, perRow: 10, createdAt: 1 });
  });
  await p.evaluate(() => go("home")); await p.waitForTimeout(200);
  const txt = await p.textContent("main");
  ok("plaques show value, melt and count", /Collection value/.test(txt) && /Melt value/.test(txt) && !!(await p.$(".sh-pl.big")));
  ok("metal prices on the top shelf", /Silver \$30\.00/.test(await p.textContent(".sh-spot")) && /Prices updated .*2026/.test(await p.textContent(".sh-upd")));
  ok("album spine", (await p.$$(".sh-spine")).length === 1);
  ok("stack shows a bar and ounces", !!(await p.$(".sh-bar.b")) && /My Silver Stack/.test(txt));
  ok("my coins stack has silver and gold", !!(await p.$(".sh-coin.ag")) && !!(await p.$(".sh-coin.au")));
  ok("rolls, box and sets shown", !!(await p.$(".sh-roll")) && /2x2 box · 0\/100/.test(txt) && /Sets · 1/.test(txt));
  ok("cost and gain kept", /Cost/.test(txt) && /Gain/.test(txt));
  ok("stack chip above shelf", !!(await p.$(".home-chips [data-act=toggleStack]")));
  if (shots) await p.screenshot({ path: "/tmp/shelf-bookcase.png", fullPage: true });
  // Tapping things opens their pages
  await p.click(".sh-spine"); await p.waitForTimeout(150);
  ok("spine opens album", (await p.evaluate(() => location.hash)) === "#album-al1");
  await p.evaluate(() => go("home")); await p.waitForTimeout(150);
  await p.click(".sh-box"); await p.waitForTimeout(150);
  ok("box opens box", (await p.evaluate(() => location.hash)) === "#box-bx1");
  // Full shelf: 30 albums -> 2 shelves (17 spines + "+N more"); 8 boxes -> 1 shelf + "+N more"
  await p.evaluate(() => {
    for (let i = 0; i < 29; i++) put("a_f" + i, { kind: "album", id: "f" + i, name: "Franklin " + i, typeId: "franklin", start: 1948, end: 1963 });
    for (let i = 0; i < 7; i++) put("b_f" + i, { kind: "box", id: "f" + i, name: "Box " + i, rows: 10, perRow: 10, createdAt: 10 + i });
  });
  await p.evaluate(() => go("home")); await p.waitForTimeout(200);
  ok("30 albums: 2 album shelves", (await p.$$(".sh-shelf.albums")).length === 2);
  ok("30 albums: 17 spines + more", (await p.$$(".sh-spine:not(.more)")).length === 17 && /\+13 more/.test(await p.textContent(".sh-spine.more")));
  ok("no sideways scroll on shelves", await p.evaluate(() => [...document.querySelectorAll(".sh-shelf")].every((e) => e.scrollWidth <= e.clientWidth + 1)));
  ok("boxes: 1 shelf with +N more", (await p.$$(".sh-group.more")).length === 1 && /\+/.test(await p.textContent(".sh-group.more")));
  if (shots) await p.screenshot({ path: "/tmp/shelf-full.png", fullPage: true });
  await p.click(".sh-spine.more"); await p.waitForTimeout(150);
  ok("more spine opens Albums", (await p.evaluate(() => location.hash)) === "#albums");
  await p.evaluate(() => { for (let i = 0; i < 29; i++) remove("a_f" + i); for (let i = 0; i < 7; i++) remove("b_f" + i); go("home"); }); await p.waitForTimeout(150);
  // Switch to Safe in Options
  await p.evaluate(() => go("options")); await p.waitForTimeout(150);
  await p.click("[data-act=shelfStyle][data-v=safe]"); await p.waitForTimeout(150);
  ok("safe saved", await p.evaluate(() => settings().shelfStyle === "safe" && document.body.classList.contains("safe")));
  await p.evaluate(() => go("home")); await p.waitForTimeout(150);
  ok("safe door and bolts", !!(await p.$(".sh-door")) && !!(await p.$(".sh-cab.safe .sh-bolts")));
  ok("page is dark in safe", await p.evaluate(() => getComputedStyle(document.body).backgroundColor === "rgb(28, 30, 33)"));
  if (shots) await p.screenshot({ path: "/tmp/shelf-safe.png", fullPage: true });
  await p.evaluate(() => saveSettings({ shelfStyle: "bookcase" })); await p.waitForTimeout(100);
  ok("back to bookcase", await p.evaluate(() => !document.body.classList.contains("safe") && !!document.querySelector(".sh-cab.wood")));
  console.log("errors", JSON.stringify(errors));
  // Night: page goes dark, bookcase wood stays the same
  const n = await run(true);
  const st = await n.p.evaluate(() => ({ page: getComputedStyle(document.body).backgroundColor, wood: getComputedStyle(document.querySelector(".sh-cab")).backgroundImage }));
  ok("night page dark", st.page === "rgb(22, 20, 18)");
  ok("night wood unchanged", /rgb\(90, 58, 30\)/.test(st.wood));
  if (shots) {
    await n.p.evaluate(() => {
      put("a_x", { kind: "album", id: "x", name: "Morgan 1878–1891", typeId: "morgan", start: 1878, end: 1891 });
      put("c_z", { ...blankCoin(), id: "z", typeName: "Test", year: "1990", value: "10", qty: 1, status: "owned", metal: "Silver", oz: "0.77" });
    });
    await n.p.waitForTimeout(150); await n.p.screenshot({ path: "/tmp/shelf-night.png", fullPage: true });
  }
  console.log("errors", JSON.stringify(n.errors));
  await b.close();
})();
