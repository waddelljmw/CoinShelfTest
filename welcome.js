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
// Each tip sits next to the real field it is about (never on top of it). Tapping a choice moves on by itself;
// typed fields (year, price) wait for Next so the guide never jumps while you type.
let guide = null; // { step } while the guide is on
const SAVE_STEP = 5;
const GUIDE_STEPS = [
  { sel: [".what-btn[data-v=us]"], text: "First pick what you\u2019re adding. For a coin like a Morgan dollar or a wheat cent, tap US coin.", done: () => draft && draft._what },
  { sel: ["#typeSearch"], above: true, text: "Type part of the coin's name (like \u201CMorgan\u201D), then tap it in the list.", done: () => draft && draft.typeId },
  { sel: ["[data-f=year]"], text: "Type the year on the coin. Pick the mint mark too if you know it. Then tap Next.", next: true },
  { sel: ["[data-f=grade]"], text: "Tap here and pick the grade (how worn the coin is). Your best guess is fine.", done: () => draft && draft.grade },
  { sel: ["[data-f=paid]"], text: "Type what you paid. Don't know? Leave it and tap Next.", next: true },
  { sel: ["#coinForm button[type=submit]"], above: true, text: "Tap here to save your coin." },
  { sel: [".miss-banner, .card"], text: "This is your coin. \u201CMissing\u201D lists details still blank; tap Fill in whenever you have them.", next: true },
  { sel: [".album-chip, .rowline"], text: () => "Where it's kept: " + guideWhere() },
];
function guideWhere() {
  const m = location.hash.match(/^#coin-(.+)$/), c = m && getCoin(m[1]);
  if (!c) return "see My Coins.";
  const a = c.albumId && getAlbum(c.albumId), bx = c.boxId && getBox(c.boxId);
  return a ? "in your album \u201C" + albumTitle(a) + "\u201D." : bx ? "in " + boxText(c) + "." : "in My Coins (open it from the menu to see every coin).";
}
function guidePlace() { // put the bubble just above or below the highlighted field, so the field stays free to tap
  const b = document.getElementById("guideBubble"), t = document.querySelector(".guide-hl");
  if (!b || !guide) return;
  if (!t) { b.className = ""; b.style.top = "70px"; return; } // below the top bar, so the menu and ✕ stay free
  const r = t.getBoundingClientRect(), h = b.offsetHeight, vh = window.innerHeight;
  let above = !!GUIDE_STEPS[guide.step].above;
  if (!above && r.bottom + h + 16 > vh - 70) above = true;
  if (above && r.top - h - 16 < 64) above = false; // never over the top bar or the pop-up's ✕
  b.className = above ? "g-above" : "g-below";
  b.style.top = Math.max(64, Math.min(vh - h - 4, above ? r.top - h - 12 : r.bottom + 12)) + "px";
}
function guideBubble() {
  let b = document.getElementById("guideBubble");
  document.querySelectorAll(".guide-hl").forEach((x) => x.classList.remove("guide-hl"));
  if (!guide) { if (b) b.remove(); return; }
  const s = GUIDE_STEPS[guide.step], last = guide.step === GUIDE_STEPS.length - 1;
  if (!b) { b = document.createElement("div"); b.id = "guideBubble"; b.setAttribute("role", "status"); document.body.appendChild(b); }
  b.innerHTML = `<div class="small muted">Step ${guide.step + 1 - guide.base} of ${GUIDE_STEPS.length - guide.base}</div><div>${esc(typeof s.text === "function" ? s.text() : s.text)}</div>
    <div class="btn-row"><button class="btn" data-act="guideSkip">${last ? "Done" : "Skip guide"}</button>${s.next ? `<button class="btn primary" data-act="guideNext">Next</button>` : ""}</div>`;
  let t = null;
  for (const q of s.sel) { t = document.querySelector(q); if (t) break; }
  if (t) {
    const d = t.closest("details"); if (d && !d.open) d.open = true; // a closed section opens so the field can be seen
    t.classList.add("guide-hl"); t.scrollIntoView({ block: "center" });
  }
  guidePlace();
}
function guideSync() { // follow the person: finished choices move on, saving moves to the coin page, leaving it ends the guide
  if (!guide) return;
  const onCoin = location.hash.startsWith("#coin-");
  // The guide is for a first coin: it ends if the form is closed before saving, or a bar, roll, set or other item is picked.
  if (!onCoin && ($("#sheet").hidden || (draft && (draft.item || (draft._what && draft._what !== "us"))))) { guide = null; guideBubble(); return; }
  if (onCoin && guide.step < SAVE_STEP + 1) guide.step = SAVE_STEP + 1;
  else if (!onCoin && guide.step > SAVE_STEP) guide = null;
  else if (!onCoin) { let s = GUIDE_STEPS[guide.step]; while (s && s.done && s.done() && guide.step < SAVE_STEP) s = GUIDE_STEPS[++guide.step]; }
  guideBubble();
}
let guideTimer = null;
const guideLater = () => { if (guide) { clearTimeout(guideTimer); guideTimer = setTimeout(guideSync, 60); } };
const guideWatch = new MutationObserver(guideLater);
["#view", "#sheet"].forEach((q) => { const e = document.querySelector(q); if (e) guideWatch.observe(e, { childList: true, subtree: true }); }); // not the bubble itself, or it would loop
document.addEventListener("change", guideLater);
window.addEventListener("hashchange", () => setTimeout(guideSync, 0));
window.addEventListener("resize", () => guidePlace());
document.addEventListener("scroll", () => guidePlace(), true); // the form scrolls inside the pop-up

Object.assign(actions, {
  word: (el) => { const w = WORDS[el.dataset.w]; if (w) openSheet(`<div class="sheet-head"><h2>${esc(w[0])}</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div><p>${esc(w[1])}</p>`); },
  startCollection: () => openSheet(`<div class="sheet-head"><h2>Add your first coin</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
    <p><b>How much do you want to see?</b> You can change this later in Options.</p>${levelChips()}
    <p>Want a one-minute walk-through? Small tips appear over the real form. You can skip at any time.</p>
    <div class="btn-row"><button class="btn primary block" data-act="guideStart">Show me how (1 minute)</button><button class="btn block" data-act="guideNoThanks">Skip</button></div>`),
  guideNoThanks: () => { closeSheet(); openCoinForm(null); },
  guideStart: () => { if (!$("#sheet").hidden) closeSheet(); openCoinForm(null); const chooser = !!document.querySelector(".what-btn"); guide = { step: chooser ? 0 : 1, base: chooser ? 0 : 1 }; guideBubble(); }, // the "What is it?" step only when that chooser shows
  guideNext: () => { if (guide && guide.step < GUIDE_STEPS.length - 1) { guide.step++; guideBubble(); } },
  guideSkip: () => { guide = null; guideBubble(); },
});
