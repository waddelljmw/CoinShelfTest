// v0.102.1: a proof coin can be put in (and stay in) a regular spot of an album that also has proof spots.
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const chk = (name, ok, extra) => console.log((ok ? "ok " : "FAIL ") + name + (extra !== undefined ? " " + JSON.stringify(extra) : ""));
  await p.evaluate(() => {
    const a = { kind: "album", id: "q1", brand: "Whitman", number: "9999", name: "Quarters", typeId: "washington-silver", typeIds: ["washington-silver"], layout: "dates", start: 1950, end: 1960, proofs: "all", removed: [], createdAt: 1 };
    a.slots = buildAlbumSlots(["washington-silver"], "dates", 1950, 1960, "all"); put("a_q1", a);
  });
  const sk = await p.evaluate(() => { const s = getAlbum("q1").slots.find((x) => x.y === 1955 && !x.pf); return s ? s.id : null; });
  chk("regular 1955 spot exists", !!sk);
  await p.evaluate(() => go("album-q1")); await p.waitForTimeout(150);
  await p.click(".slot:has-text('1955') >> nth=0"); await p.click("[data-act=slotHave]"); await p.waitForTimeout(150);
  await p.evaluate(() => { draft.grade = "PR-65"; draft._proof = true; });
  await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(250);
  const r = await p.evaluate((id) => { const cs = allCoins().filter((c) => String(c.year) === "1955"); const st = albumStats(getAlbum("q1")); const f = [...st.filled.values()].find((c) => cs[0] && c.id === cs[0].id); return [cs.length, cs[0] && cs[0].slotId === id, !!f]; }, sk);
  chk("proof saved into the regular 1955 spot", r[0] === 1 && r[1], r);
  chk("album shows the spot filled", r[2]);
  await p.evaluate(() => { const c = allCoins().find((x) => String(x.year) === "1955"); openCoinForm(c.id); draft.notes = "x"; }); 
  await p.evaluate(() => saveDraft()); await p.waitForTimeout(250);
  chk("stays in the spot after an edit", await p.evaluate((id) => allCoins().find((x) => String(x.year) === "1955").slotId === id, sk));
  chk("no page errors", errors.length === 0, errors);
  await b.close();
})();
