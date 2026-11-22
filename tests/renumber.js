// Session 40 review fixes: renumber never reuses a label on any flip, a second run changes nothing,
// a no-change run keeps the Undo, Undo keeps labels typed since, restoring the pre-renumber backup keeps IDs, CSV IDs tidied.
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (name, cond, info) => console.log((cond ? "ok   " : "FAIL ") + name + (cond ? "" : " " + (info || "")));
  const add = (id, cid, n) => p.evaluate(([id, cid, n]) => { const t = TYPE_BY_ID["morgan-dollar"];
    put("c_" + id, { ...blankCoin(), id, typeId: t.id, typeName: t.name, family: t.family, denom: t.denom, metal: t.metal, oz: t.oz || "", year: 1880 + n, createdAt: n, status: "owned", cid }, true); }, [id, cid, n]);
  const dump = () => p.evaluate(() => allCoins().sort((a, b) => a.createdAt - b.createdAt).map((c) => c.cid + "[" + (c.oldCids || []).join("|") + "]").join(" "));
  await add("a", "MD-002", 1); await add("b", "MD-001", 2); await add("c", "MD-003", 3);
  const backup = await p.evaluate(() => JSON.parse(JSON.stringify(allCoins())));

  await p.evaluate(() => renumberCoins());
  const cur = await p.evaluate(() => allCoins().map((c) => idNormKey(c.cid)));
  const every = await p.evaluate(() => allCoins().flatMap((c) => [c.cid, ...(c.oldCids || [])]).map(idNormKey));
  ok("renumber: every label (now or old) belongs to one coin", new Set(every).size === every.length, await dump());
  ok("renumber: current IDs unique", new Set(cur).size === cur.length);
  ok("search for an old flip label finds only that coin", await p.evaluate(() => idOwner("MD-001").id === "b"));
  const first = await dump();
  const n2 = await p.evaluate(() => renumberCoins());
  ok("second renumber changes nothing", n2 === 0 && (await dump()) === first, await dump());
  ok("no-change renumber keeps the Undo", await p.evaluate(() => !!settings().lastRenumber));

  // Undo keeps a label typed after the renumber
  const bId = await p.evaluate(() => getCoin("b").cid);
  await p.evaluate(() => setCoinId("b", "Box 3 #17"));
  await p.evaluate(() => undoRenumber());
  ok("undo keeps a label typed since", await p.evaluate(() => getCoin("b").cid === "Box 3 #17"));
  ok("undo restores the others", await p.evaluate(() => getCoin("a").cid === "MD-002" && getCoin("c").cid === "MD-003"), await dump());

  // Restore the pre-renumber backup: IDs come back as they were
  await p.evaluate(() => { setCoinId("b", "MD-001"); renumberCoins(); });
  await p.evaluate((bk) => { restoreRenumbered = 0; restoreDone = new Set(); restoreIncoming = new Set(bk.map((c) => c.id));
    bk.forEach((c) => put("c_" + c.id, mergeRestored("c_" + c.id, c), true)); ensureIds(); }, backup);
  ok("restore of pre-renumber backup keeps every ID", (await p.evaluate(() => ["a", "b", "c"].map((x) => getCoin(x).cid).join())) === "MD-002,MD-001,MD-003", await dump());
  ok("restore reports no clashes", await p.evaluate(() => restoreRenumbered === 0));
  // a real clash with a coin not in the backup still gets a fresh number
  await add("d", "MD-777", 4);
  await p.evaluate(() => { restoreRenumbered = 0; restoreDone = new Set(); restoreIncoming = new Set(["e"]);
    const t = TYPE_BY_ID["morgan-dollar"]; put("c_e", mergeRestored("c_e", { ...blankCoin(), id: "e", typeId: t.id, typeName: t.name, family: t.family, denom: t.denom, metal: t.metal, year: 1890, createdAt: 5, status: "owned", cid: "md-777" }), true); });
  ok("restore still drops a real clash", await p.evaluate(() => !getCoin("e").cid && restoreRenumbered === 1));

  // CSV import tidies IDs like typed ones
  ok("idTidy on import shape", await p.evaluate(() => idTidy("md-0050") === "MD-050"));
  console.log("errors", JSON.stringify(errors));
  await b.close();
})();
