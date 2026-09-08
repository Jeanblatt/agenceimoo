"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, CalendarCheck, Check, CheckCheck, Star, XCircle } from "lucide-react";
import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type Notification,
} from "@/lib/supabase/notifications";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const typeIcons: Record<Notification["type"], typeof Bell> = {
  visit_confirmed: CalendarCheck,
  visit_cancelled: XCircle,
  review_approved: Star,
};

interface NotificationsViewProps {
  onChanged?: () => void;
}

export default function NotificationsView({ onChanged }: NotificationsViewProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const refresh = useCallback(async () => {
    const { notifications: data, error: fetchError } = await getMyNotifications();
    setNotifications(data);
    setError(fetchError);
  }, []);

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  const handleMarkRead = async (id: string) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id ? { ...notification, isRead: true } : notification
      )
    );
    const { error: markError } = await markNotificationRead(id);
    if (markError) {
      setError(markError);
      await refresh();
      return;
    }
    onChanged?.();
  };

  const handleMarkAll = async () => {
    setMarkingAll(true);
    const { error: markError } = await markAllNotificationsRead();
    setMarkingAll(false);

    if (markError) {
      setError(markError);
      return;
    }

    setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })));
    onChanged?.();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl text-stone-900">Notifications</h1>
          <p className="mt-1 text-sm text-stone-500">
            {unreadCount > 0
              ? `${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""}.`
              : "Vous êtes à jour."}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAll}
            disabled={markingAll}
            className="flex items-center gap-2 rounded-full border border-stone-200 px-5 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:border-amber-500 hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <CheckCheck className="h-4 w-4" strokeWidth={1.75} />
            Tout marquer comme lu
          </button>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Impossible de charger vos notifications : {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-stone-500">Chargement...</p>
      ) : notifications.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-stone-100">
          <Bell className="mx-auto h-8 w-8 text-stone-300" strokeWidth={1.5} />
          <p className="mt-3 text-sm text-stone-500">Vous n&apos;avez aucune notification.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {notifications.map((notification) => {
            const Icon = typeIcons[notification.type] ?? Bell;

            return (
              <li
                key={notification.id}
                className={`flex items-start gap-4 rounded-2xl bg-white p-5 ring-1 transition-colors ${
                  notification.isRead ? "ring-stone-100" : "ring-amber-200"
                }`}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    notification.isRead ? "bg-stone-100 text-stone-400" : "bg-amber-100 text-amber-600"
                  }`}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-sm ${
                        notification.isRead ? "font-medium text-stone-700" : "font-semibold text-stone-900"
                      }`}
                    >
                      {notification.title}
                    </p>
                    {!notification.isRead && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    )}
                  </div>
                  <p className="mt-1 text-sm text-stone-600">{notification.message}</p>
                  <p className="mt-1.5 text-xs text-stone-400">{formatDate(notification.createdAt)}</p>
                </div>

                {!notification.isRead && (
                  <button
                    type="button"
                    onClick={() => handleMarkRead(notification.id)}
                    aria-label="Marquer comme lu"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
                  >
                    <Check className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
