# 17 — Plan: 83 "Value from" + 84 Favorites (Opus, 2026-11-15)

Both add a new saved field on coins, so one 4-box check covers both. Build on Sonnet in one PR with the `waits for review` label; Opus reviews; he says OK before merge.

## Decisions (defaults; he can change them before the build)
**83 Value from**
- New coin field `valueFrom`, saved as a short key: `pcgs`, `ngc`, `ebay`, `dealer`, `other`. Words live in one list in `catalog/varieties.js` (next to payment methods), so other languages or reskins only change the list. *Costly to change later: yes, so keys, not words.*
- A small pick right under Value on Add/Edit coin, shown only when Value has a number. Clearing Value clears `valueFrom` on save.
- Coin page: the Value row reads "Value (eBay sold)". Insurance report Source column: "Owner's value · eBay sold".
- CSV: new column "Value from" out and in (`SHEET_COLS`, names: value from, value source).
- Add many / Fill album copy it like other fields. Not used in any total.

**84 Favorites**
- New coin field `fav: true` (missing = not a favorite). Kept on the coin, not in settings, so it travels with backups, CSV and view-only files.
- ☆/★ button on the coin page: one tap saves it, toast with Undo. In the Coins list, each row also has a tappable ☆/★ (his ask 11-15): small, at the top-right corner of the row next to the coin's name, with space around it so it isn't next to where a thumb scrolls the middle of the list. A tap only counts if the finger doesn't move (a scroll never stars). Same Undo message. Tapping the star doesn't open the coin.
- Filter panel: "Favorites only" tick (`listState.f.fav`); works in saved filters. No new Home section (keeps Simple mode simple).
- CSV column "Favorite" (Yes / blank).

**Old coins:** no field means "not said" / "not a favorite". Nothing is converted, so `DATA_VERSION` stays 1.

## 4-box check (start of build)
| Box | Now | What the build must show |
|---|---|---|
| 1 Backup and restore tested | 🟢 restore copies the whole coin (`mergeRestored`); tests `oldbackup`, `restoresettings` exist | new test: coin with `valueFrom` + `fav` survives backup → restore, and an old backup without them still loads |
| 2 Data version | 🟢 `DATA_VERSION = 1` exists; no conversion added, so no raise | test: old coin with no fields shows "Value", no star |
| 3 Tried on a scratch copy | ⚪ build | run on `?demo` copy in the browser test before the PR |
| 4 Counts and totals match | ⚪ build | test: coin count, Value total, Paid total the same before and after setting both fields |

He approves only when all four are green (review session).

## Steps
1. Sonnet build (est. 4–5 weekly points): branch `v071-valuefrom-fav`, version 0.71.0, What's new line, tests above. PR + label `waits for review`.
2. Opus review (est. 3–4): changed files only, the 4 boxes, then ask him "merge it?".
3. He tries it at `?demo`.
