// Item 86: coin page value = Home value; catalog coins never under face; report Paid = full cost.
const { chromium } = require("./_compat");
const http = require("http"), fs = require("fs"), path = require("path");
const root = path.resolve(__dirname, "..");
const srv = http.createServer((q, r) => { const f = path.join(root, q.url.split("?")[0] === "/" ? "index.html" : q.url.split("?")[0]); fs.readFile(f, (e, d) => { if (e) { r.statusCode = 404; r.end(); } else r.end(d); }); }).listen(8765);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("http://localhost:8765/"); await p.waitForTimeout(400);
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  const r = await p.evaluate(() => {
    const base = blankCoin();
    const c = { ...base, id: "z1", typeId: "shield-nickel", typeName: "Shield Nickel", year: 1870, grade: "Junk", paid: 2, qty: 2, buyTax: 1, buyShip: 1, buyFees: 0 };
    const cheap = typeof meltEach === "function" ? meltEach(c) : null;
    return { best: bestEach(c), face: faceEach(c), cheap, cost: costOf(c), sameAsValue: bestEach(c) === (valueEach(c) ?? meltEach(c) ?? faceEach(c)) || bestEach(c) === faceEach(c) };
  });
  ok("never below face", r.best >= r.face);
  ok("full cost counts tax and shipping (2x2 + 2 = 6)", r.cost === 6);
  ok("no page errors", errors.length === 0); if (errors.length) console.log(errors);
  await b.close(); srv.close();
})();
