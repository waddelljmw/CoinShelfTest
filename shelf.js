// Step 4.2: the Home page drawn as a real shelf. Two styles (Options → Shelf style): Bookcase and Safe.
// Every drawing is plain HTML/CSS (no pictures), so it's fast and works offline. Tapping a thing opens its page.
"use strict";

const SHELF_STYLES = [["bookcase", "Bookcase"], ["safe", "Safe"]];
const shelfStyle = () => (settings().shelfStyle === "safe" ? "safe" : "bookcase");
// The Safe style is dark all over the app; the Bookcase follows the phone's day/night setting (only the page around it changes).
function applyShelfStyle() { document.body.classList.toggle("safe", shelfStyle() === "safe"); }

// Short words for a spine: the album's title, plus its years when the title doesn't already have them.
function spineText(a) {
  const t = albumTitle(a);
  const yrs = a.start ? a.start + "–" + (a.end || "") : "";
  return yrs && !/\d{4}/.test(t) ? t + " " + yrs : t;
}
// Albums fill up to 2 shelves of 9 spines. If there are more, the last spot becomes a "+N more" spine that opens Albums.
const SPINES_PER_SHELF = 9, ALBUM_SHELVES = 2, GROUPS_PER_SHELF = 5;
function shelfAlbums() {
  const units = albumUnits();
  if (!units.length) return [`<button class="sh-ghost" data-go="albums">No albums yet<br>Tap to add one</button>`];
  const all = [];
  units.forEach((u, i) => u.items.forEach((a) => all.push([a, i])));
  const cap = SPINES_PER_SHELF * ALBUM_SHELVES;
  const more = all.length > cap ? all.length - (cap - 1) : 0;
  const spines = all.slice(0, more ? cap - 1 : cap).map(([a, i]) => {
    const st = albumStats(a);
    const done = st.total && st.owned === st.total;
    const h = st.total > 120 ? "tall" : st.total < 40 ? "short" : "";
    return `<button class="sh-spine s${(i % 3) + 1} ${h}" data-go="album-${esc(a.id)}" aria-label="${esc(albumTitle(a))}, ${st.owned} of ${st.total}${done ? ", complete" : ""}">
      <span>${esc(spineText(a))}</span>${done ? `<i class="sh-ok" aria-hidden="true">✓</i>` : ""}</button>`;
  });
  if (more) spines.push(`<button class="sh-spine more" data-go="albums" aria-label="${more} more albums, open Albums"><span>+${more} more</span></button>`);
  const rows = [];
  for (let i = 0; i < spines.length; i += SPINES_PER_SHELF) rows.push(spines.slice(i, i + SPINES_PER_SHELF).join(""));
  return rows;
}
// One shelf of groups: if there are too many, the last spot becomes "+N more" opening `go`.
function limitGroups(groups, go, label) {
  if (groups.length <= GROUPS_PER_SHELF) return groups;
  const n = groups.length - (GROUPS_PER_SHELF - 1);
  return groups.slice(0, GROUPS_PER_SHELF - 1).concat(`<button class="sh-group more" data-go="${go}" aria-label="${n} more, open ${label}"><span class="sh-box more">+${n}<br>more</span><span class="sh-cap">${label}</span></button>`);
}
// A coin's color on the stack: silver, gold, copper, or nickel/clad.
const discCls = (c) => ({ silver: "ag", gold: "au", copper: "cu" }[meltKey(c)] || "ni");
// Up to `max` discs, mixed in proportion to what's in the group.
function discs(cs, max) {
  const n = sum(cs, qtyOf);
  if (!n) return "";
  const by = {};
  cs.forEach((c) => { const k = discCls(c); by[k] = (by[k] || 0) + qtyOf(c); });
  const show = Math.min(max, n);
  let out = "";
  Object.keys(by).sort((a, b) => by[b] - by[a]).forEach((k) => { out += `<i class="sh-coin ${k}"></i>`.repeat(Math.max(1, Math.round((by[k] / n) * show))); });
  return out;
}
function shelfStacks(owned) {
  const groups = stacksPresent().map((name) => {
    const cs = owned.filter((c) => stackOf(c) === name);
    const oz = sum(cs, (c) => ozEach(c) * qtyOf(c));
    const bars = cs.filter((c) => itemOf(c) === "bullion" && (c.bShape || "Bar") === "Bar").sort((a, b) => (num(b.bWeight) || 0) - (num(a.bWeight) || 0)).slice(0, 6);
    const other = cs.filter((c) => !bars.includes(c));
    const pile = bars.map((c) => `<i class="sh-bar ${num(c.bWeight) >= 10 ? "b" : num(c.bWeight) < 1 ? "s" : ""}"></i>`).join("") + discs(other, 5);
    return `<button class="sh-group" data-go="stacks"><span class="sh-pile">${pile}</span><span class="sh-cap">${esc(name)}<br>${oz.toFixed(oz < 10 ? 2 : 1)} oz</span></button>`;
  });
  const coins = owned.filter((c) => itemOf(c) === "coin" && !stackOf(c));
  groups.push(`<button class="sh-group" data-go="coins"><span class="sh-pile">${discs(coins, 9) || `<i class="sh-coin empty"></i>`}</span><span class="sh-cap">My Coins<br>${sum(coins, qtyOf)}</span></button>`);
  const rolls = owned.filter((c) => itemOf(c) === "roll");
  if (rolls.length) {
    const tubes = rolls.slice(0, 3).map((c, i) => `<i class="sh-roll ${discCls(c)}" style="height:${[64, 56, 70][i]}px"></i>`).join("");
    groups.push(`<button class="sh-group" data-go="coins"><span class="sh-rolls">${tubes}</span><span class="sh-cap">Rolls<br>${sum(rolls, qtyOf)}</span></button>`);
  }
  return limitGroups(groups, "stacks", "Stacks").join("");
}
function shelfBoxes(owned) {
  const out = (typeof allBoxes === "function" ? allBoxes() : []).map((b) => {
    const st = boxStats(b);
    return `<button class="sh-group" data-go="box-${esc(b.id)}"><span class="sh-box"><b>${esc(b.name || "2x2 box")}</b></span><span class="sh-cap">2x2 box · ${st.filled}/${st.total}</span></button>`;
  });
  const sets = owned.filter((c) => itemOf(c) === "set");
  if (sets.length) {
    const cases = sets.slice(0, 2).map((c, i) => `<i class="sh-set ${i ? "r" : ""}">${esc(labelOf(c).slice(0, 18))}</i>`).join("");
    out.push(`<button class="sh-group" data-go="coins"><span class="sh-sets">${cases}</span><span class="sh-cap">Sets · ${sum(sets, qtyOf)}</span></button>`);
  }
  return out.length ? limitGroups(out, "boxes", "2x2 Storage Boxes").join("") : `<button class="sh-ghost" data-go="boxes">No 2x2 boxes or sets yet<br>Tap to add a box</button>`;
}
// The totals plaques and metal prices on the top shelf.
function shelfTop(t) {
  const s = settings();
  const shown = SPOT_METALS.filter((m) => !s.hideSpot[m.key] && num(s.spot[m.key]) != null);
  const anyShown = SPOT_METALS.some((m) => !s.hideSpot[m.key]);
  const spot = shown.length
    ? shown.map((m) => `<span>${m.label} ${money(num(s.spot[m.key]))}</span>`).join("")
    : anyShown ? `<span>Tap to enter metal prices</span>` : "";
  return `<div class="sh-plaques">
      <button class="sh-pl big" data-go="value"><span class="k">Collection value</span><span class="v">${money(t.total, "$0.00")}</span></button>
      <button class="sh-pl" data-go="value"><span class="k">Melt value</span><span class="v">${money(t.melt, "$0.00")}</span></button>
      <button class="sh-pl" data-go="coins"><span class="k">Coins</span><span class="v">${t.count}</span></button>
    </div>${spot ? `<button class="sh-spot" data-go="options">${spot}</button>` : ""}${spot && s.spotUpdated ? `<div class="sh-upd">Prices updated ${esc(stampText(s.spotUpdated))}</div>` : ""}`;
}
function shelfHtml(owned, t) {
  const safe = shelfStyle() === "safe";
  const row = (label, inner, cls) => `<div class="sh-lab">${label}</div><div class="sh-shelf ${cls || ""}">${inner}</div><div class="sh-board"></div>`;
  return `${safe ? `<div class="sh-door"><i class="sh-dial"></i>Coin vault · open<i class="sh-handle"></i></div>` : ""}
  <div class="sh-cab ${safe ? "safe" : "wood"}">${safe ? `<div class="sh-bolts l">${"<i></i>".repeat(6)}</div><div class="sh-bolts r">${"<i></i>".repeat(6)}</div>` : ""}
    ${row("Top shelf · totals", shelfTop(t), "top")}
    ${shelfAlbums().map((r, i) => row(i ? "" : "Albums", r, "albums")).join("")}
    ${row("Stacks and coins", shelfStacks(owned), "spread")}
    ${row("Boxes and sets", shelfBoxes(owned), "spread")}
  </div>`;
}
