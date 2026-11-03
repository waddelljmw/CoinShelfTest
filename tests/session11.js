// Session 11 fixes: albums sort by date, notes above purchase, proof "at least", Home chips swipe row.
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  // 1. Sort by date: Kennedy 1964, Morgan 1878 (vol 1 and 2 of a series), Lincoln 1909
  await p.evaluate(() => {
    const mk = (id, name, type, start, end, num) => put("a_" + id, { kind: "album", id, brand: "Other", number: num || "", name, typeId: type, typeIds: [type], layout: "dates", start, end, slots: [], removed: [], createdAt: 1 });
    mk("K", "Kennedy", "kennedy-clad", 1964, 1980); mk("L", "Lincoln", "lincoln-wheat", 1909, 1958);
    mk("M2", "Morgan Vol. 2", "morgan-dollar", 1884, 1904); mk("M1", "Morgan Vol. 1", "morgan-dollar", 1878, 1883);
    saveSettings({ albumOrder: ["K", "L", "M2", "M1"] }); go("albums");
  });
  await p.waitForTimeout(150);
  await p.click("[data-act=reorderAlbums]"); await p.waitForTimeout(80);
  await p.click("[data-act=sortAlbumsDate]"); await p.waitForTimeout(100);
  const names = await p.evaluate(() => albums().map((a) => a.name).join(","));
  ok("sorted by first year, series together", names === "Morgan Vol. 1,Morgan Vol. 2,Lincoln,Kennedy");
  // 2. Notes above Purchase
  const order = await p.evaluate(() => {
    put("c_n", { kind: "coin", id: "n", status: "owned", typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1881, mint: "S", grade: "MS-63", gradeMode: "raw", notes: "NOTE-TEXT", paid: 20, qty: 1, createdAt: 1 });
    go("coin-n"); return null;
  });
  await p.waitForTimeout(200);
  const txt = await p.evaluate(() => document.querySelector("#view").innerText);
  ok("Notes appear before Purchase", txt.indexOf("NOTE-TEXT") > 0 && (txt.indexOf("Purchase") < 0 || txt.indexOf("NOTE-TEXT") < txt.indexOf("Purchase")));
  // 3. Proof under PR-63 shows the lowest listed price as "at least"
  const pr = await p.evaluate(() => {
    const c = { typeId: "franklin-half", gradeMode: "raw", year: 1962, mint: "", grade: "PR-60" };
    const c63 = { ...c, grade: "PR-63" };
    return { t: bookText(bookLookup(c)), v: valueEach(c), v63: valueEach(c63), none: bookLookup({ ...c, grade: "" }) };
  });
  ok("PR-60 proof shows at least the PF-63 price", /at least/.test(pr.t) && pr.v > 0 && pr.v === pr.v63);
  ok("no grade stays empty (can't tell it's a proof)", pr.none === null);
  // 4. Home chips: one swipe row
  await p.evaluate(() => { put("c_i", { kind: "coin", id: "i", status: "owned", typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1881, mint: "S", grade: "MS-63", gradeMode: "raw", source: "Inherited", qty: 1, createdAt: 2 }); go("home"); });
  await p.waitForTimeout(200);
  const ch = await p.evaluate(() => { const e = document.querySelector(".home-chips"); const cs = getComputedStyle(e); const rs = [...e.children].map((x) => x.offsetTop); return { n: e.children.length, wrap: cs.flexWrap, ox: cs.overflowX, oneRow: new Set(rs).size === 1 }; });
  ok("Home chips are a single no-wrap swipe row", ch.n >= 2 && ch.wrap === "nowrap" && ch.ox === "auto" && ch.oneRow);
  ok("no page errors", errors.length === 0); if (errors.length) console.log(errors);
  await b.close();
})();
