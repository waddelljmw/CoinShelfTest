# Full-app review (step 1b(b), Fable, 2026-11-10; nothing built)

The six approved lenses, checked against v0.58.6 by **running the app** in a phone-size browser (the `?demo` coins, a fresh empty app, and made-up collections of 2,000 and 5,000 coins). Every problem below was reproduced; the "Test" line says how. Sizes: **S** small fix, **M** a feature, **L** big. Nothing here changes how coins are saved.

## At a glance

| Lens | Verdict | Problems |
|---|---|---|
| Totals that disagree | Weakest area. The same collection shows different totals and counts on different pages | 7 (all S) |
| Coin-knowledge gaps | One wrong price row (Silver Eagles), and the form accepts coins that were never made | 6 (5 S, 1 tiny) |
| Dead ends | Few. The type search is the big one | 4 S |
| Big collections | Fine today. My Coins gets slow past about 1,000 entries | 1 M (not urgent) |
| Phone fit | No sideways scrolling, nothing covered. Some small tap targets and tiny text | 3 S |
| Tap counts | Good. One extra tap on every add | 1 S |

**No app errors** appeared in any run. **22 problems: 20 S, 1 M, 1 tiny, 0 L.**

**Top 5 by payoff:** K1 Silver Eagle prices · T1 + T2 totals that disagree · D1 type search · K2 "never made" warning · D2 Delete album asks first.

**Suggested bundles (planning day decides):**
- **Into session 55 (same file, the coin type list):** K5 (2009 and 2026 quarters), D1 (nicknames in the search). Both S.
- **Into session 56 (same areas):** T5c with box totals (bug #4) · D3 with the Back button work · D2.
- **"Numbers pass" (one Sonnet session, about M in all):** T1–T7 except T5c. Each needs one test.
- **With Nov 17 (prices leave the public files):** K1. **Needs a photo of his Red Book Silver Eagle page first.** Fix it before step A1 copies the prices onto the phone, or the wrong rows get copied too.
- **With idea 54 (contrast, Nov 17):** P2, P3.
- **Later:** B1 once he passes about 1,000 entries · K4 · date lists for the types K2 doesn't cover yet (M).

---

## 1. Totals that disagree

| # | Problem | Test (reproduced) | Fix | Size |
|---|---|---|---|---|
| T1 | **Switching a stack off on Home changes the Home total only.** The Value over time chart right below it, and the Coin Value page, still count everything. | Demo, tap the "My Silver Stack" chip off. Home value: $13,302.34. Chart's latest point and Coin Value page total: $13,973.67 (bars still listed). | One rule: chart and Coin Value follow the chips, or both say "everything, including what's switched off". Same code path for group chips. | S |
| T2 | **Insurance Report total is bigger than Home and doesn't say why.** It adds Business stock and coins that are still "On the way". | Demo: Home $13,973.67 / 118 items. Report $14,765.25 / 124 coins (the 6 Business items, $791.57). A coin set to On the way is listed like any other. | Add one line under the total ("includes 6 Business items"), and mark On the way rows. Or a tick box "Include Business stock". | S |
| T3 | **"Paid" on the report leaves out tax and shipping**; Home and the coin page include them. | 3 Morgans at $30 + $6 tax + $9 shipping. Coin page and Home: cost $105.00. Report: "Paid (where recorded) $90.00". | Report uses the same cost function as Home (`costOf`). | S |
| T4 | **A coin page shows "—" for a value the totals count.** | 50 clad dimes, 1965, no Red Book price. Page: "Value each (face value) —" then "Total value $5.00". Home counts $5.00. | Show $0.10 on the "(face value)" row. | S |
| T5 | **Three different answers to "how many?"** (a) Home says 118 items, the shelf button says "My Coins 103", and it opens a page headed "In collection (112)". The note there explains 118 but not 103. (b) My Coins says "3 bars, rounds or other silver items are in My Stacks"; My Stacks and the Home chip say 12. (c) A box holding one entry of 20 cents shows "1 item". | Demo for (a) and (b). For (c): new box without numbered spots, add 1944 cents with Quantity 20, Storage shows "Shoebox · 1 item". | Count pieces (quantity) everywhere, and make the shelf button and the page heading use the same number. Do (c) with bug #4 in session 56. | S |
| T6 | **Gain isn't Value minus Cost when some coins have no cost**, and the line under it only says "inherited not counted". | Value $620.30, Cost $105.00, Gain shown $15.00 (the $500 coin has no cost). | Line reads "inherited and 1 coin without a cost not counted". | S |
| T7 | **A coin can be valued below its face value.** A nickel with no Red Book price is valued at its copper melt. | 1936 Buffalo nickel XF-45: value $0.03, and the Insurance Report lists it as "$0.03 · Melt". | Never go below face value for a coin (rolls already do this). | S |

## 2. Coin-knowledge gaps

| # | Problem | Test (reproduced) | Fix | Size |
|---|---|---|---|---|
| K1 | **Silver Eagle prices are filed under the wrong dates.** An ordinary 2015 Silver Eagle (no mint mark) gets **$480** in MS-69 and **$4,500** in MS-70, with "Mintage 79,640". That looks like the Red Book row for the rare 2015 (P) coin. 2016 has the same pattern ($360). And an ordinary 2000–2014, 2018 or 2019 one gets **no value at all**, unless he picks "W", which isn't on the coin. | Add Silver Eagle, 2015, no mint, MS-69: $480.00. Same with 2005: "No Red Book value". 2005 + W: $55.00. The demo's own 2015 Eagle shows $480 on Home and in the report. | **Needs his Red Book page** (don't guess): file the "(W)", "(S)", "(P)" rows as choices under the plain date, with the common coin as the default. | S |
| K2 | **Coins that were never made are saved with no warning.** | All saved without a word: 1895-CC Morgan, 1930 Peace dollar, 1922 Mercury dime, 1985 Susan B. Anthony, 2018 Presidential dollar, 1965-D Roosevelt dime, 1942-D war nickel. | Warn, don't block ("No 1930 Peace dollars were made. Save anyway?"). The app already holds exact date-and-mint lists for 34 types (used for album spots), which covers all seven examples but the Presidential dollar; the Add form just doesn't check them. The remaining types need lists looked up: M, later. Keep the 1922 "no D" cent allowed. | S |
| K3 | **A 1943–1945 nickel can be saved as a plain Jefferson nickel**, so its silver isn't counted. | 1943-P under "Jefferson Nickel": melt $0.03. Under "War Nickel": $1.80. No hint points to the right one. | For 1943–1945 point to the war nickel, as the form already does for out-of-range years. 1942 has both kinds: show a hint only. | S |
| K4 | **Silver coins that can only be entered as clad.** The 1976-S silver quarter and half, and the silver proof dimes, quarters and halves from 1992 on, have no type. Metal shows "Clad", melt nothing. | 1976-S Kennedy (clad type): "Metal: Clad", no melt. 1995-S proof dime: "Metal: Clad". Searching "bicentennial" finds only the 2009 cent. | Add the silver types. Dates and silver weights looked up, not guessed. | S |
| K5 | **2009 and 2026 quarters have no type, and the message gives no way forward.** 2026 quarters are in pocket change now. | "50 States Quarter" + 2009: "was made 1999–2008." "American Women Quarter" + 2026: "was made 2022–2025." Neither suggests another type. | Add both types in session 55 (same file as the other new types). | S |
| K6 | Indian Head cents of 1859–1864 are shown as "Copper" (they were copper-nickel). Changes melt by under a cent. | 1860 Indian cent: "Metal: Copper". | Metal by year, like the 1943 steel cent. | tiny |

Already known and not repeated here: types with no Red Book pages yet (Walking Liberty, Barber and others show melt), and the missing older types coming in session 55.

## 3. Dead ends

| # | Problem | Test (reproduced) | Fix | Size |
|---|---|---|---|---|
| D1 | **The coin type search doesn't know everyday words or years.** It answers "No match. Type the coin type below instead", which leads to a hand-typed type: no Red Book value, no melt, and the type can't be changed later. | No match for: "penny", "wheat penny", "ike", "walker", "double eagle", "steel cent", "ASE", "1921 morgan". "silver dollar" lists Kennedy halves but not the Morgan or Peace dollar. | A few nicknames per type in the catalog, and ignore a year typed in the search (or use it to fill Year, which suits idea 77). | S |
| D2 | **Delete album deletes at once.** No "Are you sure?", and Undo is only on screen for 8 seconds. After that the album and its spot edits are gone (coins stay). Delete box does ask. | Demo, open the Morgan album, tap Delete album: gone, "Album deleted… Undo". | Ask first, like Delete box. | S |
| D3 | **The "← My Coins" link sends him back to the top of the list.** The phone's Back button keeps his place. | Demo, scroll My Coins down, open a coin, tap "← My Coins": list is at the top. Same with phone Back: place kept. | The link should act like Back. Do with session 56. | S |
| D4 | **On Home, "Recently sold" hides the Business tag.** The line is cut short with "…" at every phone width (360 to 412), and the "Sold" tag in front of it is no news in a sold list. | Demo, Home, Recently sold: "Sold 2026-10-20 · Raw MS-6…". | Drop the "Sold" tag there; put Business first. | S |

Checked and fine: a link to a deleted album, box or coin gives a way back · Delete box asks and has Undo · removing a want has Undo · adding from an album spot returns to the album (5 taps) · selling a coin frees its album spot · pocket albums go back to My Albums · Simple level hides menus but nothing is lost.

## 4. Big collections

Made-up collections, with the browser slowed 4× to act like a mid-range phone.

| What | 112 coins (demo) | 2,000 | 5,000 |
|---|---|---|---|
| Open the app to Home | instant | 0.5 s | not timed |
| Home redraw | instant | 0.2 s | 0.5 s |
| **Open My Coins** | instant | **2.6 s** | **6.5 s** |
| **Type "1921" in Search** | instant | **4.3 s** | not timed |
| Back to My Coins from a coin | instant | 1.2 s | not timed |
| Save one coin (screen redraw) | instant | 0.6 s | 1.4 s |
| Backup file (no photos) | instant | 0.7 MB, instant | not timed |
| Spreadsheet export | instant | 0.1 s | 0.2 s |

| # | Problem | Fix | Size |
|---|---|---|---|
| B1 | **My Coins draws every row every time** (2,001 rows for 2,000 coins), and redraws them all on each letter typed in Search. | Draw the first 100 and a "Show more" button (or draw as he scrolls); wait until he stops typing before searching. | M |

**Costly to change later?** No. It's one page. Not needed until he passes about 1,000 entries. Everything else (Home, Coin Value, backup, export) stays fast at 5,000. Photos were not part of this test.

## 5. Phone fit

Measured at 320 and 360 wide, every page and pop-up. **No page scrolls sideways and the "+" button covers no button.**

| # | Problem | Where (measured size) | Fix | Size |
|---|---|---|---|---|
| P1 | **Small tap targets side by side** (a finger needs about 40 px). | Want List "Got it · Edit · Remove": 20 px tall, in a row. ⓘ buttons: 23×15. Coin ID "Change": 49×18. "Show missing": 87×18. "← back" links: 22 tall. New album's "Is the album empty?" tick box: 13×13. | Give them 40 px of tap room (padding, no visual change needed). | S |
| P2 | **Tiny text on Home.** | Album names on the spines and "Prices": 9 px. Total labels and shelf captions: 10 px. Metal prices: 11 px. | 12 px floor; do with idea 54 (contrast). | S |
| P3 | Home stack chip and "↻ Refresh" are 23–24 px tall. | Home top shelf. | With P1. | S |

Also see the audit's L3 (Save button at the very bottom): on a 360×640 phone the new-coin form is 1.8 screens with sections closed and 5.7 screens with all open.

## 6. Tap counts

| Task | Taps (plus typing) | Verdict |
|---|---|---|
| Add a coin from Home (recent type, year, mint, grade) | 9 | OK |
| Same, with "+ Add another Morgan Dollar" on the coin page | 7 | Good |
| Add a coin to an album spot | 5 | Good |
| Mark as sold | 3 | Good |
| Add what he paid, on a new coin | +2 (open the section first) | audit L1/L2 |
| Back up | 1 from the Home reminder, else 4 | OK |

| # | Problem | Fix | Size |
|---|---|---|---|
| C1 | **"What is it?" is asked on every add**, though nearly every entry is a US coin. | Open straight on the last kind used, with a small "Something else?" link. | S |

## Not covered

Run in a desktop browser set to phone size, not on his phone: no camera, photos, keyboard-open layout or iPhone. Backup and restore were covered by `reviews/08`. Seller Mode, shows, sales reports, spreadsheet import, view-only snapshots and photo fill got only a load check (no errors). Red Book prices can't be checked without the book; K1 was found from its pattern, not from the page.
