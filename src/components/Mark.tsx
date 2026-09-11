import type { SVGProps } from "react";

/**
 * The RVB Partners brand mark: an isometric three-step staircase, on ink.
 *
 * RESTORED AT THE FIRM'S DIRECTION. A three-cube variant was tried in 81a01a2
 * and rejected on sight of it; this is the original geometry and the original
 * three greys, which is the mark as it appears on the printed documents and on
 * the firm's LinkedIn. The nine polygons came from the SVG the partners
 * supplied and the greys were sampled from `_rvb_logo.png`:
 *
 *   #8c8c8c  side faces
 *   #5c5c5c  top faces
 *   #333333  front faces
 *
 * THE GREYS ARE NOT REPAINTED, AND THE GROUND IS WHY. Those three values are
 * pitched for a dark ground and only work on one: the steps are described by
 * the light and mid faces, and the front faces at #333333 are meant to sink
 * into the ink as the shadow between them. Dropped onto the site's white that
 * reading inverts and the mark goes flat and pale, which is what the earlier
 * port did and what `currentColor` was an attempt to solve.
 *
 * So the mark carries its own ground. The black plate is part of the drawing
 * rather than something the page provides, which means one component is
 * correct in the masthead, in the hero band, in the favicon and in the share
 * card, without any of them having to know what it needs. It is also how the
 * mark is used everywhere off this site.
 *
 * THE PLATE IS SQUARE AND THE STAIRCASE IS CENTRED IN IT. The artwork occupies
 * x 0…230 and y 20…130, and the viewBox is expanded symmetrically about its
 * centre (115, 75) to a 290 × 290 box — so the staircase spans 79% of the
 * tile's width rather than floating in it. A square plate is what the mark
 * uses off this site, but the drawing inside it is 2:1, so generous padding
 * turns the whole thing into a smudge at favicon size.
 */
export function Mark({
  className,
  ...rest
}: Omit<SVGProps<SVGSVGElement>, "fill">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-30 -70 290 290"
      role="img"
      aria-label="RVB Partners"
      className={className}
      {...rest}
    >
      {/* The ground, as part of the mark. */}
      <rect x="-30" y="-70" width="290" height="290" fill="#0c0d0e" />
      {/* Step 1 — front-most (bottom-left) */}
      <polygon points="0,90 50,80 50,120 0,130" fill="#8c8c8c" />
      <polygon points="50,80 110,95 110,120 50,120" fill="#333333" />
      <polygon points="0,90 50,80 110,95 60,105" fill="#5c5c5c" />
      {/* Step 2 — middle */}
      <polygon points="60,60 110,50 110,95 60,105" fill="#8c8c8c" />
      <polygon points="110,50 170,65 170,95 110,95" fill="#333333" />
      <polygon points="60,60 110,50 170,65 120,75" fill="#5c5c5c" />
      {/* Step 3 — back-most (top-right) */}
      <polygon points="120,30 170,20 170,65 120,75" fill="#8c8c8c" />
      <polygon points="170,20 230,35 230,65 170,65" fill="#333333" />
      <polygon points="120,30 170,20 230,35 180,45" fill="#5c5c5c" />
    </svg>
  );
}
