# RVB — track record site

The public site at **[rvbpartners.fr](https://rvbpartners.fr)**.

It is two halves. **The record** — `/portfolios`, `/research`, `/selection`,
`/verify`, `/methodology`, `/disclosures` — renders the
[track-record data repository](https://github.com/rvbpartners-commits/rvbpartners-track-record-data)
and nothing else. **The firm** — `/firm`, `/team`, `/approach`, `/contact` — is
the company's own prose, written in this repository, and carries no figure the
data repository does not publish.

The split is the whole information architecture: the evidence is the second half
of a document rather than the whole of one. `src/lib/nav.ts` is the single list
every surface reads — the masthead, the footer, the sitemap and the 404 page —
so a route cannot appear in one and be forgotten in the others.

> **Paper accounts and real capital.** Some portfolios in this record are
> broker-simulated paper accounts, in which no capital is at risk and fills are
> simulated; others trade the firm's own real capital. Each portfolio's page
> states which it is, and the site reads that from `account_kind` rather than
> asserting it. No third-party money is managed. Past performance is not
> indicative of future results. Nothing here is investment advice.

## The rule

**No metric is computed in this repository.** Sharpe, CAGR, drawdown and the rest
are calculated by the desk, published as JSON, and only rendered here. The site
claims every figure is reproducible from the public data; that is only true while
the browser cannot produce a number the data does not contain.

It follows that `null` is never zero. A withheld or missing value renders as
absence — a break in the chart, a dash, or an explicit *withheld · N/60*.

The rule binds the firm pages too. `/approach` states what the firm optimises
for and hangs published counts beside it; `/team` derives its roster from
`ENTITY.officers` — the register transcription — so it cannot name anyone the
Kbis does not. Prose is allowed to describe; it is not allowed to produce a
figure.

## Stack

Next.js, Tailwind, Recharts, deployed on Vercel. Pages render per request and
fetch the public repository with `no-store`, memoised for 60 seconds; the desk
publishes every 15 minutes during the session. **No environment variables and no
secrets** — reading a public repository needs no credential.

```bash
npm install
npm run dev
npm run build
npm run lint
```

## Contact

Open an issue or write to
[contact@rvbpartners.fr](mailto:contact@rvbpartners.fr).
