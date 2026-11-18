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
      dime16P: t({ typeId: "mercury-dime", year: 1916, mint: "" }), nickel38D: t({ typeId: "buffalo-nickel", year: 1938, mint: "D" }),
      cappedHalf: t({ typeId: "capped-bust-half", year: 1830, mint: "" }), seatedDime37: t({ typeId: "seated-dime", year: 1837, mint: "" }), proof: t({ typeId: "morgan-dollar", year: 1893, mint: "S", grade: "PR-63" }),
      line: mintageLine({ typeId: "mercury-dime", year: 1916, mint: "D", gradeMode: "raw", grade: "VF-20" }), lineP: mintageLine({ typeId: "lincoln-wheat", year: 1925, mint: "", gradeMode: "raw", grade: "VF-20" }),
      // every record belongs to a real type and a real mint for that type, and no year is outside the type's dates
      bad: Object.entries(MINT_RECORDS).flatMap(([id, yrs]) => Object.entries(yrs).flatMap(([y, row]) => Object.keys(row).filter((m) => { const ty = TYPE_BY_ID[id]; return !ty || +y < ty.start || +y > ty.end || !ty.mints.includes(m); }).map((m) => id + y + m))),
      // part 2: halves with commemoratives taken out, 1964-65 by date, Seated series
      half21S: t({ typeId: "walking-liberty-half", year: 1921, mint: "S" }), half38D: t({ typeId: "walking-liberty-half", year: 1938, mint: "D" }),
      half36D: t({ typeId: "walking-liberty-half", year: 1936, mint: "D" }), half22P: t({ typeId: "walking-liberty-half", year: 1922, mint: "" }),
      barber92P: t({ typeId: "barber-half", year: 1892, mint: "" }), barber15S: t({ typeId: "barber-half", year: 1915, mint: "S" }),
      franklin55: t({ typeId: "franklin-half", year: 1955, mint: "" }), quarter93P: t({ typeId: "barber-quarter", year: 1893, mint: "" }),
      morgan00P: t({ typeId: "morgan-dollar", year: 1900, mint: "" }), kennedy64D: t({ typeId: "kennedy-90", year: 1964, mint: "D" }),
      quarter64P: t({ typeId: "washington-silver", year: 1964, mint: "" }), cent65: t({ typeId: "lincoln-memorial-copper", year: 1965, mint: "" }),
      kennedy65: t({ typeId: "kennedy-40", year: 1965, mint: "" }), twenty76CC: t({ typeId: "twenty-cent", year: 1876, mint: "CC" }),
      seatedQ73CC: t({ typeId: "seated-quarter", year: 1873, mint: "CC" }),
      line64: mintageLine({ typeId: "washington-silver", year: 1964, mint: "", gradeMode: "raw", grade: "VF-20" }),
      line65: mintageLine({ typeId: "kennedy-40", year: 1965, mint: "", gradeMode: "raw", grade: "VF-20" }),
      // a loaded price file still wins
      wins: (() => { const keep = PRICE_BOOK.mintage; const c = { typeId: "morgan-dollar", year: 1893, mint: "S", gradeMode: "raw", grade: "VF-20" }; const a = mintageInfo(c); PRICE_BOOK.mintage = keep; return a && a.text; })(),
    };
  });
  ok("1916-D Mercury dime", r.mercury16D === "264,000"); ok("1931-S wheat cent", r.wheat31S === "866,000"); ok("1914-D wheat cent", r.wheat14D === "1,193,000");
  ok("1893-S Morgan", r.morgan93S === "100,000"); ok("1932-D Washington quarter", r.wash32D === "436,800"); ok("1950-D Jefferson nickel", r.nickel50D === "2,630,030");
  ok("1928 Peace (P)", r.peace28P === "360,649"); ok("1921-D Morgan", r.morgan21D === "20,345,000");
  ok("1921 Morgan P left out", r.morgan21P === null); ok("1909-S cent left out", r.cent09S === null); ok("1916 dime P left out", r.dime16P === null);
  ok("1938-D Buffalo left out", r.nickel38D === null); ok("Capped Bust half left out", r.cappedHalf === null); ok("1837 Seated dime left out", r.seatedDime37 === null);
  ok("1921-S Walker", r.half21S === "548,000"); ok("1938-D Walker (commems out)", r.half38D === "491,600"); ok("1936-D Walker", r.half36D === "4,252,400");
  ok("1922 Walker: only commems struck, none shown", r.half22P === null); ok("1892 Barber half (Columbian out)", r.barber92P === "935,245");
  ok("1915-S Barber half (Pan-Pac out)", r.barber15S === "1,604,000"); ok("1955 Franklin", r.franklin55 === "2,876,381");
  ok("1893 quarter (Isabella out)", r.quarter93P === "5,444,815"); ok("1900 Morgan (Lafayette out)", r.morgan00P === "8,830,912");
  ok("1964-D Kennedy", r.kennedy64D === "156,205,446"); ok("1964 quarter P+S", r.quarter64P === "564,341,347");
  ok("1965 cent", r.cent65 === "1,494,864,900"); ok("1965 Kennedy", r.kennedy65 === "63,519,366");
  ok("1876-CC twenty-cent", r.twenty76CC === "10,000"); ok("1873-CC Seated quarter", r.seatedQ73CC === "16,462");
  ok("1964 line says dated + San Francisco", /coins dated 1964/.test(r.line64) && /San Francisco/.test(r.line64));
  ok("1965 line says no mint marks", /coins dated 1965/.test(r.line65) && /no mint marks/.test(r.line65) && !/struck that year/.test(r.line65)); ok("proof coin gets no mint-records number", r.proof === null);
  ok("line says where from", /from U\.S\. Mint records, struck that year/.test(r.line) && !/includes any proofs/.test(r.line));
  ok("Philadelphia line says includes proofs", /includes any proofs/.test(r.lineP));
  ok("every record fits its type, years and mints " + JSON.stringify(r.bad), r.bad.length === 0);
  console.log("errors", errors); await b.close();
})();
