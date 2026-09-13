import type { ChainEntry } from "@/lib/data";
import { date, shortHash } from "@/lib/format";

/**
 * HOW ONE RECORD HOLDS THE ONE BEFORE IT.
 *
 * /verify explained the chain in two paragraphs and then proved it in a
 * stacked box of six hash lines in the margin. The box was correct and it was
 * not a diagram: a reader had to be told, in words, that the string on one row
 * was the same string as on another. The mechanism is a picture, and it is the
 * only picture this site's central claim actually needs.
 *
 * Three records, oldest on the left, with the link drawn: the `hash` of one
 * record IS the `prev_hash` of the next, and the two are set on the same line
 * of the two boxes so the eye can run across them. The genesis record's
 * `prev_hash` is sixty-four zeros, which is what "nothing came before this"
 * looks like written down.
 *
 * IT IS READ OFF THE CHAIN ON EVERY REQUEST, never typed. The page already
 * resolves the newest record whose `prev_hash` matches a published `hash`, that
 * record's predecessor, and the book's first entry. Publish a session and this
 * drawing moves to it on the next render; nothing here has to be remembered.
 *
 * The monospace is the point in exactly two places — the linked pair — because
 * those are strings a reader compares character by character. Everything else
 * is prose.
 */
export function ChainDiagram({
  head,
  prev,
  genesis,
  label,
  records,
}: {
  /** The newest record whose `prev_hash` resolves to a published `hash`. */
  head: ChainEntry;
  /** The record that `head.prev_hash` points at. */
  prev: ChainEntry;
  /** This portfolio's first record, when the current chain still holds it. */
  genesis: ChainEntry | null;
  label: string;
  /** How many records this portfolio's chain carries. */
  records: number;
}) {
  // Oldest first. A two-record chain resolves genesis and prev to the same
  // entry; drawing it twice would invent a link that is not there.
  const shown: { role: string; entry: ChainEntry }[] = [];
  if (genesis && genesis.hash !== prev.hash && genesis.hash !== head.hash) {
    shown.push({ role: "First record", entry: genesis });
  }
  shown.push({ role: "The session before", entry: prev });
  shown.push({ role: "Newest linked record", entry: head });

  return (
    <figure className="m-0">
      <div className="grid items-stretch gap-0 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
        {shown.map((cell, i) => (
          <Cell
            key={cell.entry.hash}
            role={cell.role}
            entry={cell.entry}
            label={i === shown.length - 1 ? label : null}
            /* The genesis box is the only one whose `prev_hash` is not a link
               to anything, so it is the only one that says what it is. */
            isGenesis={cell.role === "First record"}
            linkedPrev={i > 0}
            linkedHash={i < shown.length - 1}
            position={i}
            count={shown.length}
          />
        ))}
      </div>

      <figcaption className="mt-4 text-small leading-relaxed text-fg-muted">
        The <span className="mono">hash</span> of each record is the{" "}
        <span className="mono">prev_hash</span> of the next, so a published
        number cannot be edited and a session cannot be dropped without breaking
        every record after it. This portfolio&rsquo;s chain carries{" "}
        <span className="tnum text-fg">{records}</span> records; the drawing is
        read from the published chain on every request, so it moves to the
        newest session as soon as one is published.
      </figcaption>
    </figure>
  );
}

/** One record. The two linked fields sit at fixed positions in every box so
 *  that the same line runs across the whole drawing. */
function Cell({
  role,
  entry,
  label,
  isGenesis,
  linkedPrev,
  linkedHash,
  position,
  count,
}: {
  role: string;
  entry: ChainEntry;
  label: string | null;
  isGenesis: boolean;
  linkedPrev: boolean;
  linkedHash: boolean;
  position: number;
  count: number;
}) {
  return (
    <>
      <div className="h-full border hairline px-4 py-3.5">
        <p className="text-label font-medium uppercase tracking-[0.13em] text-fg-faint">
          {role}
        </p>
        <p className="mt-1.5 text-small text-fg">
          {date(entry.session_date)}
          {label ? <span className="text-fg-muted"> · {label}</span> : null}
        </p>

        <dl className="mt-3.5 border-t hairline pt-3">
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-caption text-fg-faint">prev_hash</dt>
            <dd
              className={`mono min-w-0 break-all text-right text-caption ${
                linkedPrev ? "text-fg" : "text-fg-faint"
              }`}
            >
              {isGenesis ? "000000000000" : shortHash(entry.prev_hash)}
            </dd>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between gap-3">
            <dt className="text-caption text-fg-faint">hash</dt>
            <dd
              className={`mono min-w-0 break-all text-right text-caption ${
                linkedHash ? "text-fg" : "text-fg-muted"
              }`}
            >
              {shortHash(entry.hash)}
            </dd>
          </div>
        </dl>

        {isGenesis && (
          <p className="mt-3 text-caption leading-snug text-fg-faint">
            Sixty-four zeros: nothing precedes this session.
          </p>
        )}
      </div>

      {/* The connector. A column of its own between two boxes on a wide screen,
          a row between them on a narrow one, so the link survives the stack
          instead of disappearing with the grid. */}
      {position < count - 1 && (
        <div className="flex items-center justify-center gap-2 px-3 py-2 md:flex-col md:py-0">
          <span aria-hidden="true" className="text-fg-faint md:hidden">
            &darr;
          </span>
          <span aria-hidden="true" className="hidden text-fg-faint md:inline">
            &rarr;
          </span>
          <span className="text-caption leading-snug text-fg-faint md:max-w-[7rem] md:text-center">
            the same twelve characters
          </span>
        </div>
      )}
    </>
  );
}
