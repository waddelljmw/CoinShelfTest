// Session 37: coin already owned into an empty album spot, Suggest an idea, U.S. Mint source, three level lines, update bar at the top.
const { chromium } = require("./_compat");
const http = require("http"), fs = require("fs"), path = require("path");
const root = path.resolve(__dirname, "..");
const srv = http.createServer((q, r) => {
  const u = q.url.split("?")[0];
  fs.readFile(path.join(root, u === "/" ? "index.html" : u), (e, d) => { if (e) { r.statusCode = 404; return r.end(); } r.end(d); });
}).listen(8797);
(async () => {
  const b = await chromium.launch();
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  const errors = [];
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route("**/api.gold-api.com/**", (r) => r.abort());
  const p = await ctx.newPage(); p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("http://localhost:8797/"); await p.waitForFunction(() => store.mode === "local", null, { timeout: 15000 }); await p.waitForTimeout(300);
  await p.evaluate(() => {
    const a = { kind: "album", id: "alb1", brand: "Dansco", number: "7178", name: "", typeId: "peace-dollar", start: 1921, end: 1935, removed: [], createdAt: 1 };
    a.slots = buildSlots("peace-dollar", 1921, 1935); put("a_alb1", a, true);
    const base = { ...blankCoin(), typeId: "peace-dollar", typeName: "Peace Dollar", family: "Peace dollar", denom: "$1", status: "owned", grade: "AU-50" };
    put("c_loose", { ...base, id: "loose", year: 1923, mint: "D", qty: 1 }, true);
    put("c_group", { ...base, id: "group", year: 1923, mint: "D", qty: 3 }, true);
    put("c_other", { ...base, id: "other", year: 1923, mint: "S", qty: 1 }, true);
    go("album-alb1");
  });
  await p.waitForTimeout(250);
  // 1. coin already owned into an empty spot
  await p.click(".slot:has-text('1923-D')");
  ok("spot with a matching loose coin offers 'Put a coin I already have here'", await p.locator("[data-act=slotUseList]").count() === 1);
  await p.click("[data-act=slotUseList]"); await p.waitForTimeout(150);
  ok("list shows only the one single loose coin (not the group, not another mint)", await p.locator("#sheet [data-act=slotUse]").count() === 1);
  await p.click("#sheet [data-act=slotUse]"); await p.waitForTimeout(250);
  const placed = await p.evaluate(() => { const c = getCoin("loose"); return { al: c.albumId, sid: !!c.slotId, filled: albumStats(getAlbum("alb1")).owned, g: getCoin("group").albumId || "", grade: c.grade, year: c.year }; });
  ok("coin is placed in the album spot and the spot shows filled", placed.al === "alb1" && placed.sid && placed.filled === 1 && !placed.g && placed.grade === "AU-50" && placed.year === 1923);
  await p.click("#toast [data-act], .toast button, #toast button").catch(() => {}); await p.waitForTimeout(200);
  ok("Undo takes it back out of the album", await p.evaluate(() => !getCoin("loose").albumId));
  await p.click(".slot:has-text('1925-S')");
  ok("spot with no matching coin has no such button", await p.locator("[data-act=slotUseList]").count() === 0);
  await p.evaluate(() => closeSheet());
  // 2. Suggest an idea
  await p.evaluate(() => go("options")); await p.waitForTimeout(200);
  const urls = []; await p.evaluate(() => { window.__u = []; window.open = (u) => { window.__u.push(u); }; });
  await p.evaluate(() => actions.suggestIdea()); await p.evaluate(() => actions.reportProblem());
  const u = await p.evaluate(() => window.__u);
  ok("Suggest an idea opens a note starting 'Idea:' and Report a problem still 'Problem:'", /title=Idea%3A/.test(u[0]) && /title=Problem%3A/.test(u[1]));
  ok("both buttons are in Options", await p.locator("[data-act=suggestIdea]").count() === 1 && await p.locator("[data-act=reportProblem]").count() === 1);
  // 3. U.S. Mint source
  ok("U.S. Mint is in the Source list", await p.evaluate(() => SOURCE_DEFAULTS.includes("U.S. Mint")));
  const pay = await p.evaluate(() => { const d = { _isNew: true, payMethod: "" }; applySourceKind(d, "U.S. Mint"); return d.payMethod; });
  ok("U.S. Mint fills Paid with Card", pay === "Card");
  // 4. all three level lines
  const hint = await p.evaluate(() => levelOptionsHtml());
  ok("Options shows all three level lines", ["Simple:", "Collector:", "Everything:"].every((t) => hint.includes(t)));
  // 5. update bar at the top
  await p.evaluate(() => showUpdateBar({ postMessage() {}, state: "installed" }));
  const r = await p.evaluate(() => { const e = document.querySelector("#updateBar").getBoundingClientRect(); return { top: e.top, h: innerHeight }; });
  ok("update bar sits at the top of the screen", r.top < 60);
  console.log("errors", JSON.stringify(errors));
  await b.close(); srv.close();
})();
