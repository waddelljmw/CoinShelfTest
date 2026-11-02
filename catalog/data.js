// Coin Cabinet reference data.
// Metal content is the fine metal in troy ounces per coin.
// Copper content is also in troy ounces; the copper spot price is entered per pound
// and converted (1 troy oz = 0.0685714 lb).
"use strict";

const LB_PER_TROY_OZ = 0.0685714; // one troy ounce in avoirdupois pounds

const AG = {
  dime: 0.07234, quarter: 0.18084, half: 0.36169, half40: 0.14792,
  dollar: 0.77344, ike40: 0.31625, warNickel: 0.05626,
};
const CU = { cent: 0.09499, nickel: 0.12057, flyingEagle: 0.13213 };

// family = the filter chip a type belongs to.
// mints = the mint marks the type was struck at (P means no mint mark on most older coins).
const COIN_TYPES = [
  // Cents
  { id: "flying-eagle-cent", name: "Flying Eagle Cent", family: "Flying Eagle cent", denom: "1C", face: 0.01, start: 1856, end: 1858, mints: ["P"], metal: "Copper-nickel", melt: "copper", oz: CU.flyingEagle },
  { id: "indian-cent", name: "Indian Head Cent", family: "Indian Head cent", denom: "1C", face: 0.01, start: 1859, end: 1909, mints: ["P", "S"], metal: "Copper", melt: "copper", oz: CU.cent },
  { id: "lincoln-wheat", name: "Lincoln Wheat Cent", family: "Lincoln cent", denom: "1C", face: 0.01, start: 1909, end: 1958, mints: ["P", "D", "S"], metal: "Copper", melt: "copper", oz: CU.cent, note: "1943 cents are zinc-coated steel, so the metal is set to Steel for 1943. 1922 cents were only struck in Denver (a 1922 with no D is a famous variety).",
    metalByYear: { 1943: ["Steel", 0] }, varieties: { "1909|": ["", "VDB"], "1909|S": ["", "VDB"] } },
  { id: "lincoln-memorial-copper", name: "Lincoln Memorial Cent (copper)", family: "Lincoln cent", denom: "1C", face: 0.01, start: 1959, end: 1982, mints: ["P", "D", "S"], metal: "Copper", melt: "copper", oz: CU.cent, note: "1982 was struck in both copper and zinc. Weigh it: copper is 3.1 g, zinc is 2.5 g." },
  { id: "lincoln-memorial-zinc", name: "Lincoln Memorial Cent (zinc)", family: "Lincoln cent", denom: "1C", face: 0.01, start: 1982, end: 2008, mints: ["P", "D", "S"], metal: "Zinc", melt: null, oz: 0 },
  { id: "lincoln-bicentennial", name: "Lincoln Bicentennial Cent (2009)", family: "Lincoln cent", denom: "1C", face: 0.01, start: 2009, end: 2009, mints: ["P", "D", "S"], metal: "Zinc", melt: null, oz: 0,
    note: "Four reverse designs, each struck at Philadelphia and Denver. Coins from 2009 Mint and Proof sets are 95% copper: set the metal to Copper for those.",
    varieties: { "2009|": ["Birth and Early Childhood", "Formative Years", "Professional Life", "Presidency"], "2009|D": ["Birth and Early Childhood", "Formative Years", "Professional Life", "Presidency"], "2009|S": ["Birth and Early Childhood", "Formative Years", "Professional Life", "Presidency"] } },
  { id: "lincoln-shield", proofMints: ["S", "W"], name: "Lincoln Shield Cent", family: "Lincoln cent", denom: "1C", face: 0.01, start: 2010, end: 2026, mints: ["P", "D", "S", "W"], metal: "Zinc", melt: null, oz: 0,
    note: "The last cents for circulation were struck in 2025. 2026 cents (dated 1776–2026) come only in US Mint sets. 2017 Philadelphia cents carry a P mint mark." },
  // Nickels
  { id: "shield-nickel", name: "Shield Nickel", family: "Shield nickel", denom: "5C", face: 0.05, start: 1866, end: 1883, mints: ["P"], metal: "Copper-nickel", melt: "copper", oz: CU.nickel },
  { id: "liberty-nickel", name: "Liberty Head V Nickel", family: "Liberty nickel", denom: "5C", face: 0.05, start: 1883, end: 1912, mints: ["P", "D", "S"], metal: "Copper-nickel", melt: "copper", oz: CU.nickel },
  { id: "buffalo-nickel", name: "Buffalo Nickel", family: "Buffalo nickel", denom: "5C", face: 0.05, start: 1913, end: 1938, mints: ["P", "D", "S"], metal: "Copper-nickel", melt: "copper", oz: CU.nickel },
  { id: "jefferson-nickel", name: "Jefferson Nickel", family: "Jefferson nickel", denom: "5C", face: 0.05, start: 1938, end: 2026, mints: ["P", "D", "S"], metal: "Copper-nickel", melt: "copper", oz: CU.nickel },
  { id: "jefferson-war-nickel", name: "Jefferson War Nickel (35% silver)", family: "Jefferson nickel", denom: "5C", face: 0.05, start: 1942, end: 1945, mints: ["P", "D", "S"], metal: "Silver", melt: "silver", oz: AG.warNickel, note: "War nickels have a large mint mark above Monticello, including P." },
  // Dimes
  { id: "barber-dime", name: "Barber Dime", family: "Barber dime", denom: "10C", face: 0.10, start: 1892, end: 1916, mints: ["P", "O", "S", "D"], metal: "Silver", melt: "silver", oz: AG.dime },
  { id: "mercury-dime", name: "Mercury Dime", family: "Mercury dime", denom: "10C", face: 0.10, start: 1916, end: 1945, mints: ["P", "D", "S"], metal: "Silver", melt: "silver", oz: AG.dime },
  { id: "roosevelt-silver", name: "Roosevelt Dime (silver)", family: "Roosevelt dime", denom: "10C", face: 0.10, start: 1946, end: 1964, mints: ["P", "D", "S"], metal: "Silver", melt: "silver", oz: AG.dime },
  { id: "roosevelt-clad", name: "Roosevelt Dime (clad)", family: "Roosevelt dime", denom: "10C", face: 0.10, start: 1965, end: 2026, mints: ["P", "D", "S", "W"], metal: "Clad", melt: null, oz: 0 },
  // Quarters
  { id: "barber-quarter", name: "Barber Quarter", family: "Barber quarter", denom: "25C", face: 0.25, start: 1892, end: 1916, mints: ["P", "O", "S", "D"], metal: "Silver", melt: "silver", oz: AG.quarter },
  { id: "standing-liberty-quarter", name: "Standing Liberty Quarter", family: "Standing Liberty quarter", denom: "25C", face: 0.25, start: 1916, end: 1930, mints: ["P", "D", "S"], metal: "Silver", melt: "silver", oz: AG.quarter },
  { id: "washington-silver", name: "Washington Quarter (silver)", family: "Washington quarter", denom: "25C", face: 0.25, start: 1932, end: 1964, mints: ["P", "D", "S"], metal: "Silver", melt: "silver", oz: AG.quarter },
  { id: "washington-clad", name: "Washington Quarter (clad)", family: "Washington quarter", denom: "25C", face: 0.25, start: 1965, end: 1998, mints: ["P", "D", "S"], metal: "Clad", melt: null, oz: 0 },
  { id: "state-quarter", name: "50 States Quarter", family: "Washington quarter", denom: "25C", face: 0.25, start: 1999, end: 2008, mints: ["P", "D", "S"], metal: "Clad", melt: null, oz: 0 },
  { id: "atb-quarter", name: "America the Beautiful Quarter", family: "Washington quarter", denom: "25C", face: 0.25, start: 2010, end: 2021, mints: ["P", "D", "S", "W"], metal: "Clad", melt: null, oz: 0 },
  { id: "women-quarter", name: "American Women Quarter", family: "Washington quarter", denom: "25C", face: 0.25, start: 2022, end: 2025, mints: ["P", "D", "S"], metal: "Clad", melt: null, oz: 0 },
  // Halves
  { id: "barber-half", name: "Barber Half Dollar", family: "Barber half", denom: "50C", face: 0.50, start: 1892, end: 1915, mints: ["P", "O", "S", "D"], metal: "Silver", melt: "silver", oz: AG.half },
  { id: "walking-liberty-half", name: "Walking Liberty Half Dollar", family: "Walking Liberty half", denom: "50C", face: 0.50, start: 1916, end: 1947, mints: ["P", "D", "S"], metal: "Silver", melt: "silver", oz: AG.half },
  { id: "franklin-half", name: "Franklin Half Dollar", family: "Franklin half", denom: "50C", face: 0.50, start: 1948, end: 1963, mints: ["P", "D", "S"], metal: "Silver", melt: "silver", oz: AG.half },
  { id: "kennedy-90", name: "Kennedy Half Dollar (90% silver)", family: "Kennedy half", denom: "50C", face: 0.50, start: 1964, end: 1964, mints: ["P", "D"], metal: "Silver", melt: "silver", oz: AG.half },
  { id: "kennedy-40", name: "Kennedy Half Dollar (40% silver)", family: "Kennedy half", denom: "50C", face: 0.50, start: 1965, end: 1970, mints: ["P", "D"], metal: "Silver", melt: "silver", oz: AG.half40 },
  { id: "kennedy-clad", name: "Kennedy Half Dollar (clad)", family: "Kennedy half", denom: "50C", face: 0.50, start: 1971, end: 2026, mints: ["P", "D", "S"], metal: "Clad", melt: null, oz: 0 },
  // Dollars
  { id: "morgan-dollar", name: "Morgan Dollar", family: "Morgan dollar", denom: "$1", face: 1, start: 1878, end: 1921, mints: ["P", "CC", "O", "S", "D"], metal: "Silver", melt: "silver", oz: AG.dollar },
  { id: "peace-dollar", name: "Peace Dollar", family: "Peace dollar", denom: "$1", face: 1, start: 1921, end: 1935, mints: ["P", "D", "S"], metal: "Silver", melt: "silver", oz: AG.dollar },
  { id: "morgan-modern", proofMints: ["S", "P"], name: "Morgan Dollar (2021 on, .999 silver)", family: "Morgan dollar", denom: "$1", face: 1, start: 2021, end: 2026, mints: ["P", "D", "S", "O", "CC", "W"], metal: "Silver", melt: "silver", oz: 0.858,
    note: "US Mint legal-tender silver dollars. The 2021 O and CC are privy marks struck at Philadelphia. None were made in 2022. S coins from 2023 on are proofs." },
  { id: "peace-modern", proofMints: ["S", "P"], name: "Peace Dollar (2021 on, .999 silver)", family: "Peace dollar", denom: "$1", face: 1, start: 2021, end: 2026, mints: ["P", "S", "W"], metal: "Silver", melt: "silver", oz: 0.858,
    note: "US Mint legal-tender silver dollars. None were made in 2022. S coins from 2023 on are proofs." },
  { id: "ike-clad", name: "Eisenhower Dollar (clad)", family: "Eisenhower dollar", denom: "$1", face: 1, start: 1971, end: 1978, mints: ["P", "D", "S"], metal: "Clad", melt: null, oz: 0 },
  { id: "ike-40", name: "Eisenhower Dollar (40% silver)", family: "Eisenhower dollar", denom: "$1", face: 1, start: 1971, end: 1976, mints: ["S"], metal: "Silver", melt: "silver", oz: AG.ike40 },
  { id: "sba-dollar", name: "Susan B. Anthony Dollar", family: "Small dollar", denom: "$1", face: 1, start: 1979, end: 1999, mints: ["P", "D", "S"], metal: "Clad", melt: null, oz: 0 },
  { id: "sacagawea-dollar", name: "Sacagawea / Native American Dollar", family: "Small dollar", denom: "$1", face: 1, start: 2000, end: 2026, mints: ["P", "D", "S"], metal: "Other", melt: null, oz: 0 },
  { id: "presidential-dollar", name: "Presidential Dollar", family: "Small dollar", denom: "$1", face: 1, start: 2007, end: 2020, mints: ["P", "D", "S"], metal: "Other", melt: null, oz: 0 },
  { id: "silver-commem-dollar", proofMints: ["P", "S", "W"], name: "Modern Commemorative Silver Dollar", family: "Commemorative", denom: "$1", face: 1, start: 1983, end: 2026, mints: ["P", "D", "S", "W"], metal: "Silver", melt: "silver", oz: AG.dollar },
  // Bullion
  { id: "silver-eagle", proofMints: ["P", "S", "W"], name: "American Silver Eagle", family: "American Silver Eagle", denom: "$1", face: 1, start: 1986, end: 2026, mints: ["P", "S", "W"], metal: "Silver", melt: "silver", oz: 1.0 },
  { id: "gold-eagle-1", proofMints: ["W"], name: "American Gold Eagle 1 oz", family: "American Gold Eagle", denom: "$50", face: 50, start: 1986, end: 2026, mints: ["P", "W"], metal: "Gold", melt: "gold", oz: 1.0 },
  { id: "gold-eagle-half", proofMints: ["W"], name: "American Gold Eagle 1/2 oz", family: "American Gold Eagle", denom: "$25", face: 25, start: 1986, end: 2026, mints: ["P", "W"], metal: "Gold", melt: "gold", oz: 0.5 },
  { id: "gold-eagle-quarter", proofMints: ["W"], name: "American Gold Eagle 1/4 oz", family: "American Gold Eagle", denom: "$10", face: 10, start: 1986, end: 2026, mints: ["P", "W"], metal: "Gold", melt: "gold", oz: 0.25 },
  { id: "gold-eagle-tenth", proofMints: ["W"], name: "American Gold Eagle 1/10 oz", family: "American Gold Eagle", denom: "$5", face: 5, start: 1986, end: 2026, mints: ["P", "W"], metal: "Gold", melt: "gold", oz: 0.1 },
  { id: "gold-buffalo", proofMints: ["W"], name: "American Gold Buffalo 1 oz", family: "American Gold Eagle", denom: "$50", face: 50, start: 2006, end: 2026, mints: ["P", "W"], metal: "Gold", melt: "gold", oz: 1.0 },
  { id: "platinum-eagle", proofMints: ["W"], name: "American Platinum Eagle 1 oz", family: "Platinum Eagle", denom: "$100", face: 100, start: 1997, end: 2026, mints: ["P", "W"], metal: "Platinum", melt: "platinum", oz: 1.0 },
  // Classic gold
  { id: "gold-dollar", name: "Gold Dollar", family: "Classic gold", denom: "G$1", face: 1, start: 1849, end: 1889, mints: ["P", "C", "D", "O", "S"], metal: "Gold", melt: "gold", oz: 0.04837 },
  { id: "liberty-2-5", name: "Liberty Head $2.50 Gold", family: "Classic gold", denom: "$2.50", face: 2.5, start: 1840, end: 1907, mints: ["P", "C", "D", "O", "S"], metal: "Gold", melt: "gold", oz: 0.12094 },
  { id: "indian-2-5", name: "Indian Head $2.50 Gold", family: "Classic gold", denom: "$2.50", face: 2.5, start: 1908, end: 1929, mints: ["P", "D"], metal: "Gold", melt: "gold", oz: 0.12094 },
  { id: "liberty-5", name: "Liberty Head $5 Gold", family: "Classic gold", denom: "$5", face: 5, start: 1839, end: 1908, mints: ["P", "C", "CC", "D", "O", "S"], metal: "Gold", melt: "gold", oz: 0.24187 },
  { id: "indian-5", name: "Indian Head $5 Gold", family: "Classic gold", denom: "$5", face: 5, start: 1908, end: 1929, mints: ["P", "D", "O", "S"], metal: "Gold", melt: "gold", oz: 0.24187 },
  { id: "liberty-10", name: "Liberty Head $10 Gold", family: "Classic gold", denom: "$10", face: 10, start: 1838, end: 1907, mints: ["P", "CC", "D", "O", "S"], metal: "Gold", melt: "gold", oz: 0.48375 },
  { id: "indian-10", name: "Indian Head $10 Gold", family: "Classic gold", denom: "$10", face: 10, start: 1907, end: 1933, mints: ["P", "D", "S"], metal: "Gold", melt: "gold", oz: 0.48375 },
  { id: "liberty-20", name: "Liberty Head $20 Gold", family: "Classic gold", denom: "$20", face: 20, start: 1850, end: 1907, mints: ["P", "CC", "O", "S", "D"], metal: "Gold", melt: "gold", oz: 0.96750 },
  { id: "saint-gaudens-20", name: "Saint-Gaudens $20 Gold", family: "Classic gold", denom: "$20", face: 20, start: 1907, end: 1933, mints: ["P", "D", "S"], metal: "Gold", melt: "gold", oz: 0.96750 },
];

// Common types shown as filter chips even when the collection has none yet.
const COMMON_FAMILIES = [
  "Lincoln cent", "Indian Head cent", "Buffalo nickel", "Jefferson nickel",
  "Mercury dime", "Roosevelt dime", "Washington quarter", "Standing Liberty quarter",
  "Walking Liberty half", "Franklin half", "Kennedy half", "Morgan dollar",
  "Peace dollar", "Eisenhower dollar", "American Silver Eagle",
];

// Exact dates and mint marks for popular album series.
// Other series build every year × mint combination; remove slots that were never struck.
// Lincoln cents: the mints that struck regular (non-proof) cents each year. "P" means no mint mark.
const LINCOLN_SLOTS = (() => {
  const yrs = (a, b, m) => Array.from({ length: b - a + 1 }, (_, i) => [a + i, m]);
  const wheat = [[1909, "P S"], [1910, "P S"], ...yrs(1911, 1920, "P D S"), [1921, "P S"], [1922, "D"], [1923, "P S"], ...yrs(1924, 1931, "P D S"),
    ...yrs(1932, 1934, "P D"), ...yrs(1935, 1955, "P D S"), ...yrs(1956, 1958, "P D")];
  const copper = [...yrs(1959, 1964, "P D"), ...yrs(1965, 1967, "P"), ...yrs(1968, 1974, "P D S"), ...yrs(1975, 1982, "P D")];
  const shield = yrs(2010, Math.max(2026, new Date().getFullYear()), "P D");
  return { "lincoln-wheat": wheat, "lincoln-memorial-copper": copper, "lincoln-memorial-zinc": yrs(1982, 2008, "P D"), "lincoln-bicentennial": [[2009, "P D"]], "lincoln-shield": shield };
})();
const EXACT_SLOTS = {
  ...LINCOLN_SLOTS,
  "morgan-modern": [[2021, "P D S O CC"], [2023, "P S"], [2024, "P S"], [2025, "P S"], [2026, "P W"]],
  "sba-dollar": [[1979, "P D S"], [1980, "P D S"], [1981, "P D S"], [1999, "P D"]],
  "peace-modern": [[2021, "P"], [2023, "P S"], [2024, "P S"], [2025, "P S"], [2026, "P W"]],
  "morgan-dollar": [
    [1878, "P CC S"], [1879, "P CC O S"], [1880, "P CC O S"], [1881, "P CC O S"], [1882, "P CC O S"],
    [1883, "P CC O S"], [1884, "P CC O S"], [1885, "P CC O S"], [1886, "P O S"], [1887, "P O S"],
    [1888, "P O S"], [1889, "P CC O S"], [1890, "P CC O S"], [1891, "P CC O S"], [1892, "P CC O S"],
    [1893, "P CC O S"], [1894, "P O S"], [1895, "P O S"], [1896, "P O S"], [1897, "P O S"],
    [1898, "P O S"], [1899, "P O S"], [1900, "P O S"], [1901, "P O S"], [1902, "P O S"],
    [1903, "P O S"], [1904, "P O S"], [1921, "P D S"],
  ],
  "peace-dollar": [
    [1921, "P"], [1922, "P D S"], [1923, "P D S"], [1924, "P S"], [1925, "P S"], [1926, "P D S"],
    [1927, "P D S"], [1928, "P S"], [1934, "P D S"], [1935, "P S"],
  ],
  "walking-liberty-half": [
    [1916, "P D S"], [1917, "P D S"], [1918, "P D S"], [1919, "P D S"], [1920, "P D S"], [1921, "P D S"],
    [1923, "S"], [1927, "S"], [1928, "S"], [1929, "D S"], [1933, "S"], [1934, "P D S"], [1935, "P D S"],
    [1936, "P D S"], [1937, "P D S"], [1938, "P D"], [1939, "P D S"], [1940, "P S"], [1941, "P D S"],
    [1942, "P D S"], [1943, "P D S"], [1944, "P D S"], [1945, "P D S"], [1946, "P D S"], [1947, "P D"],
  ],
  "franklin-half": [
    [1948, "P D"], [1949, "P D S"], [1950, "P D"], [1951, "P D S"], [1952, "P D S"], [1953, "P D S"],
    [1954, "P D S"], [1955, "P"], [1956, "P"], [1957, "P D"], [1958, "P D"], [1959, "P D"],
    [1960, "P D"], [1961, "P D"], [1962, "P D"], [1963, "P D"],
  ],
  "mercury-dime": [
    [1916, "P D S"], [1917, "P D S"], [1918, "P D S"], [1919, "P D S"], [1920, "P D S"], [1921, "P D"],
    [1923, "P S"], [1924, "P D S"], [1925, "P D S"], [1926, "P D S"], [1927, "P D S"], [1928, "P D S"],
    [1929, "P D S"], [1930, "P S"], [1931, "P D S"], [1934, "P D"], [1935, "P D S"], [1936, "P D S"],
    [1937, "P D S"], [1938, "P D S"], [1939, "P D S"], [1940, "P D S"], [1941, "P D S"], [1942, "P D S"],
    [1943, "P D S"], [1944, "P D S"], [1945, "P D S"],
  ],
  "kennedy-90": [[1964, "P D"]],
};

// Sheldon scale, lowest first. "Junk" sits before the lowest grade and is valued at melt.
// More exact dates and mint marks (regular strikes only; proofs are separate). Mint "P" means no mint mark.
(function () {
  const yrs = (a, b, m) => Array.from({ length: b - a + 1 }, (_, i) => [a + i, m]);
  const only = (list, skip) => list.filter(([y]) => !skip.includes(y));
  Object.assign(EXACT_SLOTS, {
    "flying-eagle-cent": [[1856, "P"], [1857, "P"], [1858, "P"]],
    "indian-cent": [...yrs(1859, 1907, "P"), [1908, "P S"], [1909, "P S"]],
    "liberty-nickel": [...yrs(1883, 1911, "P"), [1912, "P D S"]],
    "buffalo-nickel": [[1913, "P D S"], ...yrs(1914, 1920, "P D S"), [1921, "P S"], [1923, "P S"], ...yrs(1924, 1929, "P D S"), [1930, "P S"], [1931, "S"], [1934, "P D"], ...yrs(1935, 1937, "P D S"), [1938, "D"]],
    "jefferson-nickel": [...yrs(1938, 1942, "P D S"), ...yrs(1946, 1949, "P D S"), [1950, "P D"], ...yrs(1951, 1954, "P D S"), ...yrs(1955, 1964, "P D"), ...yrs(1965, 1967, "P"), ...yrs(1968, 1970, "D"), ...yrs(1971, 2026, "P D")],
    "jefferson-war-nickel": [[1942, "P S"], [1943, "P D S"], [1944, "P D S"], [1945, "P D S"]],
    "barber-dime": [...yrs(1892, 1903, "P O S"), [1904, "P S"], [1905, "P O S"], ...yrs(1906, 1909, "P D O S"), ...yrs(1910, 1912, "P D S"), [1913, "P S"], [1914, "P D S"], [1915, "P S"], [1916, "P S"]],
    "barber-quarter": [...yrs(1892, 1903, "P O S"), [1904, "P O"], [1905, "P O S"], [1906, "P D O"], ...yrs(1907, 1909, "P D O S"), [1910, "P D"], [1911, "P D S"], [1912, "P S"], ...yrs(1913, 1915, "P D S"), [1916, "P D"]],
    "barber-half": [...yrs(1892, 1905, "P O S"), ...yrs(1906, 1908, "P D O S"), [1909, "P O S"], [1910, "P S"], ...yrs(1911, 1913, "P D S"), [1914, "P S"], [1915, "P D S"]],
    "standing-liberty-quarter": [[1916, "P"], [1917, "P D S"], [1918, "P D S"], [1919, "P D S"], [1920, "P D S"], [1921, "P"], [1923, "P S"], [1924, "P D S"], [1925, "P"], ...yrs(1926, 1929, "P D S"), [1930, "P S"]],
    "roosevelt-silver": [...yrs(1946, 1955, "P D S"), ...yrs(1956, 1964, "P D")],
    "roosevelt-clad": [...yrs(1965, 1967, "P"), ...yrs(1968, 1995, "P D"), [1996, "P D W"], ...yrs(1997, 2026, "P D")],
    "kennedy-40": [[1965, "P"], [1966, "P"], [1967, "P"], [1968, "D"], [1969, "D"], [1970, "D"]],
    "kennedy-clad": [...yrs(1971, 1974, "P D"), ...yrs(1976, 2026, "P D")],
    "ike-clad": [...yrs(1971, 1974, "P D"), ...yrs(1976, 1978, "P D")],
    "ike-40": [[1971, "S"], [1972, "S"], [1973, "S"], [1974, "S"], [1976, "S"]],
    "sacagawea-dollar": yrs(2000, 2026, "P D"),
    "state-quarter": yrs(1999, 2008, "P D"),
    "atb-quarter": [...yrs(2010, 2018, "P D"), [2019, "P D W"], ...yrs(2020, 2021, "P D")],
    "women-quarter": yrs(2022, 2025, "P D"),
  });
  // Spots that are one per design or variety (a year/mint key like "1999|D" lists the designs).
  const designs = (type, byYear, mints, extraMints) => {
    const t = COIN_TYPES.find((x) => x.id === type);
    t.varieties = t.varieties || {};
    Object.keys(byYear).forEach((y) => (extraMints && extraMints[y] || mints).forEach((m) => { t.varieties[y + "|" + (m === "P" ? "" : m)] = byYear[y]; }));
  };
  designs("state-quarter", {
    1999: ["Delaware", "Pennsylvania", "New Jersey", "Georgia", "Connecticut"], 2000: ["Massachusetts", "Maryland", "South Carolina", "New Hampshire", "Virginia"],
    2001: ["New York", "North Carolina", "Rhode Island", "Vermont", "Kentucky"], 2002: ["Tennessee", "Ohio", "Louisiana", "Indiana", "Mississippi"],
    2003: ["Illinois", "Alabama", "Maine", "Missouri", "Arkansas"], 2004: ["Michigan", "Florida", "Texas", "Iowa", "Wisconsin"],
    2005: ["California", "Minnesota", "Oregon", "Kansas", "West Virginia"], 2006: ["Nevada", "Nebraska", "Colorado", "North Dakota", "South Dakota"],
    2007: ["Montana", "Washington", "Idaho", "Wyoming", "Utah"], 2008: ["Oklahoma", "New Mexico", "Arizona", "Alaska", "Hawaii"],
  }, ["P", "D"]);
  designs("atb-quarter", {
    2010: ["Hot Springs", "Yellowstone", "Yosemite", "Grand Canyon", "Mount Hood"], 2011: ["Gettysburg", "Glacier", "Olympic", "Vicksburg", "Chickasaw"],
    2012: ["El Yunque", "Chaco Culture", "Acadia", "Hawaii Volcanoes", "Denali"], 2013: ["White Mountain", "Perry's Victory", "Great Basin", "Fort McHenry", "Mount Rushmore"],
    2014: ["Great Smoky Mountains", "Shenandoah", "Arches", "Great Sand Dunes", "Everglades"], 2015: ["Homestead", "Kisatchie", "Blue Ridge Parkway", "Bombay Hook", "Saratoga"],
    2016: ["Shawnee", "Cumberland Gap", "Harpers Ferry", "Theodore Roosevelt", "Fort Moultrie"], 2017: ["Effigy Mounds", "Frederick Douglass", "Ozark Riverways", "Ellis Island", "George Rogers Clark"],
    2018: ["Pictured Rocks", "Apostle Islands", "Voyageurs", "Cumberland Island", "Block Island"], 2019: ["Lowell", "American Memorial Park", "War in the Pacific", "San Antonio Missions", "Frank Church"],
    2020: ["American Samoa", "Weir Farm", "Salt River Bay", "Marsh-Billings-Rockefeller", "Tallgrass Prairie"], 2021: ["Tuskegee Airmen"],
  }, ["P", "D"], { 2019: ["P", "D", "W"] });
  designs("women-quarter", {
    2022: ["Maya Angelou", "Sally Ride", "Wilma Mankiller", "Nina Otero-Warren", "Anna May Wong"], 2023: ["Bessie Coleman", "Edith Kanaka'ole", "Eleanor Roosevelt", "Jovita Idar", "Maria Tallchief"],
    2024: ["Patsy Takemoto Mink", "Mary Edwards Walker", "Celia Cruz", "Zitkala-Sa", "Pauli Murray"], 2025: ["Ida B. Wells", "Juliette Gordon Low", "Vera Rubin", "Stacey Park Milbern", "Althea Gibson"],
  }, ["P", "D"]);
  // Types with two kinds in one year (shown as separate spots).
  const two = (type, key, list) => { const t = COIN_TYPES.find((x) => x.id === type); t.varieties = t.varieties || {}; t.varieties[key] = list; };
  two("liberty-nickel", "1883|", ["Without CENTS", "With CENTS"]);
  two("buffalo-nickel", "1913|", ["Type 1", "Type 2"]); two("buffalo-nickel", "1913|D", ["Type 1", "Type 2"]); two("buffalo-nickel", "1913|S", ["Type 1", "Type 2"]);
  two("standing-liberty-quarter", "1917|", ["Type 1", "Type 2"]); two("standing-liberty-quarter", "1917|D", ["Type 1", "Type 2"]); two("standing-liberty-quarter", "1917|S", ["Type 1", "Type 2"]);
  // Years the Mint made none of a type (even though they fall inside its dates).
  ["morgan-modern", "peace-modern"].forEach((id) => { COIN_TYPES.find((x) => x.id === id).skipYears = [2022]; });
})();

const GRADES = [
  "Junk", "PO-1", "FR-2", "AG-3", "G-4", "G-6", "VG-8", "VG-10", "F-12", "F-15",
  "VF-20", "VF-25", "VF-30", "VF-35", "XF-40", "XF-45", "AU-50", "AU-53", "AU-55", "AU-58",
  "MS-60", "MS-61", "MS-62", "MS-63", "MS-64", "MS-65", "MS-66", "MS-67", "MS-68", "MS-69", "MS-70",
  "PR-60", "PR-62", "PR-63", "PR-64", "PR-65", "PR-66", "PR-67", "PR-68", "PR-69", "PR-70",
];
const CERT_GRADES = GRADES.filter((g) => g !== "Junk");
// PCGS Photograde page codes (https://www.pcgs.com/photograde#/<Code>/Grades). Codes are PCGS's own; copied from the real pages.
// One code can cover several app types. Types not listed open the general Photograde page.
const PCGS_CODES = {
  "flying-eagle-cent": "Flying", "indian-cent": "Indian",
  "lincoln-wheat": "Lincoln", "lincoln-memorial-copper": "Lincoln", "lincoln-memorial-zinc": "Lincoln", "lincoln-bicentennial": "Lincoln", "lincoln-shield": "Lincoln",
  "shield-nickel": "ShieldNic", "liberty-nickel": "LibNic", "buffalo-nickel": "Buffalo", "jefferson-nickel": "Jefferson", "jefferson-war-nickel": "Jefferson",
  "barber-dime": "Barber10", "mercury-dime": "Mercury", "roosevelt-silver": "Roosevelt", "roosevelt-clad": "Roosevelt",
  "barber-quarter": "Barber25", "washington-silver": "Washington", "washington-clad": "Washington", "state-quarter": "Washington", "atb-quarter": "Washington", "women-quarter": "Washington",
  "barber-half": "Barber50", "walking-liberty-half": "Walker", "franklin-half": "Franklin", "kennedy-90": "Kennedy", "kennedy-40": "Kennedy", "kennedy-clad": "Kennedy",
  "morgan-dollar": "Morgan", "morgan-modern": "Morgan", "peace-dollar": "Peace", "peace-modern": "Peace",
  "ike-clad": "Ike", "ike-40": "Ike", "sba-dollar": "SBA", "sacagawea-dollar": "SAC",
  "indian-2-5": "2.5Ind",
};
// Standing Liberty has three PCGS pages, picked by year: 1916 Type 1; 1917 by design (Type 1 if none picked); 1918-1924 Type 2; 1925-1930 recessed date.
function pcgsCodeFor(typeId, year, variety) {
  if (typeId === "standing-liberty-quarter") {
    const y = Number(year);
    if (!y) return "SLQT1";
    if (y <= 1916) return "SLQT1";
    if (y === 1917) return variety === "Type 2" ? "SLQe" : "SLQT1";
    return y <= 1924 ? "SLQe" : "SLQ";
  }
  return PCGS_CODES[typeId] || "";
}
const SERVICES = ["PCGS", "NGC", "ANACS", "ICG", "CACG", "Other"];
const MINTS = ["", "P", "D", "S", "O", "CC", "W", "C"];
const METALS = ["Silver", "Gold", "Platinum", "Copper", "Copper-nickel", "Clad", "Zinc", "Steel", "Other"];
const MELT_OF_METAL = { Silver: "silver", Gold: "gold", Platinum: "platinum", Copper: "copper", "Copper-nickel": "copper" };
const SPOT_METALS = [
  { key: "gold", label: "Gold", unit: "oz" },
  { key: "silver", label: "Silver", unit: "oz" },
  { key: "platinum", label: "Platinum", unit: "oz" },
  { key: "copper", label: "Copper", unit: "lb" },
];
// How a coin is kept. "Album" and "Slab" are filled in on their own when a coin is in an album or certified.
const HOLDERS = ["Album", "Slab", "Hard case", "Capsule", "2x2 cardboard flip", "Plastic flip", "Plastic holder", "Mint box", "Envelope", "Roll", "Loose", "Other"];
// Old saved coins say "2x2" or "Flip"; they read as the new names (the saved word only changes when the coin is edited).
const normHolder = (h) => (h === "2x2" ? "2x2 cardboard flip" : h === "Flip" ? "Plastic flip" : h || "");
// Colors for boxes and (Other) album spines. "clear" is for plastic boxes only.
const BOX_COLORS = [["clear", "Clear"], ["white", "White"], ["red", "Red"], ["darkblue", "Dark blue"], ["yellow", "Yellow"], ["darkgreen", "Dark green"], ["orange", "Orange"], ["darkbrown", "Dark brown"]];
const BOX_LOOKS = [["black", "Black box"], ["cardboard", "Cardboard box"], ["plastic", "Plastic container"]];
// Holders offered for sets and rolls.
const SET_HOLDERS = ["Hard plastic", "Cellophane", "Mint box", "Other"];
const ROLL_HOLDERS = ["Paper wrap", "Plastic tube", "Mint-sealed", "Other"];
// Roll condition, as dealers describe nicer rolls.
const ROLL_CONDS = ["Circulated", "AU", "UNC", "BU"];
// Holders that can hold several coins in one case (e.g. three steel cents).
const CASE_HOLDERS = ["Hard case", "Capsule", "Mint box", "Other"];
// Usual number of coins in a bank roll, by denomination (can be changed per roll).
const ROLL_COUNTS = { "1C": 50, "5C": 40, "10C": 50, "25C": 40, "50C": 20, "$1": 25 };
// Proof and mint sets. years: the years each kind was made.
const SET_KINDS = [
  { id: "proof", name: "Proof set", years: [[1936, 1942], [1950, 1964], [1968, 9999]] },
  { id: "silver-proof", name: "Silver proof set", years: [[1992, 9999]] },
  { id: "mint", name: "Mint set", years: [[1947, 1964], [1968, 1981], [1984, 9999]] },
  { id: "sms", name: "Special Mint Set", years: [[1965, 1967]] },
  { id: "bicentennial", name: "Bicentennial silver set (3 coins)", years: [[1976, 1976]] },
  { id: "other", name: "Other set", years: null },
];
const SET_BY_ID = Object.fromEntries(SET_KINDS.map((k) => [k.id, k]));
// Silver in a set, in troy ounces. null = not known here: type it from the box.
// 90% silver: dime 0.07234, quarter 0.18084, half 0.36169 (Numismatic News). 40% Kennedy half 0.14792.
// .999 silver from 2019: dime 0.079, quarter 0.199, half 0.399 (U.S. Mint specs). Bicentennial 40% quarter + half + dollar = 0.53797.
function setSilverOz(kind, y) {
  if (!y) return null;
  const set90 = (quarters) => +(0.07234 + 0.18084 * quarters + 0.36169).toFixed(5);
  const set999 = (quarters) => +(0.079 + 0.199 * quarters + 0.399).toFixed(3);
  if (kind === "proof") return y >= 1950 && y <= 1964 ? set90(1) : y >= 1968 && y <= 1970 ? 0.14792 : y >= 1971 ? 0 : null;
  if (kind === "silver-proof") {
    if (y >= 1992 && y <= 1998) return set90(1);
    if (y === 2009) return set90(6); // six D.C. and territories quarters
    if (y >= 1999 && y <= 2018) return set90(5); // five state / America the Beautiful quarters
    if ([2019, 2020, 2022, 2023, 2024, 2025].includes(y)) return set999(5);
    return null; // 2021 (two quarters) and newer years: type it from the box
  }
  if (kind === "sms") return 0.14792;
  if (kind === "bicentennial") return 0.53797;
  if (kind === "mint") return y >= 1971 ? 0 : null; // older mint sets vary by year: type it from the box
  return null;
}
function setYearProblem(kind, year) {
  const y = +year, k = SET_BY_ID[kind];
  if (!year || !k || !k.years) return "";
  if (k.years.some(([a, b]) => y >= a && y <= b)) return "";
  return k.name + "s weren't made in " + y + ".";
}
const SOURCE_DEFAULTS = ["Inherited", "Coin Shop", "Coin Show", "Pawn Shop", "eBay", "Whatnot", "Gift", "Pocket change", "Bank roll"];
const ALBUM_BRANDS = ["Whitman", "Dansco", "H.E. Harris", "Littleton", "Other"];

// Short, plain-language grade guide (our own summary, not copied from any book).
const GRADE_GUIDE = [
  ["Junk", "Worn, damaged, cleaned or holed. Worth its metal only."],
  ["AG-3 About Good", "Very heavily worn. Date may be barely readable; rims worn into the design."],
  ["G-4 Good", "Heavily worn, but the main design outline and date are clear. Rims mostly complete."],
  ["VG-8 Very Good", "Well worn. Some inner detail starts to show; lettering readable."],
  ["F-12 Fine", "Moderate, even wear. All major details visible."],
  ["VF-20 Very Fine", "Light to moderate wear on the high points. Finer details sharp."],
  ["XF-40 Extremely Fine", "Light wear on the highest points only. Traces of mint luster may show."],
  ["AU-50 About Uncirculated", "Slight wear on the high points. Much of the luster remains."],
  ["MS-60 to MS-70 Mint State", "No wear at all. The number reflects marks, luster and eye appeal."],
  ["PR Proof", "Specially struck for collectors, usually with mirror fields."],
];
