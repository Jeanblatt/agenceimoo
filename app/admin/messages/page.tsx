"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import MessagesTable from "@/components/admin/MessagesTable";
import type { AdminView } from "@/components/admin/AdminSidebar";
import {
  deleteContactMessage,
  getContactMessages,
  markContactMessageAsRead,
  type ContactMessage,
} from "@/lib/supabase/contactMessages";

interface Feedback {
  type: "success" | "error";
  message: string;
}

export default function AdminMessagesPage() {
  const router = useRouter();

  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const refreshMessages = useCallback(async () => {
    const { messages: data, error } = await getContactMessages();
    if (error) {
      setLoadError(error);
      return;
    }
    setLoadError(null);
    setMessages(data);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await refreshMessages();
      setLoading(false);
    })();
  }, [refreshMessages]);

  useEffect(() => {
    if (!feedback) return;
    const timeout = setTimeout(() => setFeedback(null), 5000);
    return () => clearTimeout(timeout);
  }, [feedback]);

  const handleNavigate = (nextView: AdminView) => {
    if (nextView === "messages") return;
    // Les autres vues appartiennent au tableau de bord principal.
    router.push("/admin");
  };

  const handleMarkAsRead = async (id: string) => {
    const { error } = await markContactMessageAsRead(id);
    if (error) {
      console.error("Échec du marquage comme lu :", error);
      setFeedback({ type: "error", message: `L'action a échoué : ${error}` });
      return;
    }
    await refreshMessages();
    setFeedback({ type: "success", message: "Le message a été marqué comme lu." });
  };

  const handleDelete = async (id: string) => {
    const { error } = await deleteContactMessage(id);
    if (error) {
      console.error("Échec de la suppression du message :", error);
      setFeedback({ type: "error", message: `La suppression a échoué : ${error}` });
      return;
    }
    await refreshMessages();
    setFeedback({ type: "success", message: "Le message a été supprimé." });
  };

  const newCount = messages.filter((message) => message.status === "new").length;

  return (
    <AdminShell activeView="messages" onNavigate={handleNavigate}>
      {feedback && (
        <div
          className={`mb-6 rounded-lg px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {feedback.message}
        </div>
      )}

      {loadError && (
        <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Impossible de charger les messages : {loadError}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl text-stone-900">Messages</h1>
          <p className="mt-1 text-sm text-stone-500">
            {loading
              ? "Chargement..."
              : `${messages.length} message${messages.length !== 1 ? "s" : ""} au total, dont ${newCount} nouveau${newCount !== 1 ? "x" : ""}.`}
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-stone-500">Chargement des messages...</p>
        ) : (
          <MessagesTable
            messages={messages}
            onMarkAsRead={handleMarkAsRead}
            onDelete={handleDelete}
          />
        )}
      </div>
    </AdminShell>
  );
}
