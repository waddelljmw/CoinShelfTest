// "What's new": a short list of plain lines per version. Fixes-only versions have no entry and show nothing.
const WHATS_NEW = {
  "0.64.0": [
    "Adding a coin: the Year box now comes first, and the coin type list then shows only coins made that year. A new coin needs a year, or tick \u201CUnreadable / too worn\u201D if you can't read it. Coins you already saved are not changed.",
  ],
  "0.63.0": [
    "Fix a typo in a coin type you typed yourself: open the coin, tap Edit, and change its name, kind or face value. The ID number, photos and where it is kept stay. Coin types from the list still can't change.",
  ],
  "0.61.0": [
    "The Back button now closes just the pop-up you are in (like the ⓘ help) and keeps what you typed. Back after + in an album returns to the album.",
  ],
  "0.60.0": [
    "New coin types on Add coin: half cent, large cent, two-cent, three-cent (silver and nickel), half dimes, Capped Bust and Seated Liberty coins, twenty-cent, Trade dollar, Westward Journey nickels (2004–05) and American Innovation dollars. They have no Red Book values yet. For anything else, pick Medal, token or foreign coin.",
  ],
  "0.59.0": [
    "Red Book prices are now kept on this phone with your coins, and go into your backups. Options, Coin Value shows the line \"Red Book prices on this phone\". Your values stay the same.",
  ],
  "0.58.0": [
    "Mercury dimes now have Red Book values.",
  ],
  "0.56.0": [
    "Pocket albums: on My Albums, tap New pocket album for an album with flips or capsules. Pick pages, pockets across and pockets down; any coin can go in any pocket. It has page tabs, a spine color (black too) and Kept in, and shows on the Home shelf.",
  ],
  "0.55.0": [
    "Junk silver: on Add coin, pick Junk silver, choose 90%, 40% or 35%, and type the face value (like $20 of dimes). The silver ounces are worked out for you.",
    "Cardboard boxes: a new cardboard box starts with numbered spots off, so no rows or slots are needed. You can still switch them on.",
    "Counts agree: the Needs info line on Home opens a list with the same coins it counted, and Home's Coins box is now called Items counted, with a note on My Coins when the numbers differ.",
    "Can't grade this one: for common worn coins, so they stop showing under Needs info.",
    "Insurance report: pick the order (type, year, value or where kept). It now shows CAC stickers and who you inherited a coin from.",
    "Home hides Cost and Gain when everything you own is inherited. An inherited coin has an \"I'd like to sell this one eventually\" note. Deleting a coin now asks first (Undo stays).",
  ],
  "0.54.0": [
    "Sell together: pick two or more coins with Select, tap Sell together, and sell them as one order. One buyer, order number, tracking number, shipping charge and fee for the whole order; each coin keeps its own price. A coin's page shows its order, with Refund whole order.",
    "Profit now reads the same everywhere: Sales (coins only), Shipping charged on its own line, Profit before show costs and Profit after show costs. The Sold here list on a show shows the date, and shipping on its own small line.",
    "Show costs follow the kind of show: a stream gets Supplies, Equipment and Subscriptions, a coin show keeps Table fee, Gas, Hotel and Food, and a visit has an Entry fee. Old amounts stay.",
    "Add coin: Where from \u2192 Coin Show lets you pick the show, and the show day fills in Date acquired. A show page lists what you bought there.",
    "Options: usual shipping you charge fills in on each sale, a Fees last checked date, and a Shows only switch for people who visit shows but don't sell.",
    "The coins spreadsheet has Business / Personal, Show and Bought at show columns. The sales spreadsheet has Buyer, Order number and Tracking number.",
  ],
  "0.53.0": [
    "Refund or cancel: on a sold coin, this puts it back in stock but keeps the sale on record as Refunded. The fees and shipping you paid still count as costs in your reports. Move back to collection is still there for real mistakes.",
    "Adding a coin with Quantity above 1: choose whether the price is each or for the whole lot, and see the total as you type.",
    "Set asking price for all now has a Suggested button (never below your cost plus 10%), and you can use it from Select on any Business coins that are for sale.",
    "Paid with starts blank on a new sale (it stays the same only within one show). A Check # box appears when you pick Check.",
    "Black is now a box and spine color. The album quick list has Tick all and Untick all and one Photograde link. Every Kept in list ends with + Add storage. The guide bubble is easier to read.",
  ],
  "0.50.0": [
    "New album: choose \u201CAlready has coins in it\u201D and a quick list opens with every spot ticked. Untick the empty holes, pick a grade for each coin, and save them all at once. Undo removes the whole batch.",
    "On any album page, \u201CFill spots\u201D does the same for the spots that are still empty. Price goes on each row, or enter one total for the album and it is split across the coins.",
    "Add coin is in a calmer order: coin, grade, price and where from, where it is kept, then Notes. Everything else is under \u201CMore details\u201D.",
  ],
  "0.49.2": [
    "Renumber my coins never hands out a number that is already on any flip, and running it again changes nothing.",
    "Undo after a renumber keeps any ID you typed since. Restoring a backup made before a renumber brings every ID back.",
  ],
  "0.49.1": [
    "Renumber my coins: the Undo is now a button that stays in Options > Coin ID style (it used to be a pop-up that vanished after a few seconds).",
  ],
  "0.49.0": [
    "Options > Coin ID style: keep the app's codes, use your own letters, use one running number (like JW-1050), or turn automatic IDs off. Changing it only affects coins you add from now on.",
    "Any label can now be typed as a coin's ID (like A17 or Box 3 #17). Spreadsheet import reads an ID column, and an optional \u201CRenumber my coins\u201D keeps each coin's old ID (with Undo). The spreadsheet export now puts the everyday columns first and leaves out empty ones."
  ],
  "0.48.0": [
    "Empty album spot: new \u201CPut a coin I already have here\u201D lists your coins of that type, year and mint that are not in an album yet. Tap one to place it (Undo is offered).",
    "Options: \u201CSuggest an idea\u201D sits next to Report a problem. The U.S. Mint is now a place you can buy from, and Options > How much to show lists all three levels. The update bar now sits at the top so it never covers Save."
  ],
  "0.47.0": [
    "New: how much to show. Options now starts with Simple, Collector or Everything. Simple keeps just coins, My Coins and Coin Value. Your app stays on Everything unless you change it, and switching never changes or loses anything you saved."
  ],
  "0.46.0": [
    "New app, new look at the start: an empty Coin Cabinet now opens with a welcome card. Start your collection, or try the sample coins.",
    "Optional one-minute guide to adding your first coin (also in Options, \u201CGuided first coin\u201D). Skip it any time.",
    "Tap the small \u24D8 next to a hard word (Melt value, Spot price, Red Book, Raw / Slab, Seller Mode, Snapshot, Details coin) for a one-line meaning."
  ],
  "0.45.0": [
    "Change many coins at once: tap Select (on My Coins, an album page or a box page), pick coins, then \u201CSet purchase info\u201D to fill in date, where from and price for all of them. Split a total evenly if you like. One Undo puts everything back.",
    "The Update button now always installs the newest version, and the Missing list has Select all at the top too."
  ],
  "0.44.0": [
    "Asking price now has three suggestions: Red Book, melt, and your cost plus a minimum markup. The highest is highlighted, so it never goes below what you need. Set the minimum markup in Options.",
    "Reports: \u201CTax records\u201D saves a year-end list of every sale (cost, fees, gain, held over a year, inherited) for your tax preparer. Not tax advice."
  ],
  "0.43.0": [
    "A coin can be on several want lists at once, each with its own grade. Album spots and the Want List show \u201Cwanted \u00D72\u201D; tap it to see which lists.",
    "Album page: \u201CAdd missing to a want list\u201D suggests a list for that coin type, or makes a new one.",
    "On a filled album spot, \u201CWant an upgrade\u201D adds the next grade up.",
    "Want List has a new section for albums you want to buy."
  ],
  "0.42.0": [
    "Home shows an amber line when some coins need info (grade, cost or date inherited); tap it to see them.",
    "Totals say \u201Cestimate*\u201D until those coins are filled in.",
    "Options has an Inheritances list: who, when, earlier owners. Inherited coins use your default one.",
    "In My Coins, Select \u203A Mark inherited\u2026 fixes many coins at once."
  ],
  "0.41.0": [
    "The Save button now stays at the bottom of the screen while you fill in a coin.",
    "After you delete or sell a coin, you land back where you came from (like your album).",
    "New album: type a few letters to find the coin type, and the name is suggested in gray.",
    "An album can be marked Inherited; coins you add from it start as Inherited."
  ]
};
const verNum = (v) => String(v).split(".").reduce((n, x) => n * 1000 + (+x || 0), 0);
// Entries newer than the last version he saw, up to this one (newest first).
function newSince(seen) {
  return Object.keys(WHATS_NEW).filter((v) => verNum(v) <= verNum(APP_VERSION) && verNum(v) > verNum(seen || "0")).sort((a, b) => verNum(b) - verNum(a));
}
function whatsNewHtml(vs) {
  return vs.map((v) => `<h3 style="margin:10px 0 4px">Version ${esc(v)}</h3><ul style="margin:0 0 6px;padding-left:20px">${WHATS_NEW[v].map((l) => `<li>${esc(l)}</li>`).join("")}</ul>`).join("");
}
function openWhatsNew(all, vsGiven) {
  const vs = vsGiven || (all ? Object.keys(WHATS_NEW).sort((a, b) => verNum(b) - verNum(a)) : newSince(settings().seenVersion));
  if (!vs.length) { if (all) toast("Nothing new to show yet."); return; }
  openSheet(`<div class="sheet-head"><h2>What's new</h2><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>${whatsNewHtml(vs)}<div class="btn-row"><button class="btn primary" data-act="closeSheet">Got it</button></div>`);
}
// Once after an update. A first-ever start (no coins, nothing seen) just records the version.
function maybeShowWhatsNew() {
  if (store.mode === "snapshot" || store.mode === "loading" || /[?&]demo/.test(location.search)) return;
  const s = settings(), seen = s.seenVersion;
  if (seen === APP_VERSION) return;
  const fresh = !seen && !allCoins().length;
  const vs = newSince(seen);
  saveSettings({ seenVersion: APP_VERSION });
  if (!fresh && vs.length) openWhatsNew(false, vs);
}
