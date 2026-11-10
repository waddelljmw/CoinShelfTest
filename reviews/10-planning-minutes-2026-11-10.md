# Planning meeting minutes: Tue 2026-11-10 (session 53, Opus)

Usage at start: weekly 0% (after the 1pm reset), session 7%.
Status: **proposed, waiting for his "go"** before it is written into PLAN.md, IDEAS.md and CLAUDE.md.

## Idea 75: process answers
- **a) Before changes to how coins are saved:** he exports a backup first; a test that loads an old backup; Opus review before merge; one real restore into a private window. Costly to change later: the web address (host), coin IDs, the coin type field, where Red Book prices live, units (always store one standard unit).
- **b) QA:** automatic tests already run on every PR (`tests.yml`, `gate.yml`). Standard = his SaaS contract model: each item gets 2–3 "it should…" checks he ticks on his phone. Control limits don't fit (they're for repeated measurements). Instead count bugs found after merge; more than 2 in a week means the next update gets a review. Standards change only on planning day.
- **c) Other checks like QA:** monthly backup drill; a 2,000 fake coin speed test; contrast check; a What's-new line for every release.
- **d) PMBOK-light:** still right. The weekly rhythm is basically short sprints; add no more paperwork.
- **e) PLAN.md changes:** a "This week" box at the top (items + checks); move finished phases to an archive file so sessions read less; cost rules into CLAUDE.md.
- **f) More automation:** nothing new needed; tests + merge-on-green already run while he's away.
- **g) Using Claude better:** group notes in one message; new chat after each merge; reply within ~5 min. After a long pause Claude rereads the whole chat at full cost (explains the jump he noticed), so a new chat is cheaper.
- **h) Usage log:** start + end reading per session is enough; ~20–30 sessions shows patterns; logging costs almost nothing.
- **i) Added:** decide where the app lives (GitHub or another host) **before** new changes to how coins are saved.

## Sizes
- **S:** 5, 26, 34, 35, 46, 47, 50, 54, 55, 56, 57, 70, 72; bug #2 (restore settings); bug #4 (box totals)
- **M:** 9, 14, 16, 17, 18, 24, 36, 37, 38, 40, 41, 42, 43, 44, 45, 49, 51, 52, 53, 59, 61, 62, 64, 66, 67, 68, 69, 73, 74; plus not yet in IDEAS.md: new coin types + "Other coin" (last week's pick, never built), Add coin "type the year first", catalog check against the Red Book
- **L:** 1, 4/11, 15, 20, 21 (= bug #10, Red Book prices out of public files), 32, 39, 48, 58, 60, 63 (skip), 71, red box nested containers
- **Already covered:** 6 by 61; 65 is a note for the next review.

## This week (2 M + 2 S, one update)
1. **M:** new coin types + "Other coin" (options 1 + 2 from `09-tuesday-pack`; no change to how coins are saved). Blocks his entry today.
2. **M:** Back button fixes (idea 53). Can lose what he typed.
3. **S:** restore brings settings back (bug #2). Needed before any host move.
4. **S:** box totals count albums kept in them (bug #4).

Cost rules and PMBOK-light are written in during this planning session (no build cost).

## Next 3 weeks (tentative)
- **Nov 17:** L = Red Book prices out of public files + host decision; S = 54.
- **Nov 24:** M = 52 + M = Add coin "year first"; S = 55, 56. *Likely to change.*
- **Dec 1:** L = red box nested containers, or 58/60. *Likely to change; depends on the Fable plan.*

## Fable (free reset, capped at 50% of weekly usage, available until Nov 16)
One **"saved-data blueprint"** session before Nov 16: design every upcoming change to how coins are saved together (58, 60, 71/18, red box, Red Book prices), with tests for each. Hardest thinking in the project; doing it once avoids rework. If any of the 50% is left: the layout + wording audit (66/67).
