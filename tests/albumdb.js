const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  // every database entry builds a valid album
  const bad = await p.evaluate(() => {
    const out = [];
    for (const k of Object.keys(ALBUM_DB)) {
      const [br, num] = k.split("|"); const i = lookupAlbum(br, num);
      if (!i) { out.push(k + " missing"); continue; }
      const prob = albumProblem(i.types, "dates", i.start, i.end);
      const sl = buildAlbumSlots(i.types, "dates", i.start, i.end, lookupProofs(i));
      const keys = sl.map(slotKey);
      if (prob) out.push(k + ": " + prob);
      else if (!sl.length) out.push(k + " has no spots");
      else if (new Set(keys).size !== keys.length) out.push(k + " duplicate spots");
    }
    return out;
  });
  ok("all " + (await p.evaluate(() => Object.keys(ALBUM_DB).length)) + " database albums build cleanly", bad.length === 0); if (bad.length) console.log(bad);
  // New album form: type Whitman 9122
  await p.evaluate(() => go("albums")); await p.waitForTimeout(100); await p.click("[data-act=newAlbum]");
  await p.selectOption("#albumForm [name=brand]", "Whitman"); await p.fill("#albumForm [name=number]", "9122"); await p.waitForTimeout(100);
  const f = await p.evaluate(() => ({ name: document.querySelector("#albumForm [name=name]").value, types: [...document.querySelectorAll("#albumTypes select")].map((s) => s.value), start: document.querySelector("#albumStart").value, end: document.querySelector("#albumEnd").value, proofs: document.querySelector("#albumForm [name=proofs]").value, hint: document.querySelector("#albumLookupHint").textContent }));
  ok("9122 fills name, both types, 1932–1990, S proofs", f.name === "Washington Quarters 1932–1990" && f.types.join() === "washington-silver,washington-clad" && f.start === "1932" && f.end === "1990" && f.proofs === "s");
  console.log(f.hint.replace(/\s+/g, " ").trim());
  await p.click("#albumForm button[type=submit]"); await p.waitForTimeout(200);
  const a = await p.evaluate(() => { const a = albums().find((x) => x.number === "9122"); const sl = a.slots; return { name: a.name, types: a.typeIds, pf: sl.filter((s) => s.pf).length, y1965: sl.some((s) => s.y === 1965), y1991: sl.some((s) => s.y > 1990), y1933: sl.some((s) => s.y === 1933) }; });
  ok("album created with clad spots and S proofs, nothing past 1990", a.types.length === 2 && a.pf > 0 && a.y1965 && !a.y1991 && !a.y1933);
  // typing an unknown number clears the hint and keeps your entries
  await p.evaluate(() => go("albums")); await p.waitForTimeout(100); await p.click("[data-act=newAlbum]");
  await p.fill("#albumForm [name=number]", "9999"); await p.waitForTimeout(80);
  ok("unknown number: no hint", (await p.textContent("#albumLookupHint")).trim() === "");
  // typed name is not overwritten
  await p.fill("#albumForm [name=name]", "Grandpa's quarters"); await p.fill("#albumForm [name=number]", "9123"); await p.waitForTimeout(80);
  ok("your own album name is kept", await p.evaluate(() => document.querySelector("#albumForm [name=name]").value === "Grandpa's quarters"));
  ok("9123 sets clad type and 1991–1998", await p.evaluate(() => document.querySelector("#albumStart").value === "1991" && document.querySelector("#albumEnd").value === "1998"));
  // Dansco "to date" and brand change
  await p.selectOption("#albumForm [name=brand]", "Dansco"); await p.fill("#albumForm [name=number]", "7104"); await p.waitForTimeout(80);
  ok("Dansco 7104 runs to date", await p.evaluate(() => document.querySelector("#albumStart").value === "2010" && +document.querySelector("#albumEnd").value >= 2026));
  await p.fill("#albumForm [name=number]", "7100"); await p.waitForTimeout(80);
  ok("Dansco 7100 has 4 Lincoln types", await p.evaluate(() => document.querySelectorAll("#albumTypes select").length === 4));
  // proofs unavailable → no proof spots, hint says so
  await p.fill("#albumForm [name=number]", "8166"); await p.waitForTimeout(80);
  const t = await p.evaluate(() => ({ pf: document.querySelector("#albumForm [name=proofs]").value, hint: document.querySelector("#albumLookupHint").textContent }));
  ok("proofs not available for Kennedy yet: select stays None and hint says so", t.pf === "" && /proof dates/.test(t.hint));
  await p.evaluate(() => closeSheet());
  // Edit album on an existing album: lookup is offered, not forced
  await p.evaluate(() => { const a = { kind: "album", id: "old", brand: "Whitman", number: "", name: "Mine", typeId: "washington-silver", start: 1932, end: 1964, removed: [], createdAt: 1 }; a.slots = buildSlots("washington-silver", 1932, 1964); put("a_old", a); go("album-old"); });
  await p.waitForTimeout(100); await p.click("[data-act=editAlbum]"); await p.fill("#editAlbumForm [name=number]", "9122"); await p.waitForTimeout(80);
  ok("edit form shows Use these coin types button, doesn't change anything", (await p.$("[data-act=albumApplyDb]")) !== null && await p.evaluate(() => document.querySelectorAll("#albumTypes select").length === 1));
  await p.click("[data-act=albumApplyDb]"); console.log("after apply:", await p.evaluate(() => JSON.stringify({ n: document.querySelectorAll("#albumTypes select").length, end: document.querySelector("#editAlbumForm [name=end]").value, toast: document.querySelector("#toast").textContent }))); await p.click("#editAlbumForm button[type=submit]"); await p.waitForTimeout(200); console.log("toast:", await p.textContent("#toast"));
  console.log(await p.evaluate(() => JSON.stringify((({ typeIds, end, name, number, proofs }) => ({ typeIds, end, name, number, proofs }))(getAlbum("old"))))); ok("applied: both types and 1932–1990, name kept", await p.evaluate(() => { const a = getAlbum("old"); return a.typeIds.length === 2 && a.end === 1990 && a.name === "Mine" && a.number === "9122"; }));
  // album created from the Add coin form uses the lookup
  await p.evaluate(() => closeSheet()); await p.click("#fab"); await p.fill("#typeSearch", "morgan"); await p.click("#typeList button[data-act=pickType] >> nth=0");
  await p.fill("[data-f=year]", "1881"); await p.selectOption("[data-f=grade]", "VF-20"); await p.selectOption("[data-f=albumId]", "__new");
  await p.selectOption("[data-na=brand]", "Whitman"); await p.fill("[data-na=number]", "9128"); await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(250);
  ok("new album from coin form: Morgan 1878–1891 from the lookup", await p.evaluate(() => { const a = albums().find((x) => x.number === "9128"); return a && a.name.startsWith("Morgan Dollars") && a.end === 1891 && !a.slots.some((s) => s.y > 1891); }));
  ok("no page errors", errors.length === 0); if (errors.length) console.log(errors);
  await b.close();
})();
(async () => {
  const { chromium } = require("playwright");
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  const r = await p.evaluate(() => ({ a: lookupAlbum("Littleton", "4"), b: lookupAlbum("Littleton", "lca4"), c: lookupAlbum("Littleton", "LCA 15A"), sba: buildSlots("sba-dollar", 1979, 1999).map((s) => s.y + (s.m || "")).join(",") }));
  ok("Littleton '4', 'lca4' and 'LCA4' all find LCA4", r.a && r.b && r.a.number === "LCA4" && r.b.number === "LCA4");
  ok("Littleton LCA 15A (with a space) found", !!r.c);
  ok("SBA dollars: only 1979–81 and 1999", r.sba === "1979,1979D,1979S,1980,1980D,1980S,1981,1981D,1981S,1999,1999D");
  await b.close();
})();
