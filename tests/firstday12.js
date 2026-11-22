// Step 12 (First day): new app starts on Collector, Simple hides selling buttons, restore keeps the backup's level,
// welcome has a backup button, New box explains, clearer words.
const { chromium } = require("./_compat");
const ok = (name, v) => console.log((v ? "ok   " : "FAIL ") + name);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForFunction(() => store.mode === "local", null, { timeout: 15000 }); await p.waitForTimeout(400);
  const ev = (fn, arg) => p.evaluate(fn, arg);

  ok("a brand-new app starts on Collector", await ev(() => levelKey() === "collector"));
  ok("welcome card has I have a backup file", await p.locator(".welcome [data-act=openBackup]").count() === 1);
  ok("no coming-soon photo line on Add coin", await ev(() => { openCoinForm(null); const t = !document.querySelector("#photoFillLocked"); closeSheet(); return t; }));

  ok("Simple hides For sale, Mark as sold and Business on an owned coin; Everything shows them", await ev(() => {
    const c = blankCoin(); Object.assign(c, { id: "s1", typeId: "morgan-dollar", typeName: "Morgan Dollar", family: "Morgan dollar", denom: "$1", metal: "Silver", year: 1881, status: "owned", qty: 1 }); saveCoin(c);
    saveSettings({ level: "simple" }, true); go("coin-s1");
    const simple = document.body.innerHTML;
    saveSettings({ level: "everything" }, true); go("coin-s1");
    const all = document.body.innerHTML;
    return !/data-act="forSale"/.test(simple) && !/data-act="sell"/.test(simple) && /data-act="forSale"/.test(all) && /data-act="sell"/.test(all);
  }));

  ok("album name words: no blank album name in Placed in / Delete", await ev(() => {
    const a = { id: "al1", kind: "album", brand: "Whitman", number: "9001" }; put("a_al1", a);
    return albumTitle(a) === "Whitman 9001";
  }));

  ok("no price list says so instead of sounding checked", await ev(() => {
    const c = blankCoin(); Object.assign(c, { id: "n1", typeId: "morgan-dollar", typeName: "Morgan Dollar", family: "Morgan dollar", denom: "$1", metal: "Silver", year: 1881, grade: "VF-20", status: "owned", qty: 1 });
    const keep = PRICE_BOOK; PRICE_BOOK = emptyBook(); const t = noBookNote(c); PRICE_BOOK = keep;
    return /No price list loaded/.test(t);
  }));

  ok("Spot price help covers copper per pound", await ev(() => /pound/.test(WORDS.spot[1])));

  ok("New box with no name explains inside the form", await ev(() => {
    boxForm(null); const f = document.querySelector("#sheet form"); if (!f) return false;
    saveBoxForm(f); // the Name box is "required" in the browser, so call the saver directly
    const w = document.querySelector("#boxWarn"); return !!w && w.textContent.length > 5;
  }));

  ok("restoring into an empty phone keeps the backup's own level", await ev(() => {
    // the phone starts on Collector; a backup with no level (an old Everything collection) must win
    restoreFresh = true;
    const out = mergeRestored("settings", { kind: "settings", spot: {} });
    restoreFresh = false;
    return !out.level;
  }));
  console.log("errors", JSON.stringify(errors));
  await b.close();
})();
