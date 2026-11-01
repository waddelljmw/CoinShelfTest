# Coin Cabinet

A private app for keeping track of a coin collection: what you own, where it is, what it's worth, and its melt value. Built for a phone first.

## What it does

- **Your coins:** add a coin in a few taps. Pick a known coin type and the app fills in the denomination, metal and silver or gold weight. Raw or certified (PCGS, NGC and others), proof or regular, with photos.
- **Values:** Red Book value where the app has it, melt value from the metal prices you enter, what you paid, and your gain. Inherited coins are marked "Do not sell" and kept out of gains.
- **Albums:** type an album's brand and number (e.g. Whitman 9122) and the app builds it with the right dates, mint marks, designs and proof spots. Tap any spot to add the coin you have or put it on your want list.
- **Want lists:** several lists, including lists for one coin type or grade, with the most you'd pay.
- **Sales:** mark coins sold, with shipping, insurance, where it sold and who bought it. Move a coin back if needed.
- **Reports and sharing:** an insurance report you can print or save as a PDF, a spreadsheet export and import, and a view-only "snapshot" file to show friends (private details left out).

## Where your coins are kept

For now, coins are saved to your Claude account and are private to you. The plan (see `PLAN.md`) moves the app onto your phone so it works offline, with a Backup file you control.

## Files, in plain words

- `index.html` and `styles.css`: the page and how it looks.
- `app.js` and the other `.js` files at the top level: how the app works.
- `catalog/`: what the app knows about coins (types, dates, Red Book prices, album numbers).
- `tests/`: automatic checks that run before every change. `node tests/run-all.js` runs them all.
- `PLAN.md`: the plan and progress checklist. `CLAUDE.md`: working rules for Claude.

## Version

The version number shows at the bottom of the Options page.
