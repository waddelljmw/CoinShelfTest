const { chromium } = require("./_compat");
let fails = 0; const ok = (n, c) => { console.log((c ? "PASS " : "FAIL ") + n); if (!c) fails++; };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  const url = "file://" + require("path").resolve(__dirname, "../index.html");
  await p.goto(url); await p.waitForTimeout(900);
  // sticky save bar
  await p.evaluate(() => openCoinForm(null)); await p.waitForTimeout(100);
  ok("Save button sticks to the bottom", await p.evaluate(() => getComputedStyle(document.querySelector("#coinForm > .btn-row:last-child")).position === "sticky"));
  await p.evaluate(() => closeSheet());
  // back after delete / sell lands on the album
  await p.evaluate(() => {
    const a = { kind: "album", id: "alb1", brand: "Dansco", number: "7178", name: "", typeId: "peace-dollar", start: 1921, end: 1935, removed: [], createdAt: 1 };
    a.slots = buildSlots("peace-dollar", 1921, 1935); put("a_alb1", a);
    saveCoin({ ...blankCoin(), id: "own1", typeId: "peace-dollar", typeName: "Peace Dollar", family: "Peace dollar", denom: "$1", year: 1922, mint: "", grade: "AU-50", albumId: "alb1" });
    go("album-alb1");
  }); await p.waitForTimeout(150);
  await p.click(".slot.have"); await p.click(".sheet [data-go^=coin-]"); await p.waitForTimeout(200);
  await p.evaluate(() => actions.delete({ dataset: { id: "own1" } })); await p.waitForTimeout(200);
  ok("delete returns to the album", (await p.evaluate(() => location.hash)) === "#album-alb1");
  // new album: gray name, search box, inherited
  await p.evaluate(() => openNewAlbum()); await p.waitForTimeout(100);
  await p.fill("#albumTypeFind", "Franklin Half Dollar"); await p.dispatchEvent("#albumTypeFind", "change");
  ok("search picks the coin type", await p.evaluate(() => document.querySelector("#albumTypes select").value.startsWith("franklin")));
  ok("name stays empty with a gray suggestion", await p.evaluate(() => { const n = document.querySelector("#albumForm [name=name]"); return n.value === "" && /Franklin/.test(n.placeholder); }));
  await p.check("#albumForm [name=inherited]");
  await p.click("#albumForm button[type=submit]"); await p.waitForTimeout(200);
  const al = await p.evaluate(() => albums().find((a) => a.id !== "alb1"));
  ok("album saved as inherited with no typed name", al && al.inherited === true && al.name === "");
  // coin from an inherited album starts Inherited
  await p.evaluate((id) => { const a = withSlotIds(getAlbum(id)); const s = a.slots[0]; slotHave({ dataset: { album: id, id: s.id, y: s.y, m: s.m || "" } }); }, al.id).catch(() => {});
  // what's new
  await p.evaluate(() => { closeSheet(); saveSettings({ seenVersion: "0.40.1" }); maybeShowWhatsNew(); }); await p.waitForTimeout(100);
  ok("what's new shows once after an update", await p.evaluate(() => /What's new/.test(document.getElementById("sheet").textContent)));
  ok("and is remembered", await p.evaluate(() => settings().seenVersion === APP_VERSION));
  ok("no page errors", errors.length === 0); if (errors.length) console.log(errors);
  await b.close(); process.exit(fails ? 1 : 0);
})();
