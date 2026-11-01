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
const GRADES = [
  "Junk", "PO-1", "FR-2", "AG-3", "G-4", "G-6", "VG-8", "VG-10", "F-12", "F-15",
  "VF-20", "VF-25", "VF-30", "VF-35", "XF-40", "XF-45", "AU-50", "AU-53", "AU-55", "AU-58",
  "MS-60", "MS-61", "MS-62", "MS-63", "MS-64", "MS-65", "MS-66", "MS-67", "MS-68", "MS-69", "MS-70",
  "PR-60", "PR-62", "PR-63", "PR-64", "PR-65", "PR-66", "PR-67", "PR-68", "PR-69", "PR-70",
];
const CERT_GRADES = GRADES.filter((g) => g !== "Junk");
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
const SOURCE_DEFAULTS = ["Inherited", "Coin shop", "Coin show", "Pawn shop", "eBay", "Gift", "Pocket change", "Bank roll"];
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
