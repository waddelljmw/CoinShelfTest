# R8 solo Opus review — 2026-11-20 (app v0.101.0)

Scope: everything merged since R7 fixes (PR #328 → #337: steps 16, 16b, 16c, 16d, 18, 19, 20; 19 files, ~195 lines). Deep on the CSV round trip, two-tab sale guard, + button, melt table, album photos. Reproduced problems only. **Nothing fixed here** (his rule: tell him first).

## Findings

**R8-1 (Medium) — CSV round trip freezes a melt-valued coin's value when silver moves.**
Export writes a melt coin's melt as "Value each" (sheets.js `meltValued`). Import turns it back into "use melt" only if it matches today's melt within half a cent (sheets.js:315). Junk coins are always fine; any other silver coin with no Red Book value is not.
Reproduced (script): Mercury dime VF-20, no price file. Export at silver $40 → Value $2.89. Import on a second copy at silver $42 → saved Value "2.89" (typed). Silver to $50 → coin still $2.89, melt $3.62. Every non-junk silver coin without a Red Book price (a tester with no price file: all of them) gets stuck at the old silver price, silently.
Fix: write melt coins with an empty Value each plus a marker (e.g. Value from = "Melt"), and on import treat that marker as "use melt". Or tag the column on export. Small; no new saved field. Add a test with two silver prices.

**R8-2 (Low, selling is 2027) — the two-tab guard only covers one path.**
Code-read: only single Mark as sold (selling.js:187) checks `otherTabCoins`. Sell several as one order (order.js:92), and any edit or move in the stale tab, still save the old "owned" copy over a sale made in the other tab. Fix later: check the message in `saveCoin` itself (one place), not per form.

**R8-3 (Push back, Medium) — Undo now leaves after ~5 seconds.**
Step 16c (idea 123) set Undo to ~5 s. R6-7 (older / low-vision review) found 8 s already too short and asked for ~15 s; Undo is the safety net for moves, deletes and Fill spots. Fast plain messages (1.5 s) are fine. Recommend: Undo back to ~10 s, still closes on tap/swipe. Your call.

**R8-4 (Low) — two small CSV import slips.**
(a) Undo import removes the coins but keeps any "Inherited from" records the import made (sheets.js `inhIdForName`), so a second import attempt can leave duplicates in the inheritance list. (b) When the album exists but is for another coin type, the import message says the album "isn't here" (the preview says it right).

## Checked, no problem found
- Album photos: shows the coin's existing photo, lazy-loaded, nothing new saved; no photo = same as before.
- Melt table: weights come from the catalog, so it can't disagree with coin melt; in sw.js and snapshot lists; follows Hide values.
- Missing spots under a type filter: owned coins only, hidden spots left out, capped at 40.
- + button hides only on a finger swipe or wheel, comes back after 0.7 s or at the bottom.
- Search "You own N" matches year, type and mint (blank = P).
- Two-tab guard: no false alarm on the tab that made the sale (a tab doesn't hear its own messages); editing a sale skips it.

## Suggested queue item
"R8 fixes" (Sonnet, S, ~1 weekly, ~30 min): R8-1, R8-4, plus R8-3 if he agrees. R8-2 waits for 2027 selling. Before 15c fix check, since R8-1 hurts testers most.
