"use client";

import { useEffect, useRef } from "react";

/**
 * THE GROUND UNDER THE COVER.
 *
 * The opening band was a rectangle of ink with type on it. That is a defensible
 * cover for a register and it is not one anybody remembers, and this site has
 * exactly one surface whose job is to be looked at before it is read.
 *
 * IT IS THE ONLY DRAWING ON THIS SITE THAT IS NOT READ FROM THE RECORD, AND
 * THAT HAS TO BE TRUE ON ITS FACE. Every other figure here is a payload: the
 * chain diagram moves when a session is published, the funnel is 829 / 284 / 13,
 * the mosaic sums the catalogue. This is a picture of a SHAPE — a response
 * surface, the thing an objective looks like over a parameter space, with a few
 * narrow optima and a great deal of flat ground around them. It carries no
 * axis, no scale, no legend and no number, on purpose: nothing about it can be
 * read as a measurement, because there is nothing on it to read. It must never
 * acquire a caption, a figure or a tick. The moment it looks quantitative it is
 * a chart of nothing, and that is the one thing this site cannot publish.
 *
 * SEEDED, SO IT IS A MARK RATHER THAN NOISE. The relief comes out of a fixed
 * seed, so every visitor and every deploy get the same landscape; it is drawn
 * to the canvas once and never animated. A shape that differs per load is
 * decoration. This is the firm's cover.
 *
 * WHY CANVAS. About twenty-two thousand segments. As SVG that is twenty-two
 * thousand nodes in the document; as a canvas it is ten stroked paths.
 *
 * THE FADE IS IN THE ALPHA, NOT A GRADIENT ON TOP. The drawing has to be gone
 * where the headline is. The obvious way is to paint an ink-to-transparent
 * gradient over the finished picture, and it is the wrong way twice: it paints
 * the band's own colour over the band, and it makes the drawing depend on
 * knowing that colour. Each segment's opacity carries the fade instead — the
 * result composites identically over any ground, and the type is never sitting
 * on a wash.
 *
 * NO JAVASCRIPT, NO DRAWING, NO PROBLEM: the band is ink and the copy is on it,
 * which is what shipped before this file existed.
 */

/** Mulberry32. Small, seeded, and the same everywhere. */
function rng(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * THE PEAKS. Exponential falloff, not gaussian — that is the whole difference
 * between a ridge and a bumpy blanket. `exp(-r)` has a cusp at the centre, so
 * every optimum comes to a point; `exp(-r²)` is smooth there and gives a dome.
 *
 * A spike is a RATIO, not an amplitude: a base of 0.055 with a height of 1.0 is
 * a 20:1 mound and reads as a hill however sharp its tip is. These are 30:1 and
 * over.
 */
const PEAKS: { x: number; y: number; s: number; h: number }[] = (() => {
  const r = rng(52852713);
  const out = [
    { x: 0.6, y: 0.21, s: 0.036, h: 1.45 },
    { x: 0.68, y: 0.18, s: 0.026, h: 1.05 },
    { x: 0.87, y: 0.29, s: 0.034, h: 0.95 },
    { x: 0.46, y: 0.34, s: 0.03, h: 0.7 },
  ];
  for (let i = 0; i < 10; i++) {
    out.push({
      x: 0.28 + r() * 0.8,
      y: 0.14 + r() * 0.82,
      s: 0.02 + r() * 0.04,
      h: 0.24 + r() * 0.58,
    });
  }
  return out;
})();

/** Height of the surface at (u, v). The two trailing waves are what keeps the
 *  flat ground from being a plane — a real objective is never smooth. */
function field(u: number, v: number) {
  let z = 0;
  for (const p of PEAKS) {
    const dx = (u - p.x) / p.s;
    const dy = (v - p.y) / p.s;
    z += p.h * Math.exp(-Math.sqrt(dx * dx + dy * dy));
  }
  return (
    z +
    0.075 * Math.sin(u * 6.9 + 1.1) * Math.cos(v * 4.7 + 0.5) +
    0.045 * Math.sin(u * 13.3 + 2.2) * Math.cos(v * 9.1)
  );
}

type Cut = {
  cols: number;
  rows: number;
  /** Horizontal centre of the perspective, as a fraction of the band. */
  cx: number;
  /** How wide the grid is at the back, and at the front. */
  spread0: number;
  spread1: number;
  /** Where the back of the grid sits, and how far it runs towards the viewer. */
  horizon: number;
  depth: number;
  /** >1 pushes the rows apart as they approach, which is the perspective. */
  depthPow: number;
  /** Vertical scale of the relief, and how much of it survives at the back. */
  lift: number;
  lift0: number;
  /** Opacity of flat ground, how fast height brightens it, and the ceiling. */
  floor: number;
  gain: number;
  max: number;
  /** Which piece of the relief this cut frames. The grid always fills the
   *  band; these say which part of the landscape it is looking at, so a short
   *  strip can show the low ground in front of the peaks rather than a
   *  shrunken copy of the whole thing. */
  u0: number;
  u1: number;
  v0: number;
  v1: number;
  /** The quiet zone: the drawing is extinguished left of `fadeX` and above
   *  `fadeY`, each ramping back over its own span. */
  fadeX: number;
  fadeXSpan: number;
  fadeY: number;
  fadeYSpan: number;
};

/**
 * A GROUND, NOT A MOUNTAIN. The band is read at a glance and the type is the
 * thing being read, so the surface lies down: a shallow angle, the grid
 * converging towards the back, the relief running off both the bottom and the
 * right edge so the band is a window on something larger rather than a framed
 * picture of a hill.
 */
const WIDE: Cut = {
  cols: 132,
  rows: 84,
  cx: 0.66,
  spread0: 0.35,
  spread1: 2.4,
  horizon: 0.38,
  depth: 0.74,
  depthPow: 2.1,
  lift: 0.26,
  lift0: 0.58,
  floor: 0.044,
  gain: 0.95,
  max: 0.86,
  u0: 0,
  u1: 1,
  v0: 0,
  v1: 1,
  fadeX: 0.2,
  fadeXSpan: 0.34,
  fadeY: 0.1,
  fadeYSpan: 0.4,
};

/**
 * NARROW IS A DIFFERENT COMPOSITION, NOT THE SAME ONE SCALED. At 390px the copy
 * fills the band top to bottom, so there is no room behind it for a landscape —
 * a scaled-down wide cut would be a drawing rendered entirely underneath text.
 * The horizon drops instead: the same relief, seen from further away, running
 * as a strip under the last button and off the bottom edge. Fewer rows because
 * a 390px-wide grid at 132 columns is a grey wash, not a mesh.
 */
const NARROW: Cut = {
  ...WIDE,
  cols: 96,
  rows: 62,
  cx: 0.5,
  spread0: 0.55,
  spread1: 2.3,
  horizon: 0.84,
  depth: 0.24,
  lift: 0.16,
  lift0: 0.85,
  gain: 0.95,
  max: 0.78,
  u0: 0.25,
  u1: 1,
  v0: 0.4,
  v1: 1,
  fadeX: 0,
  fadeXSpan: 0.06,
  fadeY: 0.78,
  fadeYSpan: 0.08,
};

/**
 * WHICH CUT, AND WHERE THE QUIET ZONE ENDS, ARE READ OFF THE LAYOUT.
 *
 * Both were constants first — a breakpoint for the cut, fractions of the band
 * for the fade — and both were wrong at every width but the two I looked at.
 * The copy does not scale with the viewport: the headline is capped at 19
 * characters and the lede at 62, so their boxes are about the same 800px at
 * 1024 as at 1440. A fade set at "54% of the band" therefore clears the type at
 * one width and runs straight through it at another, and a landscape that needs
 * the right third of the band gets a breakpoint's permission to draw itself
 * into a space that is not there.
 *
 * So the drawing asks. It measures the copy, extinguishes itself up to its
 * edge, and takes the wide composition only when what is left over is wide
 * enough to hold one — otherwise it lies down as a strip under the last button,
 * which is the same landscape seen from further away. Nothing here has a
 * breakpoint in it, and the type is never sat on at any width.
 */
function cutFor(
  w: number,
  h: number,
  copy: { left: number; right: number; bottom: number },
) {
  // Under about 380px of clear band the wide cut has room for a slope and no
  // summit, which reads as a texture rather than a landscape.
  if (w - copy.right >= 380) {
    // THE DRAWING COMES UP THROUGH THE COPY, IT DOES NOT START AFTER IT. A ramp
    // that only begins where the last letter ends puts a vertical edge beside
    // the type and turns the landscape into a curtain hung in the right-hand
    // third. The mesh is out entirely under the first fifth of the copy, is
    // still faint under the body of it, and is at full strength by the time the
    // longest line runs out — which is how the headline keeps a calm ground
    // under it while the band still reads as one continuous surface.
    const width = Math.max(1, copy.right - copy.left);
    return {
      ...WIDE,
      fadeX: (copy.left + width * 0.2) / w,
      fadeXSpan: (width * 0.68) / w,
    };
  }
  return {
    ...NARROW,
    fadeY: (copy.bottom + 14) / h,
    fadeYSpan: 44 / h,
  };
}

/** Ten opacity levels, one path each. Twenty-two thousand stroke() calls would
 *  cost more than the drawing is worth; ten cost nothing. */
const BUCKETS = 10;

function draw(ctx: CanvasRenderingContext2D, w: number, h: number, o: Cut) {
  const cx = w * o.cx;
  const clamp = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

  // The grid, projected once. Both passes read the same points, so computing
  // them twice would double the work for an identical picture.
  const xs = new Float64Array(o.cols * o.rows);
  const ys = new Float64Array(o.cols * o.rows);
  const zs = new Float64Array(o.cols * o.rows);
  const near = new Float64Array(o.rows);

  for (let j = 0; j < o.rows; j++) {
    const t = j / (o.rows - 1);
    const p = Math.pow(t, o.depthPow);
    near[j] = p;
    const spread = o.spread0 + (o.spread1 - o.spread0) * p;
    const v = o.v0 + (o.v1 - o.v0) * t;
    for (let i = 0; i < o.cols; i++) {
      const c = i / (o.cols - 1);
      const u = o.u0 + (o.u1 - o.u0) * c;
      const z = field(u, v);
      const k = j * o.cols + i;
      xs[k] = cx + (c - 0.5) * w * spread;
      ys[k] =
        h * o.horizon +
        p * h * o.depth -
        z * h * o.lift * (o.lift0 + (1 - o.lift0) * p);
      zs[k] = z;
    }
  }

  // Altitude lights the mesh: a crest comes out near-white, flat ground stays a
  // hair above the ink. Lighting, not a blur — one stroke width throughout.
  const alpha = (k: number, k2: number, j: number, scale: number) => {
    const z = Math.max(zs[k], zs[k2], 0);
    const x = (xs[k] + xs[k2]) / 2 / w;
    const y = (ys[k] + ys[k2]) / 2 / h;
    const lit = (o.floor + z * o.gain) * (0.42 + 0.58 * near[j]);
    const quiet =
      clamp((x - o.fadeX) / o.fadeXSpan) * clamp((y - o.fadeY) / o.fadeYSpan);
    return Math.min(1, lit * scale) * quiet;
  };

  const paths = Array.from({ length: BUCKETS }, () => new Path2D());
  const put = (a: number, k: number, k2: number) => {
    if (a <= 0.004) return;
    const b = Math.round(a * (BUCKETS - 1));
    paths[b].moveTo(xs[k], ys[k]);
    paths[b].lineTo(xs[k2], ys[k2]);
  };

  for (let j = 0; j < o.rows; j++) {
    for (let i = 1; i < o.cols; i++) {
      const k = j * o.cols + i - 1;
      put(alpha(k, k + 1, j, 1), k, k + 1);
    }
  }
  // The columns run into the distance, so they cross rows of different
  // brightness; a touch under the rows keeps the mesh from turning into a wash.
  for (let i = 0; i < o.cols; i++) {
    for (let j = 1; j < o.rows; j++) {
      const k = (j - 1) * o.cols + i;
      put(alpha(k, k + o.cols, j, 0.82), k, k + o.cols);
    }
  }

  ctx.lineWidth = 1;
  paths.forEach((path, b) => {
    const a = (b / (BUCKETS - 1)) * o.max;
    if (a <= 0.004) return;
    ctx.strokeStyle = `rgba(242,240,236,${a.toFixed(3)})`;
    ctx.stroke(path);
  });
}

/**
 * WHERE THE TYPE ACTUALLY IS — which is not where its boxes are.
 *
 * The headline's box is 802px wide at every width above 900; its longest
 * rendered LINE is 790 and its last line is 196. The button row's box is the
 * full width of the band, because a column of stretched buttons is a
 * full-width block until there is room to put them side by side. Measured by
 * boxes, the copy therefore appears to fill the band at every width, and the
 * drawing politely refuses to draw.
 *
 * So: line boxes for text, border boxes for anything laid out inline. That is
 * the ink — the lines the reader sees and the two buttons, which have a fill
 * and a border of their own that the mesh must not show through. Block
 * containers contribute nothing; they are scaffolding, not marks.
 */
function inkRects(root: Element): DOMRect[] {
  const out: DOMRect[] = [];
  const walk = (node: Node) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        if (!(child.textContent ?? "").trim()) continue;
        const range = document.createRange();
        range.selectNode(child);
        out.push(...Array.from(range.getClientRects()));
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as Element;
        if (getComputedStyle(el).display.startsWith("inline")) {
          out.push(el.getBoundingClientRect());
        }
        walk(el);
      }
    }
  };
  walk(root);
  return out;
}

export function HeroGround() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    let frame = 0;
    const paint = () => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const holder = canvas.parentElement?.querySelector("[data-hero-copy]");
      const ink = holder ? inkRects(holder) : [];
      const copy = {
        left: ink.length
          ? Math.min(...ink.map((b) => b.left)) - rect.left
          : rect.width * 0.1,
        right: ink.length
          ? Math.max(...ink.map((b) => b.right)) - rect.left
          : rect.width * 0.55,
        bottom: ink.length
          ? Math.max(...ink.map((b) => b.bottom)) - rect.top
          : rect.height * 0.8,
      };

      // Capped at 2: past that the mesh is finer than the eye and the paint is
      // four times the pixels.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);
      draw(ctx, rect.width, rect.height, cutFor(rect.width, rect.height, copy));
    };

    paint();

    // The band grows when the copy rewraps, which a window resize listener only
    // catches by accident. One observer on the element that actually changes.
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(paint);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(canvas);
    // The band only changes height when the copy gains or loses a LINE; the
    // fallback face can rewrap the headline without moving the bottom of the
    // band at all, and the quiet zone is measured off that headline.
    document.fonts?.ready.then(schedule).catch(() => {});
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 block h-full w-full"
    />
  );
}
