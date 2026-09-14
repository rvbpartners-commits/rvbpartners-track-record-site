"use client";

import Link from "next/link";
import "./globals.css";

/**
 * The page shown when the root layout itself fails to render. It replaces the
 * whole document, so it carries its own `<html>` and `<body>` and depends on
 * nothing but the stylesheet: no masthead, no data, no fonts.
 */
export default function GlobalError() {
  return (
    <html lang="en">
      <body className="bg-bg text-fg">
        <title>RVB Partners</title>
        <main className="mx-auto max-w-[var(--column)] w-full px-5 sm:px-8 lg:px-12 py-16">
          <p className="text-small font-semibold text-fg">RVB Partners</p>
          <h1 className="mt-10 text-heading sm:text-title font-semibold tracking-tight leading-tight">
            This page could not be loaded
          </h1>
          <p className="mt-4 text-body text-fg-muted max-w-[62ch] leading-relaxed">
            The site is temporarily unavailable. The published record is
            unaffected.
          </p>
          <Link
            href="/"
            className="mt-7 inline-block text-small font-medium text-accent hover:underline"
          >
            Return to the home page &rarr;
          </Link>
        </main>
      </body>
    </html>
  );
}
