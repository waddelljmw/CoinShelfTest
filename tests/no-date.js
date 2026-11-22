// N2 follow-up (v0.64.0): a token or medal can tick "Never had a date" (saved as noDate: "none").
// Real behaviour, so plain playwright (not the _compat helper, which always picks "US coin").
const { chromium } = require("playwright");
const ok = (name, v) => console.log((v ? "PASS " : "FAIL ") + name);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(400);
  const coins = () => p.evaluate(() => allCoins().filter((c) => c.status !== "deleted"));
  const fillToken = async (name) => { await p.click("#fab"); await p.click(".what-btn[data-v=other]"); await p.fill("[data-f=typeName]", name); await p.fill("[data-f=denom]", "$1"); };
  const submit = async () => { await p.click("#coinForm button[type=submit]"); await p.waitForTimeout(350); };
  // a token offers both ticks; a catalog coin only the worn one
  await fillToken("Casino token");
  ok("token form offers Never had a date and too worn", await p.isVisible("[data-fcheck=_none]") && await p.isVisible("[data-fcheck=_worn]"));
  await submit();
  ok("token with no year and no tick is stopped", (await coins()).length === 0 && await p.isVisible("#coinForm"));
  // the two ticks exclude each other
  await p.check("[data-fcheck=_worn]"); await p.check("[data-fcheck=_none]");
  ok("ticking Never had a date clears too worn", !(await p.isChecked("[data-fcheck=_worn]")) && await p.isChecked("[data-fcheck=_none]"));
  await p.check("[data-fcheck=_worn]");
  ok("ticking too worn clears Never had a date", !(await p.isChecked("[data-fcheck=_none]")));
  await p.check("[data-fcheck=_none]");
  await submit();
  let list = await coins();
  ok("token saves with noDate none", list.length === 1 && list[0].noDate === "none" && list[0].year === "");
  ok("no stray underscore fields saved", !Object.keys(list[0]).some((k) => k.startsWith("_")));
  // a year wins over the tick
  await fillToken("Wooden nickel"); await p.check("[data-fcheck=_none]"); await p.fill("[data-f=year]", "1933");
  ok("ticks hide once a year is typed", !(await p.isVisible("#wornRow")));
  await submit();
  list = await coins();
  ok("token with a year keeps the year, no noDate", list.length === 2 && list.some((c) => c.year === 1933 && !c.noDate));
  // a catalog coin never gets Never had a date
  await p.click("#fab"); await p.click(".what-btn[data-v=us]"); await p.fill("#typeSearch", "morgan"); await p.click("#typeList button[data-act=pickType] >> nth=0");
  ok("catalog coin has only the too worn tick", !(await p.locator("[data-fcheck=_none]").count()) && await p.isVisible("[data-fcheck=_worn]"));
  await p.click(".sheet-head [data-act=closeSheet]");
  // the old record still reads back after a reload (convert on read: noDate is simply there or not)
  await p.reload(); await p.waitForTimeout(500);
  ok("saved noDate survives a reload", (await coins()).some((c) => c.noDate === "none"));
  ok("no page errors", errors.length === 0); if (errors.length) console.log(errors);
  await b.close();
})();
