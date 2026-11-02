// Typing a spot price must not close the box (the save used to redraw the page), and the time is saved.
const { chromium } = require("./_compat");
const ok = (name, v) => console.log((v ? "ok   " : "FAIL ") + name);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  await p.evaluate(() => go("options")); await p.waitForTimeout(150);
  await p.click("[data-spot=gold]");
  await p.keyboard.type("26", { delay: 20 }); await p.waitForTimeout(1000); // pause long enough for the save
  ok("box still focused after the save", await p.evaluate(() => document.activeElement && document.activeElement.dataset.spot === "gold"));
  await p.keyboard.type("80.5", { delay: 20 }); await p.waitForTimeout(900);
  ok("full price kept", (await p.inputValue("[data-spot=gold]")) === "2680.5" && (await p.evaluate(() => settings().spot.gold)) === 2680.5);
  ok("time saved and shown", /Mon|Tue|Wed|Thu|Fri|Sat|Sun/.test(await p.textContent("#spotStamp")) && /@ \d{1,2}:\d\d(am|pm)/.test(await p.textContent("#spotStamp")));
  ok("stamp format", await p.evaluate(() => stampText("2026-11-02T16:11:00Z").replace(/ [A-Z]{2,5}$/, "").replace(/\d{1,2}:\d\d(am|pm)/, "T") .includes("Mon, Nov. 2, 2026 @ T")));
  console.log("errors", JSON.stringify(errors)); await b.close();
})();
