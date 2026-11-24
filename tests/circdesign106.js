// v0.106.2: Circulated (not graded) is offered on the Add/Edit form for everyday coins with a plain design picked (e.g. America the Beautiful quarter); valuable varieties still ask for a grade. No new saved field.
const { chromium } = require("./_compat");
const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
(async () => {
  const b = await chromium.launch(); const errors = [];
  const p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(400);
  const ev = (f, a) => p.evaluate(f, a);
  await ev(() => { openCoinForm(); }); await p.waitForSelector("#coinForm");
  await ev(() => { pickType("atb-quarter"); draft.year = 2012; draft.mint = "P"; draft.variety = "Denali"; renderCoinForm(); });
  ok("ATB quarter with a design picked: Circulated switch is offered", (await p.locator("[data-act=circTick]").count()) === 1);
  await p.click("[data-act=circTick]"); await p.waitForTimeout(100);
  ok("tick keeps the design and sets noGrade", await ev(() => draft.noGrade === true && draft.variety === "Denali"));
  await ev(() => { draft.label = ""; }); await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(300);
  const c = await ev(() => allCoins()[0]);
  ok("saved with design, noGrade, no grade, no extra field", c && c.variety === "Denali" && c.noGrade === true && !c.grade && !Object.keys(c).some((k) => /^_|circ/i.test(k)));
  ok("not missing a grade", await ev(() => !missingOf(allCoins()[0]).includes("grade")));
  const r = await ev(() => {
    const base = { typeId: "lincoln-memorial-copper", year: 1972, mint: "P", grade: "", item: "coin" };
    return [quickCoinOk({ ...base, variety: "Doubled Die Obverse" }), quickCoinOk({ ...base, variety: "" }),
      quickCoinOk({ typeId: "atb-quarter", year: 2012, mint: "P", variety: "Denali", knownVar: "Doubled Die Reverse" }),
      quickCoinOk({ typeId: "roosevelt-clad", year: 1982, mint: "", variety: "No P" }),
      quickCoinOk({ typeId: "state-quarter", year: 1999, mint: "P", variety: "Delaware" })];
  });
  ok("1972 doubled die cent still needs a grade", r[0] === false);
  ok("same cent with no variety is allowed", r[1] === true);
  ok("Known variety filled in still needs a grade", r[2] === false);
  ok("1982 No P dime still needs a grade", r[3] === false);
  ok("state quarter design is allowed", r[4] === true);
  await ev(() => { openCoinForm(); }); await p.waitForSelector("#coinForm");
  await ev(() => { pickType("lincoln-memorial-copper"); draft.year = 1972; draft.mint = "P"; draft.variety = "Doubled Die Obverse"; renderCoinForm(); });
  ok("form shows Can't grade, not Circulated, for the doubled die", (await p.locator("[data-act=circTick]").count()) === 0 && /Can't grade this one/.test(await p.textContent("#coinForm")));
  ok("no page errors", errors.length === 0); if (errors.length) console.log(errors);
  await b.close();
})();
