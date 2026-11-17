# R2 First-time collector: report (app v0.77.2, Tue 2026-11-17)

Report only. No app code changed. Two Opus sim agents at phone size on copies of the app (R2a: `?demo` empty, guided first coin, first 10 coins; R2b: first week, albums, wants, boxes, prices, backup). Both got the "already done / rejected" lists, ideas 99 to 116 and R1 F1 to F26 as known. Findings below are new (N = R2a, P = R2b). Size guess: S small, M a feature, L changes saved data. Judged by what the screen says only.

## Verdict
The guided first coin, Undo after delete, draft recovery after a reload, and backup then restore on a fresh phone all work. **Two things can put wrong data in without the user knowing:** (1) "Where from" stays lit from the last coin, so a run of coins gets saved as Inherited (N1); (2) Fill spots opens with every spot ticked and one tap adds 254 coins (P1), and it can make a duplicate of a coin he already has (P2). Also, one tap on "See a full sample collection" or "Leave demo" wipes a tester's practice coins with no question (N9).

## Ranked findings
| # | Sev | Size | What happened | Expected | Where I expected it |
|---|---|---|---|---|---|
| N1 | A wrong data | S | After one inherited coin, the next 3 saved as "Inherited · do not sell", "From Grandpa Joe, 2025" (even one with Paid $2.00). Fixing one to Coin Shop did not stop it. | Blank on every new coin, or a line "Same as last: Inherited" | Add coin, Where from |
| P1 | A wrong data | S | Fill spots / New album "Already has coins" opens 254 of 254 ticked; one tap on Save coins added 254 coins, no question. | Start unticked, or ask "Add 254 coins?" | Fill spots sheet |
| P2 | B | M | With a loose 1944-D cent already owned, ticking 1944-D in Fill spots made a second coin. No hint. | "You already have a 1944-D. Use it?" | Fill spots row |
| N9 | B | S | Demo banner "See a full sample collection" replaced 11 practice coins with the sample with no question; reload wipes everything. "Nothing is saved" only shows on the first card. Leave demo is a small 82x20 link beside it. | Ask first; keep "reload clears this" in the banner | Demo banner |
| N5 | B | M | Year 1493: "No coin type matches 1493". "Type it yourself" saves a non-silver "other" item (OC-001), value "—". Fixing the year keeps it non-silver; only Delete + re-add fixes it. | "1493 isn't a US coin year", or "Did you mean Walking Liberty?" | Year box |
| N2 | B | S | The lit source chip turns OFF when tapped: tapping Coin Show saved no Where. | A tap always selects | Source chips |
| N3 | B | S | "More…" under Where from does nothing. Pocket change took 2 extra taps via Purchase details. | Shows full list | Source chips |
| N4 | B | S | eBay quietly fills Paid with "Card", Coin Show fills "Cash". | Blank | Purchase details |
| N6 | B | S | Mint mark has no "Don't know"; defaults to None (Philadelphia), so Buffalo and Mercury were saved as Philadelphia and not in Needs info. | "Not sure" choice, listed in Needs info | Mint mark list |
| N7 | B | S | Hide values still shows melt $ on Home Recently added and "Melt each" on the coin page; My Coins and Coin Value have no hide button. | All money hidden | Every page |
| N8 | B | S | Search "silver" found 4 of 7 silver coins; "grandpa" found 0; "1950 D" found 0 ("1950-D" works). (Extends F15.) | Metal, source name and loose forms match | Search |
| P3 | B | S | Back on a half-filled New album form and on the Fill spots sheet (3 graded rows) drops everything; album stays 0/254. (Extends F7.) | "Discard?" | Album form, Fill spots |
| P4 | B | S | A coin put in the "1909 VDB" spot shows as plain "1909 Lincoln Wheat Cent"; Edit says "Regular (no variety)". Spot menu says VDB. | VDB on the coin | Coin page |
| P10 | C | S | New box with defaults: Add box seemed to do nothing; only a fading toast "Each tray needs 1–50 rows…"; fields not marked. | Mark the empty fields | New box |
| N10 | C | S | Guide step 2: tapping the list item already jumps to step 3, so Next skips the grade step. | Never skip | Guide |
| N11 | C | S | Guide step 7 mentions a "Missing" row the page doesn't have; "Coin added" toast covers the Done button about 3 s. | Wording fits | Guide |
| N12 | C | S | Pocket-change US cent "Paid $0.00" but the Canada coin says "Missing: cost". | Same rule | Needs info |
| N13 | C | S | My Coins keeps the Needs info filter after leaving: "In collection (11)", 1 shown, All lit. | Clear it | My Coins |
| N14 | C | S | Coin Value shows the foreign coin as $0.00; its page shows "—". | Same mark | Coin Value |
| N15 | C | S | Real app "Start my collection" has "Everything" chosen (includes selling); the demo never shows the choice. | Simple for a newcomer | Level picker |
| N16 | C | S | Newcomer words: "Full Bands (FB)", "Variety: Regular (no variety)", "inherited not counted" before any inherited coin, "ESTIMATE*" with no note, no ⓘ on Home, "Tap the +" next to a "+ Add another" button. | Plain words | Home, Add form |
| P5 | C | S | No text size setting anywhere (R6 will cover). | "Text size" | Options > Look |
| P6 | C | S | Fresh-phone welcome has no "I have a backup file"; restore took 7 taps via Options. | Button on welcome | Welcome card |
| P7 | C | S | ⓘ popups differ from the screen: spot price says "one ounce" but copper is "$ per lb"; grade ⓘ says "Raw / Slab", buttons say Raw / Certified. | Same words | ⓘ popups |
| P8 | C | S | Demo "Get live prices" with no internet shows nothing; real app shows "Couldn't get prices". | Same message | Demo Options |
| P9 | C | S | Home "No albums yet / Tap to add one" opens the album list, not the New album form. | Open the form | Home |
| P11 | C | S | "Stack: My Silver Stack" in Move to, though no stack was made. | Hide until used | Move to |

## Tap counts
- **Guided first coin 11.** US coin with grade, source, paid 10 to 11. Add a coin 8 (6 with "+ Add another"). Foreign coin 8. Fix a coin wrongly marked Inherited 5. Fix a wrong year: Delete 3 + re-add 10.
- **First album 5.** Put an owned coin in a spot 3. Want one coin 9. Missing coins to a want list 2. New box 7 (+1 after the silent fail). Move 3 coins into a box 9.
- **Metal price:** first-silver prompt 2; Options 4 + typing. **Backup:** banner 2; Options 5. **Restore on a fresh phone 7.** Switch level 4. Load price file 4 + scrolling. Search 3. Hide values 1. Undo delete 1 (lasts about 6 to 8 s; edits have no Undo).

## Too easy to hit
The lit Inherited chip (N1, N2) · Save coins on Fill spots (P1) · Leave demo next to See a full sample collection (N9) · coin-page button row (known).

## How I used it that we didn't plan
Typed a run of coins trusting Where from to start blank · used "Type it yourself" to get past a year error · searched by metal and by who it came from · picked "Already has coins" for coins he had already typed in · spent effort building in demo then tapped Leave demo · tried the backup file as a price file (refused cleanly) · tried a Mercury dime in a Morgan album (refused cleanly).

## What worked
Guided first coin; Undo after delete; whole draft back after a reload; backup then restore into a private window kept album spot, box, want list, silver price and level; wrong-album move refused; Back walks pages correctly. Old review 01: silver prompt, Spot prices unfolded, "+ Add another", album brand and number first are fixed; jargon (F23) still true.

## Not tested
Real touch and iPhone, photos, live prices, a real price file, pocket and type-set albums, slabs, CSV, selling, Safe shelf style, phone zoom and large fonts, installing offline, Undo after a long wait, big collections.

## For R4 and planning
Group by who gets hurt. **Wrong or unwanted data in:** N1, P1, P2, N5, N6. **Lose practice work:** N9, P3 (with F1, F7). **Hide/search/words:** N7, N8, P4, N16, P7. N1 and N2 and N4 are one fix (don't remember or auto-fill the source and payment). N1, P1, P2 touch what gets saved: Opus, ask him first.
