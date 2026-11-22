// Item 87: 2026 Semiquincentennial coins, and no auto-accepting of 2027.
const { chromium } = require("./_compat");
const http = require("http"), fs = require("fs"), path = require("path");
const root = path.resolve(__dirname, "..");
const srv = http.createServer((q, r) => { const f = path.join(root, q.url.split("?")[0] === "/" ? "index.html" : q.url.split("?")[0]); fs.readFile(f, (e, d) => { if (e) { r.statusCode = 404; r.end(); } else r.end(d); }); }).listen(8765);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("http://localhost:8765/"); await p.waitForTimeout(400);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  const r = await p.evaluate(() => ({
    q: TYPE_BY_ID["semiq-quarter"].varieties["2026|"], qd: TYPE_BY_ID["semiq-quarter"].varieties["2026|D"],
    dime: !!TYPE_BY_ID["emerging-liberty-dime"], half: !!TYPE_BY_ID["enduring-liberty-half"],
    rooseveltEnd: TYPE_BY_ID["roosevelt-clad"].end, kennedyEnd: TYPE_BY_ID["kennedy-clad"].end,
    pDime: yearProblem("emerging-liberty-dime", 2026), pRoos: yearProblem("roosevelt-clad", 2026),
    p2027: yearProblem("jefferson-nickel", 2027), jeffLast: typeLastYear(TYPE_BY_ID["jefferson-nickel"]),
    codes: [ID_CODES["semiq-quarter"], ID_CODES["emerging-liberty-dime"], ID_CODES["enduring-liberty-half"]],
    dup: Object.values(ID_CODES).length !== new Set(Object.values(ID_CODES)).size,
  }));
  ok("5 quarter designs (P and D)", r.q.length === 5 && r.qd.length === 5);
  ok("dime and half types exist", r.dime && r.half);
  ok("Roosevelt and Kennedy clad end 2025", r.rooseveltEnd === 2025 && r.kennedyEnd === 2025);
  ok("2026 dime accepted, 2026 Roosevelt points to Emerging Liberty", !r.pDime && /Emerging Liberty/.test(r.pRoos));
  ok("2027 not auto-accepted (series end at 2026)", r.jeffLast === 2026);
  ok("ID codes unique", !r.dup && r.codes.every(Boolean));
  ok("no page errors", errors.length === 0); if (errors.length) console.log(errors);
  await b.close(); srv.close();
})();
