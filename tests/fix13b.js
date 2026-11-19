// Fix bundle 13b: New album type search, Mark as sold fills the show name, pop-ups close on tap or swipe.
const { chromium } = require("./_compat");
const ok = (name, v) => console.log((v ? "ok   " : "FAIL ") + name);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  await p.evaluate(() => saveSettings({ level: "everything" }, true));
  const ev = (fn, arg) => p.evaluate(fn, arg);

  // 1. New album: search box at the top, nothing pre-filled, Create off until a type is picked
  await ev(() => openNewAlbum()); await p.waitForTimeout(100);
  ok("search box is the first field", await ev(() => document.querySelector("#albumForm").firstElementChild.querySelector("#albumTypeFind") !== null));
  ok("no coin type pre-filled, no dropdown", await ev(() => document.querySelectorAll("#albumTypes select").length === 0 && document.querySelector("#albumStart").value === ""));
  ok("Create is off", await ev(() => document.querySelector("#albumCreate").disabled));
  await p.fill("#albumTypeFind", "Kennedy"); await p.dispatchEvent("#albumTypeFind", "change");
  ok("'Kennedy' alone picks nothing and says several match", await ev(() => document.querySelector("#albumCreate").disabled && /match/.test(document.querySelector("#albumTypeHint").textContent)));
  await p.fill("#albumTypeFind", "Kennedy 1964-2002");
  ok("Kennedy + years picks all three types and fills the years", await ev(() => [...document.querySelectorAll("#albumTypes select")].map((s) => s.value).join() === "kennedy-90,kennedy-40,kennedy-clad" && document.querySelector("#albumStart").value === "1964" && document.querySelector("#albumEnd").value === "2002"));
  ok("Create turns on", await ev(() => !document.querySelector("#albumCreate").disabled));
  await p.click("#albumCreate"); await p.waitForTimeout(200);
  ok("album saved with the three types and years", await ev(() => { const a = albums()[0]; return a && albumTypes(a).join() === "kennedy-90,kennedy-40,kennedy-clad" && a.start === 1964 && a.end === 2002 && a.slots.length > 50; }));
  await ev(() => openNewAlbum()); await p.waitForTimeout(100);
  await p.fill("#albumTypeFind", "Franklin Half Dollar"); await p.dispatchEvent("#albumTypeFind", "change");
  ok("a single name picks one type", await ev(() => document.querySelectorAll("#albumTypes select").length === 1 && !document.querySelector("#albumCreate").disabled));
  await p.selectOption("#albumForm [name=brand]", "Whitman"); await p.fill("#albumForm [name=number]", "9122"); await p.waitForTimeout(100);
  ok("an album number still fills the types and turns Create on", await ev(() => document.querySelectorAll("#albumTypes select").length >= 1 && !document.querySelector("#albumCreate").disabled));
  await ev(() => closeSheet());

  // 2. Mark as sold: picking a show fills the show name, also when Where was already Coin show
  await ev(() => {
    saveSeller({ on: true }, true);
    put("c_x", { ...blankCoin(), id: "x", typeName: "Test", year: "1990", value: "10", paid: "4", qty: 1, status: "owned" }, true);
    put("sh_a", { kind: "show", id: "a", name: "Baltimore Expo", type: "coinshow", start: "2020-01-01", end: "2020-01-02", createdAt: 1 }, true);
    put("sh_b", { kind: "show", id: "b", name: "FUN Show", type: "coinshow", start: "2020-02-01", end: "2020-02-02", createdAt: 2 }, true);
    openSell("x");
  }); await p.waitForTimeout(150);
  await p.selectOption("#whereType", "Coin show"); await p.waitForTimeout(50);
  await p.selectOption("#showId", "a"); await p.waitForTimeout(50);
  ok("Where already Coin show: the show name is filled in", await ev(() => document.querySelector('[name="whereDetail"]').value === "Baltimore Expo"));
  await p.selectOption("#showId", "b"); await p.waitForTimeout(50);
  ok("picking another show changes the filled name", await ev(() => document.querySelector('[name="whereDetail"]').value === "FUN Show"));
  await p.fill('[name="whereDetail"]', "My own words"); await p.selectOption("#showId", "a"); await p.waitForTimeout(50);
  ok("a name you typed is never overwritten", await ev(() => document.querySelector('[name="whereDetail"]').value === "My own words"));
  await ev(() => closeSheet());

  // 3. Pop-ups close on tap or swipe; Undo still works
  await ev(() => toast("Added to want list")); 
  ok("pop-up shows", await ev(() => !document.querySelector("#toast").hidden));
  await p.click("#toast span"); await p.waitForTimeout(50);
  ok("tap closes it", await ev(() => document.querySelector("#toast").hidden));
  await ev(() => toast("Swipe me"));
  await ev(() => { const t = document.querySelector("#toast"); const mk = (type, x, y) => { const tc = new Touch({ identifier: 1, target: t, clientX: x, clientY: y }); t.dispatchEvent(new TouchEvent(type, { bubbles: true, touches: type === "touchend" ? [] : [tc], changedTouches: [tc] })); }; mk("touchstart", 100, 700); mk("touchend", 190, 704); });
  ok("sideways swipe closes it", await ev(() => document.querySelector("#toast").hidden));
  await ev(() => { window.__undone = 0; toast("Back in stock", { label: "Undo", fn: () => { window.__undone++; } }); });
  await p.click("#toast button"); await p.waitForTimeout(50);
  ok("Undo button still runs its action", await ev(() => window.__undone === 1 && document.querySelector("#toast").hidden));
  ok("no page errors", errors.length === 0); if (errors.length) console.log(errors);
  await b.close();
})();
