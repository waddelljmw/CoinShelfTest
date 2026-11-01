// Step 1.1: saving on the device, photos, Backup and Restore (incl. moving coins out of the Claude version).
const { chromium } = require("./_compat");
const http = require("http"), fs = require("fs"), path = require("path");
const root = path.resolve(__dirname, "..");
// a tiny red JPEG-ish PNG for photos
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAEklEQVR4nGP4z8CAFTEMIgkAPfQ/wd3QmqEAAAAASUVORK5CYII=", "base64");
const srv = http.createServer((q, r) => {
  const u = q.url.split("?")[0];
  if (u.startsWith("/_blob/")) { r.setHeader("Content-Type", "image/png"); return r.end(PNG); }
  fs.readFile(path.join(root, u === "/" ? "index.html" : u), (e, d) => { if (e) { r.statusCode = 404; return r.end(); } r.end(d); });
}).listen(8771);
(async () => {
  const b = await chromium.launch();
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  const errors = [];
  // ---- A phone running the app on its own ----
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
  const p = await ctx.newPage(); p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("http://localhost:8771/"); await p.waitForTimeout(400);
  ok("starts in local mode with no practice banner", await p.evaluate(() => store.mode === "local" && document.querySelector("#banner").hidden));
  // add a coin with a photo through the form
  await p.click("#fab"); await p.fill("#typeSearch", "morgan"); await p.click("#typeList button[data-act=pickType] >> nth=0");
  await p.fill("[data-f=year]", "1881"); await p.selectOption("[data-f=mint]", "S"); await p.selectOption("[data-f=grade]", "MS-63");
  await p.setInputFiles("#photoInput", { name: "c.png", mimeType: "image/png", buffer: PNG }); await p.waitForTimeout(400);
  await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(300);
  ok("photo saved on the device", await p.evaluate(() => { const c = ownedCoins()[0]; return c && c.photos.length === 1 && !!c.photos[0].lid && localPhotoUrls.has(c.photos[0].lid); }));
  await p.evaluate(() => { const a = { kind: "album", id: "al", brand: "Whitman", number: "9128", name: "", typeId: "morgan-dollar", typeIds: ["morgan-dollar"], layout: "dates", start: 1878, end: 1891, removed: [], createdAt: 1 }; a.slots = buildAlbumSlots(a.typeIds, "dates", 1878, 1891); put("a_al", a); saveSettings({ spot: { silver: 30, gold: null, platinum: null, copper: null } }); });
  await p.waitForTimeout(200);
  // reload: everything is still there
  await p.reload(); await p.waitForTimeout(500);
  const after = await p.evaluate(() => ({ mode: store.mode, coins: ownedCoins().length, albums: albums().length, silver: settings().spot.silver, img: (() => { const c = ownedCoins()[0]; return c && !!photoSrc(c.photos[0]); })() }));
  ok("after reload: coin, album, settings and photo are still there", after.mode === "local" && after.coins === 1 && after.albums === 1 && after.silver === 30 && after.img);
  await p.evaluate(() => go("coin-" + ownedCoins()[0].id)); await p.waitForTimeout(150);
  ok("photo shows on the coin page", await p.evaluate(() => { const i = document.querySelector(".detail-photos img"); return !!i && i.complete && i.naturalWidth > 0; }));
  // Home reminds to back up
  await p.evaluate(() => go("home")); await p.waitForTimeout(100);
  ok("Home shows a backup reminder", /backup/i.test(await p.textContent("#view")));
  // Save a backup
  await p.evaluate(() => go("options")); await p.waitForTimeout(100);
  await p.click("[data-act=openBackup]");
  const [dl] = await Promise.all([p.waitForEvent("download"), p.click("[data-act=doBackup]")]);
  const file = path.join("/tmp", "cc-backup-test.json"); await dl.saveAs(file); await p.waitForTimeout(200);
  const bk = JSON.parse(fs.readFileSync(file, "utf8"));
  ok("backup file has the coin, album, settings and photo", bk.kind === "coin-cabinet-backup" && bk.docs.some((d) => d.id === "a_al") && bk.docs.some((d) => d.id === "settings") && Object.keys(bk.photos).length === 1);
  ok("backup date remembered and reminder gone", await p.evaluate(() => { go("home"); return !!settings().lastBackup && !/haven't saved a backup/.test(document.querySelector("#view").textContent); }));
  // removing a photo from a coin frees it on the next start
  await p.evaluate(async () => { const c = ownedCoins()[0]; saveCoin({ ...c, photos: [] }); await idb("photos", "readwrite", (st) => st.put(new Blob(["x"]), "p" + (Date.now() - 3 * 86400000).toString(36) + "old")); }); await p.waitForTimeout(150);
  await p.reload(); await p.waitForTimeout(500);
  ok("unused photos over a day old are cleaned up; today's are kept a day", await p.evaluate(() => localPhotoUrls.size === 1 && ![...localPhotoUrls.keys()].some((k) => k.endsWith("old"))));
  await ctx.close();
  // ---- A new phone: restore the backup ----
  const ctx2 = await b.newContext({ viewport: { width: 390, height: 844 } });
  const q = await ctx2.newPage(); q.on("pageerror", (e) => errors.push(e.message));
  await q.goto("http://localhost:8771/"); await q.waitForTimeout(400);
  await q.evaluate(() => { saveCoin({ ...blankCoin(), id: "keep", typeId: "peace-dollar", typeName: "Peace Dollar", year: 1922, grade: "VF-20" }); go("options"); });
  await q.waitForTimeout(150); await q.click("[data-act=openBackup]");
  await q.setInputFiles("#restoreFile", file); await q.waitForTimeout(300);
  ok("asks before restoring", /Restore this backup/.test(await q.textContent("#sheet")));
  await q.click("[data-act=confirmOk]"); await q.waitForTimeout(800);
  const r = await q.evaluate(() => ({ coins: ownedCoins().length, kept: !!getCoin("keep"), album: !!getAlbum("al"), photo: (() => { const c = ownedCoins().find((x) => x.id !== "keep"); return c && c.photos[0] && !!c.photos[0].lid && !!photoSrc(c.photos[0]); })(), silver: settings().spot.silver }));
  ok("restore adds the backup and keeps what was here", r.coins === 2 && r.kept && r.album && r.silver === 30);
  ok("restored photo works on the new phone", r.photo);
  await q.reload(); await q.waitForTimeout(500);
  ok("restored data survives a reload", await q.evaluate(() => ownedCoins().length === 2 && !!getAlbum("al")));
  // bad file
  await q.evaluate(() => { go("options"); }); await q.waitForTimeout(80); await q.click("[data-act=openBackup]");
  fs.writeFileSync("/tmp/cc-bad.json", "{\"hello\":1}"); await q.setInputFiles("#restoreFile", "/tmp/cc-bad.json"); await q.waitForTimeout(200);
  ok("a wrong file is refused", /isn't a Coin Cabinet backup/.test(await q.textContent("#restoreMsg")));
  await ctx2.close();
  // ---- The Claude version: "move my data out" with photos stored by Claude ----
  const ctx3 = await b.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
  const c = await ctx3.newPage(); c.on("pageerror", (e) => errors.push(e.message));
  await c.addInitScript(() => {
    const docs = new Map();
    const coll = { onSnapshot: (fn) => { const fire = () => fn({ metadata: { fromCache: false }, docs: [...docs].map(([id, v]) => ({ id, exists: true, data: () => v })) }); coll._fire = fire; setTimeout(fire, 10); return () => {}; },
      doc: (id) => ({ set: async (v) => { docs.set(id, v); }, delete: async () => { docs.delete(id); } }) };
    window.__saved = null;
    window.claude = { use: async (n) => n === "db" ? { collection: () => coll } : n === "user" ? { id: async () => "u1" } : n === "downloads" ? { save: async (o) => { window.__saved = o; return { status: "saved" }; } } : n === "assets" ? { upload: async () => ({ id: "new" + Math.random() }) } : null };
  });
  await c.goto("http://localhost:8771/"); await c.waitForTimeout(400);
  await c.evaluate(() => { saveCoin({ ...blankCoin(), id: "cl", typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1880, mint: "S", grade: "MS-64", photos: [{ id: "abc" }] }); go("options"); });
  await c.waitForTimeout(150);
  ok("Claude version explains moving to the phone app", /move your coins into the Coin Cabinet app/.test(await c.textContent("#view")));
  await c.click("[data-act=openBackup]"); await c.click("[data-act=doBackup]"); await c.waitForTimeout(600);
  const cb = await c.evaluate(() => window.__saved && JSON.parse(window.__saved.data));
  ok("Claude backup includes the Claude-stored photo", cb && cb.photos["id:abc"] && cb.docs.some((d) => d.id === "c_cl"));
  fs.writeFileSync("/tmp/cc-claude.json", JSON.stringify(cb));
  await ctx3.close();
  const ctx4 = await b.newContext({ viewport: { width: 390, height: 844 } });
  const d = await ctx4.newPage(); d.on("pageerror", (e) => errors.push(e.message));
  await d.goto("http://localhost:8771/"); await d.waitForTimeout(400);
  await d.evaluate(() => go("options")); await d.waitForTimeout(80); await d.click("[data-act=openBackup]");
  await d.setInputFiles("#restoreFile", "/tmp/cc-claude.json"); await d.waitForTimeout(200); await d.click("[data-act=confirmOk]"); await d.waitForTimeout(800);
  ok("Claude coins move into the phone app with their photo", await d.evaluate(() => { const c = getCoin("cl"); return c && c.photos.length === 1 && !!c.photos[0].lid && !!photoSrc(c.photos[0]); }));
  await ctx4.close();
  ok("no page errors", errors.length === 0); if (errors.length) console.log(errors);
  await b.close(); srv.close();
})();
