import type { Metadata } from "next";
import Navbar from "@/components/NavbarServer";
import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";
import WhatsAppButton from "@/components/WhatsAppButtonServer";
import { content } from "@/config/content";
import { resolveAgencySettings } from "@/lib/supabase/agencySettings";

export const metadata: Metadata = {
  title: "Contact",
  description: content.contact.metaDescription,
};

const SUBJECT_LABELS: Record<string, string> = {
  estimation: "Estimation de bien",
  information: "Renseignements généraux",
};

interface ContactPageProps {
  searchParams: Promise<{ subject?: string; property?: string }>;
}

// Icônes fixes par ligne de contact ; les valeurs affichées sont résolues
// à l'exécution (voir buildContactInfo) — plus de dépendance directe à
// config/agency.ts ici.
function buildContactInfo(settings: Awaited<ReturnType<typeof resolveAgencySettings>>) {
  return [
    {
      label: "Adresse",
      value: `${settings.address.street}, ${settings.address.postalCode} ${settings.address.city}`,
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21Z"
        />
      ),
    },
    {
      label: "Téléphone",
      value: settings.phoneDisplay,
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 5c0-.6.4-1 1-1h3l2 5-2 1.5a11 11 0 0 0 5.5 5.5L15 14l5 2v3c0 .6-.4 1-1 1A15 15 0 0 1 4 5Z"
        />
      ),
    },
    {
      label: "Email",
      value: settings.email,
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 6h16v12H4V6Zm0 0 8 7 8-7"
        />
      ),
    },
    {
      label: "Horaires",
      value: settings.hours,
      icon: (
        <>
          <circle cx="12" cy="12" r="9" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3.5 2" />
        </>
      ),
    },
  ];
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const params = await searchParams;
  const defaultSubject = params.subject ? SUBJECT_LABELS[params.subject] : undefined;
  const defaultMessage = params.property
    ? `Je suis intéressé(e) par : ${params.property}`
    : undefined;
  const settings = await resolveAgencySettings();
  const contactInfo = buildContactInfo(settings);

  return (
    <>
      <Navbar />

      <main>
        <section className="bg-stone-950 pb-16 pt-40 text-center">
          <div className="mx-auto max-w-2xl px-6">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-500 sm:text-sm sm:tracking-[0.3em]">
              {settings.name}
            </p>
            <h1 className="mt-4 font-serif text-4xl text-white sm:text-5xl">
              Contactez-nous
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-stone-300">
              Une question, un projet de visite ou d&apos;estimation ? Notre
              équipe vous répond sous 24h.
            </p>
          </div>
        </section>

        <section className="bg-white py-20">
          <div className="mx-auto grid max-w-6xl gap-16 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div>
              <h2 className="font-serif text-2xl text-stone-900">
                Une agence à votre écoute
              </h2>
              <p className="mt-4 leading-relaxed text-stone-600">
                {content.contact.intro(settings.name, settings.foundedYear)}
              </p>

              <ul className="mt-10 space-y-6">
                {contactInfo.map((item) => (
                  <li key={item.label} className="flex items-start gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-700">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        className="h-5 w-5"
                      >
                        {item.icon}
                      </svg>
                    </span>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-stone-500">
                        {item.label}
                      </p>
                      <p className="mt-0.5 text-sm text-stone-900">{item.value}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl bg-stone-50 p-6 ring-1 ring-stone-100 sm:p-10">
              <ContactForm
                defaultSubject={defaultSubject}
                defaultMessage={defaultMessage}
                agencyShortName={settings.shortName}
              />
            </div>
          </div>
        </section>
      </main>

      <WhatsAppButton />
      <Footer />
    </>
  );
}
