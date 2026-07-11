"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import type { Review } from "@/lib/supabase/reviews";

interface TestimonialsProps {
  reviews: Review[];
}

function initialsOf(name: string) {
  return name.slice(0, 2).toUpperCase();
}

export default function Testimonials({ reviews }: TestimonialsProps) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  // Rien à afficher tant qu'aucun avis n'a été validé par l'admin.
  if (reviews.length === 0) return null;

  const goTo = (nextIndex: number, dir: number) => {
    setDirection(dir);
    setIndex((nextIndex + reviews.length) % reviews.length);
  };

  const review = reviews[index];

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
                key={review.id}
                custom={direction}
                initial={{ opacity: 0, x: direction * 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -40 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="rounded-2xl bg-white p-8 text-center ring-1 ring-stone-100 sm:p-12"
              >
                <span className="relative mx-auto flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-stone-950 font-serif text-lg text-amber-400">
                  {review.clientPhoto ? (
                    <Image
                      src={review.clientPhoto}
                      alt={review.clientName}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : (
                    initialsOf(review.clientName)
                  )}
                </span>

                <div className="mt-4 flex justify-center gap-1">
                  {Array.from({ length: review.rating }).map((_, starIndex) => (
                    <Star
                      key={starIndex}
                      className="h-4 w-4 fill-amber-500 text-amber-500"
                    />
                  ))}
                </div>

                <p className="mt-5 font-serif text-xl leading-relaxed text-stone-800 sm:text-2xl">
                  &laquo; {review.comment} &raquo;
                </p>

                <p className="mt-6 text-sm font-medium uppercase tracking-wider text-stone-900">
                  {review.clientName}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {reviews.length > 1 && (
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
                {reviews.map((item, dotIndex) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => goTo(dotIndex, dotIndex > index ? 1 : -1)}
                    aria-label={`Voir le témoignage de ${item.clientName}`}
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
          )}
        </div>
      </div>
    </section>
  );
}
