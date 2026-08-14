# RVB — track record site

The public site at **[trackrecord.rvbpartners.fr](https://trackrecord.rvbpartners.fr)**.
It renders the
[track-record data repository](https://github.com/rvbpartners-commits/rvbpartners-track-record-data)
and does nothing else.

> **Alpaca paper accounts.** No capital is at risk and fills are simulated. Past
> performance is not indicative of future results. Nothing here is investment
> advice.

## The rule

**No metric is computed in this repository.** Sharpe, CAGR, drawdown and the rest
are calculated by the desk, published as JSON, and only rendered here. The site
claims every figure is reproducible from the public data; that is only true while
the browser cannot produce a number the data does not contain.

It follows that `null` is never zero. A withheld or missing value renders as
absence — a break in the chart, a dash, or an explicit *withheld · N/60*.

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
