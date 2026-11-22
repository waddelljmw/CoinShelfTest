// Step 14 "Seller accuracy": platform fees match the Summary after a refund, tax CSV has Type + shipping + refund rows, restore warning.
const { chromium } = require("./_compat");
const http = require("http"), fs = require("fs"), path = require("path");
const root = path.resolve(__dirname, "..");
const srv = http.createServer((q, r) => {
  const u = q.url.split("?")[0];
  fs.readFile(path.join(root, u === "/" ? "index.html" : u), (e, d) => { if (e) { r.statusCode = 404; return r.end(); } r.end(d); });
}).listen(8843);
(async () => {
  const b = await chromium.launch();
  const ok = (n, c) => console.log((c ? "PASS " : "FAIL ") + n);
  const errors = [];
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route("**/api.gold-api.com/**", (r) => r.abort());
  const p = await ctx.newPage(); p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("http://localhost:8843/"); await p.waitForFunction(() => store.mode === "local", null, { timeout: 15000 }); await p.waitForTimeout(300);
  const r = await p.evaluate(() => {
    put("settings", { ...settings(), sellerMode: true }, true);
    const mk = (id, sold) => put("c_" + id, { ...blankCoin(), id, typeId: "morgan-dollar", typeName: "Morgan Dollar", year: 1880, grade: "VF-20", status: "sold", biz: true, qty: 1, paid: "20", sold: { date: "2026-11-01", amount: "50", whereType: "Whatnot", fees: "5", shipping: "3", ...sold } });
    mk("a1", {}); mk("a2", { fees: "8.83", shipping: "2" });
    returnToStock({ dataset: { id: "a2" } }, true); // refund: its fees and shipping stay as costs
    const d = repData({ kind: "year", y: 2026 });
    const platFees = d.platforms.reduce((s, x) => s + x.fees, 0);
    const csv = buildSalesReportCsv(d), tax = buildTaxCsv(2026);
    return { sumFees: d.t.fees, platFees, csvRefund: csv.includes("Business refunded"), taxType: tax.includes("Business") && tax.includes("Type"), taxRefund: tax.includes("Business refunded"), taxShip: tax.includes("Shipping and insurance paid") };
  });
  ok("by-platform fees equal Summary fees (13.83)", Math.abs(r.sumFees - 13.83) < 0.005 && Math.abs(r.platFees - r.sumFees) < 0.005);
  ok("Sales CSV has the refunded row", r.csvRefund);
  ok("tax CSV has Type, shipping column and refund row", r.taxType && r.taxShip && r.taxRefund);
  console.log("errors", JSON.stringify(errors));
  await b.close(); srv.close();
})();
