// E1a: Inherited/Gift never carried, auto price cleared, backup menu/line/reminder/two copies, small fixes.
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(400);
  const ok = (name, cond) => console.log((cond ? "PASS " : "FAIL ") + name);
  const ev = (f, a) => p.evaluate(f, a);
  for (const src of ["Inherited", "Gift"]) ok(src + " is not carried", await ev((s) => { saveSettings({ lastSource: s }, true); openCoinForm(null); const r = draft.source === "" && !document.body.textContent.includes("Same as last: Where from"); closeSheet(); return r; }, src));
  await p.waitForTimeout(200);
  ok("carried source shows at the top; clearing it clears its price", await ev(() => {
    saveSettings({ lastSource: "Pocket change" }, true); openCoinForm(null);
    draft._what = "us"; const ty = COIN_TYPES.find((x) => /roosevelt/i.test(x.id) && /clad/i.test(x.id + x.name)); draft.typeId = ty.id; draft.denom = ty.denom; draft.metal = ty.metal || ""; draft.year = 1980; autoPaid(draft); renderCoinForm();
    const form = document.querySelector("#coinForm"), top = form.innerHTML.indexOf("Same as last") < form.innerHTML.indexOf("<fieldset"), had = draft.paid !== "";
    document.querySelector("[data-act=carryClear][data-k=source]").click();
    return top && had && draft.paid === "" && draft.source === "";
  }));
  ok("a typed price stays", await ev(() => { applySourceKind(draft, "Pocket change"); draft.paid = "5"; applySourceKind(draft, "eBay"); return draft.paid === "5"; }));
  ok("+ shows beside a certified grade before one is picked", await ev(() => { draft.gradeMode = "cert"; draft.grade = ""; renderCoinForm(); return !!document.querySelector(".grade-row [data-fcheck=plus]"); }));
  ok("problems are not inside More details; Bag holder", await ev(() => { const e = document.querySelector("[data-sec=errors]"); const r = !!e && !e.closest("[data-sec=more]") && HOLDERS.includes("Bag"); closeSheet(); return r; }));
  await p.waitForTimeout(300);
  const r = await ev(async () => {
    const ago = (n) => localDate(new Date(Date.now() - n * 86400000));
    const c = blankCoin(); put("c_" + c.id, c); await new Promise((x) => setTimeout(x, 100));
    const out = { never: backupReminder() };
    recordBackup("phone"); out.fresh = backupLine(); out.cleanOld = (saveSettings({ lastBackup: ago(30) }), backupReminder());
    put("c_" + c.id, { ...getCoin(c.id) }); await new Promise((x) => setTimeout(x, 50)); out.same = settings().backupDirty;
    put("c_" + c.id, { ...getCoin(c.id), notes: "x" }); await new Promise((x) => setTimeout(x, 50)); out.changed = settings().changedCoins; out.old = backupReminder();
    actions.backupLater(); out.snoozed = backupReminder();
    recordBackup("phone"); recordBackup("copy"); out.both = backupLine();
    for (let i = 0; i < 25; i++) { const x = { ...blankCoin(), id: "n" + i }; put("c_n" + i, x, true); }
    await new Promise((x) => setTimeout(x, 100)); out.many = backupReminder(); render(); await new Promise((x) => setTimeout(x, 100)); // coins get their ID numbers
    out.dbg = [today(), ago(30), settings().lastBackup, new Date().toString()];
    return out;
  });
  console.log(JSON.stringify(r.dbg), r.old.slice(40, 90)); ok("never backed up: reminds", /haven't saved/.test(r.never));
  ok("line after a phone save", /today.*phone only.*no changes since/.test(r.fresh));
  ok("no changes never nags", r.cleanOld === "");
  ok("saving the same coin again is not a change", r.same === false);
  ok("one changed coin counted, 30 days: reminds", r.changed === 1 && /(29|30|31) days/.test(r.old));
  ok("Not now hides it today", r.snoozed === "");
  ok("phone + copy", /phone \+ copy/.test(r.both));
  ok("25 changed coins reminds the same day", /coins changed/.test(r.many));
  // the screen: save, then the offer to send a copy opens the share menu with a .txt file
  await ev(() => { window.shared = null; navigator.canShare = () => true; navigator.share = async (d) => { window.shared = d.files[0].name; }; document.querySelector("#menuBtn").click(); });
  ok("menu: Backup above Options", await ev(() => { const t = [...document.querySelectorAll("#menu button")].map((x) => x.textContent.trim()); return t.indexOf("Backup") === t.indexOf("Options") - 1; }));
  await p.click("#menuBackup"); const dl = p.waitForEvent("download"); await p.click("#sheet [data-act=doBackup]"); await dl;
  await p.waitForSelector("text=Also send a copy somewhere else?"); await p.click("#backupMsg [data-act=sendBackup]"); await p.waitForSelector("text=Copy sent");
  ok("share menu got the .txt copy, both recorded", await ev(() => /\.txt$/.test(window.shared) && settings().backupPhone && settings().backupCopy));
  ok("no page errors", errors.length === 0); if (errors.length) console.log(errors);
  await b.close();
})();
