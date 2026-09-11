import { ImageResponse } from "next/og";
import { INK, markDataUri } from "@/lib/brand";

/**
 * The tab icon: the firm's mark, on the ink the hero band uses.
 *
 * IT WAS A LETTER, IN A COLOUR THE SITE NO LONGER HAS. This drew a gold "R"
 * (#d8a54f) on #0d0f12 — the accent and ground of the palette retired in
 * 2bc4e65, neither of which exists anywhere in globals.css. So the smallest
 * surface on the site was the last one still wearing the old design, and it
 * showed an initial rather than the mark on a site that has one.
 *
 * Ink rather than the site's white, deliberately: a tab icon is seen against
 * the browser's own chrome, and a white-ground mark disappears into a light tab
 * strip. The ground is the hero band's exact value, so the favicon and the
 * first thing a reader sees on the page are the same object.
 *
 * 6px of padding at 32px. The mark is a diagonal climb and reads as a smear
 * without air around it; at a favicon's size that margin is the difference
 * between three cubes and a grey mark.
 */
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: INK,
          padding: 6,
        }}
      >
        <img src={markDataUri()} alt="" width={20} height={20} />
      </div>
    ),
    { ...size },
  );
}
