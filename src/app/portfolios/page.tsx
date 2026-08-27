import { redirect } from "next/navigation";
import { Note } from "@/components/Note";
import { bookSlug, getIndex } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata = { title: "Portfolios" };

/**
 * `/portfolios` is not a page any more — every portfolio has its own address.
 *
 * It redirects to the first published book rather than rendering it here. Two
 * URLs serving identical content is one canonical link too many: a reader who
 * shares "the page they were on" would share an address that shows a different
 * book to whoever opens it next, the day the publishing order changes.
 */
export default async function Portfolios() {
  const index = await getIndex();

  if (!index || index.books.length === 0) {
    return (
      <Note tone="warn">
        The published data could not be loaded. Nothing is being shown rather
        than a stale or partial figure.
      </Note>
    );
  }

  redirect(`/portfolios/${bookSlug(index.books[0])}`);
}
