// Step 33c (v0.121.0): five more known varieties, and coin search finds DDO / DDR.
const { chromium } = require("./_compat");
const path = require("path");
const ok = (name, v) => { console.log((v ? "PASS " : "FAIL ") + name); if (!v) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + path.resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const names = await p.evaluate(() => [["washington-silver", 1936, "P"], ["franklin-half", 1955, "P"], ["ike-clad", 1972, "P"], ["sba-dollar", 1979, "P"], ["sacagawea-dollar", 2000, "P"], ["franklin-half", 1955, "D"], ["sacagawea-dollar", 2000, "D"]]
    .map(([typeId, year, mint]) => knownVarieties({ typeId, year, mint, variety: "" })));
  ok("each of the five is offered " + JSON.stringify(names), names.slice(0, 5).every((n) => n.length === 1));
  ok("not offered for D coins", names[5].length === 0 && names[6].length === 0);
  const r = await p.evaluate(() => {
    const c = (variety, knownVar) => ({ typeId: "lincoln-wheat", typeName: "Lincoln Cent", year: 1955, mint: "P", variety, knownVar });
    return [coinMatchesQ(c("", "Doubled Die Obverse"), "ddo"), coinMatchesQ(c("Doubled Die Obverse", ""), "1955 ddo"), coinMatchesQ(c("", "Doubled Die Reverse"), "DDR"),
      coinMatchesQ(c("", "Doubled Die Reverse"), "ddo"), coinMatchesQ(c("", ""), "ddo"), coinMatchesQ(c("", "\"Bugs Bunny\" (die clash)"), "bugs")];
  });
  ok("DDO / DDR and variety words find coins " + JSON.stringify(r), JSON.stringify(r) === "[true,true,true,false,false,true]");
  ok("no page errors", errors.length === 0); await b.close();
})();
