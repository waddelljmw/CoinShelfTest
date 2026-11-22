// Lincoln cent albums build proof spots from the Red Book years even though the app has no Lincoln proof prices.
const { chromium } = require("./_compat");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  const r = await p.evaluate(() => {
    const types = ["lincoln-memorial-copper", "lincoln-memorial-zinc", "lincoln-bicentennial", "lincoln-shield"];
    const pf = (proofs) => buildAlbumSlots(types, "dates", 1959, 2011, proofs).filter((s) => s.pf);
    const s = pf("s"), all = pf("all");
    return { hasProofs: hasProofs(types), s: s.length, all: all.length, years: s.map((x) => x.y), mints: [...new Set(s.map((x) => x.m))], old: all.filter((x) => x.y < 1968).map((x) => x.y + "|" + x.m), noDup: new Set(s.map(slotKey)).size === s.length };
  });
  ok("app knows Lincoln proof years", r.hasProofs);
  ok("S proofs only: 1968-1982, 1983-2008, 2010-2011 = 43 spots", r.s === 43);
  ok("all spots are S", r.mints.join() === "S");
  ok("no 2009 proofs built (added by hand)", !r.years.includes(2009));
  ok("stops at the album's end year (2011)", Math.max(...r.years) === 2011);
  ok("no duplicate spots", r.noDup);
  ok("All proofs adds six 1959-1964 Philadelphia spots", r.all === 49 && r.old.length === 6 && r.old[0] === "1959|");
  console.log("errors", JSON.stringify(errors)); await b.close();
})();
