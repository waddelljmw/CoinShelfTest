const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  // Whitman 9122 after the clad type was added (your setup)
  await p.evaluate(() => {
    const a = { kind: "album", id: "w", brand: "Whitman", number: "9122", name: "", typeId: "washington-silver", typeIds: ["washington-silver", "washington-clad"], layout: "dates", start: 1932, end: 1990, removed: [], createdAt: 1 };
    a.slots = buildAlbumSlots(a.typeIds, "dates", 1932, 1990); put("a_w", a);
    saveCoin({ ...blankCoin(), id: "c70", typeId: "washington-clad", typeName: "Washington Quarter", denom: "25C", year: 1970, mint: "D", grade: "MS-63", albumId: "w" });
    go("album-w");
  });
  await p.waitForTimeout(150);
  const n0 = await p.evaluate(() => getAlbum("w").slots.length);
  await p.click("[data-act=editAlbum]"); await p.selectOption("#editAlbumForm [name=proofs]", "all"); await p.click("#editAlbumForm button[type=submit]"); await p.waitForTimeout(200);
  const r = await p.evaluate(() => { const a = getAlbum("w"); const pf = a.slots.filter((s) => s.pf); return { n: a.slots.length, pf: pf.map((s) => s.y + s.m), owned: albumStats(a).owned }; });
  ok("proof spots added", r.n > n0 && r.pf.length > 0);
  ok("1970-S proof spot exists, S mint after 1968", r.pf.includes("1970S") && r.pf.filter((x) => +x.slice(0, 4) >= 1968).every((x) => x.endsWith("S")));
  ok("pre-1968 proofs are Philadelphia (no mint mark)", r.pf.includes("1950") && !r.pf.includes("1950S"));
  ok("no proof spots outside 1932–1990", r.pf.every((x) => +x.slice(0, 4) <= 1990));
  ok("existing coin still in its spot", r.owned === 1);
  console.log(r.pf.length, "proof spots:", r.pf.slice(0, 6).join(" "), "…");
  ok("grid labels the proof spots", (await p.textContent('.slot:has-text("1970-S Proof")')).includes("Proof"));
  // add coin from a proof spot: must be a PR grade
  await p.click('.slot:has-text("1970-S Proof")'); await p.click("[data-act=slotHave]"); await p.waitForTimeout(150);
  const noMS = await p.evaluate(() => draft._proof && ![...document.querySelectorAll("[data-f=grade] option")].some((o) => o.value === "MS-65")); await p.evaluate(() => { draft.grade = "MS-65"; }); await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(150); console.log(noMS ? "PASS proof spot opens with Proof ticked" : "FAIL proof spot opens with Proof ticked");
  ok("non-proof grade blocked in a proof spot", await p.evaluate(() => allCoins().length === 1 && !!draft));
  await p.check("[data-act=toggleProof]"); await p.waitForTimeout(60); await p.selectOption("[data-f=grade]", "PR-67"); await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(200);
  const st = await p.evaluate(() => { const a = getAlbum("w"); const s = albumStats(a); const pfk = a.slots.find((x) => x.pf && x.y === 1970).id; return { owned: s.owned, inPf: [...s.filled.entries()].some(([k, c]) => k.endsWith("|PF") && c.grade === "PR-67") }; });
  ok("PR-67 1970-S fills the proof spot", st.inPf && st.owned === 2);
  // a proof coin doesn't fill a regular spot; a regular 1976-S doesn't fill the 1976-S proof spot
  await p.evaluate(() => { saveCoin({ ...blankCoin(), id: "c76", typeId: "washington-clad", typeName: "Washington Quarter", year: 1976, mint: "S", grade: "MS-65", albumId: "w" }); });
  await p.waitForTimeout(100);
  ok("regular 1976-S fills regular spot, not proof", await p.evaluate(() => { const st = albumStats(getAlbum("w")); return st.filled.get("1976|S") && st.filled.get("1976|S").id === "c76" && !st.filled.get("1976|S|PF"); }));
  // wants: proof spot want separate from regular
  await p.click('.slot:has-text("1971-S Proof")'); await p.click("[data-act=slotWant]"); await p.waitForTimeout(100); await p.click("[data-act=slotWantAdd]"); await p.waitForTimeout(150);
  ok("proof want saved as proof", await p.evaluate(() => wants().some((w) => w.year === 1971 && w.mint === "S" && w.pf)));
  ok("proof want label says Proof", await p.evaluate(() => /Proof/.test(wantLabel(wants().find((w) => w.pf)))));
  // turning proofs off drops empty proof spots but keeps filled coin listed
  await p.click("[data-act=editAlbum]"); await p.selectOption("#editAlbumForm [name=proofs]", ""); await p.click("#editAlbumForm button[type=submit]"); await p.waitForTimeout(200);
  ok("proof spots removed when switched off", await p.evaluate(() => !getAlbum("w").slots.some((s) => s.pf && !s.custom)));
  // new album with proofs from the form
  await p.evaluate(() => go("albums")); await p.waitForTimeout(100); await p.click("[data-act=newAlbum]");
  await p.selectOption("#albumTypes select >> nth=0", "franklin-half"); await p.selectOption("#albumForm [name=proofs]", "all"); await p.click("#albumForm button[type=submit]"); await p.waitForTimeout(200);
  ok("new Franklin album has proof spots", await p.evaluate(() => { const a = albums().find((x) => x.typeId === "franklin-half"); return a.proofs && a.slots.some((s) => s.pf && s.y === 1955); }));
  ok("no page errors", errors.length === 0); if (errors.length) console.log(errors);
  await b.close();
})();
(async () => {
  const { chromium } = require("playwright");
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  await p.evaluate(() => { const a = { kind: "album", id: "w", brand: "Whitman", number: "9122", name: "", typeId: "washington-silver", typeIds: ["washington-silver", "washington-clad"], layout: "dates", start: 1932, end: 1990, removed: [], createdAt: 1 }; a.slots = buildAlbumSlots(a.typeIds, "dates", 1932, 1990); put("a_w", a); go("album-w"); });
  await p.waitForTimeout(150);
  await p.click("[data-act=editAlbum]"); await p.selectOption("#editAlbumForm [name=proofs]", "s"); await p.click("#editAlbumForm button[type=submit]"); await p.waitForTimeout(200);
  const pf = await p.evaluate(() => getAlbum("w").slots.filter((s) => s.pf).map((s) => s.y + s.m));
  ok("S-only: proofs 1968–1990, all S", pf.length > 0 && pf.every((x) => x.endsWith("S") && +x.slice(0, 4) >= 1968));
  console.log("S proofs:", pf.length, pf[0], "…", pf[pf.length - 1]);
  await p.click("[data-act=editAlbum]"); await p.selectOption("#editAlbumForm [name=proofs]", "all"); await p.click("#editAlbumForm button[type=submit]"); await p.waitForTimeout(200);
  ok("switching to All adds the Philadelphia proofs once", await p.evaluate(() => { const ss = getAlbum("w").slots.filter((s) => s.pf); return ss.some((s) => s.y === 1950) && ss.length === new Set(ss.map(slotKey)).size; }));
  await b.close();
})();
