// Step 9.3c: one coin on several want lists, "wanted ×N", missing-to-list, upgrade, album wish list.
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const check = (name, ok) => console.log((ok ? "ok " : "FAIL ") + name);

  await p.evaluate(() => {
    const a = { kind: "album", id: "m1", brand: "Whitman", number: "9128", name: "", typeId: "morgan-dollar", start: 1878, end: 1921, removed: [], createdAt: 1 };
    a.slots = buildSlots("morgan-dollar", 1878, 1921); put("a_m1", a);
    ensureDefaultList();
    saveWantList({ kind: "wantlist", id: "l2", name: "Birthday ideas", scope: "any", createdAt: 5 });
    // an old-style want (one list only) still reads fine
    saveWant(newWant({ typeId: "morgan-dollar", year: 1881, mint: "S", albumId: "m1" }));
    saveWant(newWant({ typeId: "morgan-dollar", year: 1881, mint: "S", listId: "l2", grade: "MS-65", albumId: "m1" }));
    go("album-m1");
  });
  await p.waitForTimeout(200);
  check("album spot shows wanted ×2", (await p.textContent(".slot:has-text('1881')")).includes("wanted ×2") || (await p.$$eval(".slot", (x) => x.some((e) => e.textContent.includes("wanted ×2")))));
  check("wantsFor finds every list", await p.evaluate(() => wantsFor("morgan-dollar", 1881, "S", "", false).length === 2));
  check("R4-1: this album counts only its own wants (not the other album's)", await p.evaluate(() => { const a = getAlbum("m1"); const s = albumStats(a).slots.find((x) => x.y === 1881 && x.m === "S"); return spotWants(a, s).length === 2; }));

  // want list page shows the tag and which lists
  await p.evaluate(() => go((winState.tab = "lists", "wants"))); await p.waitForTimeout(150);
  check("want row has ×2 tag", (await p.textContent("main")).includes("wanted ×2"));
  await p.click("[data-act=wantWhere] >> nth=0"); await p.waitForTimeout(100);
  const sheet = await p.textContent(".sheet");
  check("tag lists both lists", sheet.includes("General") && sheet.includes("Birthday ideas") && sheet.includes("MS-65"));
  await p.click("[data-act=closeSheet] >> nth=0");

  // missing picker suggests a new list named for the type and album, then creates it
  await p.evaluate(() => openMissingPicker("m1")); await p.waitForTimeout(100);
  const opt = await p.$eval("#missListPick", (s) => s.options[s.selectedIndex].textContent);
  check("suggested new list name", /Morgan Dollar – Missing from Whitman 9128/.test(opt));
  await p.click("[data-act=missAll]"); await p.waitForTimeout(100);
  check("1881-S is tickable (only on other lists)", await p.evaluate(() => missingPick.chosen.size > 90));
  await p.click("[data-act=missAdd]"); await p.waitForTimeout(150);
  const made = await p.evaluate(() => ({ lists: wantLists().map((l) => l.name), n: wantsIn(wantLists().find((l) => /Missing from/.test(l.name)).id).length, scope: wantLists().find((l) => /Missing from/.test(l.name)).scope }));
  check("new list created, type-scoped", made.lists.some((n) => /Missing from/.test(n)) && made.scope === "type" && made.n > 90);
  // second time: the existing list is suggested, not a duplicate
  await p.evaluate(() => openMissingPicker("m1")); await p.waitForTimeout(100);
  check("existing list reused", await p.evaluate(() => wantLists().filter((l) => /Missing from/.test(l.name)).length === 1 && missingPick.listId !== "__auto"));
  // idea 99: a second album of the same coin type gets its own new list, not the first album's
  await p.evaluate(() => { const a = { kind: "album", id: "m2", brand: "Inherited", number: "", name: "Morgan 1878-1886", typeId: "morgan-dollar", start: 1878, end: 1886, removed: [], createdAt: 3 }; a.slots = buildSlots("morgan-dollar", 1878, 1886); put("a_m2", a); });
  await p.click("[data-act=closeSheet] >> nth=0");
  await p.evaluate(() => openMissingPicker("m2")); await p.waitForTimeout(100);
  check("99: second Morgan album suggests its own new list", await p.evaluate(() => missingPick.listId === "__auto" && /Missing from/.test(missingSuggest(getAlbum("m2")).name) && missingSuggest(getAlbum("m2")).name !== missingSuggest(getAlbum("m1")).name));
  await p.click("[data-act=closeSheet] >> nth=0");

  // upgrade on a filled spot
  await p.evaluate(() => {
    const c = { kind: "coin", id: "c1", status: "owned", typeId: "morgan-dollar", typeName: "Morgan Dollar", denom: "$1", year: 1884, mint: "O", grade: "MS-63", gradeMode: "raw", albumId: "m1", paid: 20, qty: 1, createdAt: 2 };
    put("c_c1", c); go("album-m1");
  });
  await p.waitForTimeout(200);
  await p.click(".slot.have:has-text('1884')");
  check("upgrade button offers next grade", (await p.textContent(".sheet")).includes("Want an upgrade (above MS-63)"));
  await p.click("[data-upgrade]"); await p.waitForTimeout(100);
  check("picker says target MS-64", (await p.textContent(".sheet")).includes("MS-64"));
  await p.click("[data-act=slotWantAdd]"); await p.waitForTimeout(100);
  check("upgrade want saved with MS-64", await p.evaluate(() => wants().some((w) => w.year === 1884 && w.mint === "O" && w.grade === "MS-64")));
  check("upgradeGrade edges", await p.evaluate(() => upgradeGrade({ grade: "MS-70" }) === "" && upgradeGrade({ grade: "PR-70" }) === "" && upgradeGrade({ grade: "AU-58" }) === "MS-60" && upgradeGrade({ grade: "XF-45" }) === "AU-50"));

  // album wish list
  await p.evaluate(() => go((winState.tab = "lists", "wants"))); await p.waitForTimeout(150);
  await p.click("[data-act=awNew]");
  await p.selectOption("#awForm [name=brand]", "Dansco"); await p.fill("#awForm [name=number]", "7070");
  await p.fill("#awForm [name=name]", "Lincoln Cents");
  await p.click("#awForm button[type=submit]"); await p.waitForTimeout(150);
  check("wish list shows album", (await p.textContent("main")).includes("Dansco No. 7070 Lincoln Cents"));
  check("saved as aw_ record", await p.evaluate(() => albumWants().length === 1 && [...store.docs.keys()].some((k) => k.startsWith("aw_"))));
  await p.click("[data-act=awGot]"); await p.waitForTimeout(150);
  check("Got it fills New album", await p.evaluate(() => document.querySelector("#albumForm [name=number]").value === "7070" && document.querySelector("#albumForm [name=brand]").value === "Dansco"));
  check("Got it takes it off the wish list", await p.evaluate(() => albumWants().length === 0));
  console.log("errors", errors); { const rr = await p.evaluate(() => {
    const mk = (l, al) => saveWant(newWant({ typeId: "morgan-dollar", year: 1885, mint: "S", listId: l, albumId: al }));
    const a = getAlbum("m1"), s = albumStats(a).slots.find((x) => x.y === 1885 && x.m === "S"); const was = spotWants(a, s).length;
    mk("l2", "m1"); mk("l2", "m2"); mk("l2", "m1");
    const mine = spotWants(a, s), other = wants().filter((w) => w.albumId === "m2").length;
    const dropped = dropSpotWants(a, [s]).length;
    return mine.length === was + 2 && mine.every((w) => w.albumId === "m1") && dropped === was + 2 && wants().filter((w) => w.albumId === "m2").length === other && other === 1 || JSON.stringify([mine.length, dropped, other]);
  }); console.log(rr === true ? "ok R4-1: filling the spot crosses off only this album's wants" : "FAIL R4-1 drop " + rr); }
  await b.close();
})();
