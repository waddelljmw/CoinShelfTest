# Coin Cabinet

A private coin inventory app, rebuilt from the Base44 prototype with all the fixes from the wishlist. It runs as a private Claude artifact: coins are saved to your Claude account, photos are stored with the artifact, and nobody else can see them unless you share the link.

## Files

- `index.html`: page shell and menu
- `styles.css`: look and feel, light and dark mode
- `data.js`: coin types (Red Book series), metal content, grades, and exact date/mint lists for album series
- `app.js`: the app itself (plain JavaScript, no build step)

## Features

- **Menu (top right):** Home, Coin Value, Albums, Your Coins, PCGS Photo Guide, Options
- **Add coin:** "Start from a known coin" fills in type, denomination, metal and metal content. Metal comes after grade. Photos sit below notes and collapse. The label fills in automatically as date-mint mark, coin type, denomination, and you can type over it.
- **Grading:** Raw coins use "My estimated grade" (with Other for a custom grade) and show as "Raw VF-20". Certified coins take a grading service and cert number and show as "PCGS MS-63". Junk sits below the lowest grade and is valued at melt.
- **Home:** collection value, melt value, paid, and gain (inherited coins not counted). Each spot price can be hidden. Melt by metal shows only for metals you own.
- **Sold:** mark a coin sold with an optional sale amount, shipping and insurance. Sold results (sales, profit, margin %) stay hidden until your first sale, and you can turn them on or off in Options.
- **Inherited:** a source of "Inherited" adds a small "Do not sell" mark and keeps the coin out of gains.
- **Undo delete:** an Undo button appears after every delete, and Options → Recently deleted can restore coins later.
- **Your Coins:** filter chips by coin type (common types show even at zero), metal, and raw or certified. Sort by year, value, melt, date acquired or type. Compact rows with small thumbnails.
- **Albums:** Whitman, Dansco or Other plus an album number makes a virtual album. You can also build a custom album from a coin type and date range. Each album shows owned/total, album value, album melt, a list of missing coins, and a green check when complete. Morgan, Peace, Walking Liberty, Franklin and Mercury albums use the real dates and mint marks. Other series list every year × mint, and you can remove slots.
- **Check eBay sold:** a button on every coin opens eBay's sold listings for that coin. Certified coins also search by service and grade.
- **Export CSV** in Options.
- The source field suggests your earlier entries. Every field can be edited.

## Spot prices

You type the prices in Options; the app doesn't use a live price feed. Copper is entered per pound, and the other metals per troy ounce.

## Testing

Open `index.html` in a browser to use practice mode, where nothing is saved. A Playwright run with practice coins checks adding, selling, deleting and undoing, filters, and albums.
