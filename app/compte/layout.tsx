import type { Metadata } from "next";

// La page /compte est un composant client (état interactif), donc les
// metadata ne peuvent pas y être exportées directement : ce layout (Server
// Component) s'en charge, notamment le noindex — c'est un espace privé.
export const metadata: Metadata = {
  title: "Mon compte",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CompteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
