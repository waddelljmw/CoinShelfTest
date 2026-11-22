# Planning minutes, 2026-11-16 (Mon night, before the Tue 11-17 1pm reset)

**Job:** sort his 18 numbered notes (written after the pawn-shop trip and the last test) into IDEAS.md, wording kept. Sonnet. No builds picked yet; this week's picks happen after R4 (item 10 big review).

## His answers
- 5a: the album was made as a regular album; it needs to be marked inherited.
- 6a: "ke…" meant **key dates**.
- 17 trade-in: **park, low priority** (happened once).
- eBay sold prices go on a coin card for empty album spots; **merged into 7** (idea 105).

## Where the notes went (IDEAS.md 99–116, all "known — reviewers don't re-report")
- A Wants and albums: 99 (5 + 5b, hot bug), 100 (13), 101 (14), 102 (15), 103 (18)
- B Albums and empty spots: 104 (5a), 105 (7 + eBay), 106 (8), 107 (10)
- C Options and buttons: 108 (4b + 4c), 109 (4), 110 (4d), 111 (3a + 3b)
- D IDs: 112 (1) · E Melt: 113 (11) · F Seller: 114 (17, parked), 115 (a pawn-shop owner sim) · G Process: 116 (12 and the "reviews should catch this" notes)

## Skipped as already covered
- Note 2 (add a box from the Kept in menu): idea 41.
- 6a mintage under spots + key dates: idea 68.
- 9 rename an album: Edit album already has an editable Name box.
- 16 seller demo: idea 45 (Seller-mode sample data).
- 4b and 4c are not in the plan, so they are idea 108 and go in a quick fix chat.

## Code checks that changed the answer
- **5b is a real bug:** `missingSuggest` (wants.js) picks an existing list by coin type, so two Morgan albums share one list.
- **5a:** Edit album already has "This album was inherited". What is missing is a visible label afterward (idea 104). He can tick it now.
- **1:** coin IDs are added after a coin is saved (`ids.js` `ensureIds`); Options > Coin ID style exists. A business prefix may not need a new saved field.
- **10:** New album already finds an album by brand and number; typing the name is new.
- **11:** no coin-by-coin melt table exists today.

## Decisions
- Quick fix before the reset: 4b collapsible "How much to show" and 4c hide Photo fill (keep code). Sonnet, S.
- After the reset: R1–R4 as planned. Every review run also does a tap-by-tap pass and a "where I expected it" line on each finding (idea 116). Ask each sim to note "how I used it that we didn't plan" (idea 103).
- R4 reads ideas 99–116 and ranks them; the weekly picks follow the S/M/L fit (1 L + 1 S, or 2 M + 1–2 S, or up to 5 S).
- 99 (the wrong-list bug) goes to the top of the ranking. 110 needs one question first (which screen). 112 and 114 change how data is saved: ask first, 4-box check.
