export type Prelevement = {
  libelle: string;
  montantMensuel: number;
  montantAnnuel: number;
  derniereDate: string;
  occurrences: number;
};

export type Ligne = { date: Date; libelle: string; montant: number };

// Au-delà de ce montant mensuel, on considère que ce n'est pas un abonnement
// (loyer, crédit…).
const MONTANT_MAX = 250;

function sansAccents(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function arrondi(x: number): number {
  return Math.round(x * 100) / 100;
}

function mediane(valeurs: number[]): number {
  const t = [...valeurs].sort((a, b) => a - b);
  const m = Math.floor(t.length / 2);
  return t.length % 2 ? t[m] : (t[m - 1] + t[m]) / 2;
}

function separateur(entete: string): string {
  let meilleur = ";";
  let max = -1;
  for (const c of [";", "\t", ","]) {
    const n = entete.split(c).length - 1;
    if (n > max) {
      max = n;
      meilleur = c;
    }
  }
  return meilleur;
}

function decouper(ligne: string, sep: string): string[] {
  const champs: string[] = [];
  let courant = "";
  let entreGuillemets = false;
  for (let i = 0; i < ligne.length; i++) {
    const c = ligne[i];
    if (c === '"') {
      if (entreGuillemets && ligne[i + 1] === '"') {
        courant += '"';
        i++;
      } else {
        entreGuillemets = !entreGuillemets;
      }
    } else if (c === sep && !entreGuillemets) {
      champs.push(courant);
      courant = "";
    } else {
      courant += c;
    }
  }
  champs.push(courant);
  return champs.map((x) => x.trim());
}

function lireMontant(brut: string): number | null {
  let s = brut
    .replace(/[−–]/g, "-")
    .replace(/[\s\u00a0€$]/g, "")
    .replace(/EUR/gi, "");
  if (!s) return null;
  let negatif = false;
  if (/^\(.*\)$/.test(s)) {
    negatif = true;
    s = s.slice(1, -1);
  }
  if (s.includes(",") && s.includes(".")) {
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
  } else if (s.includes(",")) {
    s = s.replace(",", ".");
  }
  const n = Number(s);
  if (Number.isNaN(n)) return null;
  return negatif ? -Math.abs(n) : n;
}

function dateValide(a: number, m: number, j: number): Date | null {
  const d = new Date(Date.UTC(a, m - 1, j));
  return d.getUTCFullYear() === a &&
    d.getUTCMonth() === m - 1 &&
    d.getUTCDate() === j
    ? d
    : null;
}

function lireDate(brut: string): Date | null {
  const s = brut.trim();
  let m = s.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/);
  if (m) {
    const annee = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
    return dateValide(annee, Number(m[2]), Number(m[1]));
  }
  m = s.match(/^(\d{4})[\/.\-](\d{1,2})[\/.\-](\d{1,2})/);
  if (m) return dateValide(Number(m[1]), Number(m[2]), Number(m[3]));
  return null;
}

export function lireReleve(texte: string): Ligne[] {
  const lignes = texte
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((l) => l.trim() !== "");

  const indexEntete = lignes.findIndex(
    (l) =>
      /date/i.test(l) && /(montant|amount|d[ée]bit|cr[ée]dit)/i.test(l),
  );
  if (indexEntete === -1) return [];

  const sep = separateur(lignes[indexEntete]);
  const entete = decouper(lignes[indexEntete], sep).map((h) =>
    sansAccents(h).toLowerCase(),
  );

  let iDate = entete.findIndex((h) => h.includes("date") && !h.includes("valeur"));
  if (iDate < 0) iDate = entete.findIndex((h) => h.includes("date"));
  const iLibelle = entete.findIndex(
    (h) =>
      !h.includes("date") &&
      /libelle|label|description|intitule|detail|motif|beneficiaire|nom/.test(h),
  );
  const iMontant = entete.findIndex((h) => /^(montant|amount)/.test(h));
  const iDebit = entete.findIndex((h) => h.includes("debit"));
  const iCredit = entete.findIndex((h) => h.includes("credit"));

  if (iDate < 0 || iLibelle < 0 || (iMontant < 0 && iDebit < 0)) return [];

  const resultat: Ligne[] = [];
  for (let i = indexEntete + 1; i < lignes.length; i++) {
    const champs = decouper(lignes[i], sep);
    const date = lireDate(champs[iDate] ?? "");
    const libelle = (champs[iLibelle] ?? "").trim();
    if (!date || !libelle) continue;

    let montant: number | null = null;
    if (iMontant >= 0) {
      montant = lireMontant(champs[iMontant] ?? "");
    } else {
      const debit = lireMontant(champs[iDebit] ?? "");
      const credit = iCredit >= 0 ? lireMontant(champs[iCredit] ?? "") : null;
      if (debit !== null && debit !== 0) montant = -Math.abs(debit);
      else if (credit !== null) montant = Math.abs(credit);
    }
    if (montant === null) continue;

    resultat.push({ date, libelle, montant });
  }
  return resultat;
}

function cle(libelle: string): string {
  let s = sansAccents(libelle).toUpperCase();
  s = s.replace(
    /\b(PRLV|PRELEVEMENT|SEPA|PAIEMENT|CB|CARTE|VIR|VIREMENT|ECH|ECHEANCE|FACTURE|REF|MANDAT|DU)\b/g,
    " ",
  );
  s = s.replace(/\d+/g, " ").replace(/[^A-Z ]/g, " ");
  return s
    .split(/\s+/)
    .filter((mot) => mot.length > 1)
    .slice(0, 3)
    .join(" ");
}

function moisDe(d: Date): string {
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
}

export function detecter(lignes: Ligne[]): Prelevement[] {
  const groupes = new Map<string, Ligne[]>();
  for (const l of lignes) {
    if (l.montant >= 0) continue;
    const k = cle(l.libelle);
    if (!k) continue;
    groupes.set(k, [...(groupes.get(k) ?? []), l]);
  }

  const resultat: Prelevement[] = [];
  for (const items of groupes.values()) {
    if (new Set(items.map((l) => moisDe(l.date))).size < 2) continue;

    const m = mediane(items.map((l) => Math.abs(l.montant)));
    if (m < 0.5 || m > MONTANT_MAX) continue;

    const proches = items
      .filter((l) => Math.abs(Math.abs(l.montant) - m) <= Math.max(1, m * 0.15))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    if (proches.length < 2) continue;
    if (new Set(proches.map((l) => moisDe(l.date))).size < 2) continue;

    const ecarts: number[] = [];
    for (let i = 1; i < proches.length; i++) {
      ecarts.push(
        (proches[i].date.getTime() - proches[i - 1].date.getTime()) / 86400000,
      );
    }
    const ecart = mediane(ecarts);
    if (ecart < 20 || ecart > 40) continue;

    const derniere = proches[proches.length - 1];
    resultat.push({
      libelle: derniere.libelle.replace(/\s+/g, " ").slice(0, 40),
      montantMensuel: arrondi(m),
      montantAnnuel: arrondi(m * 12),
      derniereDate: derniere.date.toISOString().slice(0, 10),
      occurrences: proches.length,
    });
  }

  return resultat.sort((a, b) => b.montantAnnuel - a.montantAnnuel);
}

export const RELEVE_EXEMPLE = [
  "Date;Libellé;Montant",
  "03/07/2026;PRLV SEPA BASIC FIT 4412;-24,99",
  "05/07/2026;PRLV SEPA NETFLIX.COM;-13,49",
  "07/07/2026;CB CARREFOUR MARKET 0712;-45,20",
  "09/07/2026;PRLV SEPA ABO REVUE CUISINE;-6,50",
  "12/07/2026;PRLV SEPA SPOTIFY AB;-10,99",
  "14/07/2026;PRLV SEPA MEDITATION APP;-11,99",
  "15/07/2026;PRLV SEPA STOCKAGE CLOUD;-2,99",
  "19/07/2026;CB CARREFOUR MARKET 0719;-12,80",
  "28/07/2026;VIR SALAIRE;1850,00",
  "03/08/2026;PRLV SEPA BASIC FIT 4412;-24,99",
  "05/08/2026;PRLV SEPA NETFLIX.COM;-13,49",
  "08/08/2026;CB CARREFOUR MARKET 0808;-38,10",
  "09/08/2026;PRLV SEPA ABO REVUE CUISINE;-6,50",
  "12/08/2026;PRLV SEPA SPOTIFY AB;-10,99",
  "14/08/2026;PRLV SEPA MEDITATION APP;-11,99",
  "15/08/2026;PRLV SEPA STOCKAGE CLOUD;-2,99",
  "21/08/2026;CB CARREFOUR MARKET 0821;-19,40",
  "28/08/2026;VIR SALAIRE;1850,00",
  "03/09/2026;PRLV SEPA BASIC FIT 4412;-24,99",
  "05/09/2026;PRLV SEPA NETFLIX.COM;-13,49",
  "05/09/2026;CB CARREFOUR MARKET 0905;-52,60",
  "09/09/2026;PRLV SEPA ABO REVUE CUISINE;-6,50",
  "12/09/2026;PRLV SEPA SPOTIFY AB;-10,99",
  "14/09/2026;PRLV SEPA MEDITATION APP;-11,99",
  "15/09/2026;PRLV SEPA STOCKAGE CLOUD;-2,99",
  "20/09/2026;CB CARREFOUR MARKET 0920;-23,70",
  "28/09/2026;VIR SALAIRE;1850,00",
].join("\n");
