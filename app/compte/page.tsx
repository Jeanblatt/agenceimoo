"use client";

import { useCallback, useEffect, useState } from "react";
import ClientShell from "@/components/compte/ClientShell";
import ProfileView from "@/components/compte/ProfileView";
import FavoritesView from "@/components/compte/FavoritesView";
import VisitsView from "@/components/compte/VisitsView";
import MessagesView from "@/components/compte/MessagesView";
import ReviewsView from "@/components/compte/ReviewsView";
import NotificationsView from "@/components/compte/NotificationsView";
import type { ClientView } from "@/components/compte/ClientSidebar";
import { useSession } from "@/lib/supabase/auth";
import { getMyNotifications } from "@/lib/supabase/notifications";

export default function ComptePage() {
  const session = useSession();
  const [view, setView] = useState<ClientView>("profile");
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    const { notifications } = await getMyNotifications();
    setUnreadCount(notifications.filter((notification) => !notification.isRead).length);
  }, []);

  useEffect(() => {
    if (!session) return;
    (async () => {
      const { notifications } = await getMyNotifications();
      setUnreadCount(notifications.filter((notification) => !notification.isRead).length);
    })();
  }, [session]);

  return (
    <ClientShell activeView={view} onNavigate={setView} unreadCount={unreadCount}>
      {session && (
        <>
          {view === "profile" && <ProfileView session={session} />}
          {view === "favorites" && <FavoritesView />}
          {view === "visits" && <VisitsView />}
          {view === "messages" && <MessagesView />}
          {view === "reviews" && <ReviewsView session={session} />}
          {view === "notifications" && <NotificationsView onChanged={refreshUnreadCount} />}
        </>
      )}
    </ClientShell>
  );
}
