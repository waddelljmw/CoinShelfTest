// Step 5 Album accuracy: variety spots keep the variety, proof-only 1895, no made-up spots, variety edit moves the coin, hide spot asks.
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const chk = (name, ok, extra) => console.log((ok ? "ok " : "FAIL ") + name + (extra !== undefined ? " " + JSON.stringify(extra) : ""));
  await p.evaluate(() => {
    const m = { kind: "album", id: "m1", brand: "Whitman", number: "9128", name: "", typeId: "morgan-dollar", start: 1878, end: 1921, removed: [], createdAt: 1 };
    m.slots = buildSlots("morgan-dollar", 1878, 1921, { "1878|": ["8 Tail Feathers", "7 Over 8 Tail Feathers", "7 Tail Feathers"] }); put("a_m1", m);
    const l = { kind: "album", id: "l1", brand: "Whitman", number: "9130", name: "", typeId: "lincoln-wheat", start: 1909, end: 1915, removed: [], createdAt: 2 };
    l.slots = buildSlots("lincoln-wheat", 1909, 1915); put("a_l1", l);
  });
  const addVia = async (alb, sel, grade) => {
    await p.evaluate((a) => go("album-" + a), alb); await p.waitForTimeout(150);
    await p.click(sel); await p.click("[data-act=slotHave]"); await p.waitForTimeout(150);
    const dv = await p.evaluate(() => [draft.variety, draft.spotVariety]);
    if (grade) await p.evaluate((g) => { draft.grade = g; }, grade);
    await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(250);
    return dv;
  };
  // R4-8: variety spots keep the variety
  const filledName = (alb, key) => p.evaluate(([a, k]) => { const s = albumStats(getAlbum(a)); const c = s.filled.get(k); return c ? [c.variety, c.spotVariety] : null; }, [alb, key]);
  const dv1 = await addVia("l1", ".slot:has-text('VDB') >> nth=0", "VF-20");
  chk("VDB prefilled", dv1.some((x) => /vdb/i.test(x || "")), dv1);
  const vk = await p.evaluate(() => slotKey(getAlbum("l1").slots.find((s) => s.y === 1909 && s.v === "VDB" && !s.m)));
  chk("VDB spot filled", !!(await filledName("l1", vk)), await filledName("l1", vk));
  const dv2 = await addVia("m1", ".slot:has-text('7 Tail Feathers') >> nth=-1", "VF-20");
  chk("7TF prefilled", dv2.some((x) => /7 Tail/i.test(x || "")), dv2);
  const k7 = await p.evaluate(() => slotKey(getAlbum("m1").slots.find((s) => s.v === "7 Tail Feathers")));
  chk("7TF spot filled", !!(await filledName("m1", k7)), await filledName("m1", k7));
  // R5-4: change the variety, the coin moves
  const id7 = await p.evaluate((k) => albumStats(getAlbum("m1")).filled.get(k).id, k7);
  await p.evaluate((id) => { openCoinForm(id); draft.variety = "8 Tail Feathers"; }, id7);
  await p.evaluate(() => saveDraft()); await p.waitForTimeout(250);
  const k8 = await p.evaluate(() => slotKey(getAlbum("m1").slots.find((s) => s.v === "8 Tail Feathers")));
  const at8 = await p.evaluate(([k, id]) => { const c = albumStats(getAlbum("m1")).filled.get(k); return c && c.id === id; }, [k8, id7]);
  chk("variety edit moved coin to 8TF spot", at8);
  chk("7TF spot empty again", !(await filledName("m1", k7)));
  // 15d r54: variety back to Regular (none) moves the VDB coin to the plain 1909-S spot
  { const vdb = await p.evaluate((k) => albumStats(getAlbum("l1")).filled.get(k).id, vk);
    await p.evaluate((id) => { openCoinForm(id); draft.variety = ""; }, vdb);
    await p.evaluate(() => saveDraft()); await p.waitForTimeout(250);
    const r = await p.evaluate(([k, id]) => { const st = albumStats(getAlbum("l1")); const c = st.filled.get(k); const cc = getCoin(id); const sl = getAlbum("l1").slots.find((x) => x.id === cc.slotId); return [!!(c && c.id === id), sl && !sl.v]; }, [vk, vdb]);
    chk("15d variety back to Regular leaves the VDB spot for a plain spot", !r[0] && r[1] !== false, r); }
  // R5-2: 1895 proof only
  await p.evaluate(() => go("album-m1")); await p.waitForTimeout(150);
  await p.click(".slot:has-text('1895') >> nth=0");
  chk("proof only label", /Proof only/.test(await p.textContent("#sheet h2")));
  await p.click("[data-act=slotHave]"); await p.waitForTimeout(150);
  await p.evaluate(() => { draft.grade = "VF-20"; draft._proof = false; });
  const before = await p.evaluate(() => allCoins().length);
  await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(250);
  chk("circulated 1895 refused", (await p.evaluate(() => allCoins().length)) === before, await p.textContent("#toast"));
  await p.evaluate(() => { draft.grade = "PR-65"; draft._proof = true; });
  await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(250);
  chk("proof 1895 saved", (await p.evaluate(() => allCoins().length)) === before + 1);
  // R5-3: made-up spots
  await p.evaluate(() => go("album-m1")); await p.waitForTimeout(150);
  const tryAdd = async (y, m) => { await p.click("[data-act=addSpot]"); await p.fill("#spotY", String(y)); await p.selectOption("#spotM", m).catch(() => p.fill("#spotM", m)); await p.click("#spotForm button[type=submit]"); await p.waitForTimeout(150); const t = await p.textContent("#toast"); if (await p.$("#spotForm")) await p.click("[data-act=closeSheet]"); return t; };
  const n0 = await p.evaluate(() => getAlbum("m1").slots.length);
  const t1 = await tryAdd(1922, ""), t2 = await tryAdd(1880, "D"), t3 = await tryAdd(1950, "S");
  chk("1922 / 1880-D / 1950-S refused", (await p.evaluate(() => getAlbum("m1").slots.length)) === n0, [t1, t2, t3]);
  // R5-5: hide a filled spot asks
  const k8b = k8;
  await p.evaluate(([a, k]) => actions.toggleSlot({ dataset: { id: a, k } }), ["m1", k8b]); await p.waitForTimeout(100);
  chk("hide asks", /Hide this spot/.test(await p.textContent("#sheet h2")) && !(await p.evaluate((k) => getAlbum("m1").removed.includes(k), k8b)));
  await p.click("[data-act=confirmOk]"); await p.waitForTimeout(100);
  chk("hide after OK", await p.evaluate((k) => getAlbum("m1").removed.includes(k), k8b));
  // R5-5: shorten years asks (second tap)
  await p.evaluate(() => { go("album-m1"); openEditAlbum("m1"); }); await p.waitForTimeout(150);
  await p.fill("[name=end]", "1890"); await p.click("#editAlbumForm button[type=submit]"); await p.waitForTimeout(150);
  const note = await p.$("#albumLoseNote");
  chk("shorten years asks", !!note && (await p.evaluate(() => getAlbum("m1").end)) === 1921, note ? await note.textContent() : null);
  await p.click("#editAlbumForm button[type=submit]"); await p.waitForTimeout(150);
  chk("second tap saves", (await p.evaluate(() => getAlbum("m1").end)) === 1890);
  console.log("errors", errors); await b.close();
})();
