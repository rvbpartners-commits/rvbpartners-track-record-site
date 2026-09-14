import type { Metadata } from "next";
import Link from "next/link";
import { Next } from "@/components/Next";
import { Section } from "@/components/Section";
import { CONTACT_EMAIL, LINKEDIN_URL, SITE_ORIGIN } from "@/lib/data";
import { ENTITY, REGISTERED_ADDRESS } from "@/lib/entity";

/**
 * ONE ADDRESS, AND WHAT IT IS ACTUALLY FOR.
 *
 * The email was published four times — in the footer, at the end of /firm, in
 * the closing line of the front page, and in the disclosures' regulatory
 * block — and a reader who wanted to write still had to guess whether anyone
 * answers, and about what. An address repeated on four pages is not a contact
 * page; it is a string.
 *
 * NO FORM. A contact form on a site that manages no third-party money collects
 * personal data the firm has no reason to hold, and /legal states this site
 * stores nothing at all. A mailto keeps that true.
 *
 * AND IT SAYS WHAT WILL NOT HAPPEN. The one enquiry this page must handle
 * honestly is the one it cannot accept: the firm is not authorised to manage
 * outside capital and is not raising any. Saying so here, where someone is
 * about to write, is worth more than saying it in a disclosure they will read
 * afterwards.
 */
export const metadata: Metadata = {
  title: "Contact",
  description:
    "How to reach RVB Partners: general enquiries, requests to verify the " +
    "published record, and the company's registered address.",
  alternates: { canonical: `${SITE_ORIGIN}/contact` },
};

export default function ContactPage() {
  return (
    <div className="pt-2 lg:pt-6">
      <header>
        <h1 className="text-heading sm:text-title font-semibold tracking-tight leading-tight">
          Contact
        </h1>
        <p className="mt-3 text-body text-fg-muted leading-relaxed">
          The firm keeps one address, for research, verification and press
          enquiries alike.
        </p>
      </header>

      <div className="text-body">
        <Section
          first
          id="enquiries"
          title="General enquiries"
          gloss="Email, or LinkedIn."
          aside={
            <MarginBlock label="Where the firm is">
              <Fact label="Registered office" value={REGISTERED_ADDRESS} />
              <Fact
                label="RCS"
                value={`${ENTITY.rcs.number} R.C.S. ${ENTITY.rcs.registry}`}
              />
            </MarginBlock>
          }
        >
          <p>
            Write to{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-accent hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
            . Enquiries are answered by the officers named on the{" "}
            <Link href="/team" className="text-accent hover:underline">
              team page
            </Link>
            .
          </p>
          <p>
            The firm can also be reached on{" "}
            <a
              href={LINKEDIN_URL}
              className="text-accent hover:underline"
              target="_blank"
              rel="noreferrer noopener"
            >
              LinkedIn
            </a>
            .
          </p>
        </Section>

        <Section
          id="verification"
          title="Verifying the record"
          gloss="Checking the published figures."
        >
          <p>
            Every published figure can be re-derived independently from the
            public data repository, and the commands to do it are set out
            under{" "}
            <Link href="/verify" className="text-accent hover:underline">
              verify
            </Link>
            . Read-only access at the venue itself, described on the same page,
            is provided on request.
          </p>
          <p className="text-small leading-relaxed text-fg-muted">
            To report an error on this site, write to the address above.
          </p>
        </Section>

        <Section
          id="capital"
          title="Third-party capital"
          gloss="Investment enquiries."
        >
          <p className="text-small leading-relaxed text-fg-muted">
            RVB Partners trades its own capital, manages no third-party money
            and is not raising capital. Nothing on this site is investment
            advice, an offer, or a solicitation. The conditions
            attached to every figure published here are set out under{" "}
            <Link href="/disclosures" className="text-accent hover:underline">
              disclosures
            </Link>
            .
          </p>
        </Section>
      </div>

      <Next
        items={[
          {
            href: "/verify",
            label: "Verify the record",
            question:
              "Re-derive every published number yourself, from a clone of the public repository.",
          },
          {
            href: "/legal",
            label: "Legal notice",
            question:
              "The company's identification, its host, and what this site stores about you.",
          },
        ]}
      />
    </div>
  );
}

function MarginBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="border-b hairline pb-2 text-label font-medium uppercase tracking-[0.13em] text-fg-faint">
        {label}
      </h3>
      <dl className="mt-3">{children}</dl>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b hairline py-2 last:border-b-0">
      <dt className="text-caption leading-snug text-fg-faint">{label}</dt>
      <dd className="mt-0.5 text-small leading-snug text-fg">{value}</dd>
    </div>
  );
}
