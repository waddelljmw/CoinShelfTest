// Dates follow the phone's own time zone, not London time.
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch();
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  // 9:30 pm in New York on Oct 31 is already Nov 1 in London.
  const ctx = await b.newContext({ timezoneId: "America/New_York" });
  const p = await ctx.newPage(); const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.clock.setFixedTime(new Date("2026-11-01T01:30:00Z"));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  ok("today is Oct 31 in New York at 9:30 pm", await p.evaluate(() => today()) === "2026-10-31");
  await p.click("#fab"); await p.waitForTimeout(100);
  await p.evaluate(() => { draft.typeId = "morgan-dollar"; }); 
  ok("history uses the local date", await p.evaluate(() => { recordHistory(); return true; }));
  ok("no page errors", errors.length === 0); if (errors.length) console.log(errors);
  await b.close();
})();
