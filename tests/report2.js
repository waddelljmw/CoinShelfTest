const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.addInitScript(() => { window.__saved = null; const downloads = { save: async (r) => { window.__saved = r; return { status: "saved" }; } }; window.claude = { use: async (n) => (n === "downloads" ? downloads : null) }; });
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(500);
  await p.evaluate(() => {
    saveSettings({ spot: { gold: 3884.9, silver: 49.14 } });
    const mk = (o) => saveCoin({ ...blankCoin(), ...o });
    mk({ typeId: "indian-2-5", typeName: "Indian Head $2.50 Gold", family: "Classic gold", denom: "$2.50", metal: "Gold", oz: 0.12094, year: 1910, grade: "AU-53", value: "600", source: "Inherited" });
    mk({ typeId: "indian-2-5", typeName: "Indian Head $2.50 Gold", family: "Classic gold", denom: "$2.50", metal: "Gold", oz: 0.12094, year: 1911, grade: "AU-53", value: "600", source: "Inherited" });
    mk({ typeId: "morgan-dollar", typeName: "Morgan Dollar", family: "Morgan dollar", denom: "$1", metal: "Silver", oz: 0.77344, year: 1878, mint: "CC", grade: "VF-20", qty: 2, source: "Inherited" });
    mk({ typeId: "kennedy-40", typeName: "Kennedy Half Dollar", family: "Kennedy half", denom: "50C", metal: "Silver", oz: 0.14792, grade: "Junk", qty: 25, paid: "4" });
  });
  await p.click("#menuBtn"); await p.click("#menu [data-act=openReport]");
  console.log("list hidden at first:", !(await p.isVisible("#repPick")));
  await p.click("[data-act=repMode][data-v=pick]");
  console.log("rows:", await p.$$eval("#repList [data-repid]", (x) => x.length), "|", await p.textContent("#repCount"));
  // Choose with search: "inherited" → tick all shown
  await p.fill("#repSearch", "inherited"); await p.waitForTimeout(100);
  console.log("search rows:", await p.$$eval("#repList [data-repid]", (x) => x.length), "| focus kept:", await p.evaluate(() => document.activeElement.id));
  await p.click("[data-act=repAll]");
  console.log("after tick all:", await p.textContent("#repCount"));
  // untick the Morgan
  await p.click("#repList label:has-text('1878-CC') input");
  console.log("after untick:", await p.textContent("#repCount"));
  await p.fill("#repSearch", ""); await p.waitForTimeout(100);
  console.log("kept after clearing search:", await p.$$eval("#repList input:checked", (x) => x.length));
  await p.screenshot({ path: "/tmp/report-pick.png" });
  await p.click("[data-act=makeReport]"); await p.waitForTimeout(500);
  const s = await p.evaluate(() => window.__saved);
  console.log("file:", s.filename, "| has 1910:", s.data.includes("1910 Indian"), "| has 1911:", s.data.includes("1911 Indian"), "| no Morgan:", !s.data.includes("1878-CC"), "| no Kennedy:", !s.data.includes("Kennedy"), "| note:", /Selected coins \(2 of 4/.test(s.data), "| total $1,200:", s.data.includes("$1,200.00"));
  // none ticked → message, no save
  await p.evaluate(() => { window.__saved = null; }); await p.click("#menuBtn"); await p.click("#menu [data-act=openReport]"); await p.click("[data-act=repMode][data-v=pick]"); await p.click("[data-act=makeReport]"); await p.waitForTimeout(200);
  console.log("none ticked:", await p.textContent("#repMsg"), "| saved:", await p.evaluate(() => window.__saved));
  // All coins still works
  await p.click("[data-act=repMode][data-v=all]"); await p.click("[data-act=makeReport]"); await p.waitForTimeout(400);
  const a = await p.evaluate(() => window.__saved); console.log("all:", a.filename, a.data.includes("Kennedy"), a.data.includes("Selected coins"));
  console.log("errors", errors); await b.close();
})();
