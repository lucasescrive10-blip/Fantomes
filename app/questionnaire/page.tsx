"use client";

import Link from "next/link";
import { useState } from "react";

type Option = { label: string; valeur: number };
type Question = { texte: string; aide?: string; options: Option[] };

const questions: Question[] = [
  {
    texte: "Combien d’abonnements penses-tu avoir en ce moment ?",
    aide: "Musique, vidéo, applis, sport, logiciels, box…",
    options: [
      { label: "1 à 3", valeur: 2 },
      { label: "4 à 6", valeur: 5 },
      { label: "7 à 10", valeur: 8 },
      { label: "Plus de 10", valeur: 12 },
    ],
  },
  {
    texte: "Et ils te coûtent combien par mois, à ton avis ?",
    options: [
      { label: "Moins de 30 €", valeur: 20 },
      { label: "30 à 60 €", valeur: 45 },
      { label: "60 à 100 €", valeur: 80 },
      { label: "Plus de 100 €", valeur: 120 },
    ],
  },
  {
    texte: "Combien de fois as-tu payé un essai gratuit que tu voulais arrêter ?",
    options: [
      { label: "Jamais", valeur: 0 },
      { label: "Une fois", valeur: 1 },
      { label: "Deux ou trois fois", valeur: 2 },
      { label: "Plus souvent que je voudrais l’admettre", valeur: 3 },
    ],
  },
  {
    texte: "Quand as-tu relu tes prélèvements pour la dernière fois ?",
    options: [
      { label: "Ce mois-ci", valeur: 0 },
      { label: "Il y a quelques mois", valeur: 1 },
      { label: "Il y a plus d’un an", valeur: 2 },
      { label: "Jamais vraiment", valeur: 3 },
    ],
  },
  {
    texte: "Combien de ces abonnements n’ouvres-tu presque plus ?",
    options: [
      { label: "aucun", valeur: 0 },
      { label: "1", valeur: 1 },
      { label: "2 ou 3", valeur: 3 },
      { label: "4 ou plus", valeur: 5 },
    ],
  },
  {
    texte: "Si tu récupérais cet argent, il servirait à quoi ?",
    options: [
      { label: "À souffler en fin de mois", valeur: 0 },
      { label: "À le mettre de côté", valeur: 1 },
      { label: "À un voyage", valeur: 2 },
      { label: "À autre chose", valeur: 3 },
    ],
  },
];

export default function Questionnaire() {
  const [reponses, setReponses] = useState<Option[]>([]);
  const etape = reponses.length;
  const termine = etape >= questions.length;

  function choisir(option: Option) {
    const suite = [...reponses, option];
    setReponses(suite);
    if (suite.length >= questions.length) {
      try {
        sessionStorage.setItem("fantomes-reponses", JSON.stringify(suite));
      } catch {}
    }
  }

  function retour() {
    setReponses(reponses.slice(0, -1));
  }

  if (termine) {
    const nb = reponses[0].valeur;
    const depense = reponses[1].valeur;
    const inutilises = reponses[4].valeur;
    const actifs = Math.min(inutilises, nb);
    const mensuel = Math.round((depense / nb) * actifs);
    const annuel = mensuel * 12;

    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col px-6 pb-40 pt-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em]">
          Ton calcul
        </p>

        <p className="mt-6 leading-relaxed opacity-80">
          Tu as dit : {reponses[0].label} abonnements, {reponses[1].label} par
          mois, dont {reponses[4].label} que tu n’ouvres presque plus.
        </p>

        {annuel > 0 ? (
          <>
            <p className="mt-10 font-titre text-6xl font-black leading-none">
              {annuel.toLocaleString("fr-FR")} €
              <span className="block text-3xl">par an</span>
            </p>
            <p className="mt-6 text-lg leading-relaxed">
              Soit environ {mensuel.toLocaleString("fr-FR")} € par mois pour des
              services que tu n’ouvres presque plus. Sur 5 ans, ça fait{" "}
              {(annuel * 5).toLocaleString("fr-FR")} €.
            </p>
            <p className="mt-6 border-2 border-dashed border-encre/40 p-4 text-sm leading-relaxed">
              Estimation d’après tes réponses. Ton relevé donnera le chiffre
              exact, abonnement par abonnement.
            </p>
          </>
        ) : (
          <>
            <p className="mt-10 font-titre text-4xl font-black leading-tight">
              Tu n’en vois aucun. C’est justement le principe d’un fantôme.
            </p>
            <p className="mt-6 text-lg leading-relaxed">
              Ce qu’on ne voit pas, on ne le résilie pas. Dépose ton relevé :
              on le relit ligne par ligne pour toi.
            </p>
          </>
        )}

        <div className="fixed inset-x-0 bottom-0 border-t border-encre/10 bg-creme/95 px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <div className="mx-auto max-w-md">
            <Link
              href="/connexion"
              className="block w-full rounded-full bg-acide py-4 text-center text-lg font-bold text-encre"
            >
              Voir mes vrais fantômes
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const q = questions[etape];

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-6 pb-10 pt-6">
      <div className="flex items-center justify-between">
        {etape > 0 ? (
          <button
            onClick={retour}
            className="py-2 pr-4 text-sm font-semibold underline"
          >
            Retour
          </button>
        ) : (
          <Link href="/" className="py-2 pr-4 text-sm font-semibold underline">
            Accueil
          </Link>
        )}
        <p className="text-sm opacity-70">
          Question {etape + 1} sur {questions.length}
        </p>
      </div>

      <div className="mt-3 h-2 w-full rounded-full bg-encre/10">
        <div
          className="h-2 rounded-full bg-encre"
          style={{ width: `${(etape / questions.length) * 100}%` }}
        />
      </div>

      <h1 className="mt-10 font-titre text-3xl font-black leading-tight">
        {q.texte}
      </h1>
      {q.aide && <p className="mt-3 opacity-70">{q.aide}</p>}

      <div className="mt-8 space-y-3">
        {q.options.map((option) => (
          <button
            key={option.label}
            onClick={() => choisir(option)}
            className="block min-h-14 w-full rounded-2xl border-2 border-encre px-5 py-3 text-left text-lg font-semibold active:bg-acide"
          >
            {option.label}
          </button>
        ))}
      </div>
    </main>
  );
}
