import Link from "next/link";

const benefices = [
  {
    titre: "Classés par coût annuel",
    texte: "Ce qui te coûte le plus sur l’année passe en premier, pas ce qui paraît petit chaque mois.",
  },
  {
    titre: "Une lettre de résiliation prête",
    texte: "Pour chaque abonnement, une lettre déjà rédigée. Tu n’as plus qu’à l’envoyer.",
  },
  {
    titre: "Ton relevé n’est pas conservé",
    texte: "Il est analysé pour te montrer le résultat, puis il n’est pas gardé.",
  },
];

export default function Accueil() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-6 pb-36 pt-10">
      <p className="text-sm font-semibold uppercase tracking-[0.2em]">
        Fantômes
      </p>

      <h1 className="mt-8 font-titre text-5xl font-black leading-[1.05]">
        Trouve les abonnements que tu paies sans t’en servir.
      </h1>

      <p className="mt-5 text-lg leading-relaxed">
        Un essai jamais résilié, un service remplacé, une option activée une
        seule fois. Ils sont petits, donc invisibles. Ils tournent pendant des
        années.
      </p>

      <section className="mt-10 border-2 border-dashed border-encre p-5">
        <p className="text-sm font-semibold uppercase tracking-widest">
          Exemple
        </p>
        <p className="mt-2 font-titre text-4xl font-black">348 € par an</p>
        <p className="mt-2 leading-relaxed">
          Trois abonnements oubliés à 10 €, 13 € et 6 € par mois. Sur un
          relevé, ça ressemble à presque rien.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-titre text-3xl font-black">Ce que tu obtiens</h2>
        <ol className="mt-6 space-y-6">
          {benefices.map((b, i) => (
            <li key={b.titre} className="flex gap-4">
              <span className="font-titre text-3xl font-black">{i + 1}</span>
              <div>
                <p className="text-lg font-bold">{b.titre}</p>
                <p className="mt-1 leading-relaxed">{b.texte}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12 border-2 border-dashed border-encre/40 p-5 text-center">
        <p className="text-sm uppercase tracking-widest">
          Emplacement réservé
        </p>
        <p className="mt-2 leading-relaxed">
          Les premiers témoignages de vrais utilisateurs arriveront ici.
        </p>
      </section>

      <footer className="mt-12 text-sm opacity-70">
        © Fantômes. Mentions légales, conditions de vente et confidentialité à
        venir.
      </footer>

      <div className="fixed inset-x-0 bottom-0 border-t border-encre/10 bg-creme/95 px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto max-w-md">
          <Link
            href="/questionnaire"
            className="block w-full rounded-full bg-acide py-4 text-center text-lg font-bold text-encre"
          >
            Commencer
          </Link>
          <p className="mt-2 text-center text-sm opacity-70">
            Gratuit, deux minutes, sans compte.
          </p>
        </div>
      </div>
    </main>
  );
}
