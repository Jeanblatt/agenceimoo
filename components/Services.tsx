"use client";

import { motion } from "framer-motion";
import { Home, Key, TrendingUp, Building2, type LucideIcon } from "lucide-react";

interface Service {
  icon: LucideIcon;
  title: string;
  description: string;
}

// Tableau de données : prêt à être remplacé par une requête Supabase
// (ex. table "services") sans changer le rendu ci-dessous.
export const SERVICES: Service[] = [
  {
    icon: Home,
    title: "Achat immobilier",
    description:
      "Nous vous accompagnons dans la recherche et l'acquisition de votre bien idéal.",
  },
  {
    icon: Key,
    title: "Location immobilière",
    description:
      "Des solutions adaptées pour trouver rapidement un logement ou un local.",
  },
  {
    icon: TrendingUp,
    title: "Investissement immobilier",
    description:
      "Des conseils personnalisés pour optimiser vos projets d'investissement.",
  },
  {
    icon: Building2,
    title: "Gestion immobilière",
    description:
      "Une gestion complète de vos biens avec un suivi professionnel.",
  },
];

export default function Services() {
  return (
    <section id="services-immobiliers" className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-sm uppercase tracking-[0.3em] text-amber-600">
            Ce que nous proposons
          </p>
          <h2 className="mt-3 font-serif text-3xl text-stone-900 sm:text-4xl">
            Nos services immobiliers
          </h2>
          <p className="mt-4 text-base text-stone-600">
            Un accompagnement sur mesure à chaque étape de votre projet, de la
            première visite à la gestion long terme de votre patrimoine.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((service, index) => {
            const Icon = service.icon;
            return (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                whileHover={{ y: -6 }}
                className="group rounded-2xl bg-stone-50 p-8 ring-1 ring-stone-100 transition-shadow duration-300 hover:shadow-xl hover:shadow-stone-900/10"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-stone-950 text-amber-400 transition-colors duration-300 group-hover:bg-amber-500 group-hover:text-stone-950">
                  <Icon className="h-6 w-6" strokeWidth={1.75} />
                </span>
                <h3 className="mt-6 font-serif text-xl text-stone-900">
                  {service.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">
                  {service.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
