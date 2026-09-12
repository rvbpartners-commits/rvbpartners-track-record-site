"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * The notice that says the opposite of a cookie wall.
 *
 * WHY IT IS NOT A CONSENT BANNER. This site sets no cookies, carries no
 * analytics and stores nothing in the reader's browser — `/legal#cookies`
 * states it, and that statement is checkable in ten seconds in a network tab.
 * A consent dialog would therefore be asking permission for something that does
 * not happen, on the one site whose entire argument is that it claims nothing it
 * cannot prove. Consent is required for non-essential storage; there is none.
 *
 * So the notice asserts the fact instead of requesting a permission. Almost
 * nobody can write this sentence truthfully, which is exactly why saying it is
 * worth more than a wall everyone clicks through.
 *
 * IT STORES NOTHING TO REMEMBER ITSELF, and that is the whole discipline.
 * Persisting the dismissal is the obvious implementation, and it would have made
 * the notice contradict its own sentence the moment it was written — the legal
 * page has gone stale exactly once before, on a `sessionStorage` entry left
 * behind by a component that was removed. The dismissal therefore lives in React
 * state in a component mounted by the root layout: the App Router does not
 * remount a layout across a soft navigation, so "Ok" holds for the whole visit
 * and returns on a hard reload. That trade is deliberate — a reader who reloads
 * sees one line again, and the site keeps the right to say it stores nothing.
 *
 * No fixed overlay traps the page: it sits in the corner, is dismissible, and
 * never covers the register. `aria-live` is deliberately absent — this is not an
 * alert, and announcing it over a reader's screen reader would give a quiet
 * statement the urgency of a warning.
 */
export function PrivacyNotice() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <aside
      aria-label="Privacy"
      className="fixed bottom-0 right-0 z-40 m-3 max-w-[21rem] border border-hairline bg-bg px-4 py-3.5 sm:m-5"
    >
      <p className="text-label font-figure uppercase text-fg-faint">Privacy</p>
      <p className="mt-1.5 text-small leading-relaxed text-fg">
        This site sets no cookies and tracks no one.
      </p>
      <div className="mt-3 flex items-center gap-4">
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="border border-fg bg-fg px-3 py-1.5 text-small leading-none text-bg transition-opacity hover:opacity-80"
        >
          Ok
        </button>
        <Link
          href="/legal#cookies"
          onClick={() => setDismissed(true)}
          className="text-small text-fg-muted underline underline-offset-4 transition-colors hover:text-fg"
        >
          Tell me more
        </Link>
      </div>
    </aside>
  );
}
