const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  // Fix 7
  const w = await p.evaluate(() => buildSlots("washington-silver", 1932, 1936).map((s) => s.y + s.m));
  ok("no 1933 Washington spots", !w.some((x) => x.startsWith("1933")));
  ok("1932-S present, 1934-S absent", w.includes("1932S") && !w.includes("1934S"));
  // Fix 6
  await p.evaluate(() => {
    const a = { kind: "album", id: "e1", brand: "Whitman", number: "1", name: "Old", typeId: "morgan-dollar", start: 1878, end: 1880, removed: ["1879|O"], createdAt: 1 };
    a.slots = buildSlots(a.typeId, 1878, 1880); a.slots.push({ id: "cust1", y: 1878, m: "", v: "VAM 9", custom: true });
    put("a_e1", a); go("album-e1");
  });
  await p.waitForTimeout(200);
  const before = await p.evaluate(() => getAlbum("e1").slots.find((s) => s.y === 1880 && !s.custom).id);
  await p.click("[data-act=editAlbum]"); await p.fill("#editAlbumForm [name=name]", "Morgans");
  await p.fill("#editAlbumForm [name=start]", "1878"); await p.fill("#editAlbumForm [name=end]", "1882");
  await p.click("#editAlbumForm button[type=submit]"); await p.waitForTimeout(200);
  const a = await p.evaluate(() => getAlbum("e1"));
  ok("name saved", a.name === "Morgans" && a.end === 1882);
  ok("custom spot kept", a.slots.some((s) => s.id === "cust1"));
  ok("removed kept", a.removed.includes("1879|O"));
  ok("existing spot id kept", a.slots.some((s) => s.id === before));
  ok("new years added", a.slots.some((s) => s.y === 1882));
  ok("no duplicate spots", new Set(a.slots.map((s) => s.y + "|" + s.m + "|" + (s.v || ""))).size === a.slots.length);
  ok("chronological", a.slots.every((s, i) => i === 0 || a.slots[i - 1].y <= s.y));
  await p.evaluate(() => { saveEditAlbum(Object.assign(document.createElement("form"), {})) }).catch(() => {});
  await p.click("[data-act=editAlbum]"); await p.fill("#editAlbumForm [name=start]", "1879");
  await p.click("#editAlbumForm button[type=submit]"); await p.waitForTimeout(200);
  const a2 = await p.evaluate(() => getAlbum("e1"));
  ok("shrink drops standard 1878 spots but keeps custom", !a2.slots.some((s) => s.y === 1878 && !s.custom) && a2.slots.some((s) => s.id === "cust1"));
  ok("no page errors", errors.length === 0); if (errors.length) console.log(errors);
  await b.close();
})();
