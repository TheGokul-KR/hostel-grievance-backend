import { useEffect, useState } from "react";
import api from "../services/api";
import "./notification.css";

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [seenIds, setSeenIds] = useState(() => {
    return JSON.parse(localStorage.getItem("seen_notifications") || "[]");
  });

  const fetchComplaintsAsNotifications = async () => {
    try {
      const res = await api.get("/complaints/technician");
      const list = Array.isArray(res.data) ? res.data : [];

      // Treat active complaints as notifications
     // show latest complaints as notifications (latest first)
const sorted = list
  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  .slice(0, 10);

setItems(sorted);

    } catch (err) {
      console.error("Bell fetch failed", err);
    }
  };

  useEffect(() => {
    fetchComplaintsAsNotifications();
    const i = setInterval(fetchComplaintsAsNotifications, 15000);
    return () => clearInterval(i);
  }, []);

  const unread = items.filter(c => !seenIds.includes(c._id));

  const markSeen = id => {
    const updated = [...new Set([...seenIds, id])];
    setSeenIds(updated);
    localStorage.setItem("seen_notifications", JSON.stringify(updated));
  };

  return (
    <div className="notif-wrapper">
      <div
        className="notif-bell"
        onClick={() => setOpen(o => !o)}
      >
        <span className="bell-icon">🔔</span>
        {unread.length > 0 && (
          <span className="notif-badge">{unread.length}</span>
        )}
      </div>

      {open && (
        <div className="notif-panel">
          <div className="notif-header">
            <h4>Active Complaints</h4>
            <span className="notif-count">
              {unread.length} new
            </span>
          </div>

          <div className="notif-list">
            {items.length === 0 && (
              <p className="notif-empty">No active complaints</p>
            )}

            {items.map(c => {
              const isUnread = !seenIds.includes(c._id);

              return (
                <div
                  key={c._id}
                  className={`notif-item ${isUnread ? "unread" : "read"}`}
                  onClick={() => markSeen(c._id)}
                >
                  <div className="notif-message">
                    <b>Room {c.roomNumber}</b> — {c.status}
                  </div>
                  <small className="notif-time">
                    {new Date(c.createdAt).toLocaleString()}
                  </small>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
