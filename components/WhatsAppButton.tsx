"use client";

import { motion } from "framer-motion";
import { AGENCY } from "@/lib/site";

interface WhatsAppButtonProps {
  /** Utilisé pour pré-remplir le message envoyé à l'agence. */
  propertyTitle?: string;
}

export default function WhatsAppButton({ propertyTitle }: WhatsAppButtonProps) {
  const message = propertyTitle
    ? `Bonjour, je suis intéressé(e) par cette propriété : "${propertyTitle}".`
    : "Bonjour, je suis intéressé(e) par vos biens immobiliers.";

  // Numéro fictif : à remplacer par le numéro WhatsApp du client (format
  // international, chiffres uniquement).
  const whatsappHref = `https://wa.me/${AGENCY.telephone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;

  return (
    <motion.a
      href={whatsappHref}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contacter l'agence sur WhatsApp"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.6, type: "spring", stiffness: 260, damping: 20 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/25"
    >
      <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#25D366]/60" />
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
        <path d="M17.6 6.3A8.9 8.9 0 0 0 3.2 16.5L2 21l4.6-1.2a8.9 8.9 0 0 0 12.9-8A8.9 8.9 0 0 0 17.6 6.3ZM12 19.3a7.3 7.3 0 0 1-3.7-1l-.3-.2-2.7.7.7-2.6-.2-.3a7.4 7.4 0 1 1 6.2 3.4Zm4-5.5c-.2-.1-1.3-.6-1.5-.7-.2-.1-.3-.1-.5.1-.1.2-.5.7-.6.8-.1.1-.2.1-.4 0a6 6 0 0 1-1.8-1.1 6.7 6.7 0 0 1-1.2-1.5c-.1-.2 0-.3.1-.4l.3-.4.2-.3a.4.4 0 0 0 0-.4c-.1-.1-.5-1.2-.7-1.7-.2-.4-.4-.4-.5-.4h-.5a.9.9 0 0 0-.6.3 2.7 2.7 0 0 0-.9 2 4.7 4.7 0 0 0 1 2.5 10.7 10.7 0 0 0 4.1 3.6c.6.2 1 .4 1.4.5.6.2 1.1.1 1.5.1.5-.1 1.3-.5 1.5-1 .2-.5.2-.9.1-1l-.3-.2Z" />
      </svg>
    </motion.a>
  );
}
