// Step 22: a coin with no year shows in Fix-up; one switch hides both Share buttons; pipeline page counts local days.
const { chromium } = require("./_compat");
const ok = (name, v, x) => console.log((v ? "ok   " : "FAIL ") + name + (x !== undefined && !v ? " " + JSON.stringify(x) : ""));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const r = await p.evaluate(() => {
    const base = { ...blankCoin(), typeId: "morgan", typeName: "Morgan dollar", metal: "Silver", grade: "VF-20", paid: "10", source: "Coin Shop", qty: 1, status: "owned" };
    const mk = (id, extra) => ({ ...base, id, ...extra });
    return {
      none: needsOf(mk("a", { year: "" })).includes("year"),
      withYear: needsOf(mk("b", { year: "1921" })).includes("year"),
      worn: needsOf(mk("c", { year: "", noDate: "worn" })).includes("year"),
      group: needsOf(mk("d", { year: "", qty: 20 })).includes("year"),
      text: needsText(mk("e", { year: "" })),
    };
  });
  ok("no year, no tick: needs year", r.none === true, r);
  ok("coin with a year is fine", r.withYear === false, r);
  ok("Unreadable tick is fine", r.worn === false, r);
  ok("a group of mixed years is skipped", r.group === false, r);
  ok("wording says Missing: year", /Missing: year/.test(r.text), r.text);
  await p.evaluate(() => { put("c_n1", { ...blankCoin(), id: "n1", typeId: "morgan", typeName: "Morgan dollar", year: "", metal: "Silver", grade: "VF-20", paid: "10", source: "Coin Shop", qty: 1, status: "owned" }); });
  const n = await p.evaluate(() => needInfoCoins().map((c) => c.id));
  ok("Fix-up list includes the no-year coin", n.includes("n1"), n);
  await p.evaluate(() => go("options")); await p.waitForTimeout(250);
  let t = await p.textContent("main");
  ok("Share buttons show by default", /Share the app/.test(t) && /Share a snapshot/.test(t) && /Hide the Share buttons/.test(t));
  await p.evaluate(() => saveSettings({ hideShare: true })); await p.waitForTimeout(250);
  t = await p.textContent("main");
  ok("Hide Share removes both buttons", (await p.$$('[data-act="shareApp"], [data-act="openSnapshot"]')).length === 0);
  ok("the switch stays so it can be turned off", /Hide the Share buttons/.test(t));
  await p.evaluate(() => saveSettings({ hideShare: false })); await p.waitForTimeout(250);
  ok("turning it off brings them back", (await p.$$('[data-act="shareApp"], [data-act="openSnapshot"]')).length === 2);
  // pipeline page: local-day counting (evening in a western time zone)
  const ctx = await b.newContext({ timezoneId: "America/New_York" });
  const q = await ctx.newPage();
  await q.goto("about:blank");
  const src = require("fs").readFileSync(require("path").resolve(__dirname, "../pipeline/index.html"), "utf8");
  const m1 = src.match(/const today=\(\)=>\{[^\n]*\n/), m2 = src.match(/const dayNum=[^\n]*\n/);
  ok("pipeline page has local today() and dayNum()", !!m1 && !!m2);
  if (m1 && m2) {
    const res = await q.evaluate(([a, c]) => {
      const RealDate = Date; const fake = (iso) => { class D extends RealDate { constructor(...x) { super(...(x.length ? x : [iso])); } static now() { return new RealDate(iso).getTime(); } } return D; };
      const run = (iso, back) => { const Date = fake(iso); return new Function("Date", a + c + "return Math.round(dayNum(today())-dayNum('" + back + "'))")(Date); };
      return { sameEvening: run("2026-11-20T23:30:00-05:00", "2026-11-20"), nextDay: run("2026-11-21T08:00:00-05:00", "2026-11-20") };
    }, [m1[0], m2[0]]);
    ok("backup tapped this evening counts 0 days", res.sameEvening === 0, res);
    ok("next day counts 1", res.nextDay === 1, res);
  }
  console.log("errors", JSON.stringify(errors));
  await b.close();
})();
