// Step 37 average cost per ounce on My Stacks, and the What I need mint search ("1878cc").
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  const ev = (f) => p.evaluate(f);

  await ev(() => {
    const mk = (id, o) => put("c_" + id, { ...blankCoin(), id, typeName: "Test", item: "bullion", metal: "Silver", oz: "1", qty: 1, status: "owned", stack: "My Silver Stack", ...o });
    mk("a", { paid: "30", qty: 2 });            // 2 oz, $60
    mk("b", { paid: "36", buyShip: "4" });      // 1 oz, $40
    mk("n", {});                                // no price paid
    mk("i", { paid: "5", source: "Inherited" });
    mk("z", { paid: "500", biz: true });
    go("stacks");
  });
  await p.waitForTimeout(150);
  const line = (await p.textContent(".stack-avg")).trim();
  ok("average = 100 / 3 oz on 3 of 4 (got " + line + ")", line === "avg cost $33.33 per oz (on 3 of 4)");
  await ev(() => { put("c_g", { ...getCoin("a"), id: "g", metal: "Gold", paid: "2000", qty: 1 }); render(); });
  await p.waitForTimeout(150);
  const two = await p.textContent(".stack-avg");
  ok("mixed metals get a figure each", /silver avg cost \$33\.33 per oz/.test(two) && /gold avg cost \$2,000\.00 per oz \(on 1 of 1\)/.test(two));
  ok("not on the Melt table", await (async () => { await ev(() => go("melt")); await p.waitForTimeout(150); return !/avg cost/.test(await p.textContent("main")); })());

  const m = await ev(() => {
    const row = (y, mint, name) => ({ label: y + (mint ? "-" + mint : "") + " " + name, a: { name: name + " album" }, s: { y, m: mint } });
    const cc = row(1878, "CC", "Morgan"), ph = row(1878, "", "Morgan"), dime = row(1916, "", "Mercury dime"), d = row(1916, "D", "Mercury dime");
    return {
      joined: rowMatches(cc, "1878cc") && !rowMatches(ph, "1878cc"), spaced: rowMatches(cc, "1878 cc"),
      mintOnly: rowMatches(d, "1916 d") && !rowMatches(dime, "1916 d") && rowMatches(d, "1916d dime"),
      philly: rowMatches(ph, "1878p") && !rowMatches(cc, "1878 p"), words: rowMatches(dime, "merc"),
    };
  });
  ok("1878cc finds the CC spot only", m.joined);
  ok("1878 cc still works", m.spaced);
  ok("d matches the mint, not the word dime", m.mintOnly);
  ok("p means no mint mark", m.philly);
  ok("words still match", m.words);
  console.log("errors", errors); await b.close();
})();
