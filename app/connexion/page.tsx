"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Etat = "attente" | "envoi" | "envoye" | "erreur";

export default function Connexion() {
  const [email, setEmail] = useState("");
  const [etat, setEtat] = useState<Etat>("attente");

  async function envoyer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEtat("envoi");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/compte` },
    });
    setEtat(error ? "erreur" : "envoye");
  }

  if (etat === "envoye") {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col px-6 pt-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em]">
          Fantômes
        </p>
        <h1 className="mt-10 font-titre text-4xl font-black leading-tight">
          Regarde ta boîte mail.
        </h1>
        <p className="mt-5 text-lg leading-relaxed">
          On a envoyé un lien de connexion à <strong>{email.trim()}</strong>.
          Touche-le pour entrer, c’est tout.
        </p>
        <p className="mt-4 leading-relaxed opacity-70">
          Rien reçu au bout d’une minute ? Regarde dans les courriers
          indésirables.
        </p>
        <button
          onClick={() => setEtat("attente")}
          className="mt-8 self-start text-sm font-semibold underline"
        >
          Changer d’adresse
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-6 pt-10">
      <p className="text-sm font-semibold uppercase tracking-[0.2em]">
        Fantômes
      </p>
      <h1 className="mt-10 font-titre text-4xl font-black leading-tight">
        Où t’envoyer ton lien ?
      </h1>
      <p className="mt-5 text-lg leading-relaxed">
        Pas de mot de passe à retenir : tu reçois un lien par email, tu le
        touches, tu es dedans.
      </p>

      <form onSubmit={envoyer} className="mt-8">
        <label htmlFor="email" className="text-sm font-semibold">
          Ton adresse email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="toi@exemple.fr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-2 block w-full rounded-2xl border-2 border-encre bg-white px-5 py-4 text-lg"
        />

        {etat === "erreur" && (
          <p className="mt-3 text-sm font-semibold">
            Impossible d’envoyer le lien. Vérifie l’adresse, puis réessaie dans
            une minute.
          </p>
        )}

        <button
          type="submit"
          disabled={etat === "envoi"}
          className="mt-6 block w-full rounded-full bg-acide py-4 text-center text-lg font-bold text-encre disabled:opacity-60"
        >
          {etat === "envoi" ? "Envoi en cours…" : "Recevoir mon lien"}
        </button>
      </form>

      <Link href="/" className="mt-8 text-sm font-semibold underline">
        Retour à l’accueil
      </Link>
    </main>
  );
}
