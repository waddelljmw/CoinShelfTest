const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  // Junk silver by face value: ounces worked out for each kind
  const r = await p.evaluate(() => ({
    a: junkOz({ jKind: "90", jFace: "20" }), b: junkOz({ jKind: "40", jFace: "10" }), c: junkOz({ jKind: "35", jFace: "2" }), none: junkOz({ jKind: "90", jFace: "" }),
  }));
  ok("$20 of 90% = 14.468 oz", Math.abs(r.a - 14.468) < 1e-6); ok("$10 of 40% = 2.9584 oz", Math.abs(r.b - 2.9584) < 1e-6);
  ok("$2 of 35% nickels = 2.2504 oz (40 nickels)", Math.abs(r.c - 2.2504) < 1e-6); ok("no face value = 0", r.none === 0);
  // Add coin: the new button opens the junk form, saving keeps the ounces
  await p.evaluate(() => { openCoinForm(null); actions.what({ dataset: { v: "junk" } }); }); await p.waitForTimeout(150);
  ok("form asks for face value", !!(await p.$("[data-f=jFace]")));
  await p.fill("[data-f=jFace]", "20"); await p.waitForTimeout(100);
  ok("ounces fill in", await p.evaluate(() => draft.oz === "14.468" && draft.bWeight === "14.468"));
  await p.evaluate(() => { draft.paid = "900"; return saveDraft(); }); await p.waitForTimeout(300);
  const s = await p.evaluate(() => { const c = ownedCoins().find((x) => x.bShape === "Junk"); return c && { oz: c.oz, p: c.bPurity, k: c.jKind, f: c.jFace, st: stackOf(c) }; });
  ok("saved as a stack item with 14.468 oz", !!s && s.oz === "14.468" && s.p === "1" && s.k === "90" && s.f === "20" && s.st === "My Silver Stack");
  await p.evaluate(() => go("stacks")); await p.waitForTimeout(150);
  ok("stacks page counts the ounces", /14\.468 oz/.test(await p.textContent("main")));
  console.log("errors", JSON.stringify(errors)); await b.close();
})();
