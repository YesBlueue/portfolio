// Draws the oat cursor set and writes 1x and 2x PNGs of each to public/cursors.
// Run from the project root: node scripts/make-cursors.mjs
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(process.cwd() + "/package.json");
const sharp = require("sharp");

const OAT = "#faf4ea", COCOA = "#33241c";
const svg = (b) => `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">${b}</svg>\n`;
const shape = (d, fill, edge, lines = "") =>
  svg(
    `<path d="${d}" fill="none" stroke="${edge}" stroke-width="3" stroke-linejoin="round"/>` +
      `<path d="${d}" fill="${fill}"/>` +
      (lines ? `<path d="${lines}" fill="none" stroke="${edge}" stroke-width="1.1" stroke-linecap="round"/>` : ""),
  );

const ARROW = "M4 3 L4 22.5 L9 18 L12.6 26 L16 24.5 L12.5 16.8 L19 16.8 Z";
const POINT = "M9.5 4.5 Q9.5 2.5 11.5 2.5 Q13.5 2.5 13.5 4.5 V12.5 Q13.5 10.6 15.5 10.6 Q17.5 10.6 17.5 12.8 Q17.5 11.4 19.4 11.4 Q21.3 11.4 21.3 13.4 Q21.3 12.6 23 12.6 Q24.6 12.6 24.6 14.6 V20 Q24.6 25 21.5 27.5 H13 Q11 27.5 9.8 25.8 L5.6 19.6 Q4.6 18 6 17 Q7.3 16.2 8.6 17.5 L9.5 18.6 Z";
const POINT_L = "M13.5 12.5 V16 M17.5 13 V16 M21.3 13.6 V16";
const OPEN = "M8.6 15 V8 Q8.6 6 10.5 6 Q12.4 6 12.4 8 V6.5 Q12.4 4.5 14.3 4.5 Q16.2 4.5 16.2 6.5 V7.5 Q16.2 5.5 18.1 5.5 Q20 5.5 20 7.5 V10 Q20 8 21.8 8 Q23.6 8 23.6 10 V20 Q23.6 26 19 27.5 H13 Q10.5 27.5 9 25 L5 18.8 Q4 17 5.4 16.2 Q6.8 15.4 8 16.8 L8.6 17.6 Z";
const OPEN_L = "M12.4 8 V14 M16.2 7.5 V14 M20 10 V14";
// Seen from the back: knuckles along the top, the thumb tucked along the left side.
const FIST = "M8 13.5 Q8 11 10.2 11 Q12.2 11 12.4 12.6 Q12.8 10.3 14.9 10.3 Q16.9 10.3 17.2 12.3 Q17.6 10.6 19.6 10.6 Q21.6 10.6 21.8 12.8 Q22.4 11.9 23.4 12.2 Q24.8 12.8 24.8 14.8 V20 Q24.8 26 20.2 27.5 H13.2 Q10.2 27.5 9 25 Q7.2 23.6 6.3 21.6 Q5.5 19.6 6.8 18.7 Q7.9 18.1 8.7 19 L8 13.5 Z";
const FIST_L = "M12.4 12.8 V15.2 M17.2 12.5 V15.2 M21.8 13 V15.2 M8.7 19 Q9.9 20.6 9.6 23";
const BEAM_D = "M11 5 H13.5 Q16 5 16 8 Q16 5 18.5 5 H21 M16 8 V24 M11 27 H13.5 Q16 27 16 24 Q16 27 18.5 27 H21";
const BEAM = svg(
  `<path d="${BEAM_D}" fill="none" stroke="${COCOA}" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${BEAM_D}" fill="none" stroke="${OAT}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
);

const set = {
  arrow: shape(ARROW, OAT, COCOA),
  pointer: shape(POINT, OAT, COCOA, POINT_L),
  grab: shape(OPEN, OAT, COCOA, OPEN_L),
  grabbing: shape(FIST, OAT, COCOA, FIST_L),
  text: BEAM,
};

mkdirSync("public/cursors", { recursive: true });
for (const [name, s] of Object.entries(set)) {
  for (const [scale, suffix] of [[1, ""], [2, "@2x"]]) {
    await sharp(Buffer.from(s), { density: 72 * scale }).png().toFile(`public/cursors/${name}${suffix}.png`);
  }
}
console.log("ok");
