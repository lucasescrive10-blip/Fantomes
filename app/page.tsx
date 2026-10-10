"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  detecter,
  lireReleve,
  RELEVE_EXEMPLE,
  type Prelevement,
} from "@/lib/detection";

const GRATUITS = 3;

const euro = (n: number) =>
  n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

async function lireFichier(f: File): Promise<string> {
  const buffer = await f.arrayBuffer();
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder("windows-1252").decode(buffer);
  }
}

export default function Compte() {
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [charge, setCharge] = useState(true);
  const [liste, setListe] = useState<Prelevement[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [exemple, setExemple] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user.email ?? null);
      setUserId(data.session?.user.id ?? null);
      setCharge(false);
    });
    const { data: abonnement } = supabase.auth.onAuthStateChange(
      (_evenement, session) => {
        setEmail(session?.user.email ?? null);
        setUserId(session?.user.id ?? null);
        setCharge(false);
      },
    );
    return () => abonnement.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data: audits } = await supabase
        .from("audits")
        .select("id")
        .order("cree_le", { ascending: false })
        .limit(1);
      if (!audits || audits.length === 0) return;
      const { data: lignes } = await supabase
        .from("prelevements")
        .select("*")
        .eq("audit_id", audits[0].id)
        .order("montant_annuel", { ascending: false });
      if (lignes && lignes.length > 0) {
        setListe(
          lignes.map((l) => ({
            libelle: l.libelle,
            montantMensuel: Number(l.montant_mensuel),
            montantAnnuel: Number(l.montant_annuel),
            derniereDate: l.derniere_date ?? "",
            occurrences: l.nb_occurrences,
          })),
        );
        setExemple(false);
      }
    })();
  }, [userId]);

  async function enregistrer(trouves: Prelevement[], id: string) {
    try {
      const total =
        Math.round(trouves.reduce((s, p) => s + p.montantAnnuel, 0) * 100) /
        100;
      const { data: audit, error } = await supabase
        .from("audits")
        .insert({ user_id: id, total_annuel: total })
        .select("id")
        .single();
      if (error || !audit) return;
      await supabase.from("prelevements").insert(
        trouves.map((p) => ({
          audit_id: audit.id,
          user_id: id,
          libelle: p.libelle,
          montant_mensuel: p.montantMensuel,
          montant_annuel: p.montantAnnuel,
          derniere_date: p.derniereDate,
          nb_occurrences: p.occurrences,
        })),
      );
    } catch {}
  }

  async function analyser(texte: string, estExemple: boolean) {
    setMessage(null);
    const lignes = lireReleve(texte);
    if (lignes.length === 0) {
      setListe(null);
      setMessage(
        "Je n’ai pas réussi à lire ce fichier. Il doit contenir une colonne date, un libellé et un montant.",
      );
      return;
    }
    const trouves = detecter(lignes);
    if (trouves.length === 0) {
      setListe(null);
      setMessage(
        "Aucun prélèvement régulier repéré. Vérifie que ton relevé couvre au moins deux mois.",
      );
      return;
    }
    setListe(trouves);
    setExemple(estExemple);
    if (!estExemple && userId) await enregistrer(trouves, userId);
  }

  async function choisirFichier(e: React.ChangeEvent<HTMLInputElement>) {
    const champ = e.target;
    const fichier = champ.files?.[0];
    if (!fichier) return;
    const texte = await lireFichier(fichier);
    await analyser(texte, false);
    champ.value = "";
  }

  async function deconnecter() {
    await supabase.auth.signOut();
    setEmail(null);
    setUserId(null);
    setListe(null);
  }

  if (charge) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col px-6 pt-10">
        <p className="text-lg">Chargement…</p>
      </main>
    );
  }

  if (!email) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col px-6 pt-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em]">
          Fantômes
        </p>
        <h1 className="mt-10 font-titre text-4xl font-black leading-tight">
          Tu n’es pas connecté.
        </h1>
        <p className="mt-5 text-lg leading-relaxed">
          Demande un lien de connexion, il arrive par email en quelques
          secondes.
        </p>
        <Link
          href="/connexion"
          className="mt-8 block w-full rounded-full bg-acide py-4 text-center text-lg font-bold text-encre"
        >
          Recevoir mon lien
        </Link>
      </main>
    );
  }

  const pied = (
    <div className="mt-10 border-t border-encre/10 pt-4 text-sm">
      <p className="opacity-70">Connecté avec {email}</p>
      <button onClick={deconnecter} className="mt-2 font-semibold underline">
        Me déconnecter
      </button>
    </div>
  );

  if (liste) {
    const total = liste.reduce((s, p) => s + p.montantAnnuel, 0);
    const gratuits = liste.slice(0, GRATUITS);
    const verrouilles = liste.slice(GRATUITS);
    const totalVerrouille = verrouilles.reduce((s, p) => s + p.montantAnnuel, 0);

    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col px-6 pb-10 pt-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em]">
          Fantômes
        </p>

        {exemple && (
          <p className="mt-6 border-2 border-dashed border-encre/40 p-3 text-sm font-semibold">
            Ceci est un exemple, pas ton relevé.
          </p>
        )}

        <h1 className="mt-8 font-titre text-3xl font-black leading-tight">
          Voilà tes prélèvements réguliers.
        </h1>
        <p className="mt-6 font-titre text-6xl font-black leading-none">
          {euro(total)}
          <span className="block text-3xl">par an</span>
        </p>
        <p className="mt-4 leading-relaxed">
          {liste.length} prélèvements, classés du plus coûteux au moins coûteux.
          À toi de voir lesquels tu utilises encore.
        </p>

        <ol className="mt-8 space-y-4">
          {gratuits.map((p, i) => (
            <li key={`${p.libelle}-${i}`} className="border-2 border-encre p-4">
              <p className="font-bold">{p.libelle}</p>
              <p className="mt-1 font-titre text-3xl font-black">
                {euro(p.montantAnnuel)}{" "}
                <span className="font-texte text-base font-normal">par an</span>
              </p>
              <p className="mt-1 text-sm opacity-70">
                {euro(p.montantMensuel)} par mois
                {p.derniereDate
                  ? ` · dernier prélèvement le ${new Date(p.derniereDate).toLocaleDateString("fr-FR")}`
                  : ""}
              </p>
            </li>
          ))}
          {verrouilles.map((_, i) => (
            <li
              key={`verrou-${i}`}
              className="border-2 border-dashed border-encre/40 p-4"
            >
              <p className="font-bold opacity-50">Prélèvement verrouillé</p>
              <p className="mt-1 select-none font-titre text-3xl font-black opacity-30 blur-[3px]">
                •••• €
              </p>
            </li>
          ))}
        </ol>

        {verrouilles.length > 0 && (
          <div className="mt-6 border-2 border-encre p-4">
            <p className="font-bold">
              {verrouilles.length} autres prélèvements, {euro(totalVerrouille)}{" "}
              par an.
            </p>
            <button
              disabled
              className="mt-3 block w-full rounded-full bg-encre/10 py-3 text-center font-bold opacity-60"
            >
              Tout débloquer (bientôt)
            </button>
          </div>
        )}

        <button
          onClick={() => {
            setListe(null);
            setMessage(null);
          }}
          className="mt-8 self-start text-sm font-semibold underline"
        >
          Analyser un autre relevé
        </button>

        {pied}
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-6 pb-10 pt-10">
      <p className="text-sm font-semibold uppercase tracking-[0.2em]">
        Fantômes
      </p>
      <h1 className="mt-10 font-titre text-4xl font-black leading-tight">
        Dépose ton relevé.
      </h1>
      <p className="mt-5 text-lg leading-relaxed">
        Un fichier CSV de 2 à 3 mois, exporté depuis le site de ta banque. Il
        est lu sur ton téléphone : il n’est jamais envoyé ni conservé.
      </p>

      {message && (
        <p className="mt-6 border-2 border-encre p-4 text-sm font-semibold">
          {message}
        </p>
      )}

      <label className="mt-8 block w-full cursor-pointer rounded-full bg-acide py-4 text-center text-lg font-bold text-encre">
        Choisir mon relevé (CSV)
        <input
          type="file"
          accept=".csv,.txt,text/csv,text/plain"
          className="sr-only"
          onChange={choisirFichier}
        />
      </label>

      <button
        onClick={() => analyser(RELEVE_EXEMPLE, true)}
        className="mt-4 block w-full rounded-full border-2 border-encre py-4 text-center text-lg font-bold"
      >
        Voir avec un exemple
      </button>

      {pied}
    </main>
  );
}
