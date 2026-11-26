// Step 33b (v0.120.0): 8 more album numbers from store listings.
const { chromium } = require("./_compat");
const path = require("path");
const ok = (name, v) => { console.log((v ? "PASS " : "FAIL ") + name); if (!v) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + path.resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const want = [["Whitman", "9004", 1909, 1940], ["Whitman", "9030", 1941, 1974], ["Whitman", "9000", 1959, 1998], ["H.E. Harris", "2673", 1941, 1974],
    ["H.E. Harris", "2674", 1975, 2013], ["Whitman", "9149", 1979, 1981], ["Whitman", "3394", 1946, 2022], ["Dansco", "7181", 1986, 2021]];
  const r = await p.evaluate((want) => want.map(([br, n]) => {
    const i = lookupAlbum(br, n); if (!i) return null;
    const s = buildAlbumSlots(i.types, "dates", i.start, i.end, "");
    const list = Array.isArray(s) ? s : s.slots, ys = list.map((x) => +x.y);
    return [i.start, i.end, Math.min(...ys), Math.max(...ys), i.types.length];
  }), want);
  want.forEach(([br, n, a, z], k) => ok(br + " " + n + " " + JSON.stringify(r[k]), !!r[k] && r[k][0] === a && r[k][1] === z && r[k][2] === a && r[k][3] === z));
  console.log("errors", errors); await b.close();
})();
