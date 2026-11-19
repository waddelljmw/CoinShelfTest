// Step 9.4b: welcome card on an empty app, the optional guided first coin, and plain-words help (the small ⓘ).
// Nothing here is saved: the guide only points at the real screens, and never blocks typing.

/* ---------- plain-words help: one list, add new words here ---------- */
const WORDS = {
  melt: ["Melt value", "What the metal in a coin would be worth by weight if it were melted. It only applies to silver, gold and other metal coins."],
  spot: ["Spot price", "Today's market price for a metal: per ounce for gold, silver and platinum, per pound for copper. The app uses it to work out melt values."],
  redbook: ["Red Book", "The yearly price guide for U.S. coins. The app uses its values for a coin unless you type in your own."],
  rawslab: ["Raw / Slab", "Raw means a coin that is not in a sealed holder. A slab is a coin graded and sealed in hard plastic by a service such as PCGS or NGC."],
  keptin: ["Kept in", "Where the coin physically is: an album, a storage box, a display box, or loose in a flip."],
  seller: ["Seller Mode", "Extra tools for people who buy and sell coins: business stock, shows and sales reports. Leave it off if you only collect."],
  snapshot: ["Snapshot", "A view-only copy of your collection saved as one file. Friends can look at it but can't change anything."],
  keydate: ["Key date", "A date with a very low mintage: 10% or less of a typical year for that coin, and under 1.5 million struck. The app works it out from U.S. Mint records. It's the app's own rule, not anyone's official list."],
  details: ["Details coin", "A coin with a problem (cleaned, damaged, repaired). It has no Red Book value because the book prices undamaged coins."],
};
let shownWords = new Set();
const wordsReset = () => { shownWords = new Set(); }; // the ⓘ shows only where a word first appears on a page
function wi(k, always) { // always: show on every row (the Key date tag), not only the first one on a page
  if (!WORDS[k] || (!always && shownWords.has(k))) return "";
  shownWords.add(k);
  return `<button type="button" class="info-btn" data-act="word" data-w="${k}" aria-label="What is ${esc(WORDS[k][0])}?">ⓘ</button>`;
}

/* ---------- welcome card (Home, phone app, no coins yet) ---------- */
function welcomeCard() {
  return `<div class="card welcome"><b>${store.mode === "demo" ? "Demo walkthrough" : "Welcome to Coin Cabinet"}</b>
    <div class="small muted" style="margin:4px 0 8px">${store.mode === "demo" ? "Follow the steps to add a made-up practice coin and see how the app works. Nothing is saved, and your real coins are not here." : "Keep track of every coin you own, what it's worth and where it's kept."}</div>
    <div class="btn-row"><button class="btn primary block" data-act="startCollection">${store.mode === "demo" ? "Start the demo walkthrough" : "Start my collection"}</button>
    ${store.mode === "demo" ? `<button class="btn block" data-act="demoFull">See a full sample collection</button>` : `<button class="btn block" data-act="tryDemo">Try with sample coins</button><button class="btn block" data-act="openBackup">I have a backup file</button>`}</div></div>`;
}

/* ---------- guided first coin ---------- */
// Each tip sits next to the real field it is about (never on top of it). Tapping a choice moves on by itself;
// typed fields (year, price) wait for Next so the guide never jumps while you type.
let guide = null; // { step } while the guide is on
const SAVE_STEP = 6;
const GUIDE_STEPS = [
  { sel: [".what-btn[data-v=us]"], above: true, text: "First pick what you\u2019re adding. For a coin like a Morgan dollar or a wheat cent, tap US coin.", next: true, done: () => draft && draft._what },
  { sel: ["[data-f=year]"], text: "Type the year on the coin (it also narrows the list of coin types). Then tap Next.", next: true },
  { sel: ["#typeSearch"], above: true, text: "Now the coin type: type part of its name (like \u201CMorgan\u201D) and tap it in the list. Not sure? Tap Next.", next: true, done: () => draft && draft.typeId },
  { sel: ["[data-f=grade]"], text: "Tap here and pick the grade (how worn the coin is). Your best guess is fine.", next: true, done: () => draft && draft.grade },
  { sel: [".src-chips"], text: "Where did it come from? Tap Coin Shop or whichever fits. Not sure? Tap Next.", next: true, done: () => draft && draft._sourceKind },
  { sel: ["[data-f=paid]"], text: "Type what you paid. Don't know? Leave it and tap Next.", next: true },
  { sel: ["#coinForm button[type=submit]"], above: true, text: () => "Tap here to save your coin." + (guide && guide.note ? " " + guide.note : "") },
  { sel: [".miss-banner, .card"], text: "This is your coin. It is saved in My Coins (open it from the menu). \u201CMissing\u201D lists details still blank; tap Fill in whenever you have them." },
];
function guidePlace() { // put the bubble just above or below the highlighted field, so the field stays free to tap
  const b = document.getElementById("guideBubble"), t = document.querySelector(".guide-hl");
  if (!b || !guide) return;
  const vh = window.visualViewport ? visualViewport.height : window.innerHeight; // the phone keyboard shrinks this
  if (!t) { b.className = ""; b.style.top = "70px"; return; } // below the top bar, so the menu and ✕ stay free
  let r = t.getBoundingClientRect(); const h = b.offsetHeight;
  const room = r.top - h - 16 - 64; // space above the field for a tip that must sit above it
  if (GUIDE_STEPS[guide.step].above && room < 0 && !t.dataset.gpad) { t.dataset.gpad = "1"; t.style.marginTop = Math.ceil(-room) + "px"; r = t.getBoundingClientRect(); } // make room instead of covering the list below
  const want = !!GUIDE_STEPS[guide.step].above;
  let above = want;
  if (!above && r.bottom + h + 16 > vh - 70) above = true;
  if (above && !want && r.top - h - 16 < 64) above = false; // never over the top bar or the pop-up's ✕
  // a step that asked for "above" stays above: its list or button sits below and must stay uncovered
  b.className = above ? "g-above" : "g-below";
  b.style.top = Math.max(64, Math.min(vh - h - 4, above ? r.top - h - 12 : r.bottom + 12)) + "px";
}
function guidePrev() { // the nearest earlier step whose field is on screen now (-1 = none, so no Back button)
  if (!guide || guide.step > SAVE_STEP) return -1;
  for (let i = guide.step - 1; i >= guide.base; i--) if (document.querySelector(GUIDE_STEPS[i].sel.join(","))) return i;
  return -1;
}
function guideBubble() {
  let b = document.getElementById("guideBubble");
  document.querySelectorAll(".guide-hl").forEach((x) => { x.classList.remove("guide-hl"); if (x.dataset.gpad) { delete x.dataset.gpad; x.style.marginTop = ""; } });
  if (!guide) { if (b) b.remove(); return; }
  const s = GUIDE_STEPS[guide.step], last = guide.step === GUIDE_STEPS.length - 1;
  if (!b) { b = document.createElement("div"); b.id = "guideBubble"; b.setAttribute("role", "status"); document.body.appendChild(b); }
  b.innerHTML = `<div class="small muted">${store.mode === "demo" ? "Demo walkthrough: " : ""}Step ${guide.step + 1 - guide.base} of ${GUIDE_STEPS.length - guide.base}</div><div>${esc(typeof s.text === "function" ? s.text() : s.text)}</div>
    <div class="btn-row"><button class="btn" data-act="guideSkip">${last ? "Done" : guide.sure ? "Tap again to stop" : "Skip guide"}</button>${guidePrev() >= 0 ? `<button class="btn" data-act="guideBack">Back</button>` : ""}${s.next ? `<button class="btn primary" data-act="guideNext">Next</button>` : ""}</div>`;
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
  word: (el) => { const w = WORDS[el.dataset.w]; if (w) openSheetOver(`<div class="sheet-head"><h2>${esc(w[0])}</h2><button class="x" data-act="wordBack" aria-label="Close">✕</button></div><p>${esc(w[1])}</p>`); },
  wordBack: () => { if (sheetLayers.length && sheetMarks) { sheetMarks--; sheetPopping = true; sheetPopCb = () => sheetLayerBack(); history.back(); } else closeSheet(); },
  startCollection: () => { if (store.mode === "demo") return actions.guideStart(); return openSheet(`<div class="sheet-head"><h2>Add your first coin</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
    <p><b>How much do you want to see?</b> You can change this later in Options.</p>${levelChips()}
    <p>Want a one-minute walk-through? Small tips appear over the real form. You can skip at any time.</p>
    <div class="btn-row"><button class="btn primary block" data-act="guideStart">Show me how (1 minute)</button><button class="btn block" data-act="guideNoThanks">Skip</button></div>`); },
  guideNoThanks: () => { closeSheet(); openCoinForm(null); },
  guideStart: () => { if (!$("#sheet").hidden) closeSheet(); openCoinForm(null); const us = document.querySelector(".what-btn[data-v=us]"); if (us) us.click(); /* the walk-through is for a US coin, so skip "What is it?" */ const chooser = !!document.querySelector(".what-btn"); guide = { step: chooser ? 0 : 1, base: chooser ? 0 : 1 }; guideBubble(); }, // the "What is it?" step only when that chooser shows
  guideBack: () => { const i = guidePrev(); if (i >= 0) { guide.step = i; guide.sure = false; guide.note = ""; guideBubble(); } },
  guideNext: () => {
    if (guide && guide.step === 2 && draft && !draft.typeId && draft._typeQ) { const m = typeMatches(draft._typeQ), all = m.recent.concat(m.rest); const ex = all.filter((t) => t.name.toLowerCase() === draft._typeQ.trim().toLowerCase()), one = ex.length === 1 ? ex : all.length === 1 ? all : []; if (one.length) pickType(one[0].id); } // typed a name but didn't tap the list: one match is enough
  // Next moves the screen along too (the form may already have moved the guide)
    if (guide && guide.step < GUIDE_STEPS.length - 1) { guide.step++; guide.sure = false; guide.note = ""; guideBubble(); } },
  guideSkip: () => { // leaving takes two taps (except on the last step), so a slip of the thumb doesn't end it
    if (guide && guide.step < GUIDE_STEPS.length - 1 && !guide.sure) { guide.sure = true; guideBubble(); clearTimeout(guide.sureTimer); const g = guide; g.sureTimer = setTimeout(() => { g.sure = false; if (guide === g) guideBubble(); }, 3000); return; }
    if (guide) clearTimeout(guide.sureTimer);
    guide = null; guideBubble();
  },
});

// If saving is refused, say why inside the guide, so the reason can't hide behind the tip.
const toastBase = toast;
toast = function (msg, action) { toastBase(msg, action); if (guide && guide.step === SAVE_STEP && !action) { guide.note = "\u2192 " + msg; guideBubble(); } };
