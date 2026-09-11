/**
 * THE BRAND LITERALS, FOR THE TWO SURFACES THAT CANNOT READ A TOKEN.
 *
 * `icon.tsx` and `opengraph-image.tsx` render through `next/og`, outside the
 * document: there is no stylesheet, so `var(--fg)` resolves to nothing and the
 * `currentColor` the mark is drawn in has nothing to inherit. Both files
 * therefore have to state colours as literals, and both had drifted — they were
 * still painting `#0d0f12` and `#d8a54f`, the ground and gold of the palette
 * retired in 2bc4e65, neither of which appears anywhere in globals.css. The
 * favicon and the card every shared link unfurls into were the last two
 * surfaces on a different design.
 *
 * They live here, once, rather than being typed into each file, so the next
 * palette move has one place to visit instead of two to forget.
 *
 * THE GROUND IS INK, NOT THE SITE'S WHITE. Both surfaces are seen against
 * someone else's chrome — a browser tab strip, a chat client's message list —
 * where a white-ground mark dissolves into a light UI and a white card cannot
 * be told from the app around it. The site does have an ink surface, the hero
 * band, and these take its exact values so the share card and the page a reader
 * lands on are the same object.
 */

/** The hero band's ground, and the ground of both generated images. */
export const INK = "#0c0d0e";
/** The hero band's type. */
export const INK_FG = "#f2f0ec";
/** The hero band's secondary type: the lede, the card's subtitle. */
export const INK_MUTED = "#b9b4ab";
/** The hero band's quietest type: figure labels, the card's host line. */
export const INK_FAINT = "#8b8781";

/**
 * The mark's three greys, sampled from `_rvb_logo.png` and not repainted.
 *
 * Same values as `Mark.tsx`, for the same reason: they are pitched for a dark
 * ground, and the mark supplies that ground itself.
 */
const FACE_SIDE = "#8c8c8c";
const FACE_TOP = "#5c5c5c";
const FACE_FRONT = "#333333";

/**
 * The mark as a standalone SVG document, for `next/og`.
 *
 * Satori renders a limited SVG subset, so this is handed over as a data URI on
 * an `<img>` — the path it supports without reservation. An inline `<svg>` with
 * ten children is not.
 *
 * Same geometry, same greys and same square `viewBox` as `Mark.tsx`, black
 * plate included. If one changes, change both.
 */
export function markSvg(): string {
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-30 -70 290 290" width="260" height="260">',
    `<rect x="-30" y="-70" width="290" height="290" fill="${INK}"/>`,
    `<polygon points="0,90 50,80 50,120 0,130" fill="${FACE_SIDE}"/>`,
    `<polygon points="50,80 110,95 110,120 50,120" fill="${FACE_FRONT}"/>`,
    `<polygon points="0,90 50,80 110,95 60,105" fill="${FACE_TOP}"/>`,
    `<polygon points="60,60 110,50 110,95 60,105" fill="${FACE_SIDE}"/>`,
    `<polygon points="110,50 170,65 170,95 110,95" fill="${FACE_FRONT}"/>`,
    `<polygon points="60,60 110,50 170,65 120,75" fill="${FACE_TOP}"/>`,
    `<polygon points="120,30 170,20 170,65 120,75" fill="${FACE_SIDE}"/>`,
    `<polygon points="170,20 230,35 230,65 170,65" fill="${FACE_FRONT}"/>`,
    `<polygon points="120,30 170,20 230,35 180,45" fill="${FACE_TOP}"/>`,
    "</svg>",
  ].join("");
}

/** The same, as a data URI ready for an `<img src>`. */
export function markDataUri(): string {
  return `data:image/svg+xml;base64,${Buffer.from(markSvg()).toString("base64")}`;
}
