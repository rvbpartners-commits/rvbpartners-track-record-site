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
 * The mark's three faces, resolved against the ink ground.
 *
 * `Mark.tsx` paints them in `currentColor` at 0.40 / 0.66 / 0.92 so one drawing
 * serves both grounds. These are those three opacities composited over `INK`
 * with `INK_FG` as the ink, which is what the browser computes for the hero
 * band — so the generated images and the rendered page show the same mark
 * rather than two that merely resemble each other.
 */
const FACE_TOP = "#686867";
const FACE_RIGHT = "#a4a3a1";
const FACE_LEFT = "#e0deda";

/**
 * The mark as a standalone SVG document, for `next/og`.
 *
 * Satori renders a limited SVG subset and `currentColor` is not part of it, so
 * the faces are stated. It is handed over as a data URI on an `<img>`, which is
 * the path Satori supports without reservation — an inline `<svg>` with nine
 * `<polygon>` children is not.
 *
 * Same geometry and same `viewBox` as `Mark.tsx`, including the `-20` origin
 * that stops the top cube being cropped. If one changes, change both.
 */
export function markSvg(): string {
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -20 160 160" width="160" height="160">',
    `<polygon points="0,80 40,60 80,80 40,100" fill="${FACE_TOP}"/>`,
    `<polygon points="0,80 40,100 40,140 0,120" fill="${FACE_LEFT}"/>`,
    `<polygon points="40,100 80,80 80,120 40,140" fill="${FACE_RIGHT}"/>`,
    `<polygon points="40,40 80,20 120,40 80,60" fill="${FACE_TOP}"/>`,
    `<polygon points="40,40 80,60 80,100 40,80" fill="${FACE_LEFT}"/>`,
    `<polygon points="80,60 120,40 120,80 80,100" fill="${FACE_RIGHT}"/>`,
    `<polygon points="80,0 120,-20 160,0 120,20" fill="${FACE_TOP}"/>`,
    `<polygon points="80,0 120,20 120,60 80,40" fill="${FACE_LEFT}"/>`,
    `<polygon points="120,20 160,0 160,40 120,60" fill="${FACE_RIGHT}"/>`,
    "</svg>",
  ].join("");
}

/** The same, as a data URI ready for an `<img src>`. */
export function markDataUri(): string {
  return `data:image/svg+xml;base64,${Buffer.from(markSvg()).toString("base64")}`;
}
