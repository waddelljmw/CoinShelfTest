// Checks the version number matches in all three places (app.js, package.json, sw.js).
"use strict";
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
const app = (read("app.js").match(/APP_VERSION = "([\d.]+)"/) || [])[1];
const pkg = JSON.parse(read("package.json")).version;
const sw = (read("sw.js").match(/CACHE = "coin-cabinet-([\d.]+)"/) || [])[1];
if (app && app === pkg && app === sw) console.log("ok versions match " + app);
else console.log(`FAIL versions differ: app.js ${app}, package.json ${pkg}, sw.js ${sw}`);
