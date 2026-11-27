# R11 solo Opus review — 2026-11-26 (main v0.124.1 + open PR #48, E1q v0.125.0)

Scope: everything merged since R10 (PR #33): R10f (v0.116.2), E1a safe carry + backup (v0.117.0), Shelf fix (v0.118.0), 33a Semi-key (v0.119.0), 33b store albums (v0.120.0), 33c varieties (v0.121.0), E1b fewer taps (v0.122.0), E1c receipts (v0.123.0), E1d Edit one by one (v0.124.0), E1r fill-ins (v0.124.1). Deep on the **unmerged PR #48** (E1q: Something else in a spot, Break up a set), with its 4-box check. Page checklist notes included (Save pinned + asks before losing changes, "does everything sit where it makes sense?", taps at real size). Solo, no helper agents. **Nothing fixed, nothing merged.**

## Verdict
Main is in good shape: no data-loss problem found in the 10 merged steps. PR #48 is close, but **should not merge yet**: one money bug (R11-1) needs a small fix first.

## Findings

**R11-1 (Medium, PR #48) — breaking up a set from a receipt counts its tax and shipping twice.**
Reproduced (script): a 1964 proof set, paid $50 + $3 tax + $10 shipping, on a receipt. Break up → the 5 coins' prices add to $63 (good). But the tax and shipping were folded into each coin's *price*. Open that receipt and save it again: the receipt fills tax and shipping onto the coins a second time. Total cost becomes **$76 instead of $63**, and the receipt's "Coins on this receipt" shows $63 where it should show $50. You order proof sets with shipping, so this would hit you.
Fix (S, in PR #48): split the set's price into the coins' prices, and split its tax, shipping and fees into the coins' own tax/shipping/fees boxes. Totals stay exactly the same.

**R11-2 (Low, PR #48) — the Break up screen can lose your work without asking, and its button scrolls away.**
By reading the code: closing the sheet (✕ or phone Back) after filling 10 lines of a mint set throws the work away with no "Discard changes?" question, and "Make coins" sits at the very bottom instead of pinned like other Save buttons. This is the idea 136 rule (Save pinned, ask before losing).
Fix (S, in PR #48): mark the sheet as touched so it asks, and pin the button.

**R11-3 (Low, PR #48) — a "something else" coin whose spot is later hidden can count as owned.**
Reproduced (script): a 1891 Morgan sitting in the 1890 hole as "something else". Hide the 1890 spot in Edit spots (it doesn't ask, since the spot counts as empty): the coin jumps into the 1891 spot and the album shows 1 owned, still marked "something else". Rare.
Fix (S): when its spot is hidden or removed, the coin drops the "something else" mark (goes to Also in this album).

**R11-4 (Low, main E1a) — the backup reminder can count the same coin twice.**
By reading the code: the "25 coins changed" count forgets which coins it already counted each time the app is reopened, so editing one coin on 3 different days counts 3. The reminder just comes a bit early. Nothing is lost.
Fix (S, Sonnet, optional): keep the list of changed coin IDs in settings instead of memory. Your call; fine to leave.

## Checked and fine
- Break up: Undo puts the set, spots, want lists and ID numbers back; coins carry Where from, receipt, Inherited / Keeping for; set becomes Gone "Broken up".
- Set contents are right: 1950–64 proof sets (5 coins, 90% Kennedy in 1964), 1965–67 SMS (40% Kennedy), 1968–74 and 1977–78 S proofs (Ike added from 1973), 1959–64 P+D mint sets; 1975–76 and 1979+ left empty on purpose.
- Something else: moving the coin anywhere clears the mark; the spot stays missing and on want lists.
- Main: backup phone + copy, loose-coin offer on a new album, Select by grade, lot price split, receipt from an album, Edit one by one (no endless loop), Quick grade double-tap guard, Semi-key and the 5 varieties.

## PR #48 4-box check
- (1) Backup and restore tested: **green** (I ran a real backup → wipe → restore: 5 broken-up coins and the Gone set came back with their marks).
- (2) Data version: **green** (no conversion added, so no raise needed; DATA_VERSION exists).
- (3) Tried on a demo copy first: **green** (tests/e1q_demo.js).
- (4) Coin count and totals match: **red until R11-1 is fixed** (equal at break-up time, $13 off after re-saving the receipt).

PR #48 tests: all 213 passed on my run.

## Recommended next
R11f in a new Opus chat: fix R11-1, R11-2, R11-3 inside PR #48, re-run the 4-box check, then merge after your OK (~1–2 weekly, 30–45 min). R11-4 only if you want it.
