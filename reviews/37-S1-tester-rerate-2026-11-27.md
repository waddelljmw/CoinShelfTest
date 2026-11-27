# S1: the six testers try again (app v0.125.1, Fri 2026-11-27)

Report only. No app code, saved data or IDEAS.md was changed. One Opus chat, solo, no helpers. I re-ran the six simulated testers from the 11-17 big review (R1 to R6, reports 20 to 25) on `?demo=big` (1,229 made-up coins, 4 albums) in a phone-size browser (390x844, touch). Each tester first re-checked what tripped them up or cost their trust on 11-17, then did their real jobs with taps counted.

**How taps are counted:** every tap on a button, chip or row = 1; picking from a drop-down list = 2 (open + pick); typing in a box = "typed"; a "scroll" = the thing to tap was off screen. Opening the app is not counted.

**Tags:** RUN = I did it in the browser · TEST = covered by an app test that passes on GitHub (I did not re-run it) · GUESS. The 11-17 reports had no stars, so the **"then"** stars are my GUESS from their verdicts.

## Verdict
- **Every trust-loser I re-ran is fixed** (14 of 14 I ran myself, 4 more covered by app tests); one is only partly fixed and already on the known-gaps list (F2, restore over newer data). Nothing crashed; no page errors.
- **Stars: 3.0 then (GUESS) to 4.3 now.** Album filler went to 5. Nobody is below 4.
- **Big jobs are fast now:** a coin with grade and source is 9 taps + 2 typed; 3 album spots with grades 12 taps (4 a coin); moving a spot 40 places 7 taps; a sale 10 taps; regrade 4 taps.
- **What still costs trust (new, all small):** a scary Home "Gain −77%" when most coins have no price yet (S1-1); the "Red Book" name on screens (S1-2); the agreed "Cull" word never shipped, the grade list still says "Junk" (S1-3).

## Stars
| Tester (11-17 report) | Then (GUESS) | Now | One line, in their words |
|---|---|---|---|
| R1 Everything collector (20) | ★★★☆☆ | ★★★★☆ | "The four ways I could lose data are closed. Home told me I'd lost 77% though, and I hadn't." |
| R2 First-time collector (21) | ★★★☆☆ | ★★★★☆ | "Where from starts blank, Fill spots starts empty and the demo asks before wiping my practice coins. My first inherited coin was flagged 'needs info' right away." |
| R3 Seller (22) | ★★★★☆ | ★★★★☆ | "The show no longer sneaks onto shop sales and a refund goes back on the For sale list. Still no partial refund." |
| R4 App critic (23) | ★★★☆☆ | ★★★★☆ | "My top list is done. Now fix the words: 'Red Book' everywhere and 'Junk' where you agreed 'Cull'." |
| R5 Album filler (24) | ★★★☆☆ | ★★★★★ | "Fill spots crosses off my want list, hiding a full spot asks, an upgrade asks to swap, and a long move is 7 taps." |
| R6 Older user (25) | ★★☆☆☆ | ★★★★☆ | "Extra large works on every page with no sideways scroll. I had to dig in Options to find it." |

## 1. Re-checks: what tripped them up on 11-17
| Tester | 11-17 problem | Now | How |
|---|---|---|---|
| R1 | F1: a fast Back after typing a metal price wiped every price | Fixed: gold kept, silver/platinum/copper untouched | RUN |
| R1 | Half-filled Add coin form vanished on Back | Fixed: the form stays open | RUN |
| R1 | Box into a for-sale case skipped the inherited check; sold coin edited to Inherited | Fixed | TEST (inheritguard, seller82) |
| R1 | F2: restore hid coins in added spots | **Partly:** restore now warns that it replaces albums; restoring an older backup over newer data is still a listed known gap (R4-25) | pipeline.json, not re-run |
| R2 | N1: Where from stayed on Inherited for the next coins | Fixed: next form starts with no chip lit | RUN |
| R2 | P1: Fill spots opened with all 254 ticked | Fixed: "0 of 8 spots ticked" | RUN |
| R2 | N9: "See a full sample" wiped practice coins with no question | Fixed: "Replace your practice coins?" | RUN |
| R2 | N15: new real app started on Everything | Fixed: starts on Collector | RUN |
| R3 | R3-1: today's show filled into a shop sale | Fixed: Show starts on "No show" when no show is running | RUN |
| R3 | R3-4: refund put Business stock "In collection" | Fixed: back on For sale, sale kept as Refunded, Undo offered | RUN |
| R3 | R3-2: personal coin moved into a case with no question | Fixed | TEST (biz-on-forsale) |
| R4 | Idea 99: one album's want list crossed off by another album | Fixed | TEST (multilist) |
| R4 | Idea 108: "Fill in from photos: coming soon" on every form | Fixed: gone from the real app | RUN |
| R4 | Group totals disagree (Business in album value) | Fixed | TEST (step13numbers) |
| R5 | R5-1: Fill spots never crossed coins off the Missing list | Fixed: open wants 2 → 1 after filling | RUN |
| R5 | R5-5: hiding a filled spot, no question | Fixed: "This spot holds your 1878 VF-30. Hide it anyway?" | RUN |
| R5 | R5-7: the better coin didn't take the spot | Fixed: "Put the AU-55 in the spot?" with Swap choices | RUN |
| R6 | R6-1: no way to make text bigger | Fixed: Normal / Large / Extra large, no sideways scroll at Extra large | RUN |
| R6 | Tap targets under 24 px | Fixed on Home, My Coins, album, Options (0 found); 1 left on the coin page (S1-4) | RUN |

## 2. Real jobs, with taps
| Tester | Job | Taps |
|---|---|---|
| R2 | Add a 1964-D Kennedy half, AU-50, Pocket change | 9 taps, 2 typed (1 scroll to the Add coin button). Paid fills $0.50 by itself. |
| R5 | Fill 3 open Morgan spots with a grade each (Fill spots) | 12 taps (4 a coin) |
| R5 | Want an upgrade on a filled spot | 3 taps |
| R5 | Got it on that upgrade, pick grade, swap into the spot | 4 taps + the swap choice |
| R5 | Move one spot 40 places in a 140-spot Lincoln album | 7 taps, 4 scrolls (his worry was 81 taps) |
| R1 | Find a coin by typing on Home ("1881 cc") | 1 typed + 1 tap; results in under 1 second with 1,226 coins |
| R1 | Change that coin's grade from its page | 4 taps |
| R3 | Sell a For sale coin at a shop (find it, Mark as sold, paid with, where, save) | 10 taps (asking price fills Sold for) |
| R3 | Refund or cancel a sale | 1 tap, with Undo (no question) |
| All | My Coins with 1,226 coins | opens in about 0.06 s; Home search about 0.8 s |

## 3. New findings (small, none lose data)
| # | Sev | Size | What happened | Suggest | Saved data? |
|---|---|---|---|---|---|
| S1-1 | B trust | S | Home shows **Gain −$59,898 (−77.1%)** when 1,064 of 1,229 coins have no value and are counted at melt against what was paid. A new user with no price list sees a big fake loss. | When most coins have no value, show Gain as "—" with "add values to see gain", or count only coins that have a value. | No |
| S1-2 | C words | S–M | "Red Book" appears on screens even with no price list loaded: the Add coin chooser ("isn't a US coin from the Red Book"), every coin page ("no Red Book value"), the Options section name, the ⓘ help word. Your 11-18 rule: no publisher or brand names in app wording. | Question for planning (below): use a plain word ("price list", "your book") unless he typed the name himself. | No |
| S1-3 | C words | S | The 11-10 blueprint (C2) agreed "Junk" shows as **"Cull"**. Every grade list still says "Junk" (Add coin, Fill spots). | Build the display-only part (saved word stays Junk). | No (display only) |
| S1-4 | C taps | S | Coin page "PCGS photos ↗" link is 18 px tall (20 at Extra large); under the 24 px minimum. | Make it a 44 px row like the other links. | No |
| S1-5 | C | S | Text size sits in Options; an older user has to know to look. | Offer Normal / Large / Extra large on the first-run "How much do you want to see?" sheet. | No |
| S1-6 | C | S | Saving a new inherited coin lands on its page with "Missing: inherit date" straight away. Fine for him, a nag for an heir typing 50 coins. | Only flag it after the run, or let Mark inherited fill it for the batch. GUESS on how much it bothers people. | No |
| S1-7 | C | S | Refund or cancel is one tap with only an Undo toast, and has no partial amount or date (R3-6, R3-13 still open). | Leave for the 2027 selling group. | Maybe |

**Not a finding:** the app still says "Coin Cabinet". The new public name waits on name clearance; that's a launch-planning item.

## Not tested
Real phone touch and Android/iPhone differences, photos, live metal prices (blocked here), printing, restore of a real backup, offline use. Seller checks used the demo's Business coins only.
