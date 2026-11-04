// Step 9.5: Coin ID styles (app / own / running / off), typed labels, renumber with old IDs + Undo, CSV import of IDs, tidier export.
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (name, cond) => console.log((cond ? "ok   " : "FAIL ") + name);
  const addCoin = (id, typeId, year, extra) => p.evaluate(([id, typeId, year, extra]) => {
    const t = TYPE_BY_ID[typeId];
    put("c_" + id, { ...blankCoin(), id, typeId, typeName: t.name, family: t.family, denom: t.denom, metal: t.metal, oz: t.oz || "", year, createdAt: +id.replace(/\D/g, "") || 1, ...(extra || {}) }, true);
  }, [id, typeId, year, extra]);
  const cids = () => p.evaluate(() => allCoins().sort((a, b) => a.createdAt - b.createdAt).map((c) => c.cid || ""));
  const set = (patch) => p.evaluate((x) => saveSettings(x, true), patch);

  // 1. default = app's codes, as before (old data has no idStyle)
  await addCoin("c1", "morgan-dollar", 1880); await addCoin("c2", "morgan-dollar", 1881); await addCoin("c3", "peace-dollar", 1922);
  await p.evaluate(() => ensureIds());
  ok("default app codes", JSON.stringify(await cids()) === JSON.stringify(["MD-001", "MD-002", "PD-001"]));

  // 2. my own codes: rename MD -> MOR starting at 100; others keep the app's code
  await set({ idStyle: "own", idOwn: { MD: { code: "mor", start: "100" } } });
  await addCoin("c4", "morgan-dollar", 1882); await addCoin("c5", "peace-dollar", 1923); await p.evaluate(() => ensureIds());
  const own = await cids(); ok("own codes", own[3] === "MOR-100" && own[4] === "PD-002");

  // 3. one running number with prefix, padded to the start's width
  await set({ idStyle: "running", idRun: { prefix: "JW-", start: "0007" } });
  await addCoin("c6", "morgan-dollar", 1883); await addCoin("c7", "state-quarter", 2001); await p.evaluate(() => ensureIds());
  const run = await cids(); ok("running number", run[5] === "JW-0007" && run[6] === "JW-0008");
  // a typed label that fits the style moves the counter past it
  const t1 = await p.evaluate(() => setCoinId("c1", "jw-0020"));
  await addCoin("c8", "morgan-dollar", 1884); await p.evaluate(() => ensureIds());
  ok("typed label ok + counter moves on", t1 === "" && (await cids())[7] === "JW-0021");

  // 4. any label can be typed; duplicates refused (case and spaces ignored) and named
  const t2 = await p.evaluate(() => [setCoinId("c2", "Box 3  #17"), getCoin("c2").cid, setCoinId("c3", "box 3 #17"), setCoinId("c3", "x".repeat(41))]);
  ok("any label typed + tidied", t2[0] === "" && t2[1] === "Box 3 #17");
  ok("duplicate refused, names the coin", /already used by/.test(t2[2]) && /1881/.test(t2[2]));
  ok("too long refused", /too long/.test(t2[3]));
  ok("empty refused while IDs on", /Type an ID/.test(await p.evaluate(() => setCoinId("c3", ""))));

  // 5. off: no automatic IDs; blank allowed; typed one on the form path still checked
  await set({ idStyle: "off" });
  await addCoin("c9", "peace-dollar", 1925); await p.evaluate(() => ensureIds());
  ok("off gives no ID", (await cids())[8] === "");
  ok("off allows clearing", (await p.evaluate(() => [setCoinId("c8", ""), getCoin("c8").cid]))[1] === "");
  const chk = await p.evaluate(() => { const a = { id: "zz", cid: "box 3 #17" }; const b2 = { id: "zz", cid: "  A17 " }; return [checkTypedId(a), checkTypedId(b2), b2.cid]; });
  ok("form label checked", /already used/.test(chk[0]) && chk[1] === "" && chk[2] === "A17");
  ok("add form shows nothing when off", (await p.evaluate(() => nextIdPreview({}))) === "");

  // 6. renumber keeps old IDs, is searchable, sold coins untouched, Undo restores
  await set({ idStyle: "app", idOwn: {}, idRun: {} });
  await p.evaluate(() => { put("c_c3", { ...getCoin("c3"), status: "sold", sold: { date: "2026-10-31", amount: 50 } }, true); });
  const before = await p.evaluate(() => Object.fromEntries(allCoins().map((c) => [c.id, c.cid || ""])));
  const n = await p.evaluate(() => renumberCoins());
  const after = await p.evaluate(() => Object.fromEntries(allCoins().map((c) => [c.id, { cid: c.cid, old: c.oldCids || [] }])));
  ok("renumber changed coins", n > 0);
  ok("sold coin keeps its ID", after.c3.cid === before.c3 && after.c3.old.length === 0);
  ok("old ID kept", after.c1.old.includes(before.c1) && after.c1.cid !== before.c1 && /^MD-\d+$/.test(after.c1.cid));
  ok("no repeats", new Set(Object.values(after).map((x) => x.cid).filter(Boolean)).size === Object.values(after).filter((x) => x.cid).length);
  await p.evaluate(() => { go("coins"); }); await p.waitForTimeout(200);
  await p.fill("#coinSearch", before.c1); await p.waitForTimeout(200);
  ok("search finds coin by old ID", (await p.locator(".coin-row").count()) >= 1);
  await p.evaluate(() => { go("coin-c1"); }); await p.waitForTimeout(200);
  ok("coin page shows old ID", new RegExp("old ID").test(await p.textContent("main")));
  ok("old ID can't be handed to another coin", /already used/.test(await p.evaluate((o) => setCoinId("c5", o), before.c1)));
  await p.evaluate(() => undoRenumber());
  const back = await p.evaluate(() => Object.fromEntries(allCoins().map((c) => [c.id, [c.cid || "", (c.oldCids || []).length]])));
  ok("undo restores IDs and drops old IDs", Object.keys(before).every((k) => back[k][0] === before[k] && back[k][1] === 0));

  // 7. CSV import takes the ID column; repeats keep the first and are reported
  const csv = "ID,Label,Year,Coin type,Qty\nA1,Morgan one,1890,Morgan Dollar,1\nA2,Morgan two,1891,Morgan Dollar,1\nA1,Morgan three,1892,Morgan Dollar,1\nbox 3 #17,Morgan four,1893,Morgan Dollar,1\n";
  await p.evaluate((t) => { openImport(); loadImportText(t, "ids.csv"); }, csv);
  ok("ID column is matched", await p.evaluate(() => imp.map.includes("cid")));
  await p.click("[data-act=doImport]"); await p.waitForTimeout(500);
  const imp = await p.evaluate(() => allCoins().filter((c) => c.importBatch).sort((a, b) => a.year - b.year).map((c) => [c.year, c.cid]));
  ok("first A1 kept, repeat gets new ID", imp[0][1] === "A1" && imp[1][1] === "A2" && imp[2][1] !== "A1" && !!imp[2][1]);
  ok("clash with existing coin gets new ID", imp[3][1] !== "box 3 #17" && !!imp[3][1]);

  // 8. export: everyday columns first, empty columns left out, still re-imports
  const out = await p.evaluate(() => toCsv());
  const head = out.split("\n")[0].split(",");
  ok("export starts with everyday columns", head.slice(0, 4).join() === "ID,Label,Year,Coin type", head.slice(0, 5).join());
  ok("empty columns left out", !head.includes("Bar weight (oz)") && !head.includes("Roll condition") && !head.includes("Sold tracking number"));
  ok("export still has Status and Qty", head.includes("Status") && head.includes("Qty"));

  // 9. Options section shows the styles; running/own inputs appear
  await p.evaluate(() => go("options")); await p.waitForTimeout(200);
  const optHtml = await p.evaluate(() => idStyleOptionsHtml());
  ok("options lists four styles", ["App's codes", "My own codes", "One running number", "Off"].every((s) => optHtml.includes(s)));
  await set({ idStyle: "own" }); ok("own style has code boxes", (await p.evaluate(() => idStyleOptionsHtml())).includes('data-idown="MD"'));
  await set({ idStyle: "running" }); ok("running style has prefix box", (await p.evaluate(() => idStyleOptionsHtml())).includes('data-idrun="prefix"'));
  // Add coin form: hint when on, field when off
  await set({ idStyle: "app" }); await p.evaluate(() => go("home")); await p.waitForTimeout(150);
  await p.click("#fab"); await p.waitForTimeout(200);
  ok("add form shows next ID hint", /next is/.test(await p.evaluate(() => document.body.innerText)));
  await p.evaluate(() => closeSheet && closeSheet());
  await set({ idStyle: "off" }); await p.evaluate(() => go("home")); await p.waitForTimeout(150);
  await p.click("#fab"); await p.waitForTimeout(200);
  ok("add form has ID field when off", await p.evaluate(() => !!document.querySelector("[data-f=cid]")));

  console.log("errors", JSON.stringify(errors));
  await b.close();
})();
