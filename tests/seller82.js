// Step 8.2: dealer display case, take out / return, shows, show profit.
const { chromium } = require("./_compat");
const ok = (name, v) => console.log((v ? "ok   " : "FAIL ") + name);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ev = (fn, arg) => p.evaluate(fn, arg);
  await ev(() => {
    const mk = (id, o) => put("c_" + id, { ...blankCoin(), id, typeName: "Test", year: "1990", value: "10", paid: "4", qty: 1, status: "owned", ...o }, true);
    put("a_alb", { kind: "album", id: "alb", name: "Album", slots: [{ id: "s1" }] }, true);
    put("b_st", { kind: "box", id: "st", name: "Black 1", type: "storage", look: "black", spots: true, rows: 2, perRow: 2, createdAt: 1 }, true);
    mk("x", { boxId: "st", boxRow: "1", boxSlot: "1" });
    mk("y", { boxId: "st", boxRow: "1", boxSlot: "2", stage: "forsale", ask: "30" });
    mk("z", { stack: "Junk" });
    mk("inh", { source: "Inherited" });
    mk("n", {});
    saveSeller({ on: true }, true);
  });

  // a dealer case is its own kind of box
  await ev(() => put("b_dc", { kind: "box", id: "dc", name: "Show case", type: "dealer", look: "wood", spots: false, rows: 0, perRow: 0, createdAt: 2 }, true));
  ok("dealer case reads as a dealer box, For sale on by default", await ev(() => getBox("dc").type === "dealer" && getBox("dc").forSale === true && caseOn(getBox("dc"))));
  ok("it is not a storage or display box", await ev(() => !storageBoxes().some((x) => x.id === "dc") && !displayBoxes().some((x) => x.id === "dc") && dealerBoxes().length === 1));
  ok("old boxes still read as storage", await ev(() => getBox("st").type === "storage" && getBox("st").forSale === undefined));

  // moving in: status switches to For sale, old place and status remembered
  await ev(() => { const c = JSON.parse(JSON.stringify(getCoin("x"))); applyKept(c, "b:dc"); saveCoin(c); });
  ok("coin moved in is For sale", await ev(() => getCoin("x").stage === "forsale" && getCoin("x").boxId === "dc"));
  ok("old box spot remembered", await ev(() => { const f = getCoin("x").caseFrom; return f.boxId === "st" && f.boxRow === "1" && f.boxSlot === "1" && f.status === "owned" && f.stage === ""; }));
  await ev(() => { const c = JSON.parse(JSON.stringify(getCoin("y"))); applyKept(c, "b:dc"); saveCoin(c); });
  ok("a coin already For sale remembers that", await ev(() => getCoin("y").caseFrom.stage === "forsale" && getCoin("y").stage === "forsale"));
  await ev(() => { const c = JSON.parse(JSON.stringify(getCoin("z"))); applyKept(c, "b:dc"); saveCoin(c); });
  ok("a stack is remembered too", await ev(() => getCoin("z").caseFrom.stack === "Junk"));
  await ev(() => { const c = JSON.parse(JSON.stringify(getCoin("n"))); c.albumId = "alb"; c.slotId = "s1"; saveCoin(c); const d = JSON.parse(JSON.stringify(getCoin("n"))); applyKept(d, "b:dc"); saveCoin(d); });
  ok("an album spot is remembered", await ev(() => getCoin("n").caseFrom.albumId === "alb" && getCoin("n").caseFrom.slotId === "s1"));

  // inherited coins cannot go in a for-sale case
  ok("inherited coin refused by the form check", await ev(() => { const c = { ...getCoin("inh"), boxId: "dc" }; return boxCheck(c).includes("Inherited"); }));
  ok("Select many skips an inherited coin", await ev(() => movePlace(JSON.parse(JSON.stringify(getCoin("inh"))), "b:dc", new Set())).then((r) => !!r));

  // a display-only case leaves status alone
  await ev(() => { put("b_dd", { kind: "box", id: "dd", name: "Display only", type: "dealer", forSale: false, look: "black", spots: false, rows: 0, perRow: 0, createdAt: 3 }, true); put("c_inh", { ...getCoin("inh"), boxId: "dd" }, true); });
  ok("a display-only case keeps the coin's status", await ev(() => getCoin("inh").stage !== "forsale" && !!getCoin("inh").caseFrom));
  ok("turning the switch off later changes nothing inside", await ev(() => { put("b_dc", { ...getBox("dc"), forSale: false }, true); const ok = getCoin("x").stage === "forsale"; put("b_dc", { ...getBox("dc"), forSale: true }, true); return ok; }));

  // take out one coin: back to the box spot, back to its old status
  await ev(() => actions.caseOut({ dataset: { id: "x" } }));
  ok("Take out puts it back in its spot and status", await ev(() => { const c = getCoin("x"); return c.boxId === "st" && c.boxRow === "1" && c.boxSlot === "1" && c.stage === "" && !c.caseFrom; }));
  await ev(() => document.querySelector("#toast button").click()); await p.waitForTimeout(100);
  ok("Undo puts it back in the case", await ev(() => getCoin("x").boxId === "dc" && getCoin("x").stage === "forsale" && !!getCoin("x").caseFrom));

  // old spot taken: goes to Nothing special and is listed
  await ev(() => { mkTaken(); function mkTaken() { put("c_t", { ...blankCoin(), id: "t", typeName: "Taker", year: "1991", status: "owned", qty: 1, boxId: "st", boxRow: "1", boxSlot: "1" }, true); } });
  await ev(() => actions.caseReturnAll({ dataset: { id: "dc" } })); await p.waitForTimeout(150);
  ok("return all: coin whose spot is taken goes to Nothing special", await ev(() => { const c = getCoin("x"); return !c.boxId && !c.albumId && c.stage === ""; }));
  ok("it is listed on screen", await ev(() => document.querySelector("#sheet").textContent.includes("Nothing special") && document.querySelector("#sheet").textContent.includes("1990 Test")));
  ok("already For sale stays For sale", await ev(() => getCoin("y").stage === "forsale" && getCoin("y").boxId === "st" && getCoin("y").boxSlot === "2"));
  ok("stack and album come back", await ev(() => getCoin("z").stack === "Junk" && !getCoin("z").boxId && getCoin("n").albumId === "alb" && getCoin("n").slotId === "s1"));
  ok("nothing is left in the case", await ev(() => boxCoins(getBox("dc")).length === 0));
  await ev(() => document.querySelector('[data-act="caseUndo"]').click()); await p.waitForTimeout(150);
  ok("one Undo puts them all back", await ev(() => boxCoins(getBox("dc")).length === 4 && getCoin("x").stage === "forsale" && getCoin("y").boxId === "dc"));
  await ev(() => actions.caseReturnAll({ dataset: { id: "dc" } })); await p.waitForTimeout(100);

  // seller mode off hides the pieces, keeps the data
  await ev(() => saveSeller({ on: false }, true));
  await ev(() => go("home")); await p.waitForTimeout(150);
  ok("Seller Mode off hides the dealer shelf", await ev(() => !document.querySelector(".sh-cab").textContent.includes("Dealer cases")));
  await ev(() => go("boxes")); await p.waitForTimeout(150);
  ok("...the Storage section and the menu item", await ev(() => !document.querySelector("#view").textContent.includes("Show case") && document.querySelector("#menuShows").hidden));
  ok("the case record is kept", await ev(() => !!getBox("dc")));
  await ev(() => saveSeller({ on: true }, true));
  await ev(() => put("c_x", { ...getCoin("x"), boxId: "dc" }, true)); // one coin back in for the pages below
  await ev(() => go("home")); await p.waitForTimeout(150);
  ok("Home shelf draws the dealer case", await ev(() => document.querySelector(".sh-cab").textContent.includes("Dealer cases") && !!document.querySelector(".sh-case.dealer")));
  await ev(() => go("box-dc")); await p.waitForTimeout(150);
  ok("case page has Take out and Return unsold coins", await ev(() => !!document.querySelector('[data-act="caseOut"]') && !!document.querySelector('[data-act="caseReturnAll"]')));
  await ev(() => go("boxes")); await p.waitForTimeout(100);
  ok("Storage page lists Dealer cases", await ev(() => document.querySelector("#view").textContent.includes("Dealer cases")));

  // shows
  await ev(() => saveSettings({ showSold: true }, true));
  ok("menu shows the Shows page with Seller Mode on", await ev(() => { render(); return !document.querySelector("#menuShows").hidden; }));
  await ev(() => go("shows")); await p.waitForTimeout(100);
  await ev(() => actions.showNew()); await p.waitForTimeout(100);
  await p.fill('#showForm [name="name"]', "Baltimore Expo");
  await p.selectOption('#showForm [name="type"]', "coinshow");
  await p.fill('#showForm [name="c_table"]', "100"); await p.fill('#showForm [name="c_gas"]', "30.5"); await p.fill('#showForm [name="c_food"]', "20");
  await p.click('#showForm button[type="submit"]'); await p.waitForTimeout(200);
  const showId = await ev(() => allShows()[0].id);
  ok("show saved with today's date and costs", await ev(() => { const s = allShows()[0]; return s.name === "Baltimore Expo" && s.start === today() && showCostTotal(s) === 150.5; }));
  ok("show page opens", await ev(() => location.hash === "#show-" + allShows()[0].id && document.querySelector("#view").textContent.includes("Profit for the show")));

  // the sale form defaults to the show happening today and fills Where
  await ev((id) => openSell("x"), null); await p.waitForTimeout(150);
  ok("Show picker defaults to today's show", await ev(() => document.querySelector("#showId").value === allShows()[0].id));
  ok("Where is filled in from the show", await ev(() => document.querySelector("#whereType").value === "Coin show" && document.querySelector('[name="whereDetail"]').value === "Baltimore Expo"));
  await p.fill('#sellForm [name="amount"]', "50"); await ev(() => { const f = document.querySelector('#sellForm [name="fees"]'); f.value = "2"; f.dispatchEvent(new Event("input", { bubbles: true })); });
  await p.click('#sellForm button[type="submit"]'); await p.waitForTimeout(200);
  ok("sale saved with the show", await ev((id) => soldCoins().some((c) => c.sold.showId === id && c.sold.whereType === "Coin show"), showId));

  // second sale chosen by hand, and a sale at no show
  await ev(() => { put("c_y", { ...getCoin("y"), boxId: "", ask: "40", paid: "10", shipCostFree: undefined }, true); });
  await ev(() => openSell("y")); await p.waitForTimeout(100);
  await p.fill('#sellForm [name="amount"]', "40"); await p.click('#sellForm button[type="submit"]'); await p.waitForTimeout(200);
  await ev(() => openSell("z")); await p.waitForTimeout(100);
  await p.selectOption("#showId", ""); await p.fill('#sellForm [name="amount"]', "99"); await p.click('#sellForm button[type="submit"]'); await p.waitForTimeout(200);
  ok("choosing No show leaves the sale out", await ev((id) => soldCoins().filter((c) => c.sold.showId === id).length === 2, showId));

  // the math: sales 90, cost 4+10, fees 2, show costs 150.5 -> -76.5
  const st = await ev((id) => { const s = showStats(getShow(id)); return { sales: s.sales, cost: s.cost, fees: s.fees, costs: s.costs, profit: s.profit, n: s.n }; }, showId);
  ok("show stats add up", st.sales === 90 && st.cost === 14 && st.fees === 2 && st.costs === 150.5 && st.profit === -76.5 && st.n === 2);
  ok("matches the sum of each sale's profit minus show costs", await ev((id) => { const s = getShow(id); return r2(sum(showSales(s), saleProfit) - showCostTotal(s)) === showStats(s).profit; }, showId));
  await ev((id) => go("show-" + id), showId); await p.waitForTimeout(100);
  ok("show page lists what sold and shows the loss", await ev(() => { const t = document.querySelector("#view").textContent; return t.includes("Sold here") && t.includes("76.50") && document.querySelectorAll("#view .coin-row").length === 2; }));
  ok("inherited coins never count at a show", await ev((id) => { put("c_inh", { ...getCoin("inh"), status: "sold", sold: { showId: id, amount: 500, at: 1, date: today() } }, true); return showStats(getShow(id)).n === 2; }, showId));

  // edit sale keeps the show; delete show keeps sales; Undo restores
  await ev(() => openSell(soldCoins().find((c) => c.sold.showId).id, true)); await p.waitForTimeout(100);
  ok("editing a sale keeps its show", await ev((id) => document.querySelector("#showId").value === id, showId));
  await ev(() => closeSheet());
  await ev((id) => actions.showDelete({ dataset: { id } }), showId); await p.waitForTimeout(100);
  await ev(() => actions.confirmOk()); await p.waitForTimeout(200);
  ok("deleting a show keeps the sales", await ev(() => !allShows().length && soldCoins().length >= 3));
  await ev(() => document.querySelector("#toast button").click()); await p.waitForTimeout(100);
  ok("Undo brings the show back with its sales", await ev((id) => !!getShow(id) && showStats(getShow(id)).n === 2, showId));

  // backup keeps shows and the case memory
  ok("backup includes shows and boxes", await ev(() => { const keys = []; store.docs.forEach((v, k) => keys.push(k)); return keys.some((k) => k.startsWith("sh_")) && keys.includes("b_dc"); }));
  ok("no page errors", errors.length === 0);
  if (errors.length) console.log(errors.join("\n"));
  await b.close();
})();
