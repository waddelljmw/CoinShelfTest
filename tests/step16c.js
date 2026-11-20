const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(400);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  // 123 pop-up time
  await p.evaluate(() => toast("Saved.")); 
  ok("plain message shows", await p.evaluate(() => !document.getElementById("toast").hidden));
  await p.waitForTimeout(1900);
  ok("plain message gone by 1.9s", await p.evaluate(() => document.getElementById("toast").hidden));
  await p.evaluate(() => toast("Removed.", { label: "Undo", fn: () => {} }));
  await p.waitForTimeout(3000);
  ok("Undo message still there at 3s", await p.evaluate(() => !document.getElementById("toast").hidden));
  await p.waitForTimeout(2800);
  ok("Undo message gone by 5.8s", await p.evaluate(() => document.getElementById("toast").hidden));
  ok("toastMs grows with long text", await p.evaluate(() => toastMs("x".repeat(160), false) > 3000 && toastMs("hi", false) === 1500));
  // 119 + 26 hints
  await p.evaluate(() => { settings().optOpen = {}; go("options"); }); await p.waitForTimeout(500);
  const t = await p.evaluate(() => document.body.innerHTML);
  ok("CSV hint", /Import takes a spreadsheet saved as CSV/.test(t));
  ok("restore hint", /Restore takes a Coin Cabinet backup file/.test(t));
  await p.waitForTimeout(400);
  ok("space note filled", /Room used on this device/.test(await p.evaluate(() => document.getElementById("spaceMsg").textContent)));
  // 122 empty spot while selecting
  await p.evaluate(() => {
    const a = { kind: "album", id: "a1", brand: "Whitman", number: "9128", name: "", typeId: "morgan-dollar", start: 1880, end: 1881, removed: [], createdAt: 1 };
    a.slots = buildSlots(a.typeId, 1880, 1881); put("a_a1", a); withSlotIds(a);
    const s = getAlbum("a1").slots.find((x) => x.m === "S");
    saveCoin({ ...blankCoin(), id: "s1", typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1880, mint: "S", grade: "VF-20", albumId: "a1", slotId: s.id });
    go("album-a1");
  });
  await p.waitForTimeout(400);
  await p.evaluate(() => { listState.sel = new Set(); render(); });
  await p.waitForTimeout(200);
  await p.click(".slot.dim", { force: true }); await p.waitForTimeout(200);
  ok("empty spot explains itself", /nothing to select/.test(await p.textContent("#toast")));
  ok("no page errors", errors.length === 0);
  await b.close();
})();
