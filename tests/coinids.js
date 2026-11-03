const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const add = async (t, y) => { await p.click("#fab"); await p.fill("#typeSearch", t); await p.click("#typeList button[data-act=pickType] >> nth=0"); await p.fill("[data-f=year]", y); await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(200); };
  await add("morgan", "1880"); await add("morgan", "1881"); await add("peace", "1922");
  const ids = () => p.evaluate(() => allCoins().map((c) => c.cid).sort());
  console.log("ids:", JSON.stringify(await ids()));
  if (JSON.stringify(await ids()) !== JSON.stringify(["MD-001", "MD-002", "PD-001"])) console.log("FAIL numbering");
  // old coin without an ID gets one on read; never reuses a deleted coin's number
  const r = await p.evaluate(() => {
    const m = allCoins().find((c) => c.cid === "MD-002"); put("c_" + m.id, { ...m, status: "deleted" }, true);
    const old = { ...allCoins().find((c) => c.cid === "PD-001"), id: "old1", cid: undefined, createdAt: 1 }; delete old.cid; put("c_old1", old, true);
    const old2 = { ...old, id: "old2", createdAt: 2 }; put("c_old2", old2, true);
    ensureIds();
    return [getCoin("old1").cid, getCoin("old2").cid];
  });
  console.log("old coins:", JSON.stringify(r)); if (r[0] !== "PD-002" || r[1] !== "PD-003") console.log("FAIL old numbering");
  const nm = await p.evaluate(() => { const m = { ...allCoins().find((c) => c.cid === "MD-001"), id: "new3" }; delete m.cid; put("c_new3", m, true); ensureIds(); return getCoin("new3").cid; });
  console.log("after delete, next Morgan:", nm); if (nm !== "MD-003") console.log("FAIL reuse");
  const dup = await p.evaluate(() => setCoinId("old1", "MD-001")); console.log("duplicate:", dup); if (!/already used/.test(dup)) console.log("FAIL duplicate");
  console.log("edit ok:", JSON.stringify(await p.evaluate(() => [setCoinId("old1", "pd-050"), getCoin("old1").cid, settings().idNext.PD])));
  console.log("bad format:", await p.evaluate(() => setCoinId("old1", "hello")));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html") + "#coins"); await p.waitForTimeout(300);
  await p.fill("#coinSearch", "PD-050"); await p.waitForTimeout(200);
  const n = await p.locator(".coin-row").count(); console.log("search PD-050 rows:", n); if (n !== 1) console.log("FAIL search");
  // Review fixes (session 8): padding duplicates, restores keep/refresh IDs, re-add drops the ID
  const fx = await p.evaluate(async () => {
    const out = {};
    const m1 = allCoins().find((c) => c.cid === "MD-001"), m3 = allCoins().find((c) => c.cid === "MD-003");
    out.pad = setCoinId(m3.id, "md-1");
    out.norm = [setCoinId(m3.id, "md-77"), getCoin(m3.id).cid];
    const before = allCoins().filter((c) => c.status !== "deleted").map((c) => c.id + "=" + c.cid).sort().join();
    let docs = allCoins().map((c) => { const d = { ...c }; delete d.cid; return { id: "c_" + c.id, data: d }; });
    restorePending = { kind: BACKUP_KIND, format: 1, docs, photos: {} }; await doRestore(); await new Promise((r) => setTimeout(r, 300));
    out.oldBackupSame = allCoins().filter((c) => c.status !== "deleted").map((c) => c.id + "=" + c.cid).sort().join() === before;
    docs = [{ id: "c_other1", data: { ...m1, id: "other1", cid: "MD-001", year: "1885" } }];
    restorePending = { kind: BACKUP_KIND, format: 1, docs, photos: {} }; await doRestore(); await new Promise((r) => setTimeout(r, 300));
    const all = allCoins().map((c) => c.cid);
    out.noDup = all.length === new Set(all).size && !!getCoin("other1").cid && getCoin("other1").cid !== "MD-001";
    return out;
  });
  console.log("review fixes:", JSON.stringify(fx));
  if (!/already used/.test(fx.pad) || fx.norm[1] !== "MD-077" || !fx.oldBackupSame || !fx.noDup) console.log("FAIL review fixes");
  const re = await p.evaluate(() => { openCoinForm(allCoins().find((c) => c.cid === "MD-001").id); retypeDraft(); return draft.cid; });
  if (re) console.log("FAIL re-add copies ID " + re);
  console.log("errors", errors); await b.close();
})();
