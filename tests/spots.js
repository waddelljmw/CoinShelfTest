const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  await p.evaluate(() => {
    const a = { kind: "album", id: "m1", brand: "Whitman", number: "9128", name: "", typeId: "morgan-dollar", start: 1878, end: 1921, removed: [], createdAt: 1 };
    a.slots = buildSlots("morgan-dollar", 1878, 1921); put("a_m1", a);
    // An existing 8TF coin in the album (from the Red Book variety picker), and a plain 1878
    saveCoin({ ...blankCoin(), id: "tf8", typeId: "morgan-dollar", typeName: "Morgan Dollar", family: "Morgan dollar", denom: "$1", year: 1878, mint: "", grade: "VF-20", variety: "8 Tail Feathers", albumId: "m1" });
    go("album-m1");
  });
  await p.waitForTimeout(200);
  const total = () => p.textContent(".stat:has-text('Owned') .v");
  console.log("before:", (await total()).trim(), "| 1878 spot holds:", (await p.textContent(".slot:has-text('1878') >> nth=0")).trim());
  await p.click("[data-act=addSpot]");
  await p.fill("#spotY", "1878"); await p.waitForTimeout(100);
  console.log("suggestions:", await p.$$eval("#spotHint button", (x) => x.map((b) => b.textContent)));
  await p.click("[data-act=pickSpotV][data-v='8 Tail Feathers']");
  await p.screenshot({ path: "/tmp/spot-add.png" });
  await p.click("#spotForm button[type=submit]"); await p.waitForTimeout(200);
  await p.click("[data-act=addSpot]"); await p.fill("#spotY", "1878"); await p.fill("#spotV", "7 over 8 tail feathers"); await p.click("#spotForm button[type=submit]"); await p.waitForTimeout(200);
  console.log("after:", (await total()).trim());
  console.log("first spots:", await p.$$eval(".album-grid .slot", (x) => x.slice(0, 5).map((e) => e.innerText.replace(/\n/g, " / "))));
  await p.screenshot({ path: "/tmp/spot-grid.png" });
  // add 7/8 coin through the spot's "I have it"
  await p.click(".slot:has-text('7 over 8')"); await p.click("[data-act=slotHave]"); await p.waitForTimeout(150);
  console.log("prefill variety:", await p.evaluate(() => [draft.variety, draft.spotVariety]));
  await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(250);
  await p.evaluate(() => go("album-m1")); await p.waitForTimeout(200);
  console.log("filled:", await p.$$eval(".album-grid .slot", (x) => x.slice(0, 5).map((e) => e.innerText.replace(/\n/g, " / "))), "| owned:", (await total()).trim());
  // duplicate spot
  await p.click("[data-act=addSpot]"); await p.fill("#spotY", "1878"); await p.fill("#spotV", "8 Tail Feathers"); await p.click("#spotForm button[type=submit]"); await p.waitForTimeout(200);
  console.log("dup toast:", await p.textContent("#toast"));
  // want from a variety spot
  await p.click("[data-act=missing]");
  await p.click("[data-missck] >> nth=0"); await p.click("[data-act=missAdd]"); await p.waitForTimeout(150);
  // edit mode: remove custom spot + undo
  await p.click("[data-act=editSlots]");
  console.log("custom spots marked added:", await p.$$eval(".slot-edit .g", (x) => x.filter((e) => e.textContent === "added").length));
  const ci = await p.evaluate(() => getAlbum("m1").slots.findIndex((s) => s.custom));
  await p.click(`[data-act=spotEdit][data-i='${ci}']`); await p.click("#spotEditForm [data-act=deleteSpot]"); await p.waitForTimeout(150);
  console.log("after remove:", await p.evaluate(() => getAlbum("m1").slots.filter((s) => s.custom).length)); await p.click("#toast button"); await p.waitForTimeout(150);
  console.log("after undo:", await p.evaluate(() => getAlbum("m1").slots.filter((s) => s.custom).length));
  console.log("errors", errors); await b.close();
})();
