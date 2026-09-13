import { ENTITY } from "@/lib/entity";

/**
 * THE PEOPLE, AND HOW THIS FILE IS PREVENTED FROM INVENTING ANY.
 *
 * /firm publishes the officers exactly as the register carries them, with no
 * roles and no biographies, and that page is right to: it is a transcription,
 * and a transcription with prose added to it is no longer one. But it left the
 * site unable to answer the first question anyone asks about an investment
 * firm — *who is this* — anywhere at all. The register says three names hold
 * three titles. It does not say the firm is a research team, and that is the
 * fact a reader is actually after.
 *
 * So the two are separated rather than mixed. The register entry stays on
 * /firm and /legal, untouched. This is what the firm says about itself, and
 * the only way to keep the second from drifting away from the first is to
 * derive it FROM the first.
 *
 * THE ROSTER IS THE REGISTER'S, NOT THIS FILE'S. `roster()` walks
 * `ENTITY.officers` — the Kbis transcription — and attaches a description to
 * each name it finds. Nobody can be added here who is not an officer, because
 * this file never produces a name: it only ever looks one up. An officer whose
 * registered name changes stops matching and renders with their title and no
 * description, which is visible on the page in a way a silently stale sentence
 * would not be.
 *
 * THE DOUBLE HYPHEN IS NOT A TYPO AND IS NOT CORRECTED IN `entity.ts`. French
 * civil registration doubles the hyphen to mark a composite surname — it is how
 * the Kbis prints it, and /legal must print what the Kbis prints. A page
 * introducing a colleague is not a registry extract, so `display` carries the
 * ordinary spelling and the two surfaces stay honest in their own registers.
 * `format.prose` would turn `--` into a colon, which is why neither surface may
 * be run through it.
 *
 * FOUR LINES EACH, AND NO CAREER HISTORY. What a reader needs is what each
 * person is responsible for inside the system the rest of this site documents,
 * not where they studied. Anything longer is a biography, and a biography is a
 * claim this record cannot verify.
 */
export type Member = {
  /** Exactly as the register carries it. The key this file looks up by. */
  registered: string;
  /** The ordinary spelling, for a page that is introducing a person. */
  display: string;
  /** From `ENTITY.officers`, never typed here. */
  title: string;
  /** The area of the system this person answers for. Three or four words. */
  area: string;
  /** What that means, in two or three sentences. */
  description: string;
};

type Profile = Pick<Member, "display" | "area" | "description">;

/** Keyed on the REGISTERED name, so a registry change is a visible miss. */
const PROFILES: Record<string, Profile> = {
  "Finn Van Den Bosch": {
    display: "Finn Van Den Bosch",
    area: "Research and production",
    description:
      "Works on the strategies that enter the catalogue, and on what it takes " +
      "to move one from a measured result to a funded account: the validation " +
      "it has to survive, the weight it is given, and the conditions under " +
      "which it is retired.",
  },
  "Elias Garcia--Baron": {
    display: "Elias Garcia-Baron",
    area: "Research and production",
    description:
      "Works across the catalogue and the books that trade it, and on the " +
      "tooling the firm searches with. A strategy is not finished when it " +
      "backtests well; it is finished when the same logic runs on an account " +
      "and the difference between the two is measured.",
  },
  "Florian Rizzo": {
    display: "Florian Rizzo",
    area: "Infrastructure and architecture",
    description:
      "Owns the framework research and the desk share — one metrics module, " +
      "one accounting engine, one execution path — and the systems that " +
      "publish this record. It is what makes a live figure comparable to the " +
      "backtest that argued for it.",
  },
};

/**
 * The team, in the register's own order: the president, then the general
 * managers as entered.
 *
 * A name with no profile is kept rather than dropped. Omitting an officer
 * would make this page quietly disagree with /legal about who runs the
 * company, which is the one disagreement a register cannot afford.
 */
export function roster(): Member[] {
  const entries: { registered: string; title: string }[] = [
    { registered: ENTITY.officers.president, title: "President" },
    ...ENTITY.officers.generalManagers.map((name) => ({
      registered: name,
      title: "General manager",
    })),
  ];

  return entries.map(({ registered, title }) => {
    const profile = PROFILES[registered];
    return {
      registered,
      title,
      display: profile?.display ?? registered,
      area: profile?.area ?? "",
      description: profile?.description ?? "",
    };
  });
}
