// Step 8.3b: saved shipping costs, Going as (Seller/Attendee), Was kept in on sold coins.
const { chromium } = require("./_compat");
const ok = (name, v) => console.log((v ? "ok   " : "FAIL ") + name);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ev = (fn, arg) => p.evaluate(fn, arg);
  await ev(() => {
    saveSeller({ on: true }, true);
    put("b_x", { kind: "box", id: "x", name: "Black box 1", type: "storage", look: "black", spots: false, rows: 0, perRow: 0, createdAt: 1 }, true);
    put("b_dc", { kind: "box", id: "dc", name: "Show case", type: "dealer", look: "wood", spots: false, rows: 0, perRow: 0, createdAt: 2 }, true);
    put("c_m", { ...blankCoin(), id: "m", typeId: "morgan-dollar", year: "1881", mint: "S", qty: 1, status: "owned", boxId: "x" }, true);
    put("c_k", { ...blankCoin(), id: "k", typeId: "kennedy-clad", year: "1971", mint: "D", qty: 1, status: "owned", boxId: "x" }, true);
    put("c_n", { ...blankCoin(), id: "n", typeName: "Odd token", year: "1990", qty: 1, status: "owned" }, true);
  });
  // ---- saved shipping ----
  await ev(() => go("options")); await p.waitForTimeout(150);
  ok("Options has the shipping costs", await p.locator("[data-shipdef]").count() === 1);
  await ev(() => { saveSettings({ shipping: { def: 4, byType: { "morgan-dollar": 4.5 } } }, true); });
  ok("per-type amount wins", await ev(() => shipFor(getCoin("m")) === 4.5));
  ok("other types use the usual amount", await ev(() => shipFor(getCoin("k")) === 4));
  await ev(() => openSell("m")); await p.waitForTimeout(150);
  ok("sold form fills shipping paid", await ev(() => document.querySelector('#sellForm [name=shipping]').value === "4.5"));
  ok("More details opens when filled", await ev(() => document.querySelector("#sellForm details.more").open));
  await ev(() => { document.querySelector('#sellForm [name=shipping]').value = "6"; doSell(document.getElementById("sellForm")); });
  ok("changed shipping is what is saved", await ev(() => getCoin("m").sold.shipping === 6));
  await ev(() => { saveSettings({ shipping: {} }, true); openSell("n"); });
  ok("no saved cost leaves it blank", await ev(() => document.querySelector('#sellForm [name=shipping]').value === ""));
  await ev(() => closeSheet());
  await ev(() => { actions.shipTypeDel; saveShip({ def: 3 }); });
  await ev(() => go("options")); await p.waitForTimeout(100);
  await p.locator('summary:has-text("Shipping costs")').click();
  await p.selectOption("[data-shipadd]", "kennedy-clad"); await p.waitForTimeout(150);
  ok("adding a type starts at the usual amount", await ev(() => shipRates().byType["kennedy-clad"] === 3));
  await p.locator('[data-act=shipTypeDel]').first().click(); await p.waitForTimeout(100);
  ok("remove works", await ev(() => !("kennedy-clad" in shipRates().byType)));
  // ---- Was kept in ----
  ok("sold from a box remembers the box", await ev(() => getCoin("m").sold.keptIn === "Black box 1"));
  await ev(() => { put("c_k", { ...getCoin("k"), boxId: "dc" }, true); });
  ok("coin in a case remembers its old box", await ev(() => getCoin("k").caseFrom && getCoin("k").caseFrom.boxId === "x"));
  await ev(() => { openSell("k"); doSell(document.getElementById("sellForm")); });
  ok("sold from a case remembers the place before the case", await ev(() => getCoin("k").sold.keptIn === "Black box 1"));
  await ev(() => go("coin-k")); await p.waitForTimeout(150);
  ok("sold coin page shows Was kept in", (await p.locator("#view").innerText()).includes("Was kept in"));
  await ev(() => { openSell("n"); doSell(document.getElementById("sellForm")); });
  ok("no place means no line", await ev(() => !getCoin("n").sold.keptIn));
  // ---- Going as ----
  await ev(() => { showForm(); }); await p.waitForTimeout(150);
  ok("table fee shows for a seller", await p.locator("#showForm [name=c_table]").isVisible());
  await p.selectOption("#showRole", "attendee"); await p.waitForTimeout(100);
  ok("table fee hides for an attendee", !(await p.locator("#showForm [name=c_table]").isVisible()));
  await p.fill('#showForm [name=name]', "Visit show");
  await p.fill('#showForm [name=c_gas]', "20");
  await p.locator('#showForm button[type=submit]').click(); await p.waitForTimeout(200);
  ok("attendee saved, no table fee", await ev(() => { const s = allShows()[0]; return s.role === "attendee" && s.costs.table == null && s.costs.gas === 20; }));
  ok("attendee page has no profit card", !(await p.locator("#view").innerText()).includes("Profit for the show"));
  await ev(() => go("shows")); await p.waitForTimeout(100);
  ok("shows list says Attendee", (await p.locator("#view").innerText()).includes("Attendee"));
  ok("Find shows link is there", await p.locator('#view a[href*="coin+shows"]').count() === 1);
  await ev(() => { put("sh_s", { kind: "show", id: "s", name: "Old show", start: "2026-10-01", type: "coinshow", costs: { table: 50 }, createdAt: 1 }); });
  ok("older shows count as Seller", await ev(() => !isAttendee(getShow("s")) && showStats(getShow("s")).costs === 50));
  ok("no page errors", errors.length === 0);
  if (errors.length) console.log(errors.join("\n"));
  await b.close();
})();
