// Step 9.4c: Simple mode. Three levels decide only what is SHOWN. No saved coin or setting is ever changed or removed.
// No saved level means "everything" (today's app), so an existing collection looks exactly as before.
const LEVELS = [
  ["simple", "Simple", "Add coins, bars and rounds. Home, My Coins and Coin Value."],
  ["collector", "Collector", "Simple, plus albums, storage, want lists, stacks, Insurance Report and Value over time."],
  ["everything", "Everything", "The whole app, including selling and Seller Mode."],
];
const levelKey = () => { const k = settings().level; return LEVELS.some((l) => l[0] === k) ? k : "everything"; };
const levelAtLeast = (k) => LEVELS.findIndex((l) => l[0] === levelKey()) >= LEVELS.findIndex((l) => l[0] === k);
// Add coin: for a NEW coin, Simple leaves out these sections (type, year/mint, grade, cost, notes stay). Editing a saved coin shows all.
const SIMPLE_HIDDEN_SECTIONS = ["status", "holder", "errors"];
const levelHidesSection = (key) => levelKey() === "simple" && draft && draft._isNew && SIMPLE_HIDDEN_SECTIONS.includes(key);
function levelChips() {
  return `<div class="chips">${LEVELS.map(([k, n]) => `<button class="chip ${levelKey() === k ? "on" : ""}" data-act="setLevel" data-v="${k}" aria-pressed="${levelKey() === k}">${levelKey() === k ? "✓ " : ""}${n}</button>`).join("")}</div>
    <div class="hint">${LEVELS.map(([k, n, line]) => `<div style="${levelKey() === k ? "font-weight:600" : ""}"><b>${esc(n)}:</b> ${esc(line)}</div>`).join("")}<div style="margin-top:4px">Switching only hides or shows screens. Nothing you saved changes or is lost.</div></div>`;
}
function levelOptionsHtml() {
  return `<div class="card"><b>How much to show</b>${levelChips()}</div>`; // not a folded section: always visible at the top
}
function syncLevelMenu() { // runs on every page draw (called from syncShowsMenu)
  const c = levelAtLeast("collector");
  ["albums", "boxes", "wants"].forEach((g) => { const b = document.querySelector(`#menu [data-go=${g}]`); if (b) b.hidden = !c; });
  const rep = document.querySelector("#menu [data-act=openReport]"); if (rep) rep.hidden = !c;
  const st = $("#menuStacks"); if (st) st.hidden = !c || !hasStackItem();
  if (!levelAtLeast("everything")) ["#menuShows", "#menuReports", "#menuBiz"].forEach((s) => { const e = $(s); if (e) e.hidden = true; });
}
Object.assign(actions, {
  setLevel: (el) => {
    saveSettings({ level: el.dataset.v });
    if (!$("#sheet").hidden && $("#sheet [data-act=guideStart]")) { $$("#sheet .chips").forEach((c) => { c.outerHTML = levelChips(); }); return; } // welcome sheet: stay open
    render();
  },
});
if (typeof SNAPSHOT_BLOCK !== "undefined") SNAPSHOT_BLOCK.add("setLevel");
