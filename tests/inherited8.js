// Step 8: inherited album label, never auto-grouped, twin album names, for-sale case guard, sold coin -> Inherited guard.
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  await p.evaluate(() => {
    const mk = (id, number, inherited) => put("a_" + id, { kind: "album", id, brand: "Whitman", number, name: "", inherited, typeId: "morgan-dollar", typeIds: ["morgan-dollar"], layout: "dates", start: 1878, end: 1904, proofs: "", removed: [], slots: [], createdAt: 1 });
    mk("mine", "9128", false); mk("inh", "9129", true);
  });
  const keys = await p.evaluate(() => { const k = albumSeriesKeys(albums()); return [k.get("mine") || null, k.get("inh") || null]; });
  ok("inherited album is not auto-joined to yours", keys[0] === null && keys[1] === null);
  await p.evaluate(() => go("albums")); await p.waitForTimeout(200);
  const html = await p.textContent("#app, body");
  ok("My Albums shows an Inherited chip", /Inherited/.test(html));
  ok("albumLabel adds (inherited)", await p.evaluate(() => albumLabel(getAlbum("inh")) === "Whitman 9129 (inherited)" && albumLabel(getAlbum("mine")) === "Whitman 9128"));
  // twin names
  const t = await p.evaluate(() => { const a = { id: "x", brand: "Whitman", number: "9128", name: "" }; const c = uniqueAlbumName(a); const a2 = { id: "y", brand: "Whitman", number: "9130", name: "" }; return [c, a.name, uniqueAlbumName(a2), a2.name]; });
  ok("twin album gets (2)", t[0] === true && t[1] === "Whitman 9128 (2)" && t[2] === false && t[3] === "");
  // sold coin -> Inherited asks first
  await p.evaluate(() => { put("settings", { ...settings(), inheritances: [{ id: "i1", from: "X", date: "2023", earlier: [], valueWhen: "5" }], inhDefault: "i1" });
    put("c_s", { ...blankCoin(), id: "s", typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1880, grade: "VF-20", value: "40", qty: 1, status: "sold", source: "eBay" }); });
  await p.evaluate(() => { openCoinForm("s"); applySourceKind(draft, "Inherited"); renderCoinForm(); saveDraft(); }); await p.waitForTimeout(300);
  ok("sold -> Inherited asks first", /Make this sold coin inherited/.test(await p.textContent("#sheetTop")));
  ok("not saved yet", (await p.evaluate(() => getCoin("s").source)) === "eBay");
  await p.click("#sheetTop [data-act=inhSoldKeep]:not(.x)"); await p.waitForTimeout(300);
  ok("Keep as it was restores source", await p.evaluate(() => draft.source === "eBay"));
  await p.evaluate(() => { applySourceKind(draft, "Inherited"); renderCoinForm(); saveDraft(); }); await p.waitForTimeout(300);
  await p.click("#sheetTop [data-act=inhSoldOk]"); await p.waitForTimeout(400);
  ok("Change it saves", await p.evaluate(() => isInherited(getCoin("s"))));
  // for-sale case with inherited coins
  await p.evaluate(() => { put("b_cs", { kind: "box", id: "cs", name: "Case", type: "dealer", forSale: false, spots: true, rows: 1, perRow: 5, createdAt: 1 }); put("c_in", { ...blankCoin(), id: "in", typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1881, grade: "VF-20", value: "40", qty: 1, status: "owned", source: "Inherited", inhId: "i1", boxId: "cs" }); });
  await p.evaluate(() => boxForm(getBox("cs"))); await p.waitForTimeout(300);
  await p.evaluate(() => { const f = document.querySelector("#boxForm"); f.querySelector("[name=forSale]").checked = true; saveBoxForm(f); }); await p.waitForTimeout(300);
  ok("for-sale case with inherited coins asks first", /Make this a for-sale case/.test(await p.textContent("#sheetTop")));
  ok("box not changed yet", await p.evaluate(() => getBox("cs").forSale === false));
  await p.click("#sheetTop [data-act=boxSaleOk]"); await p.waitForTimeout(400);
  ok("Yes saves it as for sale", await p.evaluate(() => getBox("cs").forSale === true));
  console.log("errors", JSON.stringify(errors)); await b.close();
})();
