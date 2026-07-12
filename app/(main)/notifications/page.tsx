'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/button';

interface Notification {
  id: string;
  type: 'follow' | 'like' | 'comment' | 'mention' | 'system';
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  created_at: string;
  actor: { username: string; avatar_url: string | null } | null;
}

function describe(notification: Notification): string {
  const actor = notification.actor?.username ?? 'Someone';
  switch (notification.type) {
    case 'follow':
      return `${actor} started following you`;
    case 'like':
      return `${actor} liked your recipe`;
    case 'comment':
      return `${actor} commented on your recipe`;
    case 'mention':
      return `${actor} mentioned you`;
    default:
      return 'New notification';
  }
}

function linkFor(notification: Notification): string {
  if (notification.entity_type === 'recipe' && notification.entity_id) {
    return `/recipes/${notification.entity_id}`; // recipe detail also accepts an id, not just slug
  }
  if (notification.entity_type === 'profile' && notification.actor) {
    return `/profile/${notification.actor.username}`;
  }
  return '/feed';
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ notifications: Notification[] }>('/v1/notifications');
      setNotifications(data.notifications);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load notifications');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function markRead(id: string) {
    setNotifications((current) => current.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    try {
      await apiFetch(`/v1/notifications/${id}/read`, { method: 'PATCH' });
    } catch {
      /* the read-state is cosmetic here — a failed mark-as-read isn't worth
         surfacing an error for for a first pass */
    }
  }

  async function markAllRead() {
    setNotifications((current) => current.map((n) => ({ ...n, is_read: true })));
    try {
      await apiFetch('/v1/notifications/read-all', { method: 'POST' });
    } catch {
      /* same as above */
    }
  }

  const hasUnread = notifications.some((n) => !n.is_read);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Notifications</h1>
        {hasUnread && (
          <Button variant="secondary" size="sm" onClick={markAllRead}>
            Mark all read
          </Button>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-chili">
          {error}
        </p>
      )}

      {isLoading && <p className="mt-6 text-sm">Loading…</p>}

      {!isLoading && notifications.length === 0 && (
        <p className="mt-6 text-sm text-[#241E1A]/60 dark:text-flour/60">
          Nothing yet — likes, comments, and new followers will show up here.
        </p>
      )}

      <ul className="mt-4 divide-y divide-copper/15">
        {notifications.map((notification) => (
          <li key={notification.id}>
            <Link
              href={linkFor(notification)}
              onClick={() => !notification.is_read && markRead(notification.id)}
              className="flex items-center justify-between gap-3 py-3 text-sm"
            >
              <span className={notification.is_read ? 'text-[#241E1A]/60 dark:text-flour/60' : ''}>
                {describe(notification)}
              </span>
              <span className="flex shrink-0 items-center gap-2">
                {!notification.is_read && <span className="h-2 w-2 rounded-full bg-chili" />}
                <span className="font-mono text-xs text-[#241E1A]/50 dark:text-flour/50">
                  {new Date(notification.created_at).toLocaleDateString()}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
