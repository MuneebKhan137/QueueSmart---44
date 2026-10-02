import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext";
import "./notifications.css";

// turns a date into "just now", "X min ago", "X hr ago" or "X days ago"
const timeAgo = (date, now) => {
  // difference in whole minutes between now and when it was created
  const minutes = Math.floor((now - date) / 60000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;

  const days = Math.floor(hours / 24);
  return days === 1 ? "1 day ago" : `${days} days ago`;
};

export default function NotificationBell() {
  // open state comes from context so toasts can hide while the dropdown is open
  const {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    isBellOpen: isOpen,
    setIsBellOpen: setIsOpen,
  } = useNotifications();
  const location = useLocation();

  // current time, refreshed every 30 seconds while open
  const [now, setNow] = useState(() => new Date());

  // wraps the bell and the dropdown
  const wrapperRef = useRef(null);
  const buttonRef = useRef(null);

  // anything under /admin is the admin side, everything else is the user side
  // once auth exists this switches to the logged in user's role instead
  const audience = location.pathname.startsWith("/admin") ? "admin" : "user";

  const items = getNotifications(audience);
  const unreadCount = getUnreadCount(audience);

  // badge text
  const badgeText = unreadCount > 9 ? "9+" : String(unreadCount);

  const bellLabel = unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications, no unread";

  // close the dropdown when we go to another page
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname, setIsOpen]);

  // close on outside click or escape
  useEffect(() => {
    if (!isOpen) return;

    // if the click landed outside the wrapper, close it
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    // escape closes it and puts focus back on the bell
    const handleKey = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);

    // update the time right away and then every 30 seconds
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 30000);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
      clearInterval(timer);
    };
  }, [isOpen, setIsOpen]);

  return (
    <div className="notif-wrapper" ref={wrapperRef}>
      <button
        type="button"
        ref={buttonRef}
        className="notif-bell"
        aria-label={bellLabel}
        aria-expanded={isOpen}
        aria-haspopup="true"
        onClick={() => setIsOpen((open) => !open)}
      >
        {/* simple bell outline */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {/* only show the badge if something is unread */}
        {unreadCount > 0 && (
          <span className="notif-badge" aria-hidden="true">
            {badgeText}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <span className="notif-heading">Notifications</span>
            <button
              type="button"
              className="notif-mark-all"
              onClick={() => markAllAsRead(audience)}
              disabled={unreadCount === 0}
            >
              Mark all as read
            </button>
          </div>

          {items.length === 0 ? (
            <p className="notif-empty">No notifications yet</p>
          ) : (
            <ul className="notif-list">
              {items.map((n) => (
                <li key={n.id}>
                  {/* clicking an item marks it read */}
                  <button
                    type="button"
                    className={n.read ? "notif-item" : "notif-item notif-unread"}
                    onClick={() => markAsRead(n.id)}
                  >
                    {/* blue dot only for unread ones */}
                    <span className="notif-dot" aria-hidden="true" />
                    <span className="notif-text">
                      <span className="notif-title">
                        {n.title}
                        {!n.read && <span className="notif-sr-only"> (unread)</span>}
                      </span>
                      <span className="notif-message">{n.message}</span>
                      <span className="notif-time">{timeAgo(n.createdAt, now)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}