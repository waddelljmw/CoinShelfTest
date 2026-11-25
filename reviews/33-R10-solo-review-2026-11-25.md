# R10 solo Opus review — 2026-11-25 (app v0.116.1)

Scope: steps 30 (Select › Set for all, v0.114.0), 30b (Add bar / Save bar words, v0.114.1), 30c (long-press to select, v0.115.0), 31 (album layout: blank spots, Move/Hide several spots, own order, v0.116.0) and the v0.116.1 Create album fix. Deep on those; light elsewhere. Page checklist notes included: Save pinned + asks before losing changes (idea 136), "does everything sit where it makes sense?", and tap counts at real album size. Reproduced problems only (scripted checks at phone size, 390 px). **Nothing fixed here.**

## Findings

**R10-1 (Medium) — "Original to the album" follows a coin into a different album.**
Reproduced: a coin marked original in album B1, moved with Select › Move to › album B2, still says "original" in B2. Moving a coin (Move to, Move to another album, Take out, blank-spot "A coin I have") never clears the mark. Since step 30 any album can have original coins, so this now happens more often. It is wrong history: that coin did not come with B2.
Fix (S, Sonnet): clear `origAlbum` whenever a coin's album changes (one place: `applyKept`). Undo already brings the old coin back.

**R10-2 (Medium) — a blank spot nudged with ◀ ▶ snaps back to the end later.**
Reproduced: in a year-order album, a blank spot moved with ◀ into the middle (after 1941-D) does not switch the album to "your own order". The next "+ Add a spot" (next to its year), or an Edit album year change, re-sorts and every blank spot jumps back to the end. Coins in blank spots move with their spot, so nothing is lost, but your page layout is.
"Move spots" and "Add blank spots after…" do set your own order; only the ◀ ▶ path misses it.
Fix (S, Sonnet): moving a blank spot past a dated spot of another year turns on "your own order", like moving a dated spot does.

**R10-3 (Medium-low) — rolls and mint sets can go into an album's blank spot.**
Reproduced: a roll and a mint set both appear in a blank spot's "A coin I have" list; the roll went in and the album's value counted it. Select › Move to blocks the same move ("only coins go in albums").
Fix (S, Sonnet): that list shows coins only (same rule as Move to).

**R10-4 (Low, your call) — Set for all › Grade skips "Not graded" coins by default.**
Reproduced with 4 coins (2 Not graded, 1 blank, 1 MS-64): the safe default "Only the blank" sets the grade on just 1 coin ("Set VF-20 on 1 coin"). "Not graded" counts as already filled, yet those are often exactly the coins you want to grade in a batch. "Change all" would also overwrite the MS-64.
Recommend: for Grade only, treat Not graded as blank (the Now line still lists them). One-line change, no saved-data change.

**R10-5 (Low) — removing a blank spot with a coin in it shows wrong words.**
Reproduced: "This spot holds your **Blank spot** AU-50. The coin stays in the album **under its date**." A Kennedy half in a Wheat cent album's blank spot has no date spot; it goes to "Also in this album".
Fix (S): name the coin (e.g. "1964 Kennedy Half AU-50") and say where it goes.

**R10-6 (Low, place check) — two Select bar buttons sit where they don't fit.**
"Sell together…" shows on every Select bar, even with Seller Mode off (selling starts 2027; step 12 hid other selling buttons). "Take out of album…" shows on My Coins and box pages, where most picks aren't in an album (they're skipped and listed).
Recommend: Sell together only with Seller Mode on; Take out of album only on album pages. Screen only.

## Tap counts at real size (100-spot album)
- Move one spot 40 places: Edit spots › Move spots › tap it › Move 1 spot… › type "1963-D" › Put them there = **5 taps + typing** (was up to 40 ◀ taps). A second spot behind it: tap both first, same 5 taps. Meets the 11-25 note.
- Hide 6 spots: 6 taps + 3. Grade a whole album: Select › Select all › Set for all › Grade › pick › Set = **6 taps**. Long-press saves 1 tap per batch.
- Nothing found that needs a faster path.

## Checked, no problem found
- Set for all: one Undo puts every coin back; skipped coins are listed with reasons; sold coins skipped; slabs keep grade and holder; album coins keep holder "Album"; Add to notes never wipes existing notes and skips a repeat line; Add to a want list skips coins already on it and Undo removes the new list too; all write actions are blocked in view-only copies.
- Long-press: starts only where a Select button exists; letting go doesn't also open or untick the coin; the next normal tap works; the phone's own menu is blocked.
- 30b: Add bar / Save bar words change with the type.
- Step 31: Move spots keeps tap order; Hide several asks first when spots hold coins; Put back in year order + Undo; blank spots never count in Owned or Add missing; backup keeps blank spots and order (test layout31).
- v0.116.1: Create album says what's missing.
- Idea 136 check: Save stays pinned; editing a saved coin then closing now asks "Discard your changes?" (R9-3 is fixed). New small sheets (Add to notes, Move spots) hold one typed line only; no ask needed.
- Related tests: setall30 (22), longpress30c (7), layout31 (34), barwords30b (7): all pass.

## Suggested fix step (R10f, Sonnet, ~1 weekly, ~30 min, waits for your OK)
R10-1, R10-2, R10-3, R10-5, plus R10-4 and R10-6 if you say yes. No change to how coins are saved (R10-1 only removes a wrong mark when a coin moves).
