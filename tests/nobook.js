// Step 11.1: coin facts (which dates, proof spots, varieties, FB/FBL and SMS ticks) come from catalog/bookfacts.js,
// not from the price files. Empty the price list in the page and everything must stay exactly as it was.
// Every expected number was recorded from v0.58.9, before the facts were split out.
const { chromium } = require("./_compat");
const path = require("path");
const ok = (name, v) => console.log((v ? "PASS " : "FAIL ") + name);
const J = JSON.stringify;

const probe = () => {
  const cc = (o) => ({ ...blankCoin(), gradeMode: "raw", grade: "MS-65", ...o });
  const al = { kind: "album", id: "x", typeId: "morgan-dollar", typeIds: ["morgan-dollar"], layout: "dates", start: 1878, end: 1921, removed: [] };
  const form = (o) => { draft = cc({ ...o, _isNew: true }); renderCoinForm(); const f = document.querySelector("#coinForm"); const t = f ? f.innerText : ""; return [/Full Bands/.test(t), /Full Bell Lines/.test(t)]; };
  return {
    washingtonSpots: [EXACT_SLOTS["washington-silver"].length, EXACT_SLOTS["washington-clad"].length],
    washingtonAlbums: [buildAlbumSlots(["washington-silver"], "dates", 1932, 1964, false).length, buildAlbumSlots(["washington-clad"], "dates", 1965, 1998, false).length],
    washington1932: EXACT_SLOTS["washington-silver"].find((x) => x[0] === 1932),
    proofYears: ["morgan-dollar", "franklin-half", "kennedy-clad", "silver-eagle", "mercury-dime"].map((id) => { const y = proofYears(id); return [y.length, y[0], y[y.length - 1], proofMint(id, 1968)]; }),
    proofSpots: [buildAlbumSlots(["franklin-half"], "dates", 1948, 1963, "all").length, buildAlbumSlots(["morgan-dollar"], "dates", 1878, 1921, "all").length, buildAlbumSlots(["kennedy-clad"], "dates", 1971, 2020, "s").length, buildAlbumSlots(["silver-eagle"], "dates", 1986, 2024, "all").length],
    morgan1878Choices: bookVarieties(cc({ typeId: "morgan-dollar", year: "1878", mint: "" })),
    morgan1878Proof: bookVarieties(cc({ typeId: "morgan-dollar", year: "1878", mint: "", grade: "PR-63" })),
    spotChoices: [spotVarietyOptions(al, 1878, "", "morgan-dollar"), spotVarietyOptions(al, 1921, "", "morgan-dollar"), spotVarietyOptions(al, 2017, "", "silver-eagle")],
    eagleProof: bookVarieties(cc({ typeId: "silver-eagle", year: "2017", mint: "S", grade: "PR-69" })),
    smsTick: [["washington-silver", "1964"], ["washington-silver", "1965"], ["washington-clad", "1966"], ["roosevelt-silver", "1960"], ["morgan-dollar", "1881"]].map(([t, y]) => hasSms(cc({ typeId: t, year: y }))),
    labels: [gradeText(cc({ typeId: "mercury-dime", year: "1940", fbl: true })), gradeText(cc({ typeId: "franklin-half", year: "1955", fbl: true })), gradeText(cc({ typeId: "morgan-dollar", year: "1881", fbl: true })), gradeText(cc({ typeId: "washington-silver", year: "1964", sms: true })), gradeText(cc({ typeId: "washington-silver", year: "1965", sms: true })), gradeText(cc({ typeId: "mercury-dime", year: "1940", fbl: true, grade: "PR-65" }))],
    ticks: [form({ typeId: "mercury-dime", year: "1940" }), form({ typeId: "franklin-half", year: "1955" }), form({ typeId: "morgan-dollar", year: "1881" })],
  };
};

const WANT = {
  washingtonSpots: [32, 33],
  washingtonAlbums: [83, 64],
  washington1932: [1932, "P D S"],
  proofYears: [[28, 1878, 1921, "S"], [14, 1950, 1963, "S"], [54, 1971, 2025, "S"], [39, 1986, 2025, "S"], [7, 1936, 1942, "S"]],
  proofSpots: [49, 124, 147, 155],
  morgan1878Choices: ["8 Tail Feathers", "7 Tail Feathers, Reverse of 1878", "7 Over 8 Tail Feathers, Strong", "7 Over 8 Tail Feathers, Weak", "7 Tail Feathers, Reverse of 1879"],
  morgan1878Proof: ["7 Tail Feathers, Reverse of 1878", "7 Tail Feathers, Reverse of 1879", "8 Tail Feathers"],
  spotChoices: [["8 Tail Feathers", "7 Tail Feathers, Reverse of 1878", "7 Over 8 Tail Feathers, Strong", "7 Over 8 Tail Feathers, Weak", "7 Tail Feathers, Reverse of 1879"], ["Chapman", "Zerbe"], ["(P)", "(S)", "(W)", "San Francisco (S)", "West Point (W)"]],
  eagleProof: ["San Francisco (S)", "West Point (W)"],
  smsTick: [true, false, true, false, false],
  labels: ["Raw MS-65 FB", "Raw MS-65 FBL", "Raw MS-65", "Raw MS-65 SMS", "Raw MS-65", "Raw PR-65"],
  ticks: [[true, false], [false, true], [false, false]],
};

(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + path.resolve(__dirname, "../index.html")); await p.waitForTimeout(400);

  const before = await p.evaluate(probe);
  Object.keys(WANT).forEach((k) => ok("with prices: " + k, J(before[k]) === J(WANT[k])));

  // Now take every price out of the page.
  await p.evaluate(() => { PRICE_BOOK.series = {}; PRICE_BOOK.mintage = {}; });
  ok("price list is empty", (await p.evaluate(() => Object.keys(PRICE_BOOK.series).length)) === 0);
  const after = await p.evaluate(probe);
  Object.keys(WANT).forEach((k) => ok("no prices: " + k, J(after[k]) === J(WANT[k])));
  ok("Washington album still has its spots", after.washingtonAlbums[0] === 83);
  ok("no page errors", errors.length === 0);
  console.log("errors", J(errors));
  await b.close();
})();
