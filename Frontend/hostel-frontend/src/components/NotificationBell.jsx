import { useEffect, useState } from "react";
import api from "../services/api";
import "./notification.css";

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data || []);
    } catch {
      console.error("Notification load failed");
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      fetchNotifications();
    } catch {
      console.error("Mark read failed");
    }
  };

  return (
    <div className="notif-wrapper">

      <div className="notif-bell" onClick={() => setOpen(!open)}>
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount}</span>
        )}
      </div>

      {open && (
        <div className="notif-panel">

          <div className="notif-header">
            <h4>Notifications</h4>
            <span className="notif-count">{unreadCount} unread</span>
          </div>

          <div className="notif-list">
            {notifications.length === 0 && (
              <p className="notif-empty">No notifications</p>
            )}

            {notifications.map(n => (
              <div
                key={n._id}
                className={`notif-item ${n.isRead ? "read" : "unread"}`}
                onClick={() => markRead(n._id)}
              >
                <div className="notif-message">{n.message}</div>
                <small className="notif-time">
                  {new Date(n.createdAt).toLocaleString()}
                </small>
              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  );
}

export default NotificationBell;
