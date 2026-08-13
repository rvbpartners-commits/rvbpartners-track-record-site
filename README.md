# RVB Partners — live track record (site)

The public site for RVB Partners' live paper-trading track record. It renders
[the data repository](https://github.com/rvbpartners-commits/rvbpartners-track-record-data)
and does nothing else.

> **These are Alpaca paper accounts.** No capital is at risk and fills are
> simulated. Past performance is not indicative of future results. Nothing here
> is investment advice, an offer, or a solicitation.

## The one architectural rule

**No metric is computed in this repository.** Sharpe, CAGR, drawdown and the
rest are calculated once, in the firm's `rvb.metrics` module, published as JSON,
and rendered here. `src/lib/data.ts` fetches and parses; `src/lib/format.ts`
formats. Neither does arithmetic that changes what a number means.

That is not stylistic. The site claims that its calculation source is open and
that every published figure is reproducible from the data repository. The claim
is only true if the browser is incapable of producing a number that is not in
the data. If you are about to write `Math.sqrt(252) * ...` in this repo, the
answer belongs upstream.

A second rule follows from it: **`null` is not zero.** A withheld or missing
value is rendered as absence — a break in the chart line, a "—" in a table, or
an explicit *insufficient history — N/60* — never as `0.00%`.

## Stack

Next.js (App Router) · Tailwind CSS · Recharts · deployed on Vercel.

Data is fetched from the public data repository at request time with a 15-minute
revalidation window. There is no build hook, no webhook and **no secret of any
kind** — the site needs no credential to read a public repository, so CI holds
none. A publish on the trading box is visible here within the revalidation
window without anything being triggered.

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build; fetches live data
npm run lint
```

## Pages

| Route | What it is |
|---|---|
| `/` | The four portfolios: KPI row, cumulative-return chart with benchmarks, holdings grouped by strategy |
| `/verify` | Every published snapshot with its hash, chain link, OpenTimestamps proof and commit history |
| `/methodology` | How every number is produced, and the biases that are known but unmeasured |
| `/disclosures` | The full disclosures, rendered from the same source stamped into every record |

## Deploying

Import the repository on Vercel and accept the defaults — it is a stock Next.js
app with no environment variables. The production domain is configured in
Vercel's dashboard; DNS is managed at OVH.
