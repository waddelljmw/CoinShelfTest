// F1: a coin whose type was typed by hand can have its name, kind and face value fixed; catalog coins stay locked.
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  await p.evaluate(() => {
    const base = blankCoin();
    put("c_t1", { ...base, id: "t1", typeId: "", typeName: "Casino tokn", family: "Token", denom: "$1", year: 1975, cid: "TK-007", photos: [{ lid: "ph1" }], albumId: "", keptIn: "Shelf A", paid: 5, createdAt: 1 }, true);
    put("c_t2", { ...base, id: "t2", typeId: "", typeName: "Old medal", family: "", denom: "", year: 1900, cid: "MT-001", createdAt: 2 }, true); // kind was only the name
    put("c_m1", { ...base, id: "m1", typeId: "morgan-dollar", typeName: "Morgan Dollar", family: "Dollars", denom: "$1", year: 1881, mint: "S", cid: "MD-001", createdAt: 3 }, true);
  });
  const save = async () => { await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(250); };
  const get = (id) => p.evaluate((i) => { const c = getCoin(i); return { typeId: c.typeId, typeName: c.typeName, family: c.family, denom: c.denom, cid: c.cid, year: c.year, photos: JSON.stringify(c.photos || []), keptIn: c.keptIn, paid: c.paid }; }, id);

  // fix a typo: name, face value and kind change; ID, photos, place, price stay
  await p.evaluate(() => openCoinForm("t1")); await p.waitForTimeout(200);
  ok("typed coin shows editable name", (await p.locator("#coinForm [data-f=typeName]").count()) === 1);
  ok("no locked-type box for typed coin", (await p.locator("#coinForm .locked-type").count()) === 0);
  await p.fill("#coinForm [data-f=typeName]", "Casino token"); await p.fill("#coinForm [data-f=denom]", "$5");
  await p.selectOption("#coinForm [data-f=family]", "Medal");
  await save();
  let t = await get("t1");
  ok("name fixed", t.typeName === "Casino token"); ok("face value fixed", t.denom === "$5"); ok("kind fixed", t.family === "Medal");
  ok("same ID number", t.cid === "TK-007"); ok("photos kept", t.photos === JSON.stringify([{ lid: "ph1" }]));
  ok("place, price, year kept", t.keptIn === "Shelf A" && t.paid === 5 && t.year === 1975); ok("still no catalog type", t.typeId === "");

  // empty name is refused when it had one
  await p.evaluate(() => openCoinForm("t1")); await p.waitForTimeout(200);
  await p.fill("#coinForm [data-f=typeName]", "   "); await save();
  ok("empty name refused", (await get("t1")).typeName === "Casino token");
  await p.evaluate(() => { const d = document.querySelector(".sheet .x, [data-act=closeSheet]"); if (d) d.click(); }); await p.waitForTimeout(150);

  // a kind that was only the old name follows the new name
  await p.evaluate(() => openCoinForm("t2")); await p.waitForTimeout(200);
  await p.fill("#coinForm [data-f=typeName]", "Old medallion"); await save();
  t = await get("t2"); ok("name-only kind follows", t.typeName === "Old medallion" && t.family === "Old medallion"); ok("t2 ID kept", t.cid === "MT-001");

  // catalog coin still locked
  await p.evaluate(() => openCoinForm("m1")); await p.waitForTimeout(200);
  ok("catalog coin shows locked type", (await p.locator("#coinForm .locked-type").count()) === 1 && (await p.locator("#coinForm [data-f=typeName]").count()) === 0);
  await p.evaluate(() => { draft.typeName = "Hacked"; draft.typeId = "peace-dollar"; draft.denom = "$9"; draft.family = "X"; }); await save();
  t = await get("m1"); ok("catalog type unchanged by save", t.typeId === "morgan-dollar" && t.typeName === "Morgan Dollar" && t.denom === "$1" && t.family === "Dollars");

  // the "used before" list shows the new name
  const used = await p.evaluate(() => savedOthers().map((o) => o.name));
  ok("types-used list has new name, not the old", used.includes("Casino token") && !used.includes("Casino tokn"));
  console.log("errors", JSON.stringify(errors)); await b.close();
})();
