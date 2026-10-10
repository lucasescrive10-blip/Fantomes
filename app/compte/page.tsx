"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Compte() {
  const [email, setEmail] = useState<string | null>(null);
  const [charge, setCharge] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user.email ?? null);
      setCharge(false);
    });
    const { data: abonnement } = supabase.auth.onAuthStateChange(
      (_evenement, session) => {
        setEmail(session?.user.email ?? null);
        setCharge(false);
      },
    );
    return () => abonnement.subscription.unsubscribe();
  }, []);

  async function deconnecter() {
    await supabase.auth.signOut();
    setEmail(null);
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

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-6 pt-10">
      <p className="text-sm font-semibold uppercase tracking-[0.2em]">
        Fantômes
      </p>
      <h1 className="mt-10 font-titre text-4xl font-black leading-tight">
        Te voilà dedans.
      </h1>
      <p className="mt-5 text-lg leading-relaxed">
        Connecté avec <strong>{email}</strong>.
      </p>

      <section className="mt-8 border-2 border-dashed border-encre p-5">
        <p className="text-sm font-semibold uppercase tracking-widest">
          Bientôt ici
        </p>
        <p className="mt-2 leading-relaxed">
          Le dépôt de ton relevé et la liste de tes fantômes arrivent à la
          prochaine étape.
        </p>
      </section>

      <button
        onClick={deconnecter}
        className="mt-8 self-start text-sm font-semibold underline"
      >
        Me déconnecter
      </button>
    </main>
  );
}
