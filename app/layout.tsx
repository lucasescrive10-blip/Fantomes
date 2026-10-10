import type { Metadata } from "next";
import { Fraunces, Instrument_Sans } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["600", "900"],
  variable: "--font-fraunces",
  display: "swap",
});

const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

const titre = "Fantômes — Débusque les abonnements que tu paies sans t'en servir";
const description =
  "Dépose ton relevé, découvre les prélèvements oubliés et résilie-les avec une lettre toute prête.";

export const metadata: Metadata = {
  title: titre,
  description,
  openGraph: {
    title: titre,
    description,
    locale: "fr_FR",
    type: "website",
    siteName: "Fantômes",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${instrument.variable}`}>
      <body>{children}</body>
    </html>
  );
}
