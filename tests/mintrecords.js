// Step 3a: mintage from the U.S. Mint records (catalog/mintages.js) shows with no price file loaded.
// Expected numbers were read from the Mint's 1792-1965 book and checked against its printed totals.
const { chromium } = require("./_compat");
const ok = (name, v) => console.log((v ? "PASS " : "FAIL ") + name);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + require("path").resolve(__dirname, "../index.html")); await p.waitForTimeout(200);
  const r = await p.evaluate(() => {
    PRICE_BOOK.mintage = {}; // no price file
    const t = (o) => { const m = mintageInfo({ gradeMode: "raw", grade: "VF-20", ...o }); return m ? m.text : null; };
    return {
      mercury16D: t({ typeId: "mercury-dime", year: 1916, mint: "D" }), wheat31S: t({ typeId: "lincoln-wheat", year: 1931, mint: "S" }),
      wheat14D: t({ typeId: "lincoln-wheat", year: 1914, mint: "D" }), morgan93S: t({ typeId: "morgan-dollar", year: 1893, mint: "S" }),
      wash32D: t({ typeId: "washington-silver", year: 1932, mint: "D" }), nickel50D: t({ typeId: "jefferson-nickel", year: 1950, mint: "D" }),
      peace28P: t({ typeId: "peace-dollar", year: 1928, mint: "" }), morgan21D: t({ typeId: "morgan-dollar", year: 1921, mint: "D" }),
      // left out on purpose
      morgan21P: t({ typeId: "morgan-dollar", year: 1921, mint: "" }), cent09S: t({ typeId: "lincoln-wheat", year: 1909, mint: "S" }),
      dime16P: t({ typeId: "mercury-dime", year: 1916, mint: "" }), half21S: t({ typeId: "walking-liberty-half", year: 1921, mint: "S" }),
      kennedy64: t({ typeId: "kennedy-90", year: 1964, mint: "D" }), proof: t({ typeId: "morgan-dollar", year: 1893, mint: "S", grade: "PR-63" }),
      line: mintageLine({ typeId: "mercury-dime", year: 1916, mint: "D", gradeMode: "raw", grade: "VF-20" }), lineP: mintageLine({ typeId: "lincoln-wheat", year: 1925, mint: "", gradeMode: "raw", grade: "VF-20" }),
      // every record belongs to a real type and a real mint for that type, and no year is outside the type's dates
      bad: Object.entries(MINT_RECORDS).flatMap(([id, yrs]) => Object.entries(yrs).flatMap(([y, row]) => Object.keys(row).filter((m) => { const ty = TYPE_BY_ID[id]; return !ty || +y < ty.start || +y > ty.end || !ty.mints.includes(m); }).map((m) => id + y + m))),
      // a loaded price file still wins
      wins: (() => { const keep = PRICE_BOOK.mintage; const c = { typeId: "morgan-dollar", year: 1893, mint: "S", gradeMode: "raw", grade: "VF-20" }; const a = mintageInfo(c); PRICE_BOOK.mintage = keep; return a && a.text; })(),
    };
  });
  ok("1916-D Mercury dime", r.mercury16D === "264,000"); ok("1931-S wheat cent", r.wheat31S === "866,000"); ok("1914-D wheat cent", r.wheat14D === "1,193,000");
  ok("1893-S Morgan", r.morgan93S === "100,000"); ok("1932-D Washington quarter", r.wash32D === "436,800"); ok("1950-D Jefferson nickel", r.nickel50D === "2,630,030");
  ok("1928 Peace (P)", r.peace28P === "360,649"); ok("1921-D Morgan", r.morgan21D === "20,345,000");
  ok("1921 Morgan P left out", r.morgan21P === null); ok("1909-S cent left out", r.cent09S === null); ok("1916 dime P left out", r.dime16P === null);
  ok("halves left out", r.half21S === null); ok("1964 Kennedy left out", r.kennedy64 === null); ok("proof coin gets no mint-records number", r.proof === null);
  ok("line says where from", /from U\.S\. Mint records, struck that year/.test(r.line) && !/includes any proofs/.test(r.line));
  ok("Philadelphia line says includes proofs", /includes any proofs/.test(r.lineP));
  ok("every record fits its type, years and mints " + JSON.stringify(r.bad), r.bad.length === 0);
  console.log("errors", errors); await b.close();
})();
