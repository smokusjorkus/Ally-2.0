import { Bell, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const titles = {
  CASE_SUBMITTED: 'New case submitted',
  CASE_ACCEPTED: 'Case accepted',
  CASE_DECLINED: 'Case declined',
  CASE_COMPLETED: 'Case completed',
  APPOINTMENT_PROPOSED: 'Appointment proposed',
  APPOINTMENT_UPDATED: 'Appointment updated',
  APPOINTMENT_CONFIRMED: 'Appointment confirmed',
  APPOINTMENT_REMOVED: 'Appointment removed',
};

const dateFormat = new Intl.DateTimeFormat('en-PH', {
  timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short',
});

export default function NotificationDropdown({ onClose, approvalStatus, inbox, loading, error, marking, markAllRead, refresh }) {
  const items = inbox?.items || [];

  return (
    <section id="notification-inbox" aria-labelledby="notification-heading"
      className="fixed inset-x-4 top-16 z-50 rounded-lg border border-gray-200 bg-white shadow-lg sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80">
      <div className="flex items-center justify-between gap-2 border-b border-gray-200 p-4">
        <h3 id="notification-heading" className="font-semibold text-gray-900">Notifications</h3>
        <button type="button" onClick={onClose} aria-label="Close notifications" className="text-gray-500 hover:text-gray-700">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="max-h-[calc(100dvh-9rem)] space-y-2 overflow-y-auto p-3 sm:max-h-96">
        {inbox?.hasUnread && (
          <button type="button" onClick={markAllRead} disabled={marking}
            className="mb-1 px-2 text-sm font-medium text-blue-700 hover:underline disabled:opacity-50">Mark all as read</button>
        )}
        {approvalStatus && (
          <Link to="/settings" onClick={onClose} className="block rounded-md bg-amber-50 p-3 text-sm text-amber-900 hover:bg-amber-100">
            {approvalStatus === 'pending' ? 'Your lawyer account is pending approval.' : 'Your lawyer account was rejected.'}
          </Link>
        )}
        {error && (
          <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error} <button type="button" onClick={refresh} className="font-medium underline">Retry</button>
          </div>
        )}
        {loading && <p role="status" className="p-4 text-center text-sm text-gray-500">Loading notifications…</p>}
        {!loading && !error && !items.length && !approvalStatus && (
          <div className="p-6 text-center text-sm text-gray-500">
            <Bell aria-hidden="true" className="mx-auto mb-2 h-7 w-7 text-gray-400" />
            No notifications yet
          </div>
        )}
        {items.map(item => (
          <Link key={item.id} to={`/workspace?caseId=${item.caseId}&tab=${item.type.startsWith('APPOINTMENT_') ? 'hearings' : 'overview'}`}
            onClick={onClose} className={`block rounded-md p-3 text-sm hover:bg-blue-100 ${item.seen ? 'bg-gray-50' : 'bg-blue-50'}`}>
            <p className="font-medium text-gray-900">{titles[item.type] || 'Case update'}{!item.seen && <span className="sr-only"> (unread)</span>}</p>
            <p className="mt-1 text-xs text-gray-600">Case #{item.caseId} · {dateFormat.format(new Date(item.createdAt))}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
