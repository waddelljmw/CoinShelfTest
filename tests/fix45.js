const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (name, cond) => console.log((cond ? "PASS " : "FAIL ") + name);
  const val = (sel) => p.evaluate((s) => (document.querySelector(s) || {}).value, sel);
  await p.evaluate(() => { ensureDefaultList(); saveWantList({ kind: "wantlist", id: "peace", name: "Peace only", scope: "type", typeId: "peace-dollar", createdAt: 1 });
    saveWantList({ kind: "wantlist", id: "pms63", name: "Peace MS-63", scope: "type-grade", typeId: "peace-dollar", grade: "MS-63", createdAt: 2 });
    saveWant(newWant({ typeId: "morgan-dollar", year: 1893, mint: "S", grade: "MS-63", notes: "old note" })); go("wants"); });
  await p.waitForTimeout(200);
  // --- Fix 4: edit want, change grade + notes, make a new list: edits survive and new list is chosen
  await p.click("[data-act=wantEdit]");
  await p.selectOption("[name=grade]:not([disabled])", "MS-65"); await p.fill("[name=notes]", "new note");
  await p.selectOption("#wantListPick", "__new"); await p.fill("#wlForm [name=name]", "Key dates"); await p.click("#wlForm button[type=submit]"); await p.waitForTimeout(150);
  ok("edits kept after new list", (await val("[name=grade]")) === "MS-65" && (await val("[name=notes]")) === "new note");
  ok("new list selected", (await p.evaluate(() => { const o = document.querySelector("#wantListPick").selectedOptions[0]; return o && o.textContent; })) === "Key dates");
  // cancel path keeps edits too
  await p.fill("[name=notes]", "typed then cancel"); await p.selectOption("#wantListPick", "__new"); await p.click("[data-act=wlCancel]"); await p.waitForTimeout(100);
  ok("cancel returns with edits", (await val("[name=notes]")) === "typed then cancel" && await p.isVisible("#wantForm"));
  await p.click("#wantForm button[type=submit]"); await p.waitForTimeout(150);
  const w = await p.evaluate(() => { const x = wants()[0]; return { ...x, listName: getWantList(x.listId).name }; });
  console.log(JSON.stringify({g:w.grade,n:w.notes,l:w.listName}));
  ok("saved to new list with edits", w.grade === "MS-65" && w.notes === "typed then cancel" && w.listName === "Key dates");
  // --- Fix 5: scoped list locks type and grade
  await p.click("[data-act=wantNew]"); await p.selectOption("#wantListPick", "pms63"); await p.waitForTimeout(100);
  ok("type locked to Peace", (await p.isDisabled("select[name=typeId]")) && (await val("select[name=typeId]")) === "peace-dollar");
  ok("grade locked to MS-63", (await p.isDisabled("select[name=grade]")) && (await val("select[name=grade]")) === "MS-63");
  // tamper with the DOM: force Morgan anyway → save still forces Peace
  await p.evaluate(() => { document.querySelectorAll("[name=typeId]").forEach((e) => { e.disabled = false; e.value = "morgan-dollar"; }); });
  await p.fill("[name=year]", "1922"); await p.click("#wantForm button[type=submit]"); await p.waitForTimeout(150);
  ok("scope enforced on save", (await p.evaluate(() => { const x = wants().find((w) => w.listId === "pms63"); return x && x.typeId + "/" + x.grade; })) === "peace-dollar/MS-63");
  // slot menu asks for a list and hides lists for other types
  await p.evaluate(() => { const a = { kind: "album", id: "mo", brand: "Whitman", number: "1", name: "", typeId: "morgan-dollar", start: 1878, end: 1879, removed: [], createdAt: 1 }; a.slots = buildSlots("morgan-dollar", 1878, 1879); put("a_mo", a); go("album-mo"); });
  await p.waitForTimeout(150);
  await p.click(".slot >> nth=0"); await p.click(".btn-want");
  const opts = await p.$$eval("#slotListPick option", (o) => o.map((x) => x.textContent));
  ok("slot picker offers only fitting lists", !opts.some((x) => /Peace/.test(x)) && opts.includes("General") && opts.includes("Key dates"));
  await p.selectOption("#slotListPick", { label: "Key dates" }); await p.click("[data-act=slotWantAdd]"); await p.waitForTimeout(150);
  ok("slot want saved to chosen list", (await p.evaluate(() => wants().some((w) => w.year === 1878 && getWantList(w.listId).name === "Key dates"))));
  // missing picker hides wrong-type lists
  await p.click("[data-act=missing]");
  ok("missing picker hides Peace lists", !(await p.$$eval("#missListPick option", (o) => o.map((x) => x.textContent))).some((x) => /Peace/.test(x)));
  console.log("errors", errors); await b.close();
})();
