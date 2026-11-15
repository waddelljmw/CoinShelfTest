// 0.73.1: Where from chip order, guide Where from step, Undo on add-missing, New list always offered.
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  const chips = await p.evaluate(() => { const d = { _sourceKind: "" }; const el = document.createElement("div"); el.innerHTML = sourceChips(d); return [...el.querySelectorAll("[data-act=srcChip]")].map((x) => x.textContent); });
  ok("Where from order: Coin Shop, Coin Show, eBay, Inherited, More", chips.join("|") === "Coin Shop|Coin Show|eBay|Inherited|More…");
  ok("guide has 8 steps and a Where from step before price", await p.evaluate(() => GUIDE_STEPS.length === 8 && GUIDE_STEPS[4].sel[0] === ".src-chips" && GUIDE_STEPS[5].sel[0] === "[data-f=paid]" && SAVE_STEP === 6));
  const r = await p.evaluate(() => {
    const a = { kind: "album", id: "a1", brand: "Whitman", number: "a1", name: "", typeId: "morgan-dollar", start: 1880, end: 1881, removed: [], createdAt: 1 };
    a.slots = buildSlots(a.typeId, 1880, 1881); put("a_a1", a);
    ensureDefaultList();
    const before = wants().length;
    openMissingQuick("a1");
    const sheet = document.body.innerText;
    const hasNew = !!document.querySelector("[data-act=wlNewQuick]"), scopeText = /\(any coin\)/.test(sheet);
    addMissingTo(getAlbum("a1"), DEFAULT_LIST_ID);
    const added = wants().length - before;
    return { hasNew, scopeText, added };
  });
  ok("quick sheet always has + New list and plain scope words", r.hasNew && r.scopeText);
  ok("add missing adds wants", r.added > 0);
  const hasUndo = await p.evaluate(() => !!document.querySelector("#toast button, .toast button"));
  ok("toast offers Undo", hasUndo);
  await p.evaluate(() => { const t = document.querySelector("#toast button, .toast button"); t && t.click(); }); await p.waitForTimeout(200);
  ok("Undo removes them", await p.evaluate(() => wants().length) === 0);
  ok("no page errors", errors.length === 0);
  await b.close();
})();
