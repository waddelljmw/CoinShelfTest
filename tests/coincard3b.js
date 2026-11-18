// Step 3b (v0.81.0): coin card facts shared by empty album spots and owned coin pages. Nothing new is saved.
const { chromium } = require("./_compat");
const path = require("path");
const ok = (name, v) => { console.log((v ? "PASS " : "FAIL ") + name); if (!v) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + path.resolve(__dirname, "../index.html")); await p.waitForTimeout(300);
  const r = await p.evaluate(() => {
    PRICE_BOOK.mintage = {};
    const mk = (o) => ({ gradeMode: "raw", grade: "VF-20", ...o });
    const key = (o) => !!keyDateInfo(mk(o));
    put("c_k1", { kind: "coin", id: "k1", status: "owned", typeId: "lincoln-wheat", year: 1914, mint: "D", grade: "F-12", price: 100, qty: 1, createdAt: 1 });
    put("c_k2", { kind: "coin", id: "k2", status: "owned", typeId: "lincoln-wheat", year: 1914, mint: "D", grade: "G-4", price: 80, qty: 1, createdAt: 2 });
    put("c_k3", { kind: "coin", id: "k3", status: "owned", typeId: "lincoln-wheat", year: 1925, mint: "", grade: "F-12", price: 1, qty: 1, createdAt: 3 });
    const wheat14 = mk({ typeId: "lincoln-wheat", year: 1914, mint: "D" });
    return {
      keys: [key({ typeId: "lincoln-wheat", year: 1914, mint: "D" }), key({ typeId: "mercury-dime", year: 1916, mint: "D" }), key({ typeId: "washington-silver", year: 1932, mint: "D" }), key({ typeId: "morgan-dollar", year: 1893, mint: "S" })],
      notKeys: [key({ typeId: "lincoln-wheat", year: 1925, mint: "" }), key({ typeId: "morgan-dollar", year: 1921, mint: "D" }), key({ typeId: "jefferson-nickel", year: 1950, mint: "D" }), key({ typeId: "lincoln-wheat", year: 1909, mint: "S" })],
      proofNo: key({ typeId: "morgan-dollar", year: 1893, mint: "S", grade: "PR-63" }),
      own: ownCountOf(wheat14), own25: ownCountOf(mk({ typeId: "lincoln-wheat", year: 1925, mint: "P" })), ownNone: ownCountOf(mk({ typeId: "mercury-dime", year: 1916, mint: "D" })),
      spotKey: coinCardHtml(wheat14, { spot: true }), spotEmpty: coinCardHtml(mk({ typeId: "washington-silver", year: 1940, mint: "S" }), { spot: true }),
      spotFilled: coinCardHtml(wheat14, { spot: true, inAlbum: true }),
      ownedPage: coinCardHtml(getCoin("k1")), ownedPlain: coinCardHtml(getCoin("k3")),
      varieties: coinCardHtml(mk({ typeId: "lincoln-wheat", year: 1955, mint: "" })),
    };
  });
  ok("key dates flagged", r.keys.every(Boolean));
  ok("common dates not flagged", r.notKeys.every((x) => !x));
  ok("proof gets no key flag", !r.proofNo);
  ok("you-own counts both coins of the date", r.own === 2 && r.own25 === 1 && r.ownNone === 0);
  ok("empty spot card: key date, metal row skipped for copper, own count", /Key date/.test(r.spotKey) && /Not in this album yet/.test(r.spotKey) && /You own 2/.test(r.spotKey));
  ok("empty spot with nothing owned says empty spot, melt shown for silver", /Empty spot in your album/.test(r.spotEmpty) && /Silver: 0\.18/.test(r.spotEmpty));
  ok("filled spot says so", /This spot is filled/.test(r.spotFilled));
  ok("owned coin page card shows key date and count, no melt row", /Key date/.test(r.ownedPage) && /You own 2/.test(r.ownedPage) && !/melt today/.test(r.ownedPage));
  ok("owned common coin with count 1 shows no card", r.ownedPlain === "");
  ok("1955 wheat varieties listed", /Varieties to look for/.test(r.varieties));
  await p.evaluate(() => go("coin-k1")); await p.waitForTimeout(300);
  const page = await p.evaluate(() => document.body.innerText);
  ok("coin page renders the card", /Key date/.test(page) && /You own 2/.test(page));
  ok("no page errors", errors.length === 0);
  if (errors.length) console.log(errors);
  await b.close();
})();
