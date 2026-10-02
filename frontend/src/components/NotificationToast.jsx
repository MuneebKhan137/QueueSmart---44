import { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext";
import "./notifications.css";

// how long toast stays on screen before going away automatically
const toastDuration = 4000;

// most toasts we show at the same time
const maxToasts = 3;

// one single toast, handles its own timer
function ToastItem({ toast, onDismiss }) {
  // start the auto dismiss timer when the toast shows up
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toastDuration);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div className="notif-toast">
      <div className="notif-text">
        <span className="notif-title">{toast.title}</span>
        <span className="notif-message">{toast.message}</span>
      </div>
      <button
        type="button"
        className="notif-toast-close"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(toast.id)}
      >
        {/* x icon */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
          <path d="M18 6 6 18" />
          <path d="M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default function NotificationToast() {
  const { toasts, dismissToast, isBellOpen } = useNotifications();
  const location = useLocation();

  // /admin is the admin side, everything else is user
  // once auth exists this switches to the logged-in user's role instead
  const audience = location.pathname.startsWith("/admin") ? "admin" : "user";

  // show nothing while the bell is open, otherwise only this audience's toasts, and only newest 3
  const visible = useMemo(() => {
    if (isBellOpen) return [];
    return toasts.filter((t) => t.audience === audience).slice(-maxToasts);
  }, [toasts, audience, isBellOpen]);

  // anything not shown gets dismissed
  useEffect(() => {
    const visibleIds = visible.map((t) => t.id);
    toasts
      .filter((t) => !visibleIds.includes(t.id))
      .forEach((t) => dismissToast(t.id));
  }, [toasts, visible, dismissToast]);

  return (
    <div className="notif-toast-stack" role="status" aria-live="polite">
      {visible.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={dismissToast} />
      ))}
    </div>
  );
}