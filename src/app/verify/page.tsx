import type { Metadata } from "next";
import Image from "next/image";
import { Note } from "@/components/Note";
import {
  DATA_BASE,
  DATA_REPO_URL,
  MAINTAINER_AVATAR,
  MAINTAINER_URL,
  SITE_REPO_URL,
  getChain,
  getIndex,
} from "@/lib/data";
import { date, dateTime, shortHash } from "@/lib/format";

// Next.js requires this to be a statically analysable literal, so it cannot
// be the REVALIDATE_SECONDS constant. 900s = 15 min; the desk publishes daily.
export const revalidate = 900;

export const metadata: Metadata = {
  title: "Verify",
  description:
    "Every published snapshot with its hash, its commit, and its " +
    "OpenTimestamps proof — so a stranger can re-derive every number.",
};

export default async function VerifyPage() {
  const [index, chain] = await Promise.all([getIndex(), getChain()]);
  const entries = [...chain].reverse();

  return (
    <>
      <header>
        <h1 className="text-[28px] sm:text-[34px] font-semibold tracking-tight leading-tight">
          Verify this record
        </h1>
        <p className="mt-2 text-[14px] text-fg-muted max-w-[72ch] leading-relaxed">
          Every number on this site comes from a file in a public repository.
          Each file hashes its own content, carries the hash of the previous
          session, and has a third-party timestamp proving when it existed. You
          do not have to take any of it on trust, and you do not need our
          cooperation to check it.
        </p>
      </header>

      <section className="mt-12">
        <h2 className="text-[15px] font-semibold tracking-tight">
          What the proofs do and do not establish
        </h2>
        <div className="mt-4 grid md:grid-cols-2 gap-4">
          <Note>
            <strong className="font-semibold text-fg">This proves:</strong> no
            published number has been edited after the fact; no session has been
            quietly dropped; each record existed when it claims to; and every
            metric follows from the published equity curve by open code.
          </Note>
          <Note tone="warn">
            <strong className="font-semibold">This does not prove:</strong> that
            the trading was skilful, that these paper fills would have happened in
            a real market, or that no other book exists unpublished. Git history
            can be rewritten by whoever controls a repository — which is exactly
            why the hash chain, the timestamps and branch protection are used
            together rather than relying on any one of them.
          </Note>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-[15px] font-semibold tracking-tight">
          The four checks
        </h2>
        <ol className="mt-5 space-y-5 sm:space-y-6 text-[13px] leading-relaxed max-w-[80ch]">
          <Check
            n={1}
            title="Each record hashes its own content"
            body={
              <>
                Every snapshot carries a <Code>hash</Code>: the SHA-256 of its
                canonical JSON with the <Code>hash</Code> field removed. Change
                any published number and it stops matching.
              </>
            }
          />
          <Check
            n={2}
            title="The records are chained"
            body={
              <>
                Each snapshot&rsquo;s <Code>prev_hash</Code> is the previous
                session&rsquo;s <Code>hash</Code>. This is what a timestamp alone
                cannot give you: a timestamp proves a file existed, but says
                nothing about whether the series is <em>complete</em>. Because
                each session commits to the one before it, a day cannot be
                removed later without breaking every record after it — so
                publishing only the good days leaves evidence.
              </>
            }
          />
          <Check
            n={3}
            title="The records were not back-dated"
            body={
              <>
                Each snapshot has an OpenTimestamps proof beside it, anchored in
                the Bitcoin blockchain. Run{" "}
                <Code>ots verify &lt;file&gt;.ots</Code>. A fresh proof reads
                &ldquo;pending confirmation&rdquo; for a few hours until the
                aggregating transaction confirms — that means not yet confirmed,
                not invalid.
              </>
            }
          />
          <Check
            n={4}
            title="The numbers follow from the inputs"
            body={
              <>
                <Code>nav.csv</Code> is the whole equity curve. Every metric is
                computed from it by one function in the firm&rsquo;s metrics
                module, with the risk-free rate echoed in{" "}
                <Code>metrics.json</Code>. Nothing is computed in your browser —
                this page renders numbers it was handed.
              </>
            }
          />
        </ol>

        <div className="mt-8">
          <p className="text-[13px] text-fg-muted mb-2">
            Checks 1 and 2, end to end, on a clone:
          </p>
          <pre className="scroll-x bg-bg-subtle border hairline p-3 sm:p-4 text-[11px] sm:text-[12px] leading-relaxed">
            <code>{`git clone ${DATA_REPO_URL}.git
cd rvbpartners-track-record-data
python -c "
import json,hashlib,pathlib
prev={}
for line in open('CHAIN.jsonl',encoding='utf-8'):
    e=json.loads(line); p=pathlib.Path(e['file']); raw=p.read_bytes()
    assert hashlib.sha256(raw).hexdigest()==e['sha256'], p
    rec=json.loads(raw.decode())
    assert rec['prev_hash']==prev.get(e['book'],'0'*64), p
    prev[e['book']]=rec['hash']
print('chain ok:', {k:v[:12] for k,v in prev.items()})
"`}</code>
          </pre>
        </div>
      </section>

      <section className="mt-14">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-[15px] font-semibold tracking-tight">
            Every published snapshot
          </h2>
          <span className="text-[12px] text-fg-faint">
            {entries.length} records
            {index ? ` · published ${dateTime(index.published_at)}` : ""}
          </span>
        </div>

        <div className="scroll-x mt-5">
          <table className="w-full sm:min-w-[760px] text-[13px]">
            <thead>
              <tr className="text-[11px] text-fg-faint">
                <th className="text-left font-normal pb-3">Session</th>
                <th className="hidden sm:table-cell text-left font-normal pb-3">Book</th>
                <th className="text-left font-normal pb-3">Record hash</th>
                <th className="hidden sm:table-cell text-left font-normal pb-3">Chains to</th>
                <th className="text-right font-normal pb-3">Files</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={`${e.book}:${e.session_date}`} className="border-t hairline">
                  <td className="py-2.5 pr-4 tnum whitespace-nowrap">
                    {date(e.session_date)}
                  </td>
                  <td className="hidden sm:table-cell py-2.5 pr-4 text-fg-muted">{e.book}</td>
                  <td className="py-2.5 pr-4 tnum text-fg-muted">
                    {shortHash(e.hash)}
                  </td>
                  <td className="hidden sm:table-cell py-2.5 pr-4 tnum text-fg-faint">
                    {e.prev_hash === "0".repeat(64)
                      ? "genesis"
                      : shortHash(e.prev_hash)}
                  </td>
                  <td className="py-2.5 text-right whitespace-nowrap">
                    <a
                      className="text-accent hover:underline"
                      href={`${DATA_BASE}/${e.file}`}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      JSON
                    </a>
                    <span className="text-fg-faint px-1.5">·</span>
                    <a
                      className="text-accent hover:underline"
                      href={`${DATA_BASE}/${e.file}.ots`}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      .ots
                    </a>
                    <span className="text-fg-faint px-1.5">·</span>
                    <a
                      className="text-accent hover:underline"
                      href={`${DATA_REPO_URL}/commits/main/${e.file}`}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      commits
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {entries.length === 0 && (
          <p className="mt-4 text-[13px] text-fg-muted">
            No records published yet.
          </p>
        )}
      </section>

      <section className="mt-14 grid lg:grid-cols-[190px_1fr] gap-x-10 gap-y-4 border-t hairline pt-8">
        <h2 className="text-[14px] font-semibold tracking-tight">
          Where everything lives
        </h2>
        <div className="max-w-[74ch]">
          <p className="text-[13px] text-fg-muted leading-relaxed">
            The data is in{" "}
            <a className="text-accent hover:underline" href={DATA_REPO_URL}
               target="_blank" rel="noreferrer noopener">
              {DATA_REPO_URL.replace("https://github.com/", "")}
            </a>{" "}
            and this site is in{" "}
            <a className="text-accent hover:underline" href={SITE_REPO_URL}
               target="_blank" rel="noreferrer noopener">
              {SITE_REPO_URL.replace("https://github.com/", "")}
            </a>
            . Both are public. Their <Code>main</Code> branches are protected
            against force-push and deletion, so the append-only history cannot be
            rewritten without leaving a trace. Publication runs on the trading box
            itself — GitHub Actions is not involved in producing this data and
            holds no broker credential.
          </p>

          <div className="mt-6 border-t hairline pt-5">
            <h3 className="text-[13px] font-semibold tracking-tight">
              Found something wrong?
            </h3>
            <p className="mt-2 text-[13px] text-fg-muted leading-relaxed">
              If a check fails, a number does not reconcile, or something here is
              unclear, please say so. Open an issue on either repository and tag{" "}
              <a className="text-accent hover:underline" href={MAINTAINER_URL}
                 target="_blank" rel="noreferrer noopener">
                @v89ysppdry
              </a>
              , or write to{" "}
              <a className="text-accent hover:underline"
                 href="mailto:contact@rvbpartners.fr">
                contact@rvbpartners.fr
              </a>
              . A track record nobody can question is not one worth publishing.
            </p>
            {/* The avatar makes the maintainer a person rather than a handle,
                which is the point of putting a contact here at all. */}
            <a
              href={MAINTAINER_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-5 inline-flex items-center gap-3 group"
            >
              <Image
                src={`${MAINTAINER_AVATAR}&s=160`}
                alt=""
                width={40}
                height={40}
                unoptimized
                className="rounded-full shrink-0"
              />
              <span className="min-w-0">
                <span className="block text-[13px] font-medium group-hover:underline">
                  @v89ysppdry
                </span>
                <span className="block text-[12px] text-fg-muted">
                  maintains this record
                </span>
              </span>
            </a>

            <div className="mt-5 flex flex-col sm:flex-row sm:flex-wrap gap-x-5 gap-y-2 text-[13px]">
              <a className="text-accent hover:underline"
                 href={`${DATA_REPO_URL}/issues/new`}
                 target="_blank" rel="noreferrer noopener">
                Open an issue on the data
              </a>
              <a className="text-accent hover:underline"
                 href={`${SITE_REPO_URL}/issues/new`}
                 target="_blank" rel="noreferrer noopener">
                Open an issue on the site
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function Check({
  n,
  title,
  body,
}: {
  n: number;
  title: string;
  body: React.ReactNode;
}) {
  return (
    <li className="flex gap-4">
      <span className="shrink-0 text-[12px] tnum text-fg-faint pt-0.5 w-4">
        {n}
      </span>
      <div>
        <div className="font-medium">{title}</div>
        <p className="mt-1 text-fg-muted">{body}</p>
      </div>
    </li>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="bg-bg-subtle px-1.5 py-0.5 text-[12px] tnum">
      {children}
    </code>
  );
}
