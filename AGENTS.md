# Working in this repository

**No metric may be computed here.** Sharpe, CAGR, volatility, drawdown and every
other statistic are calculated once in the firm's `rvb.metrics` module, published
as JSON by the trading desk, and only *rendered* by this site. `src/lib/data.ts`
fetches and parses; `src/lib/format.ts` formats. If a change needs a number that
is not already in the data, the change belongs in the publisher, not here.

The site claims that its calculation source is open and that every figure is
reproducible from the public data repository. That claim is only true while the
browser is incapable of producing a number the data does not contain.

**`null` is not zero.** A withheld or missing value renders as absence — a break
in the chart line (`connectNulls={false}`), a dash in a table, or an explicit
"insufficient history — N/60". Never `0.00%`.

**The footer disclosure is load-bearing.** The paper-account disclosure sits in
the footer at body size (14px) and full foreground contrast, on every page. It is
a disclosure, not fine print; shrinking or greying it removes it in everything
but name.

**No secrets, ever.** This site reads a public repository and needs no
credential. CI declares none. Nothing here can write to the data repository.

## Commands

    npm run dev / build / lint
