"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMyContactMessages, type ContactMessage } from "@/lib/supabase/contactMessages";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function MessagesView() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { messages: data, error: fetchError } = await getMyContactMessages();
      setMessages(data);
      setError(fetchError);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-stone-900">Mes messages</h1>
        <p className="mt-1 text-sm text-stone-500">
          Historique de vos échanges avec l&apos;agence.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Impossible de charger vos messages : {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-stone-500">Chargement...</p>
      ) : messages.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-stone-100">
          <p className="text-sm text-stone-500">
            Vous n&apos;avez pas encore contacté l&apos;agence.{" "}
            <Link href="/contact" className="font-medium text-amber-600 hover:text-amber-700">
              Nous contacter
            </Link>
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-stone-100">
          <ul className="divide-y divide-stone-100">
            {messages.map((message) => (
              <li key={message.id} className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-stone-900">{message.subject}</p>
                  <span className="text-xs text-stone-400">{formatDate(message.createdAt)}</span>
                </div>
                <p className="mt-1.5 text-sm text-stone-600">{message.message}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
