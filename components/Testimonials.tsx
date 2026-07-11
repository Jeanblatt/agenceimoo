"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

interface Testimonial {
  name: string;
  role: string;
  rating: number;
  comment: string;
  initials: string;
}

// Tableau de données : prêt à être remplacé par une requête Supabase
// (ex. table "temoignages") sans changer le rendu ci-dessous.
export const TESTIMONIALS: Testimonial[] = [
  {
    name: "Sami Ben Youssef",
    role: "Acquéreur, Villa à Gammarth",
    rating: 5,
    comment:
      "Une équipe très professionnelle, accompagnement parfait jusqu'à la signature.",
    initials: "SB",
  },
  {
    name: "Amira Trabelsi",
    role: "Locataire, Appartement à La Marsa",
    rating: 5,
    comment:
      "Grâce à l'agence, nous avons trouvé notre appartement rapidement.",
    initials: "AT",
  },
  {
    name: "Karim Fendri",
    role: "Investisseur, Sousse",
    rating: 5,
    comment:
      "Des conseils précis et une vraie connaissance du marché tunisien. Je recommande sans hésiter.",
    initials: "KF",
  },
];

export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const goTo = (nextIndex: number, dir: number) => {
    setDirection(dir);
    setIndex((nextIndex + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  const testimonial = TESTIMONIALS[index];

  return (
    <section className="bg-stone-50 py-24">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-sm uppercase tracking-[0.3em] text-amber-600">
            Témoignages
          </p>
          <h2 className="mt-3 font-serif text-3xl text-stone-900 sm:text-4xl">
            Ce que disent nos clients
          </h2>
        </motion.div>

        <div className="relative mt-14">
          <div className="overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={testimonial.name}
                custom={direction}
                initial={{ opacity: 0, x: direction * 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -40 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="rounded-2xl bg-white p-8 text-center ring-1 ring-stone-100 sm:p-12"
              >
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-stone-950 font-serif text-lg text-amber-400">
                  {testimonial.initials}
                </span>

                <div className="mt-4 flex justify-center gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, starIndex) => (
                    <Star
                      key={starIndex}
                      className="h-4 w-4 fill-amber-500 text-amber-500"
                    />
                  ))}
                </div>

                <p className="mt-5 font-serif text-xl leading-relaxed text-stone-800 sm:text-2xl">
                  &laquo; {testimonial.comment} &raquo;
                </p>

                <p className="mt-6 text-sm font-medium uppercase tracking-wider text-stone-900">
                  {testimonial.name}
                </p>
                <p className="mt-1 text-xs text-stone-500">{testimonial.role}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => goTo(index - 1, -1)}
              aria-label="Témoignage précédent"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-stone-300 text-stone-600 transition-colors hover:border-amber-500 hover:text-amber-600"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="flex gap-1">
              {TESTIMONIALS.map((item, dotIndex) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => goTo(dotIndex, dotIndex > index ? 1 : -1)}
                  aria-label={`Voir le témoignage de ${item.name}`}
                  aria-current={dotIndex === index}
                  className="flex h-6 w-6 items-center justify-center"
                >
                  <span
                    className={`h-2 w-2 rounded-full transition-colors ${
                      dotIndex === index ? "bg-amber-500" : "bg-stone-300"
                    }`}
                  />
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => goTo(index + 1, 1)}
              aria-label="Témoignage suivant"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-stone-300 text-stone-600 transition-colors hover:border-amber-500 hover:text-amber-600"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
