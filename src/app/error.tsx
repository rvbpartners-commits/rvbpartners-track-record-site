"use client";

/**
 * The page shown when a render fails — almost always because the data host was
 * unreachable, since nothing else here does any work.
 *
 * The site's rule is that absence is shown as absence: a missing file already
 * renders as an honest note rather than a zero. A failed fetch is the same kind
 * of event and deserves the same voice, not a stack trace. It says what is
 * wrong, what it is NOT (a change to the record), and where the data lives so a
 * reader can go around us entirely.
 */
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="py-16">
      <h1 className="text-[28px] sm:text-[34px] font-semibold tracking-tight leading-tight">
        This page could not be loaded
      </h1>
      <p className="mt-4 text-[15px] text-fg-muted max-w-[62ch] leading-relaxed">
        The site could not reach the published data. Nothing is being shown
        rather than a stale or partial figure — this is a display failure on our
        side, not a change to the record.
      </p>
      <p className="mt-3 text-[15px] text-fg-muted max-w-[62ch] leading-relaxed">
        The record itself is a public repository and does not depend on this
        site. You can read every published file, and verify it, directly at{" "}
        <a
          className="text-accent hover:underline"
          href="https://github.com/rvbpartners-commits/rvbpartners-track-record-data"
          target="_blank"
          rel="noreferrer noopener"
        >
          rvbpartners-track-record-data
        </a>
        .
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-7 border border-rule px-4 py-2 text-[13px] text-fg hover:border-accent hover:text-accent transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
