import type { SVGProps } from "react";

/**
 * The RVB Partners brand mark — three isometric cubes climbing to the right.
 *
 * SUPPLIED BY THE FIRM, AND IT REPLACES THE STAIRCASE. The previous mark was a
 * three-step staircase ported from `Web/SiteWebCr/components/ui/Logo.tsx`, and
 * the comment there recorded a rule: its three greys were sampled from
 * `_rvb_logo.png` so the rendered mark would match the printed documents, and
 * they were therefore NOT to be repainted for this site's palette. That rule
 * belonged to that drawing. This is a different mark, delivered for this site,
 * and the decision it carried is made again below rather than inherited.
 *
 * PAINTED IN `currentColor`, AT THREE OPACITIES. The mark as supplied is three
 * fixed greys — #c8c8c8 top faces, #9b9b9b right faces, #696969 left faces —
 * which is one drawing that works on exactly one ground. This site needs it on
 * two: the white masthead and the ink hero band. A fixed mid-grey goes muddy on
 * ink, where the light faces are barely separated from the dark ones and the
 * cubes stop reading as cubes.
 *
 * So each face takes the ink of whatever is around it and steps down from it:
 *
 *   0.40  top faces     #9d9d9d on white
 *   0.66  right faces   #5d5d5d on white
 *   0.92  left faces    #1e1e1e on white
 *
 * On the white ground that is the supplied drawing made darker, at the firm's
 * direction — the mark as delivered read as grey beside a near-black wordmark,
 * which is a logo apologising for itself. On the ink band the relationship
 * inverts with the ground, so the light source flips and the cubes still read.
 * One drawing, correct on both, and it follows the `--fg` token rather than
 * sitting beside it.
 *
 * THE VIEWBOX IS THE TIGHT BOUNDING BOX, and it is square. The geometry spans
 * x 0…160 and y −20…140: the third cube's top face peaks 20 units ABOVE the
 * origin, so the `0 0 160 160` the drawing arrived with cropped it flat. The
 * box is stated as `0 -20 160 160` rather than padded to `0 -20 160 180`,
 * because 160 × 160 is exactly what the nine polygons occupy and any other
 * height puts dead space on one edge and centres the mark wrongly against
 * anything it sits beside.
 *
 * Consumers set a height and let the width follow; the mark is square, unlike
 * the 230 × 130 staircase it replaces, so the same `h-*` value now reads
 * noticeably larger and the call sites were re-sized with it.
 */
export function Mark({
  className,
  ...rest
}: Omit<SVGProps<SVGSVGElement>, "fill">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 -20 160 160"
      role="img"
      aria-label="RVB Partners"
      className={className}
      {...rest}
    >
      <g fill="currentColor">
        {/* Cube 1 — bottom-left */}
        <polygon points="0,80 40,60 80,80 40,100" opacity="0.4" />
        <polygon points="0,80 40,100 40,140 0,120" opacity="0.92" />
        <polygon points="40,100 80,80 80,120 40,140" opacity="0.66" />
        {/* Cube 2 — middle */}
        <polygon points="40,40 80,20 120,40 80,60" opacity="0.4" />
        <polygon points="40,40 80,60 80,100 40,80" opacity="0.92" />
        <polygon points="80,60 120,40 120,80 80,100" opacity="0.66" />
        {/* Cube 3 — top-right, peaking above the origin */}
        <polygon points="80,0 120,-20 160,0 120,20" opacity="0.4" />
        <polygon points="80,0 120,20 120,60 80,40" opacity="0.92" />
        <polygon points="120,20 160,0 160,40 120,60" opacity="0.66" />
      </g>
    </svg>
  );
}
