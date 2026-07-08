import type { Metadata } from "next";

// La page /admin est un composant client (beaucoup d'état interactif), donc
// les metadata ne peuvent pas y être exportées directement : ce layout
// (Server Component) s'en charge, notamment le noindex indispensable pour
// une zone d'administration.
export const metadata: Metadata = {
  title: "Administration",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
