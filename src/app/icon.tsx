import { ImageResponse } from "next/og";

/**
 * The tab icon, drawn rather than shipped as a binary: a ledger rule with a
 * chain link through it — the two things this record is. It replaced the
 * framework's default, which was the only mark of the deploy platform left on
 * a page arguing that everything here is the firm's own work.
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
          background: "#0d0f12",
          color: "#d8a54f",
          fontSize: 21,
          fontWeight: 600,
          letterSpacing: "-0.04em",
          fontFamily: "ui-monospace, monospace",
        }}
      >
        R
      </div>
    ),
    { ...size },
  );
}
