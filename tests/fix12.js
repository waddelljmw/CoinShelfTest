// Fixes 1+2: spot identity and variety default
const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (name, cond) => console.log((cond ? "PASS " : "FAIL ") + name);

  // --- Fix 2: an 1878 Morgan entered by hand gets no variety and a flagged lowest price
  await p.click("#fab"); await p.fill("#typeSearch", "morgan"); await p.click("#typeList button[data-act=pickType] >> nth=0");
  await p.fill("[data-f=year]", "1878"); await p.selectOption("[data-f=grade]", "VF-20"); await p.waitForTimeout(100);
  const v = await p.evaluate(() => ({ variety: draft.variety, first: document.querySelector("[data-f=variety] option").textContent, hint: document.querySelector("#bookHint").textContent, price: bookPrice(draft) }));
  ok("variety left blank", v.variety === "");
  ok("first option is neutral", v.first === "Not sure / not listed");
  ok("value is lowest 1878 VF-20 (55), not 8TF (95)", v.price === 55);
  ok("hint explains the estimate", /lowest-priced variety/.test(v.hint));
  await p.selectOption("[data-f=variety]", "8 Tail Feathers"); await p.waitForTimeout(80);
  ok("picking 8TF gives 95", (await p.evaluate(() => bookPrice(draft))) === 95);
  await p.click("[data-act=closeSheet] >> nth=0");

  // --- Fix 1: three 1878 spots, add a coin to each via its spot, then rename + reorder
  await p.evaluate(() => {
    const a = { kind: "album", id: "m1", brand: "Whitman", number: "9128", name: "", typeId: "morgan-dollar", start: 1878, end: 1880, removed: [], createdAt: 1 };
    a.slots = [{ y: 1878, m: "", v: "8 Tail Feathers", custom: true }, { y: 1878, m: "", v: "7/8 Tail Feathers", custom: true }, { y: 1878, m: "", v: "7 Tail Feathers" }, { y: 1878, m: "CC" }, { y: 1879, m: "" }];
    put("a_m1", a); go("album-m1");
  });
  await p.waitForTimeout(200);
  for (const label of ["7/8 Tail Feathers", "8 Tail Feathers", "7 Tail Feathers"]) {
    await p.click(`.slot:has-text("${label}")`); await p.click(".btn-addcoin"); await p.waitForTimeout(100);
    await p.fill("[data-f=notes]", "coin for " + label);
    await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(200);
  }
  const where = () => p.evaluate(() => { const a = getAlbum("m1"); const st = albumStats(a); return a.slots.map((s) => (s.v || slotLabel(s)) + " => " + ((st.filled.get(slotKey(s)) || {}).notes || "empty")); });
  const before = await where();
  ok("each coin in its own spot", before.slice(0, 3).every((x) => x.includes("coin for " + x.split(" => ")[0])));
  ok("7/8 coin got no wrong variety", (await p.evaluate(() => ownedCoins().find((c) => c.notes === "coin for 7/8 Tail Feathers").variety)) === "");
  // rename 7/8 spot and move it to the front
  await p.click("[data-act=editSlots]");
  const i78 = await p.evaluate(() => getAlbum("m1").slots.findIndex((s) => s.v === "7/8 Tail Feathers"));
  await p.click(`[data-act=spotEdit][data-i='${i78}']`); await p.fill("#spotV", "Seven over Eight"); await p.click("#spotEditForm button[type=submit]"); await p.waitForTimeout(100);
  const i2 = await p.evaluate(() => getAlbum("m1").slots.findIndex((s) => s.v === "Seven over Eight"));
  await p.click(`[data-act=moveSpot][data-i='${i2}'][data-d='-1']`); await p.waitForTimeout(100);
  await p.click("[data-act=editSlots]"); await p.waitForTimeout(100);
  const after = await where();
  console.log(after.join(" | "));
  ok("renamed+moved spot keeps its coin", after.some((x) => x === "Seven over Eight => coin for 7/8 Tail Feathers"));
  ok("8TF spot keeps its coin", after.some((x) => x === "8 Tail Feathers => coin for 8 Tail Feathers"));
  ok("7TF spot keeps its coin", after.some((x) => x === "7 Tail Feathers => coin for 7 Tail Feathers"));
  // removing a custom spot frees its coin to a plain spot rather than losing it
  await p.click("[data-act=editSlots]");
  const i3 = await p.evaluate(() => getAlbum("m1").slots.findIndex((s) => s.v === "Seven over Eight"));
  await p.click(`[data-act=spotEdit][data-i='${i3}']`); await p.click("#spotEditForm [data-act=deleteSpot]"); await p.waitForTimeout(150);
  ok("coin's spot link cleared after spot removed", (await p.evaluate(() => !("slotId" in ownedCoins().find((c) => c.notes === "coin for 7/8 Tail Feathers")))));
  // legacy album without ids still fills by date
  await p.evaluate(() => { put("a_old", { kind: "album", id: "old", brand: "Dansco", number: "1", name: "", typeId: "peace-dollar", start: 1921, end: 1922, removed: [], createdAt: 1, slots: [{ y: 1921, m: "" }, { y: 1922, m: "" }] }); saveCoin({ ...blankCoin(), typeId: "peace-dollar", typeName: "Peace Dollar", year: 1922, mint: "", albumId: "old", grade: "VF-20" }); });
  ok("legacy album still fills by date", (await p.evaluate(() => albumStats(getAlbum("old")).owned)) === 1);
  console.log("errors", errors); await b.close();
})();
