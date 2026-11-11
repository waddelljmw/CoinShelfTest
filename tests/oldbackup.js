// Safety net (step 11.0): a backup made by v0.58 must still restore exactly, whatever changes later.
// tests/fixtures/backup-v058.json is made-up (not real coins) and holds one of everything awkward.
// Every expected number below is written by hand (typed values and melt at silver $30/oz), so no Red Book prices are needed.
const { chromium } = require("./_compat");
const path = require("path");
const ok = (name, v) => console.log((v ? "PASS " : "FAIL ") + name);
const FIXTURE = path.resolve(__dirname, "fixtures/backup-v058.json");

// id: [name, value each, kept in]
const COINS = {
  k1: ["Lincoln Wheat Cent", 7, "Test Lincoln album"],        // coin in an album spot
  k2: ["Morgan Dollar", 55, "Blue box"],                        // coin in a box slot
  k3: ["Roosevelt Dime (silver)", 2.1702, "Dad's stack"],       // junk silver coin in a stack: 0.07234 oz x $30
  k4: ["Washington Quarter (silver)", 9, "Blue box Old stack"], // old coin with a stack AND a box
  k5: ["Buffalo Nickel", 3, ""],                                // no year
  k6: ["Odd token", 12, ""],                                    // hand-typed type
  k7: ["Bullion", 96.3555, "My Silver Stack"],                  // bar in grams: 3.21185 oz x $30
  k8: ["Bullion", 108.51, "My Silver Stack"],                   // junk by face value: $5 of 90% = 3.617 oz x $30
  k9: ["Jefferson Nickel", 2, ""],                              // roll of 40 nickels: $2.00 face
  k10: ["Mint set", 50, ""],                                    // set
  k11: ["Jefferson Nickel", 1, "Kept album"],                   // coin in an album that is kept in a box
  k12: ["Kennedy Half Dollar (clad)", 2, "Pocket book"],        // coin in a pocket album
};

(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + path.resolve(__dirname, "../index.html")); await p.waitForTimeout(400);
  ok("starts empty", (await p.evaluate(() => allCoins().length)) === 0);

  // Restore through the real Backup sheet.
  await p.evaluate(() => openBackupSheet()); await p.waitForTimeout(100);
  await p.setInputFiles("#restoreFile", FIXTURE); await p.waitForTimeout(300);
  await p.click("[data-act=confirmOk]"); await p.waitForTimeout(1000);

  const r = await p.evaluate((ids) => {
    const out = { coins: {}, albums: albums().length, pockets: [...store.docs.values()].filter((d) => d && d.kind === "box" && d.type === "pocket").length };
    ids.forEach((id) => { const c = store.docs.get("c_" + id); out.coins[id] = c ? [c.typeName, Math.round(bestEach(c) * 1e4) / 1e4, keptName(c)] : null; });
    const owned = countedCoins();
    out.total = Math.round(sum(owned, (c) => (bestEach(c) || 0) * qtyOf(c)) * 1e4) / 1e4;
    out.count = sum(owned, qtyOf);
    out.melt = Math.round(sum(owned, (c) => (meltEach(c) || 0) * qtyOf(c)) * 1e4) / 1e4;
    const s = settings();
    out.settings = { silver: s.spot.silver, gold: s.spot.gold, style: s.shelfStyle, showAdded: s.showAdded, folded: !!(s.homeClosed || {}).history };
    out.stacks = stacksPresent();
    out.keptBox = (store.docs.get("a_al2") || {}).keptBox;
    out.slot = [store.docs.get("c_k2").boxRow, store.docs.get("c_k2").boxSlot];
    out.pocket = ["boxId", "boxTray", "boxRow", "boxSlot"].map((k) => store.docs.get("c_k12")[k]);
    out.noYear = store.docs.get("c_k5").year;
    out.bar = (({ bWeight, bUnit, oz }) => [bWeight, bUnit, oz])(store.docs.get("c_k7"));
    out.junk = (({ jKind, jFace, oz }) => [jKind, jFace, oz])(store.docs.get("c_k8"));
    out.roll = [store.docs.get("c_k9").item, store.docs.get("c_k9").rollCount];
    out.set = store.docs.get("c_k10").item;
    out.two = [store.docs.get("c_k4").stack, store.docs.get("c_k4").boxId];
    return out;
  }, Object.keys(COINS));

  Object.entries(COINS).forEach(([id, [name, val, kept]]) => {
    const g = r.coins[id];
    ok(`${id} ${name}: name, value ${val}, kept in "${kept}"`, !!g && g[0] === name && g[1] === val && g[2] === kept);
  });
  ok("Home total is $348.0357", r.total === 348.0357);
  ok("Home count is 12", r.count === 12);
  ok("melt total is $207.0357", r.melt === 207.0357);
  ok("2 albums and 1 pocket album", r.albums === 2 && r.pockets === 1);
  ok("album kept in a box", r.keptBox === "bx1");
  ok("box slot row 1, slot 2", r.slot[0] === 1 && r.slot[1] === 2);
  ok("pocket coin: book, page 1, row 1, slot 2", r.pocket.join() === "pk1,1,1,2");
  ok("coin with no year stays blank", r.noYear === "");
  ok("bar in grams keeps its unit and ounces", r.bar.join() === "3.21507,g,3.21185");
  ok("junk by face value", r.junk.join() === "90,5,3.617");
  ok("roll of 40", r.roll.join() === "roll,40");
  ok("set", r.set === "set");
  ok("coin with a stack and a box keeps both", r.two.join() === "Old stack,bx1");
  ok("stacks listed", r.stacks.join("|") === "Dad's stack|My Silver Stack|Old stack");
  ok("changed settings come back", r.settings.silver === 30 && r.settings.gold === 2000 && r.settings.style === "safe" && r.settings.showAdded === false && r.settings.folded === true);

  // The Home page shows the same numbers.
  await p.evaluate(() => go("home")); await p.waitForTimeout(300);
  const home = await p.innerText("body");
  ok("Home page shows $348.04", /\$348\.04/.test(home));

  // A record kind this version doesn't know (a future one) must survive restore and a second backup.
  const future = { kind: "coin-cabinet-backup", format: 1, appVersion: "9.9.9", made: "2026-12-01", counts: { coins: 0, albums: 0, photos: 0 },
    docs: [{ id: "zz_future", data: { kind: "future-thing", format: 1, note: "keep me", list: [1, 2, 3] } }], photos: {} };
  require("fs").writeFileSync("/tmp/cc-future.json", JSON.stringify(future));
  await p.evaluate(() => openBackupSheet()); await p.waitForTimeout(100);
  await p.setInputFiles("#restoreFile", "/tmp/cc-future.json"); await p.waitForTimeout(300);
  await p.click("[data-act=confirmOk]"); await p.waitForTimeout(800);
  const f = await p.evaluate(async () => {
    const second = await buildBackup();
    const d = second.docs.find((x) => x.id === "zz_future");
    return { coins: allCoins().length, inStore: JSON.stringify(store.docs.get("zz_future")), inSecond: d ? JSON.stringify(d.data) : null };
  });
  const want = JSON.stringify({ kind: "future-thing", format: 1, note: "keep me", list: [1, 2, 3] });
  ok("unknown record kind is kept after restore", f.inStore === want);
  ok("unknown record kind is in the next backup, unchanged", f.inSecond === want);
  ok("earlier coins untouched by the second restore", f.coins === 12);
  ok("no page errors", errors.length === 0);
  console.log("errors", JSON.stringify(errors));
  await b.close();
})();
