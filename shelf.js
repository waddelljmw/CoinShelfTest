// Step 4.2: the Home page drawn as a real shelf. Two styles (Options → Shelf style): Bookcase and Safe.
// Every drawing is plain HTML/CSS (no pictures), so it's fast and works offline. Tapping a thing opens its page.
"use strict";

const SHELF_STYLES = [["bookcase", "Bookcase"], ["safe", "Safe"]];
const shelfStyle = () => (settings().shelfStyle === "safe" ? "safe" : "bookcase");
// The Safe style is dark all over the app; the Bookcase follows the phone's day/night setting (only the page around it changes).
function applyShelfStyle() { document.body.classList.toggle("safe", shelfStyle() === "safe"); }

// Step 4.4: which shelves show, in what order, and which are pinned. Saved in settings as `shelfLayout`: { order, hidden, hiddenItems, pins }.
// Anything missing or unknown falls back to the default, so shelves added later just appear.
const SHELF_DEFS = [["albums", "Albums"], ["stacks", "Stacks and coins"], ["storage", "Storage boxes"], ["display", "Display boxes"], ["sets", "Sets"]];
const SHELF_KEYS = SHELF_DEFS.map((d) => d[0]);
function shelfLayout() {
  const L = settings().shelfLayout || {}, obj = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
  const order = (Array.isArray(L.order) ? L.order : []).filter((k, i, a) => SHELF_KEYS.includes(k) && a.indexOf(k) === i);
  SHELF_KEYS.forEach((k) => { if (!order.includes(k)) order.push(k); });
  const pins = {};
  Object.entries(obj(L.pins)).forEach(([k, v]) => { if (SHELF_KEYS.includes(k) && (v === "top" || v === "lock")) pins[k] = v; });
  const hidden = {};
  Object.entries(obj(L.hidden)).forEach(([k, v]) => { if (SHELF_KEYS.includes(k) && v) hidden[k] = true; });
  return { order, pins, hidden, hiddenItems: { ...obj(L.hiddenItems) } };
}
// Pinned-to-top shelves come first (keeping their order); the rest follow in order. A locked shelf keeps its spot because moving skips over it.
function shelfOrder() { const L = shelfLayout(); return L.order.filter((k) => L.pins[k] === "top").concat(L.order.filter((k) => L.pins[k] !== "top")); }
const itemShown = (id) => !shelfLayout().hiddenItems[id];
const hiddenItemCount = () => Object.values(shelfLayout().hiddenItems).filter(Boolean).length;
function saveLayout(patch) { saveSettings({ shelfLayout: { ...shelfLayout(), ...patch } }); }
// Move a shelf up (-1) or down (+1) among the shelves that are not locked.
function moveShelf(key, d) {
  const L = shelfLayout(), o = L.order.slice(), i = o.indexOf(key);
  if (i < 0 || L.pins[key] === "lock") return;
  let j = i + d;
  while (j >= 0 && j < o.length && L.pins[o[j]] === "lock") j += d;
  if (j < 0 || j >= o.length) return;
  [o[i], o[j]] = [o[j], o[i]];
  saveLayout({ order: o });
}

// Short words for a spine: the album's title, plus its years when the title doesn't already have them.
function spineText(a) {
  const t = albumTitle(a);
  const yrs = a.start ? a.start + "–" + (a.end || "") : "";
  return yrs && !/\d{4}/.test(t) ? t + " " + yrs : t;
}
// Spine color follows the album's brand: Whitman blue, Littleton green, Dansco dark brown, H.E. Harris beige. "Other" uses the color picked for it (red if none).
const LIGHT_COLORS = ["clear", "white", "yellow"];
function brandSpine(a) {
  const cls = { Whitman: "s1", Littleton: "s3", Dansco: "sd", "H.E. Harris": "sbg" }[a.brand];
  if (cls) return { cls, style: "" };
  const k = BOX_COLORS.some((x) => x[0] === a.color) && a.color !== "clear" ? a.color : "red", hex = colorHex(k, "red");
  return { cls: "so", style: `style="background:linear-gradient(90deg,${hex},${hex} 50%,${hex});box-shadow:inset 0 0 0 99px rgba(0,0,0,.08);color:${LIGHT_COLORS.includes(k) ? "#2a2218" : "#e8d29a"}"` };
}
// Albums fill up to 2 shelves of 9 spines. If there are more, the last spot becomes a "+N more" spine that opens Albums.
const SPINES_PER_SHELF = 9, ALBUM_SHELVES = 2, GROUPS_PER_SHELF = 5;
function shelfAlbums() {
  const units = albumUnits();
  if (!units.length) return [`<button class="sh-ghost" data-go="albums">No albums yet<br>Tap to add one</button>`];
  const all = [];
  units.forEach((u, i) => u.items.forEach((a) => { if (itemShown(a.id)) all.push([a, i]); }));
  const cap = SPINES_PER_SHELF * ALBUM_SHELVES;
  const more = all.length > cap ? all.length - (cap - 1) : 0;
  const spines = all.slice(0, more ? cap - 1 : cap).map(([a, i]) => {
    const st = albumStats(a);
    const done = st.total && st.owned === st.total;
    const h = st.total > 120 ? "tall" : st.total < 40 ? "short" : "";
    const bc = brandSpine(a);
    return `<button class="sh-spine ${bc.cls} ${h}" ${bc.style} data-go="album-${esc(a.id)}" aria-label="${esc(albumTitle(a))}, ${st.owned} of ${st.total}${done ? ", complete" : ""}">
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
// Roll wrapper colors follow the standard bank colors: cents red, nickels blue, dimes green, quarters orange, halves sand/brown, dollars gray.
// Morgan and Peace silver dollar rolls are drawn as worn beige paper.
function rollColor(c) {
  const t = TYPE_BY_ID[c.typeId] || {};
  if (["morgan-dollar", "peace-dollar"].includes(c.typeId)) return "beige";
  return { "1C": "red", "5C": "blue", "10C": "green", "25C": "orange", "50C": "sand", "$1": "gray" }[t.denom || c.denom] || "";
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
    const tubes = rolls.slice(0, 3).map((c, i) => `<i class="sh-roll ${rollColor(c) ? "rc-" + rollColor(c) : discCls(c)}" style="height:${[64, 56, 70][i]}px"></i>`).join("");
    groups.push(`<button class="sh-group" data-go="coins"><span class="sh-rolls">${tubes}</span><span class="sh-cap">Rolls<br>${sum(rolls, qtyOf)}</span></button>`);
  }
  return limitGroups(groups, "stacks", "Stacks").join("");
}
// One box drawn on the shelf, by its look: black, cardboard, plastic (any color, or clear with coins showing). Display boxes are a glass case.
function boxDrawing(b) {
  const st = boxStats(b), name = esc(b.name || "Box");
  const cap = (b.type === "display" ? "Display" : "Storage") + " · " + (hasSpots(b) ? st.filled + "/" + st.total : st.filled + " item" + (st.filled === 1 ? "" : "s"));
  let art;
  if (b.type === "display" && b.look === "wood") { // a wooden display box is a solid wood case
    art = `<span class="sh-case solid"><span class="sh-case-coins">${["ag", "cu", "ni", "ag", "au"].map((k) => `<i class="sh-coin ${k}"></i>`).join("")}</span><b>${name}</b></span>`;
  } else if (b.type === "display") {
    const coins = ["ag", "cu", "ni", "ag", "au"].slice(0, 5).map((k) => `<i class="sh-coin ${k}"></i>`).join("");
    art = `<span class="sh-case"><span class="sh-case-coins">${coins}</span><b>${name}</b></span>`;
  } else if (b.look === "plastic") {
    const clear = b.color === "clear", hex = colorHex(b.color, "clear");
    art = `<span class="sh-box plastic ${clear ? "clear" : ""}" ${clear ? "" : `style="background:${hex};color:${LIGHT_COLORS.includes(b.color) ? "#222" : "#eee"}"`}>${clear ? `<span class="sh-incoins"><i></i><i></i><i></i></span>` : ""}<b>${name}</b></span>`;
  } else art = `<span class="sh-box ${b.look === "cardboard" ? "cardboard" : b.look === "wood" ? "wooden" : ""}"><b>${name}</b></span>`;
  return `<button class="sh-group" data-go="box-${esc(b.id)}">${art}<span class="sh-cap">${cap}</span></button>`;
}
function shelfBoxes() {
  if (!storageBoxes().length) return `<button class="sh-ghost" data-go="boxes">No storage boxes yet<br>Tap to add a box</button>`;
  return limitGroups(storageBoxes().filter((b) => itemShown(b.id)).map(boxDrawing), "boxes", "Storage").join("");
}
function shelfDisplay() { return limitGroups(displayBoxes().filter((b) => itemShown(b.id)).map(boxDrawing), "boxes", "Storage").join(""); }
// Sets get their own shelf (only drawn when you own one).
function shelfSets(owned) {
  const sets = owned.filter((c) => itemOf(c) === "set");
  if (!sets.length) return "";
  const cases = sets.slice(0, 2).map((c, i) => `<i class="sh-set ${i ? "r" : ""}">${esc(labelOf(c).slice(0, 18))}</i>`).join("");
  return `<button class="sh-group" data-go="coins"><span class="sh-sets">${cases}</span><span class="sh-cap">Sets · ${sum(sets, qtyOf)}</span></button>`;
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
  const safe = shelfStyle() === "safe", L = shelfLayout();
  const row = (label, inner, cls) => `<div class="sh-lab">${label}</div><div class="sh-shelf ${cls || ""}">${inner}</div><div class="sh-board"></div>`;
  const draw = {
    albums: () => shelfAlbums().map((r, i) => row(i ? "" : "Albums", r, "albums")).join(""),
    stacks: () => row("Stacks and coins", shelfStacks(owned), "spread"),
    storage: () => { const h = shelfBoxes(); return h ? row("Storage boxes", h, "spread") : ""; },
    display: () => { const h = shelfDisplay(); return h ? row("Display boxes", h, "spread") : ""; },
    sets: () => { const h = shelfSets(owned); return h ? row("Sets", h, "spread") : ""; },
  };
  const rows = shelfOrder().filter((k) => !L.hidden[k]).map((k) => draw[k]()).join("");
  return `${safe ? `<div class="sh-door"><i class="sh-dial"></i>Coin vault · open<i class="sh-handle"></i></div>` : ""}
  <div class="sh-cab ${safe ? "safe" : "wood"}">${safe ? `<div class="sh-bolts l">${"<i></i>".repeat(6)}</div><div class="sh-bolts r">${"<i></i>".repeat(6)}</div>` : ""}
    ${row("Top shelf · totals", shelfTop(t), "top")}
    ${rows}
  </div>`;
}
// Options → Home shelf: on/off, up/down arrows and a pin choice for each shelf, plus a note when single albums or boxes are hidden.
function shelfOptionsHtml() {
  const L = shelfLayout(), name = Object.fromEntries(SHELF_DEFS);
  const n = hiddenItemCount();
  const rows = L.order.map((k, i) => {
    const pin = L.pins[k] || "", lock = pin === "lock";
    const chip = (v, txt) => `<button class="chip ${pin === v ? "on" : ""}" data-act="shelfPin" data-k="${k}" data-v="${v}" aria-pressed="${pin === v}">${txt}</button>`;
    return `<div class="shelf-opt"><label class="switch"><span>${name[k]}</span><input type="checkbox" data-act="shelfShow" data-k="${k}" ${L.hidden[k] ? "" : "checked"}></label>
      <div class="chips">${chip("", "No pin")}${chip("top", "Pin to top")}${chip("lock", "Lock in place")}
        <button class="chip" data-act="shelfMove" data-k="${k}" data-d="-1" ${lock || i === 0 ? "disabled" : ""} aria-label="Move ${name[k]} up">▲</button>
        <button class="chip" data-act="shelfMove" data-k="${k}" data-d="1" ${lock || i === L.order.length - 1 ? "disabled" : ""} aria-label="Move ${name[k]} down">▼</button></div></div>`;
  }).join("");
  return `<div class="small muted" style="margin-bottom:6px">Totals always stay first. Hidden shelves still count in your totals.</div>${rows}
    ${n ? `<div class="hint">${n} album${n === 1 ? "" : "s"} or box${n === 1 ? "" : "es"} hidden from the shelf. <button class="link-btn" data-act="shelfShowAll">Show all</button></div>` : ""}`;
}
// The "Show on Home shelf" switch on an album page or box page.
const shelfItemSwitch = (id) => `<label class="switch"><span>Show on Home shelf</span><input type="checkbox" data-act="shelfItem" data-id="${esc(id)}" ${itemShown(id) ? "checked" : ""}></label>`;
