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
 * WHAT IS DELIBERATELY ABSENT. The Kbis also records each officer's date and
 * place of birth and their nationality. None of that appears here or on the
 * site. The registry requires it OF THE REGISTRY; no law requires it on a
 * website, and it is personal data about three named individuals published to
 * no purpose. The Kbis itself already withholds their home addresses under
 * article R. 123-54-1 du code de commerce, which is the same judgment.
 *
 * `capital_social` is 3,00 € and is stated as such. It is small, and it is
 * legally required on the site (LCEN art. 6-III, and R. 123-237 for commercial
 * documents), already public on Infogreffe, and normal for a société à capital
 * VARIABLE — the form exists precisely so the figure moves. Rounding it,
 * omitting it, or dressing it up would be the one kind of dishonesty this
 * entire site exists to make impossible.
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
  /** Directeur de la publication. Defaults to the legal representative of the
   *  company, which for a SAS is its président. */
  publicationDirector: "Finn Van Den Bosch",
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
