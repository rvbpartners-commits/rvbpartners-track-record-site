import type { SVGProps } from "react";

/**
 * The RVB Partners brand mark — an isometric three-step staircase.
 *
 * PORTED, NOT REDRAWN. The geometry and the fills are copied exactly from
 * `Web/SiteWebCr/components/ui/Logo.tsx`, which records that the nine polygons
 * came from the SVG the partners supplied and that the three greys were
 * sampled from `_rvb_logo.png` so the rendered mark matches the printed
 * documents. Three faces per step, three lightness levels:
 *
 *   #8c8c8c  side faces
 *   #5c5c5c  top faces
 *   #333333  front faces
 *
 * Those hexes are NOT repainted for this site's palette, and should not be.
 * They are the firm's mark as it appears on paper, and a brand mark that
 * renders in a different set of greys on the website than in the documents is
 * two marks. The front faces sit close to the page ground here, which is how
 * the mark reads on black by design — the steps are described by the light and
 * mid faces, and the dark ones are the shadow between them.
 */
export function Mark({
  className,
  ...rest
}: Omit<SVGProps<SVGSVGElement>, "fill">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 230 130"
      role="img"
      aria-label="RVB Partners"
      className={className}
      {...rest}
    >
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
