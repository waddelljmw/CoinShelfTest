// Step 9.4b: welcome card on an empty app, the optional guided first coin, and plain-words help (the small ⓘ).
// Nothing here is saved: the guide only points at the real screens, and never blocks typing.

/* ---------- plain-words help: one list, add new words here ---------- */
const WORDS = {
  melt: ["Melt value", "What the metal in a coin would be worth by weight if it were melted. It only applies to silver, gold and other metal coins."],
  spot: ["Spot price", "Today's market price for one ounce of a metal. The app uses it to work out melt values."],
  redbook: ["Red Book", "The yearly price guide for U.S. coins. The app uses its values for a coin unless you type in your own."],
  rawslab: ["Raw / Slab", "Raw means a coin that is not in a sealed holder. A slab is a coin graded and sealed in hard plastic by a service such as PCGS or NGC."],
  keptin: ["Kept in", "Where the coin physically is: an album, a storage box, a display box, or loose in a flip."],
  seller: ["Seller Mode", "Extra tools for people who buy and sell coins: business stock, shows and sales reports. Leave it off if you only collect."],
  snapshot: ["Snapshot", "A view-only copy of your collection saved as one file. Friends can look at it but can't change anything."],
  details: ["Details coin", "A coin with a problem (cleaned, damaged, repaired). It has no Red Book value because the book prices undamaged coins."],
};
let shownWords = new Set();
const wordsReset = () => { shownWords = new Set(); }; // the ⓘ shows only where a word first appears on a page
function wi(k) {
  if (!WORDS[k] || shownWords.has(k)) return "";
  shownWords.add(k);
  return `<button type="button" class="info-btn" data-act="word" data-w="${k}" aria-label="What is ${esc(WORDS[k][0])}?">ⓘ</button>`;
}

/* ---------- welcome card (Home, phone app, no coins yet) ---------- */
function welcomeCard() {
  return `<div class="card welcome"><b>Welcome to Coin Cabinet</b>
    <div class="small muted" style="margin:4px 0 8px">Keep track of every coin you own, what it's worth and where it's kept.</div>
    <div class="btn-row"><button class="btn primary block" data-act="startCollection">Start my collection</button>
    <button class="btn block" data-act="tryDemo">Try with sample coins</button></div></div>`;
}

/* ---------- guided first coin ---------- */
let guide = null; // { step } while the guide is on
const GUIDE_STEPS = [
  { sel: ["#typeSearch", "[data-act=what]"], text: "Choose what you're adding. For a US coin, search its name and tap the type." },
  { sel: ["[data-f=year]"], text: "Type the year, then pick the mint mark (the tiny letter on the coin; none means Philadelphia)." },
  { sel: ["[data-f=grade]"], text: "Pick the grade, how worn the coin is. Not sure? Choose your best guess; you can change it later." },
  { sel: ["[data-f=paid]"], text: "Type what you paid. Skip it if you don't know; the coin just shows as “missing” that info." },
  { sel: ["#coinForm button[type=submit]"], text: "Tap here to save the coin." },
  { sel: [".miss-banner, .card"], text: "This is your coin. “Missing” lists details still blank; tap Fill in whenever you have them." },
  { sel: [".album-chip, .rowline"], text: () => "Where it's kept: " + guideWhere() },
];
function guideWhere() {
  const m = location.hash.match(/^#coin-(.+)$/), c = m && getCoin(m[1]);
  if (!c) return "see My Coins.";
  const a = c.albumId && getAlbum(c.albumId), bx = c.boxId && getBox(c.boxId);
  return a ? "in your album “" + albumTitle(a) + "”." : bx ? "in " + boxText(c) + "." : "in My Coins (open it from the menu to see every coin).";
}
function guideBubble() {
  let b = document.getElementById("guideBubble");
  if (!guide) { if (b) b.remove(); document.querySelectorAll(".guide-hl").forEach((x) => x.classList.remove("guide-hl")); return; }
  const s = GUIDE_STEPS[guide.step], last = guide.step === GUIDE_STEPS.length - 1, noNext = last || guide.step === 4; // step 4: tapping Save is the way on
  if (!b) { b = document.createElement("div"); b.id = "guideBubble"; b.setAttribute("role", "status"); document.body.appendChild(b); }
  b.innerHTML = `<div class="small muted">Step ${guide.step + 1} of ${GUIDE_STEPS.length}</div><div>${esc(typeof s.text === "function" ? s.text() : s.text)}</div>
    <div class="btn-row"><button class="btn" data-act="guideSkip">${last ? "Done" : "Skip"}</button>${noNext ? "" : `<button class="btn primary" data-act="guideNext">Next</button>`}</div>`;
  document.querySelectorAll(".guide-hl").forEach((x) => x.classList.remove("guide-hl"));
  let t = null;
  for (const q of s.sel) { t = document.querySelector(q); if (t) break; }
  if (t) {
    const d = t.closest("details"); if (d && !d.open) d.open = true; // a closed section opens so the field can be seen
    t.classList.add("guide-hl"); t.scrollIntoView({ block: "center", behavior: "smooth" });
  }
}
function guideSync() { // follow the person: saving the coin moves the guide to the coin page; leaving it ends the guide
  if (!guide) return;
  const onCoin = location.hash.startsWith("#coin-");
  if (onCoin && guide.step < 5) guide.step = 5;
  else if (!onCoin && guide.step >= 5) guide = null;
  guideBubble();
}
let guideTimer = null;
const guideWatch = new MutationObserver(() => { if (guide) { clearTimeout(guideTimer); guideTimer = setTimeout(guideSync, 60); } });
["#view", "#sheet"].forEach((q) => { const e = document.querySelector(q); if (e) guideWatch.observe(e, { childList: true, subtree: true }); }); // not the bubble itself, or it would loop
window.addEventListener("hashchange", () => setTimeout(guideSync, 0));

Object.assign(actions, {
  word: (el) => { const w = WORDS[el.dataset.w]; if (w) openSheet(`<div class="sheet-head"><h2>${esc(w[0])}</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div><p>${esc(w[1])}</p>`); },
  startCollection: () => openSheet(`<div class="sheet-head"><h2>Add your first coin</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
    <p>Want a one-minute walk-through? Small tips appear over the real form. You can skip at any time.</p>
    <div class="btn-row"><button class="btn primary block" data-act="guideStart">Show me how (1 minute)</button><button class="btn block" data-act="guideNoThanks">Skip</button></div>`),
  guideNoThanks: () => { closeSheet(); openCoinForm(null); },
  guideStart: () => { if (!$("#sheet").hidden) closeSheet(); guide = { step: 0 }; openCoinForm(null); guideBubble(); },
  guideNext: () => { if (guide && guide.step < GUIDE_STEPS.length - 1) { guide.step++; guideBubble(); } },
  guideSkip: () => { guide = null; guideBubble(); },
});
