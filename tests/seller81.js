// Step 8.1: Seller Mode switch, Business stock, separate totals, Move to Business, business profile.
const { chromium } = require("./_compat");
const ok = (name, v) => console.log((v ? "ok   " : "FAIL ") + name);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  await p.evaluate(() => {
    const mk = (id, o) => put("c_" + id, { ...blankCoin(), id, typeName: "Test", year: "1990", value: "10", paid: "4", qty: 1, status: "owned", ...o });
    mk("a", {}); mk("b", { value: "20" }); mk("inh", { source: "Inherited", value: "50" }); mk("old", { value: "5" });
  });
  const total = () => p.evaluate(() => Math.round(sum(countedCoins(), (c) => (bestEach(c) || 0) * qtyOf(c)) * 100) / 100);

  ok("Seller Mode starts off", await p.evaluate(() => !sellerOn()));
  ok("no Personal/Business choice while off", await p.evaluate(() => bizField(blankCoin()) === ""));
  ok("no Business plaque while off", await p.evaluate(() => bizPlaqueHtml() === ""));
  ok("old coins are Personal and counted", (await total()) === 85);

  // switch on from Options
  await p.evaluate(() => go("options")); await p.waitForTimeout(150);
  await p.click('[data-act="sellerMode"]'); await p.waitForTimeout(150);
  ok("switch turns it on", await p.evaluate(() => sellerOn()));
  ok("profile fields appear", (await p.$$("[data-seller]")).length === 4);
  await p.fill('[data-seller="name"]', "Test Coins LLC"); await p.fill('[data-seller="permit"]', "ST-123");
  ok("profile saved in settings", await p.evaluate(() => { const s = settings().seller.profile; return s.name === "Test Coins LLC" && s.permit === "ST-123" && s.ein === ""; }));
  ok("Personal/Business choice shows when on", await p.evaluate(() => bizField(blankCoin()).includes('data-f="biz"')));
  ok("no choice for an inherited coin", await p.evaluate(() => bizField({ ...blankCoin(), source: "Inherited" }) === ""));

  // move one to Business: collection total drops, cost kept, Business plaque shows it
  await p.evaluate(() => bizMoveOne("b", true));
  ok("Business stock leaves the collection total", (await total()) === 65);
  ok("moved coin keeps what was paid", await p.evaluate(() => getCoin("b").paid === "4" && costOf(getCoin("b")) === 4));
  ok("plaque shows value and count", await p.evaluate(() => { const h = bizPlaqueHtml(); return h.includes("$20.00") && h.includes("1 item"); }));
  ok("value history leaves Business out", await p.evaluate(() => currentTotals().v === 65));
  await p.evaluate(() => go("home")); await p.waitForTimeout(150);
  ok("Home draws the plaque", !!(await p.$(".biz-plaque")));
  ok("Home Recently added skips Business", await p.evaluate(() => !document.querySelector('[data-go="coin-b"]') && !!document.querySelector('[data-go="coin-a"]')));

  // inherited cannot move
  await p.evaluate(() => bizMoveOne("inh", true));
  ok("inherited stays Personal", await p.evaluate(() => !getCoin("inh").biz));

  // Undo puts it back
  await p.evaluate(() => { bizMoveOne("a", true); document.querySelector("#toast button, .toast button, [data-act=toastUndo]").click(); });
  await p.waitForTimeout(150);
  ok("Undo moves it back", await p.evaluate(() => !getCoin("a").biz));

  // filter
  await p.evaluate(() => { listState.status = "owned"; listState.f = { biz: "business" }; });
  ok("filter: Business only", await p.evaluate(() => allCoins().filter((c) => extraFilter(c)).map((c) => c.id).join() === "b"));
  await p.evaluate(() => { listState.f = { biz: "personal" }; });
  ok("filter: Personal only", await p.evaluate(() => allCoins().filter((c) => extraFilter(c)).map((c) => c.id).sort().join() === "a,inh,old"));
  await p.evaluate(() => { listState.f = {}; });

  // bulk: skips inherited and already-Business, one Undo
  await p.evaluate(() => { go("coins"); listState.sel = new Set(["a", "b", "inh", "old"]); });
  await p.evaluate(() => { actions.bizBulk(); });
  await p.waitForTimeout(150);
  ok("bulk moved the movable ones", await p.evaluate(() => getCoin("a").biz && getCoin("old").biz && getCoin("b").biz && !getCoin("inh").biz));
  await p.evaluate(() => { document.querySelector("[data-act=fltUndo]") ? document.querySelector("[data-act=fltUndo]").click() : actions.fltUndo(); });
  await p.waitForTimeout(150);
  ok("bulk Undo restores", await p.evaluate(() => !getCoin("a").biz && !getCoin("old").biz && getCoin("b").biz));

  // off: tags and plaque hide, data stays, still not in collection totals
  await p.evaluate(() => saveSettings({ seller: { ...settings().seller, on: false } }));
  ok("off hides the plaque and the choice", await p.evaluate(() => bizPlaqueHtml() === "" && bizField(blankCoin()) === ""));
  ok("off keeps the Business tag and the profile", await p.evaluate(() => getCoin("b").biz === true && settings().seller.profile.name === "Test Coins LLC"));
  ok("off: Business still out of collection total", (await total()) === 65);

  // Add coin form: Business choice is saved, Personal saves nothing, Add many copies it
  await p.evaluate(() => saveSettings({ seller: { ...settings().seller, on: true } }));
  const open = async () => { await p.click("#fab"); await p.fill("#typeSearch", "morgan"); await p.click("#typeList button[data-act=pickType] >> nth=0"); await p.fill("[data-f=year]", "1881"); };
  const save = async () => { await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(300); };
  await open();
  await p.evaluate(() => { const e = document.querySelector("[data-f=biz]"); e.value = "1"; e.dispatchEvent(new Event("change", { bubbles: true })); });
  await p.evaluate(() => { const e = document.querySelector("[data-f=_many]"); e.value = "3"; e.dispatchEvent(new Event("change", { bubbles: true })); });
  await p.waitForTimeout(100);
  await save();
  ok("Add many copies Business to each coin", await p.evaluate(() => allCoins().filter((c) => c.typeId === "morgan-dollar" && c.year == 1881 && c.biz === true).length === 3));
  await open(); await save();
  ok("a Personal coin saves with no biz field", await p.evaluate(() => { const c = allCoins().find((c) => c.typeId === "morgan-dollar" && c.year == 1881 && !c.biz); return !!c && !("biz" in c); }));

  ok("no page errors", errors.length === 0);
  if (errors.length) console.log(errors.join("\n"));
  await b.close();
})();
