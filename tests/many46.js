// Step 4.6: add many identical coins at once.
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const fail = (m) => console.log("FAIL " + m);
  const open = async () => { await p.click("#fab"); await p.fill("#typeSearch", "morgan"); await p.click("#typeList button[data-act=pickType] >> nth=0"); await p.fill("[data-f=year]", "1881"); };
  const save = async () => { await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(300); };
  const coins = () => p.evaluate(() => allCoins().map((c) => ({ id: c.id, cid: c.cid, paid: c.paid, tax: c.buyTax, qty: c.qty, box: c.boxId, r: c.boxRow, s: c.boxSlot, ph: (c.photos || []).length })));

  // 1. plain group of 5, total price $10.01 (not evenly divisible) and $1.00 tax
  await open();
  await p.evaluate(() => { document.querySelector("[data-f=_many]").value = "5"; document.querySelector("[data-f=_many]").dispatchEvent(new Event("change", { bubbles: true })); });
  await p.waitForTimeout(100);
  await p.evaluate(() => { draft._payMode = "total"; draft.paid = "10.01"; draft.buyTax = "1.00"; draft.photos = [{ url: "blob:x" }]; });
  await save();
  let cs = await coins();
  console.log("group:", JSON.stringify(cs.map((c) => [c.cid, c.paid, c.tax])));
  if (cs.length !== 5) fail("count " + cs.length);
  if (new Set(cs.map((c) => c.cid)).size !== 5 || cs.map((c) => c.cid).sort().join() !== "MD-001,MD-002,MD-003,MD-004,MD-005") fail("ids");
  const sum = (k) => Math.round(cs.reduce((a, c) => a + Number(c[k]), 0) * 100) / 100;
  if (sum("paid") !== 10.01) fail("paid sum " + sum("paid")); if (sum("tax") !== 1) fail("tax sum " + sum("tax"));
  const first = cs.find((c) => c.cid === "MD-001"); if (first.paid !== "2.01") fail("leftover on first: " + first.paid);
  if (cs.some((c) => c.qty !== 1 || c.ph !== 1)) fail("qty/photo");
  // photo lists are separate copies
  const sep = await p.evaluate(() => { const a = allCoins(); return a[0].photos !== a[1].photos; });
  if (!sep) fail("photo lists shared");

  // 2. per-coin price copies to each
  await open();
  await p.evaluate(() => { document.querySelector("[data-f=_many]").value = "3"; document.querySelector("[data-f=_many]").dispatchEvent(new Event("change", { bubbles: true })); });
  await p.waitForTimeout(100);
  await p.evaluate(() => { draft.paid = "4.50"; });
  await save();
  cs = await coins(); const per = cs.filter((c) => c.paid === "4.5"); if (per.length !== 3) fail("per coin price " + JSON.stringify(cs.map((c) => c.paid)));

  // 3. Undo removes the whole group (the last 3), not the earlier 5
  await p.evaluate(() => { document.querySelector("#toast button, .toast button, [data-act=toastUndo]").click(); });
  await p.waitForTimeout(200);
  cs = await coins(); if (cs.length !== 5) fail("undo left " + cs.length);

  // 4. box with spots: tap in order, fill the rest, blocked when not placed
  await p.evaluate(() => { put("b_t", { kind: "box", id: "t", name: "Test box", rows: 2, perRow: 4, spots: true, type: "storage", look: "black", createdAt: 1 }); put("c_x", { kind: "coin", id: "x", status: "owned", typeId: COIN_TYPES[0].id, year: 1944, boxId: "t", boxRow: "1", boxSlot: "2", createdAt: 2 }); });
  await open();
  await p.evaluate(() => { document.querySelector("[data-f=_many]").value = "3"; document.querySelector("[data-f=_many]").dispatchEvent(new Event("change", { bubbles: true })); });
  await p.waitForTimeout(100);
  await p.evaluate(() => { draft.boxId = "t"; renderCoinForm(); });
  await p.waitForTimeout(100);
  await save(); // no spots yet: must not save
  if ((await coins()).length !== 6) fail("saved without spots");
  await p.evaluate(() => actions.manySpot({ dataset: { r: "2", s: "3" } }));
  await p.evaluate(() => actions.manySpot({ dataset: { r: "1", s: "2" } })); // occupied by coin x: UI disables it, but the save check must also stop it
  await p.evaluate(() => actions.manyFill());
  const st = await p.evaluate(() => draft._spots.slice());
  console.log("spots:", JSON.stringify(st));
  if (st[0] !== "2-3") fail("order"); if (st.includes("1-2") && st.indexOf("1-2") === 1) { /* tapped occupied; checked below */ }
  await p.evaluate(() => { draft._spots = ["2-3", "1-1", "1-2"]; }); // 1-2 is taken
  await save(); if ((await coins()).length !== 6) fail("saved onto an occupied spot");
  await p.evaluate(() => { draft._spots = ["2-3", "1-1", "1-3"]; });
  await save();
  cs = await coins();
  const inBox = cs.filter((c) => c.box === "t" && c.id !== "x").map((c) => c.r + "-" + c.s).sort();
  console.log("in box:", JSON.stringify(inBox));
  if (inBox.join() !== "1-1,1-3,2-3") fail("box spots " + inBox);

  // 5. taking a spot back out, and album picks hide the field
  await open();
  await p.evaluate(() => { draft._many = "2"; draft.boxId = "t"; renderCoinForm(); actions.manySpot({ dataset: { r: "2", s: "1" } }); actions.manySpot({ dataset: { r: "2", s: "1" } }); });
  if ((await p.evaluate(() => draft._spots.length)) !== 0) fail("tap again should remove");
  if (!(await p.evaluate(() => manyOn({ ...draft })))) fail("manyOn");
  if (await p.evaluate(() => manyOn({ ...draft, albumId: "zzz" }))) fail("album should disable many");
  if (await p.evaluate(() => manyCount({ ...draft, _many: "500" })) !== 100) fail("max 100");
  console.log("errors", JSON.stringify(errors)); await b.close();
})();
