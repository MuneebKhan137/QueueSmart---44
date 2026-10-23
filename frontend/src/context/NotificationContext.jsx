import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { apiGet, apiPatch } from "../api";
import NotificationToast from "../components/NotificationToast";

// context, starts as null so hook can tell if there's no provider
const NotificationContext = createContext(null);

const audiences = ["admin", "user"];

// how often to ask the backend for new notifications
const pollMs = 5000;

// helper to check that something is a string with text
const isNonEmptyString = (value) => typeof value === "string" && value.trim() !== "";

const toClient = (n) => ({ ...n, createdAt: new Date(n.createdAt) });

const toToast = ({ id, audience, title, message }) => ({ id, audience, title, message });

// who is signed in
const storedUser = () => {
  try {
    return JSON.parse(localStorage.getItem("queuesmart.user"));
  } catch {
    return null;
  }
};

export function NotificationProvider({ children }) {
  const location = useLocation();

  const audience = location.pathname.startsWith("/admin") ? "admin" : "user";

  const [serverNotes, setServerNotes] = useState([]);

  const [localNotes, setLocalNotes] = useState([]);
  const nextLocalId = useRef(-1);

  // toasts kept separate so dismissing a toast doesn't delete notification from list
  const [toasts, setToasts] = useState([]);

  // whether the bell dropdown is open
  const [isBellOpen, setIsBellOpen] = useState(false);

  const seen = useRef({ key: null, ids: new Set() });

  const requestCount = useRef(0);

  const isDown = useRef(false);

  const fetchNotifications = useCallback(async () => {
    const user = storedUser();

    if (audience === "admin" && user?.role !== "admin") return;

    const request = ++requestCount.current;
    // switching users starts fresh
    const key = `${audience}:${user?.id ?? null}`;

    try {
      const data = await apiGet(`/notifications?audience=${audience}`);
      if (request !== requestCount.current) return;

      const list = data.notifications.map(toClient);

      // toast only what's new since the last fetch
      if (seen.current.key === key) {
        const fresh = list.filter((n) => !seen.current.ids.has(n.id));
        if (fresh.length > 0) setToasts((prev) => [...prev, ...fresh.map(toToast)]);
      }
      seen.current = { key, ids: new Set(list.map((n) => n.id)) };

      setServerNotes(list);
      isDown.current = false;
    } catch (err) {
      if (request !== requestCount.current) return;

      // keep the last list we had
      if (!isDown.current) {
        console.warn("Couldn't load notifications, will keep trying:", err.message);
        isDown.current = true;
      }
    }
  }, [audience]);

  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(fetchNotifications, pollMs);

    return () => {
      clearInterval(timer);
      requestCount.current += 1;
    };
  }, [fetchNotifications]);

  const notifications = [...localNotes, ...serverNotes];

  // returns one audience's notifications, newest first
  const getNotifications = (audience) => {
    return notifications
      .filter((n) => n.audience === audience)
      .sort((a, b) => b.createdAt - a.createdAt);
  };

  // how many unread ones that audience has
  const getUnreadCount = (audience) => {
    return notifications.filter((n) => n.audience === audience && !n.read).length;
  };

  const addNotification = ({ audience, type, title, message }) => {
    // check if anything is wrong
    if (!audiences.includes(audience)) {
      console.warn("addNotification: audience must be \"admin\" or \"user\", got:", audience);
      return;
    }
    if (!isNonEmptyString(title) || !isNonEmptyString(message)) {
      console.warn("addNotification: title and message must be non-empty strings");
      return;
    }

    const id = nextLocalId.current;
    nextLocalId.current -= 1;

    const newNotification = {
      id,
      audience,
      type,
      title,
      message,
      createdAt: new Date(),
      read: false,
    };

    setLocalNotes((prev) => [newNotification, ...prev]);
    setToasts((prev) => [...prev, toToast(newNotification)]);
  };

  // mark a single notification as read, keep rest the same
  const markAsRead = async (id) => {
    if (id < 0) {
      setLocalNotes((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      return;
    }

    requestCount.current += 1;
    try {
      const { notification } = await apiPatch(`/notifications/${id}/read`);
      setServerNotes((prev) => prev.map((n) => (n.id === id ? toClient(notification) : n)));
    } catch (err) {
      console.warn("Couldn't mark notification as read:", err.message);
    }
  };

  // mark every notification for one audience as read
  const markAllAsRead = async (audience) => {
    setLocalNotes((prev) => prev.map((n) => (n.audience === audience ? { ...n, read: true } : n)));

    requestCount.current += 1;
    try {
      await apiPatch(`/notifications/read-all?audience=${audience}`);
      setServerNotes((prev) => prev.map((n) => (n.audience === audience ? { ...n, read: true } : n)));
    } catch (err) {
      console.warn("Couldn't mark notifications as read:", err.message);
    }
  };

  // remove toast from screen
  // useCallback keeps it the same function every render
  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // the backend creates these notifications
  // the call can be removed once that page uses the API
  const notifyNewSignup = () => fetchNotifications();
  const notifyQueuePosition = () => fetchNotifications();
  const notifyStatusChange = () => fetchNotifications();

  // everything components can use through useNotifications()
  const value = {
    audience,
    notifications,
    toasts,
    getNotifications,
    getUnreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    dismissToast,
    isBellOpen,
    setIsBellOpen,
    notifyNewSignup,
    notifyQueuePosition,
    notifyStatusChange,
  };

  // toasts render once here so they work on every page
  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationToast />
    </NotificationContext.Provider>
  );
}

// hook so components can just call useNotifications()
export function useNotifications() {
  const context = useContext(NotificationContext);

  // if this is null the component isn't inside <NotificationProvider>
  if (context === null) {
    throw new Error("useNotifications must be used inside a <NotificationProvider>");
  }

  return context;
}