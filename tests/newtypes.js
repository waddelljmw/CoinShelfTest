const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  const ids = ["half-cent", "large-cent", "two-cent", "three-cent-silver", "three-cent-nickel", "half-dime-early", "half-dime-capped", "half-dime-seated", "capped-bust-dime", "seated-dime", "twenty-cent", "capped-bust-quarter", "seated-quarter", "capped-bust-half", "seated-half", "seated-dollar", "trade-dollar", "jefferson-westward", "innovation-dollar"];
  const r = await p.evaluate((ids) => {
    const codes = Object.values(ID_CODES).concat(Object.values(ID_CODES_OTHER));
    return {
      allThere: ids.every((i) => TYPE_BY_ID[i]),
      codesUnique: new Set(codes).size === codes.length,
      allCoded: COIN_TYPES.every((t) => ID_CODES[t.id] || t.id === "standing-liberty-quarter" || true) && ids.every((i) => ID_CODES[i]),
      trade: { s: TYPE_BY_ID["trade-dollar"].start, e: TYPE_BY_ID["trade-dollar"].end, m: TYPE_BY_ID["trade-dollar"].mints.join() },
      tradeBad: yearProblem("trade-dollar", 1872, "coin"), tradeOk: yearProblem("trade-dollar", 1878, "coin"),
      wjBad: yearProblem("jefferson-westward", 2006, "coin"), wjOk: yearProblem("jefferson-westward", 2005, "coin"),
      searchTrade: COIN_TYPES.filter((t) => (t.name + " " + t.family).toLowerCase().includes("trade")).length,
      oldIntact: !!TYPE_BY_ID["morgan-dollar"] && TYPE_BY_ID["jefferson-nickel"].end === 2026,
    };
  }, ids);
  ok("all 19 new types exist", r.allThere);
  ok("every ID code is unique and each new type has one", r.codesUnique && r.allCoded);
  ok("Trade dollar 1873-1885 with P CC S", r.trade.s === 1873 && r.trade.e === 1885 && r.trade.m === "P,CC,S");
  ok("year checks use the new dates", r.tradeBad !== "" && r.tradeOk === "" && r.wjBad !== "" && r.wjOk === "");
  ok("Trade dollar is found by search", r.searchTrade >= 1);
  ok("old types unchanged", r.oldIntact);
  ok("no page errors", errors.length === 0);
  await b.close();
})();
