const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  await p.evaluate(() => {
    const a = { kind: "album", id: "m1", brand: "Whitman", number: "9128", name: "", typeId: "morgan-dollar", start: 1878, end: 1921, removed: [], createdAt: 1 };
    a.slots = buildSlots("morgan-dollar", 1878, 1921); put("a_m1", a); go("album-m1");
  });
  await p.waitForTimeout(200);
  const first = () => p.evaluate(() => getAlbum("m1").slots.slice(0, 7).map((s) => slotLabel(s) + (s.v ? " " + s.v : "")));
  // add the two 1878 variety spots
  for (const v of ["8 Tail Feathers", "7 over 8 Tail Feathers"]) { await p.click("[data-act=addSpot]"); await p.fill("#spotY", "1878"); await p.fill("#spotV", v); await p.click("#spotForm button[type=submit]"); await p.waitForTimeout(150); }
  console.log("after adding (end of 1878):", await first());
  await p.click("[data-act=editSlots]");
  // rename plain 1878 → 7 Tail Feathers
  await p.click("[data-act=spotEdit][data-i='0']"); await p.fill("#spotV", "7 Tail Feathers"); await p.click("#spotEditForm button[type=submit]"); await p.waitForTimeout(150);
  // move 8TF (now index 3) to the front: three ◀
  const moveLeft = async (label) => { const i = await p.evaluate((l) => getAlbum("m1").slots.findIndex((s) => s.v === l), label); await p.click(`[data-act=moveSpot][data-i='${i}'][data-d='-1']`); await p.waitForTimeout(80); };
  await moveLeft("8 Tail Feathers"); await moveLeft("8 Tail Feathers"); await moveLeft("8 Tail Feathers");
  await moveLeft("7 over 8 Tail Feathers"); await moveLeft("7 over 8 Tail Feathers");
  console.log("arranged:", await first());
  console.log("1878 first ◀ disabled:", await p.isDisabled("[data-act=moveSpot][data-i='0'][data-d='-1']"), "| last 1878 ▶ disabled:", await p.isDisabled("[data-act=moveSpot][data-i='4'][data-d='1']"), "| 1879 ◀ disabled:", await p.isDisabled("[data-act=moveSpot][data-i='5'][data-d='-1']"));
  // try to move across a year by calling the action directly → ignored
  await p.evaluate(() => actions.moveSpot({ dataset: { id: "m1", i: "4", d: "1" } }));
  console.log("cross-year blocked:", (await first())[4], (await first())[5]);
  await p.screenshot({ path: "/tmp/order-edit.png" });
  // hide 1878-S from its sheet
  await p.click("[data-act=spotEdit][data-i='4']"); await p.click("#spotEditForm [data-act=toggleSlot]"); await p.waitForTimeout(100);
  await p.click("[data-act=editSlots]"); await p.waitForTimeout(150);
  console.log("view order:", await p.$$eval(".album-grid .slot", (x) => x.slice(0, 6).map((e) => e.innerText.split("\n").slice(0, 2).join(" "))));
  // adding a 1879 spot later goes to the end of 1879, keeps 1878 order
  await p.click("[data-act=addSpot]"); await p.fill("#spotY", "1879"); await p.fill("#spotV", "Reverse of 1878"); await p.selectOption("#spotM", "S"); await p.click("#spotForm button[type=submit]"); await p.waitForTimeout(150);
  console.log("after adding 1879-S spot:", await p.evaluate(() => getAlbum("m1").slots.slice(0, 11).map((s) => slotLabel(s) + (s.v ? " " + s.v : ""))));
  // coins fill renamed spots
  await p.evaluate(() => {
    const mk = (o) => saveCoin({ ...blankCoin(), typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1878, mint: "", grade: "VF-20", albumId: "m1", ...o });
    mk({ variety: "8 Tail Feathers" }); mk({ variety: "7 Tail Feathers, Reverse of 1878" }); mk({ variety: "7 Over 8 Tail Feathers, Weak" });
  });
  await p.waitForTimeout(150);
  console.log("filled:", await p.$$eval(".album-grid .slot", (x) => x.slice(0, 3).map((e) => e.innerText.replace(/\n/g, " / "))));
  console.log("errors", errors); await b.close();
})();
