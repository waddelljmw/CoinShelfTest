# Consultant notes (ChatGPT handoff, 2026-11-06), condensed by Claude

An outside review written by ChatGPT. It is advice, not a plan. Claude decides what goes into PLAN.md on planning day.

## Keep
- **Decision filter:** "Maximum accurate information. Minimum effort." Ask of every idea: what does it save, can stored info or defaults do it, can it be a batch, does it keep old data and accuracy, and what is the smallest safe version?
- **No more AI test-user rounds** for now. Reviews 01–06 were scripted on a test computer, not a real phone. Next, test on a real phone.
- **README storage wording looks stale.** It says data is saved to the Claude account, but app.js also uses on-phone storage (IndexedDB) when the app runs on its own. Check this, fix the README, and tell him plainly where his coins live.
- **Backup/restore has never been tested for real** (including photos and restoring into an empty app). This is the top data risk. Don't call it broken unless it fails a real test.
- **Value labels:** check that Red Book value, melt value, estimate, face value and "no value yet" are always told apart.
- **No tracking/analytics code.** Measure by hand if needed.

## Later / only if needed
- Dealer workflow (per-order Whatnot fee, ship queue, payout matching, stream run sheet): only if he or a seller he knows will actually use it. Check the current code first; v0.53–v0.54.1 already fixed a lot.
- An "add another" flow for entering many coins, and easier search by location.
- A timed-task benchmark: at most 2–3 tasks, done by him on his phone.

## Dropped
- Labelling every handoff item against the code (that would be another full audit).
- Repeating rules that already live in CLAUDE.md / PLAN.md.
