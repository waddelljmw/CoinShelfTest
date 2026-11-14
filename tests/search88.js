const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  const r = await p.evaluate(() => {
    const ids = (q) => COIN_TYPES.filter((t) => q.split(/\s+/).every((w) => (t.name + " " + t.family + " " + t.denom + " " + nickWords(t.id)).toLowerCase().includes(w))).map((t) => t.id);
    return {
      wheat: ids("wheat penny"), walker: ids("walker"), v: ids("v nickel"), ase: ids("ase"), war: ids("war nickel"), barber: ids("barber"),
      steelList: nickWords("lincoln-wheat", 1943).includes("steel"), steelOther: nickWords("lincoln-wheat", 1950).includes("steel"),
      vdb: nickWords("lincoln-wheat", 1909).includes("vdb"), bi: ids("bicentennial"),
      w1: mintWarning("lincoln-wheat", 1922, "P"), w2: mintWarning("lincoln-wheat", 1922, "D"), w3: mintWarning("lincoln-wheat", 1950, "D"), w4: mintWarning("lincoln-wheat", 1950, "W"),
    };
  });
  ok("wheat penny → Lincoln Wheat", r.wheat.includes("lincoln-wheat") && !r.wheat.includes("indian-cent"));
  ok("walker, V nickel, ASE, war nickel", r.walker.includes("walking-liberty-half") && r.v.includes("liberty-nickel") && r.ase.includes("silver-eagle") && r.war.includes("jefferson-war-nickel"));
  ok("barber finds Barber coins", r.barber.includes("barber-dime"));
  ok("steel only for 1943, VDB for 1909", r.steelList && !r.steelOther && r.vdb);
  ok("Bicentennial shows cent, quarter, half, dollar", ["lincoln-bicentennial", "washington-clad", "kennedy-clad", "ike-clad"].every((i) => r.bi.includes(i)));
  ok("1922 cent: P warns, D fine; 1950 D fine, W warns", r.w1 && !r.w2 && !r.w3 && r.w4);
  // Add flow: warning shows, Gift fills $0
  await p.click("#fab"); await p.fill("#typeSearch", "wheat penny"); await p.click("#typeList button[data-act=pickType] >> nth=0");
  await p.fill("[data-f=year]", "1922"); await p.waitForTimeout(150);
  ok("form shows the warning for 1922 P", /struck at D/.test(await p.textContent("#yearHint")));
  await p.selectOption("[data-f=mint]", "D"); await p.waitForTimeout(150);
  ok("warning clears for 1922 D", (await p.textContent("#yearHint")).trim() === "");
  await p.evaluate(() => { applySourceKind(draft, "Gift"); renderCoinForm(); });
  ok("Gift fills Price paid $0", (await p.inputValue("[data-f=paid]")) === "0");
  ok("no page errors", errors.length === 0);
  await b.close();
})();
