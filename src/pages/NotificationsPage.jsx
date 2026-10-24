import { Link } from "react-router-dom";

function NotificationsPage({ items, onMarkRead, onMarkAllRead }) {
  const unread = items.filter((n) => !n.read).length;

  return (
    <section className="notifications-page">
      <header className="page-hero">
        <h2>Notifications</h2>
        <p className="muted page-hero-sub">Alerts for this session stay on this device.</p>
      </header>

      <div className="notifications-toolbar card">
        <p className="notifications-count">
          {unread > 0 ? (
            <>
              <strong>{unread}</strong> unread
            </>
          ) : (
            <span className="muted">You are all caught up.</span>
          )}
        </p>
        {items.length > 0 ? (
          <button type="button" className="btn btn-ghost btn-small" onClick={onMarkAllRead}>
            Mark all read
          </button>
        ) : null}
      </div>

      <div className="stack notifications-list">
        {items.length === 0 ? (
          <p className="muted card card-muted">
            No notifications yet. Accept a task or receive updates to see entries here.{" "}
            <Link to="/tasks">Browse tasks</Link>
          </p>
        ) : (
          items.map((n) => (
            <article
              key={n.id}
              className={`card notification-item${n.read ? "" : " notification-item--unread"}`}
            >
              <div className="notification-item-main">
                <p className="notification-text">{n.text}</p>
                <small className="muted">{new Date(n.at).toLocaleString()}</small>
              </div>
              {!n.read ? (
                <button type="button" className="btn btn-ghost btn-small" onClick={() => onMarkRead(n.id)}>
                  Mark read
                </button>
              ) : null}
            </article>
          ))
        )}
      </div>
    </section>
  );
}

export default NotificationsPage;
