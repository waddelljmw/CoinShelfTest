// "What's new": a short list of plain lines per version. Fixes-only versions have no entry and show nothing.
const WHATS_NEW = {
  "0.98.0": [
    "Search any coin now says when you own it: \"You own 2\". Tap it to see where each one is kept and to open your coin.",
  ],
  "0.97.0": [
    "Options now says which kind of file each Load, Import and Restore button takes, and how much room the app and its photos use on your phone.",
    "Tapping an empty album spot while selecting coins now explains why it can't be selected.",
    "Pop-up messages leave faster: about 1.5 seconds, and Undo messages about 5.",
  ],
  "0.96.0": [
    "In My Coins, pick one coin type and a card under the list shows the album spots you are still missing for it.",
    "If you mark the same coin sold in two tabs, the second tab now warns you instead of replacing the first sale.",
  ],
  "0.95.0": [
    "Pocket albums now show what they are worth and which grades are inside, on the album page and on its card in My Albums. Hide values hides the amount.",
  ],
  "0.94.0": [
    "A coin in an album spot now has Move to another album: pick an album that has an empty spot for it. The old spot opens up, and one Undo puts it back.",
  ],
  "0.93.0": [
    "Tapping + on an empty box or pocket spot now also offers a coin you already have, not only a new coin. One Undo.",
  ],
  "0.92.0": [
    "The Filter panel on My Coins can now filter by Where from (for example Inherited or Coin Show). It works together with the other filters and can be saved.",
  ],
  "0.91.0": [
    "Options is tidier: six clear groups, most-used first (Prices and selling, Backup and your data, Reports and sharing, Look and Home, Adding coins, Demo and help). Every section still folds shut, and nothing you saved changes.",
  ],
  "0.90.0": [
    "A brand-new app now starts on Collector (albums, storage, want lists), so the first screens are simpler. You can switch to Everything in Options > How much to show. Existing collections are not changed.",
    "Simple now really hides the selling buttons (For sale, Mark as sold, Business) on a coin's page.",
    "The welcome card has I have a backup file, which opens Backup and restore. New box now says what is missing right inside the form.",
    "Clearer words: album names show properly in Placed in and Delete messages, the Spot price help covers copper per pound, a coin with no price list says No price list loaded yet, and the old photo coming-soon line is gone.",
  ],
  "0.89.0": [
    "Easier to take back: Take off For sale now has Undo, Return unsold coins asks first, and messages stay on screen longer (Undo stays about 15 seconds).",
    "In the demo, See a full sample collection asks before replacing the practice coins you added.",
  ],
  "0.88.1": [
    "Easier to tap: the ⓘ help buttons, folding section bars, back links, menu rows and Close buttons now have comfortable, bigger tap areas.",
    "The star on a coin row has its own space at the right edge, so opening a coin no longer stars it by mistake. The small eBay link under each coin on Coin Value is gone (use Check eBay sold on the coin page).",
  ],
  "0.88.0": [
    "New Text size choice in Options (Normal, Large, Extra large). It works on iPhone too. Long coin names now wrap instead of being cut off at the larger sizes.",
    "Album spots show the grade and spot number bigger, and the small help lines are a little bigger.",
  ],
  "0.86.0": [
    "Want an upgrade now works for every grade (XF-45 goes to AU-50, AU-58 to MS-60, and so on).",
    "Album spots say \u201Cupgrade wanted\u201D or \u201Cwanted\u201D so you can tell them apart. The coin's Upgrade wanted tick and the spot's upgrade want are now the same mark.",
    "When a better coin arrives for a filled spot, the app asks to swap it in and sends the old coin loose, to a box, or for sale.",
    "Changing an album's years and back keeps its variety spots (like the three 1878 Morgan spots).",
  ],
  "0.85.0": [
    "Quick-add pocket change: on Fill spots, everyday coins (clad dimes, quarters and halves, Jefferson nickels from 1946, Lincoln cents from 1959) can be added as Circulated (not graded). No grade needed, valued at face. Silver, proofs, key dates and variety spots still ask for a grade.",
    "New source Coin roll hunting. Pocket change, Coin roll hunting and Bank roll fill Price paid with face value; Gift stays $0. Fill spots remembers your last source and has one-tap source buttons.",
    "Kennedy halves made only for collectors (1970-D, 1987-P, 1987-D, 2002 to 2020) now show an NIFC tag, which means not intended for circulation. Filter has a Not graded choice, and the CSV file now keeps Not graded / Circulated coins.",
  ],
  "0.84.0": [
    "Albums are tidier: tap a filled spot and choose Take out of album (one tap, Undo). Tap an empty spot and Add to want list adds it to that album's own list right away. Deleting an album asks if its want-list coins should go too. A coin put in an album leaves its box slot, and no longer says Holder: Album after it leaves. Album melt says Needs silver price when no price is entered, and the album page shows how many spots are hidden, with a Show button.",
  ],
  "0.83.0": [
    "Album spots are more accurate: a coin added to a variety spot (like 1909 VDB or 1878 7 Tail Feathers) keeps that variety; the 1895 Morgan spot says Proof only and asks for a proof grade; + Add a spot refuses dates and mint marks the series never had; changing a coin's variety moves it to the matching spot; and Hide spot or shortening an album's years asks first when coins sit in those spots.",
  ],
  "0.82.1": [
    "Home now has a Search any coin box. Type a year and coin (like 1916 dime) and you land on the Coins page with the matching coins to look up, Key date first. Tap the small ⓘ next to Key date to see how it's decided. When none of your coins match, it says Not in your coins.",
  ],
  "0.82.0": [
    "Look up any coin: type a date and coin in the Coins search box (like 1916-D dime or 1909 vdb) and tap the row that appears. You get the coin card: mintage, key date flag, melt today, varieties and how many you own, plus Search eBay sold and Add to want list. Nothing is saved until you add it to a want list.",
  ],
  "0.81.0": [
    "Coin card: tap an empty album spot to see a Key date tag for low mintages, the metal and melt today, varieties to look for, and how many of that date you own. Your own coins' pages show the Key date tag, varieties and your count too. Key date here means a very low mintage by the U.S. Mint list, so a few well-known semi-keys may not be tagged.",
  ],
  "0.80.0": [
    "More mintages from U.S. Mint records: Barber, Walking Liberty and Franklin halves (commemoratives taken out), 1964 and 1965 coins by the date on them, and the Seated Liberty series, 3-cent silver and 20-cent pieces. The 1900 Morgan and 1893 quarter numbers no longer count the commemoratives.",
  ],
  "0.79.0": [
    "Mintage now shows even without a price file, for the common US series (cents, nickels, dimes, quarters, Morgan and Peace dollars, trade dollars). It says \"from U.S. Mint records\" and counts coins struck that year. Tap an empty album spot or open a coin to see it. Halves and a few overlap years are not in yet.",
  ],
  "0.78.1": [
    "Fix-up wording: the button now says \"Fix the next coin\", and the Needs info tags read \"Missing: grade, cost. Check the mint mark.\"",
  ],
  "0.78.0": [
    "Fix-up run: on My Coins, open Needs info and tap \"Fix the next coin\". It opens the first coin missing a grade, cost, where from or mint; fill it in, Save, and it jumps to the next one. Skip or Stop any time.",
    "Needs info now also catches coins with no Where from, and US coins with no mint chosen from a year that had D or S mints. Pick P once if it really is Philadelphia. Totals are only marked as estimates for what really changes them.",
    "Gift and Pocket change coins no longer say \"Missing: cost\" (they cost $0), for US and foreign coins alike. The Needs info filter now ends when you leave My Coins.",
    "Search understands you: \"1921 morgan\", \"1950 D\", \"silver\" and \"grandpa\" find coins. Every word must match; a single letter means a mint mark.",
    "Adding coins one after another: Price, Photos and other sections you opened stay open for the next new coin.",
    "Fill spots: if you already own that date loose, it offers to place that coin in the spot instead of adding a second one.",
  ],
  "0.77.3": [
    "Each album now uses only its own want list: filling a spot (any way, including Fill spots) crosses it off that album's list.",
    "Add coin shows what it carried over from your last coin as \"Same as last: Coin Show ✕\", one tap to clear. Fill spots starts with nothing ticked and asks \"Add 12 coins?\" before saving.",
    "Typing is no longer lost: Back no longer wipes your metal prices, and Back on a half-filled coin asks \"Discard this coin?\".",
  ],
  "0.77.2": [
    "Adding missing coins from an album now suggests that album's own want list (or a new one named for it). Two albums of the same coin no longer share one list.",
  ],
  "0.77.1": [
    "Options: \"How much to show\" now folds shut like the other sections and names your current level in its heading. The unfinished Photo fill section is hidden.",
  ],
  "0.77.0": [
    "A box can now be kept in another box or a place you type (Edit box > Kept in), so an album in a cardboard box in the safe shows the whole chain on the coin and box pages.",
    "Rearranged the pull-out drawers? Edit box > Swap two trays: the trays trade places with their coins (same row and slot). One Undo puts it back.",
  ],
  "0.76.0": [
    "Reports now have filters: just coins, just bars, one metal, and switches for Business stock and coins on the way (left out of the insurance report). Two quick buttons: Insurance and Full inventory (everything, with what you paid and where it's kept).",
  ],
  "0.75.0": [
    "New \"Take out of album…\" button when you select coins. The coins go loose (they stay in your collection) or into a box or stack you pick, and one Undo puts them back. Nothing is deleted.",
  ],
  "0.73.0": [
    "On an album, \"Add missing to a want list\" now asks which list (or a new one) and adds every missing coin in one tap. Coins already on the list are skipped. \"Show missing\" still lets you pick one by one.",
  ],
  "0.72.0": [
    "Add coin has small hints: any field can be left blank, Raw and Certified are explained in plain words, and the PCGS photo link sits right under the grade with a line on what it is for.",
    "After your very first coin, the app points you to the + button to add the next one.",
  ],
  "0.71.0": [
    "Value from: say where a value you typed came from (PCGS, NGC, eBay sold, dealer offer, other). It shows on the coin page, the insurance report and in CSV.",
    "Favorites: tap the ☆ on a coin or in the Coins list to star it (Undo is offered). Filter has a Favorites only choice. Favorite is a CSV column too.",
  ],
  "0.70.0": [
    "Search by nickname: wheat penny, steel, VDB, walker, V nickel, war nickel, Buffalo, Mercury, ASE, Bicentennial and more now find the right coin, both when adding a coin and in the Coins list.",
    "A warning (not a block) shows when a year or mint mark was never struck, like a 1922 Lincoln cent with no D.",
    "Choosing Gift or Pocket change as Where from fills Price paid with $0 on a new coin.",
  ],
  "0.69.0": [
    "2026 coins: the five Semiquincentennial quarters (Mayflower Compact, Revolutionary War, Declaration of Independence, U.S. Constitution, Gettysburg Address), the Emerging Liberty dime and the Enduring Liberty half dollar are now coin types. The Roosevelt dime and Kennedy half now end at 2025, so for 2026 pick the new types.",
  ],
  "0.68.0": [
    "Inherited coins: if you change a saved inherited coin's Where from, the app now asks first, because it would lose who and when you inherited it and its value (Keep Inherited undoes the change). Mark as sold only shows on an inherited coin once you tap \u201CI'd like to sell this one eventually\u201D, and it asks once more before the sale form. Nothing you saved is changed."
  ],
  "0.67.0": [
    "Your own values: on the Coin Value page, tap Load your own values and pick a spreadsheet (CSV) of your own numbers. Match the columns, check the preview, then add them. Tap How it works for a blank template. Your coins are not changed, and Undo puts the old prices back."
  ],
  "0.66.0": [
    "Adding a coin: the Year box now comes first, and the coin type list then shows only coins made that year. A new coin needs a year, or tick \u201CUnreadable / too worn\u201D if you can't read it (a token or medal can also tick \u201CNever had a date\u201D). Coins you already saved are not changed.",
  ],
  "0.65.0": [
    "Red Book prices are no longer inside the app's public files. They stay on your phone. To move them to another phone, tap Save price file on the Coin Value page, then Load a price file on the other phone. Your coins and values here are unchanged.",
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
