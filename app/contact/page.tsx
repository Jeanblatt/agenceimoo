import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";
import WhatsAppButton from "@/components/WhatsAppButton";
import { AGENCY } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contactez Horizon Immobilier pour organiser une visite, demander une estimation ou obtenir des renseignements sur nos biens d'exception.",
};

const SUBJECT_LABELS: Record<string, string> = {
  estimation: "Estimation de bien",
  information: "Renseignements généraux",
};

interface ContactPageProps {
  searchParams: Promise<{ subject?: string; property?: string }>;
}

const contactInfo = [
  {
    label: "Adresse",
    value: `${AGENCY.address.streetAddress}, ${AGENCY.address.postalCode} ${AGENCY.address.addressLocality}`,
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
    value: AGENCY.telephoneDisplay,
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
    value: AGENCY.email,
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
    value: "Lun–Ven 9h–19h · Sam 10h–17h",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3.5 2" />
      </>
    ),
  },
];

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const params = await searchParams;
  const defaultSubject = params.subject ? SUBJECT_LABELS[params.subject] : undefined;
  const defaultMessage = params.property
    ? `Je suis intéressé(e) par : ${params.property}`
    : undefined;

  return (
    <>
      <Navbar />

      <main>
        <section className="bg-stone-950 pb-16 pt-40 text-center">
          <div className="mx-auto max-w-2xl px-6">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-500 sm:text-sm sm:tracking-[0.3em]">
              Horizon Immobilier
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
                Depuis 2010, Horizon Immobilier accompagne une clientèle
                exigeante dans l&apos;achat, la vente et l&apos;estimation de
                biens d&apos;exception partout en Tunisie. Chaque demande est
                suivie par un conseiller dédié, du premier échange jusqu&apos;à
                la signature.
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
