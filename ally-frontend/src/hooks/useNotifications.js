import { useCallback, useEffect, useState } from 'react';
import { notificationService } from '../services/notificationService.js';

export default function useNotifications(token, open) {
  const [inbox, setInbox] = useState(null);
  const [error, setError] = useState('');
  const [marking, setMarking] = useState(false);
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision(value => value + 1), []);

  useEffect(() => {
    if (!token || marking) return;
    const controller = new AbortController();
    let busy = false;
    const load = async () => {
      if (busy) return;
      busy = true;
      try {
        const next = await notificationService.list(token, controller.signal);
        if (!controller.signal.aborted) {
          setInbox(next);
          setError('');
        }
      } catch {
        if (!controller.signal.aborted) setError('Unable to load notifications.');
      } finally {
        busy = false;
      }
    };
    load();
    const timer = window.setInterval(() => { if (!document.hidden) load(); }, 60_000);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [token, open, revision, marking]);

  async function markAllRead() {
    const latestId = inbox?.items[0]?.id;
    if (!latestId || marking) return;
    setMarking(true);
    try {
      await notificationService.markRead(token, latestId);
      setInbox(current => ({ hasUnread: false, items: current.items.map(item => ({ ...item, seen: true })) }));
      setError('');
    } catch {
      setError('Unable to mark notifications as read.');
    } finally {
      setMarking(false);
    }
  }

  return { inbox, loading: Boolean(token && !inbox && !error), error, marking, markAllRead, refresh };
}
