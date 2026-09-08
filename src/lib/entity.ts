/**
 * THE FIRM'S LEGAL IDENTITY, IN ONE PLACE.
 *
 * Every field below is transcribed from the company's Extrait Kbis (Greffe du
 * Tribunal des Activités Économiques de Paris, n° de gestion 2026B18348, à jour
 * au 9 avril 2026). Nothing here is inferred, rounded or reworded: an identifier
 * that disagrees with the registry is worse than no identifier, because a reader
 * who checks it against Infogreffe and finds a mismatch has been given a reason
 * to disbelieve everything else on the site.
 *
 * Officers' dates and places of birth and their nationalities are recorded by
 * the registry and are not carried here; only what the site publishes is.
 */
export const ENTITY = {
  /** Dénomination sociale, exactly as registered. */
  name: "RVB Partners",
  /** Sigle. */
  short: "RVB",
  legalForm: "Société par actions simplifiée à capital variable",
  legalFormEn: "simplified joint-stock company with variable capital",
  capital: "3,00 €",
  capitalMinimum: "1,00 €",
  registeredOffice: {
    street: "47 rue Vivienne",
    postcode: "75002",
    city: "Paris",
    country: "France",
  },
  /** The siège is a domiciliation address, and saying so is more honest than
   *  letting a reader infer an office. The domiciliataire is itself registered. */
  domiciliation: {
    name: "Vivienne Domiciliation",
    rcs: "994 567 121",
  },
  rcs: {
    registry: "Paris",
    number: "103 404 778",
    /** The Kbis prints SIREN and RCS number as the same 9 digits. */
    siren: "103 404 778",
    euid: "FR7501.103404778",
    registeredOn: "2026-04-09",
    managementNumber: "2026B18348",
  },
  /** THE REGISTERED CORPORATE PURPOSE, verbatim. This is the single most useful
   *  line on the Kbis: it is a third party's record that the firm trades its own
   *  money and no one else's, which is the same claim the disclosures make in
   *  prose — but checkable. */
  purpose: "Achat et vente de tous produits financiers en compte propre.",
  purposeEn:
    "Purchase and sale of all financial products for its own account.",
  activityStarted: "2026-04-06",
  fiscalYearEnd: "30 June",
  officers: {
    president: "Finn Van Den Bosch",
    generalManagers: ["Elias Garcia--Baron", "Florian Rizzo"],
  },
  /* There is no `publicationDirector` field, and its absence is deliberate
   * rather than an oversight — do not add one back as a bugfix. The company's
   * officers are listed above and rendered on /legal. */
  host: {
    name: "Vercel Inc.",
    address: "340 S Lemon Ave #4133, Walnut, CA 91789, United States",
    url: "https://vercel.com",
  },
} as const;

/** "47 rue Vivienne, 75002 Paris, France" */
export const REGISTERED_ADDRESS = [
  ENTITY.registeredOffice.street,
  `${ENTITY.registeredOffice.postcode} ${ENTITY.registeredOffice.city}`,
  ENTITY.registeredOffice.country,
].join(", ");
