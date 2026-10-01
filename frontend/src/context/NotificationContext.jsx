import { createContext, useContext, useRef, useState } from "react";
import { initialNotifications } from "../data/mockData";

// context, starts as null so hook can tell if there's no provider
const NotificationContext = createContext(null);

const audiences = ["admin", "user"];

// helper to check that something is a string with text
const isNonEmptyString = (value) => typeof value === "string" && value.trim() !== "";

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(initialNotifications);

  // toasts kept separate so dismissing a toast doesn't delete notification from list
  const [toasts, setToasts] = useState([]);

  // counter for new ids, starts after biggest mock id
  const nextId = useRef(Math.max(0, ...initialNotifications.map((n) => n.id)) + 1);

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

    // grab new id and increase the counter
    const id = nextId.current;
    nextId.current += 1;

    const newNotification = {
      id,
      audience,
      type,
      title,
      message,
      createdAt: new Date(),
      read: false,
    };

    // put at the front of list
    setNotifications((prev) => [newNotification, ...prev]);

    // also show a toast for it with same id
    setToasts((prev) => [...prev, { id, audience, title, message }]);
  };

  // mark a single notification as read, keep rest the same
  const markAsRead = (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  // mark every notification for one audience as read
  const markAllAsRead = (audience) => {
    setNotifications((prev) =>
      prev.map((n) => (n.audience === audience ? { ...n, read: true } : n))
    );
  };

  // remove toast from screen
  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // everything components can use through useNotifications()
  const value = {
    notifications,
    toasts,
    getNotifications,
    getUnreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    dismissToast,
  };
  
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
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