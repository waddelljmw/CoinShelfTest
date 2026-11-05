const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  const ev = (f, a) => p.evaluate(f, a);
  // can't-grade stops "needs info"; Home count and its list agree (business stock is left out of both)
  const r = await ev(() => {
    const m = (o) => ({ ...blankCoin(), typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1880, status: "owned", paid: "10", ...o });
    return { plain: missingOf(m({})).join(), ng: missingOf(m({ noGrade: true })).length, txt: gradeText(m({ noGrade: true })) };
  });
  ok("no grade needs info", r.plain === "grade"); ok("can't grade stops it", r.ng === 0); ok("shows Not graded", r.txt.includes("Not graded"));
  await ev(() => {
    const m = (id, o) => saveCoin({ ...blankCoin(), id, typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1880, status: "owned", ...o });
    m("n1", {}); m("n2", {}); m("n3", { biz: true });
  });
  const homeN = await ev(() => needInfoCoins().length);
  await ev(() => actions.needInfo()); await p.waitForTimeout(250);
  const listN = await ev(() => document.querySelectorAll("main .coin-row").length);
  const txt = await p.textContent("main");
  ok("Home counts 2 (business stock left out)", homeN === 2);
  ok("list opened from Home shows 2, not 3", listN === 2);
  ok("list is labeled for Home totals", /in Home totals/.test(txt));
  // new cardboard box starts with spots off
  await ev(() => boxForm(null)); await p.waitForTimeout(150);
  await p.selectOption("#boxLook", "cardboard"); await p.waitForTimeout(100);
  ok("cardboard: numbered spots off", !(await p.isChecked("#boxSpots")));
  await p.selectOption("#boxLook", "black"); await p.waitForTimeout(100);
  ok("black box: spots back on (not touched)", await p.isChecked("#boxSpots"));
  await p.selectOption("#boxLook", "cardboard"); await p.check("#boxSpots"); await p.selectOption("#boxLook", "wood"); await p.selectOption("#boxLook", "cardboard");
  ok("a choice you made stays", await p.isChecked("#boxSpots"));
  await ev(() => closeSheet());
  // report order, CAC, inheritance
  const rep = await ev(async () => {
    put("settings", { ...settings(), inheritances: [{ id: "i1", from: "Uncle Bob", date: "2023", earlier: [], valueWhen: "" }], inhDefault: "i1" });
    saveCoin({ ...blankCoin(), id: "r1", typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1881, grade: "VF-20", status: "owned", source: "Inherited", inhId: "i1", cac: "Green", value: "50" });
    saveCoin({ ...blankCoin(), id: "r2", typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1879, grade: "VF-20", status: "owned", paid: "5", value: "500" });
    const byYear = await buildReport({ order: "year" }), byVal = await buildReport({ order: "value" });
    const pos = (h, s) => h.indexOf(s);
    return { inh: byYear.includes("Inherited from Uncle Bob, 2023"), cac: byYear.includes("CAC Green"), yearFirst: pos(byYear, "1879") < pos(byYear, "1881"), valFirst: byVal.indexOf("$500.00") < byVal.indexOf("$50.00") };
  });
  ok("report shows who/when inherited", rep.inh); ok("report shows CAC", rep.cac); ok("order by year", rep.yearFirst); ok("order by value, highest first", rep.valFirst);
  // Home hides Cost and Gain when everything is inherited
  await ev(() => { allCoins().filter((c) => c.status === "owned" && !isInherited(c)).forEach((c) => saveCoin({ ...c, status: "deleted" })); go("home"); }); await p.waitForTimeout(250);
  ok("Home hides Cost and Gain when everything is inherited", !(await p.$(".stats")));
  await ev(() => saveCoin({ ...blankCoin(), id: "r2", typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1879, grade: "VF-20", status: "owned", paid: "5", value: "500" }));
  // delete asks first; sell-eventually note
  await ev(() => go("coin-r1")); await p.waitForTimeout(200);
  await p.click("[data-act=sellLater]"); await p.waitForTimeout(250);
  ok("sell-eventually keeps it inherited", await ev(() => { const c = getCoin("r1"); return c.sellLater === true && isInherited(c); }));
  ok("note shows on the page", /sell this one eventually/.test(await p.textContent("main")));
  await ev(() => go("coin-r2")); await p.waitForTimeout(200);
  await p.click("button.danger[data-act=delete]"); await p.waitForTimeout(250);
  ok("delete asks first (coin still there)", await ev(() => getCoin("r2").status === "owned") && /Delete this coin\?/.test(await p.textContent("body")));
  await p.click("[data-act=confirmOk]"); await p.waitForTimeout(250);
  ok("confirming deletes it", await ev(() => getCoin("r2").status === "deleted"));
  console.log("errors", JSON.stringify(errors)); await b.close();
})();
