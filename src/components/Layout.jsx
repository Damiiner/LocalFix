import { Link, NavLink } from "react-router-dom";
import LogoMark from "./LogoMark";

const memberNav = [
  { to: "/", label: "Discover" },
  { to: "/tasks", label: "Board" },
  { to: "/requester", label: "Post" },
  { to: "/messages", label: "Inbox" },
  { to: "/map", label: "Atlas" },
  { to: "/report", label: "Flag" },
  { to: "/settings", label: "Account" }
];

const operatorNav = [
  { to: "/", label: "Discover" },
  { to: "/tasks", label: "Board" },
  { to: "/map", label: "Atlas" },
  { to: "/admin", label: "Console" },
  { to: "/notifications", label: "Signals" },
  { to: "/settings", label: "Account" }
];

function Layout({ children, toasts, currentUserName, onLogout, isAdmin = false, unreadNotifications = 0, isOnline = true }) {
  const links = isAdmin ? operatorNav : memberNav;

  return (
    <div className="app-frame">
      <aside className="app-rail" aria-label="Site">
        <Link to="/" className="rail-brand" aria-label="LocalFix home">
          <LogoMark large />
          <span className="rail-brand-text">
            <span className="rail-brand-title">LocalFix</span>
            <span className="rail-brand-sub">Monastir</span>
          </span>
        </Link>

        <nav className="rail-nav" aria-label="Main">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) => `rail-link${isActive ? " rail-link--active" : ""}`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="rail-footer">
          <Link to="/notifications" className="rail-notify" aria-label="Notifications">
            <span className="rail-notify-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 22a2 2 0 002-2H10a2 2 0 002 2zm6-6V11a6 6 0 10-12 0v5l-2 2v1h16v-1l-2-2z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            {unreadNotifications > 0 ? (
              <span className="rail-notify-badge">{unreadNotifications > 99 ? "99+" : unreadNotifications}</span>
            ) : null}
          </Link>
          <div className="rail-user-block">
            <span className="rail-user-name">{currentUserName}</span>
            <button className="rail-logout" onClick={onLogout} type="button">
              Log out
            </button>
          </div>
        </div>
      </aside>

      <div className="app-stage">
        {!isOnline ? (
          <div className="app-offline-banner" role="status">
            You&apos;re offline. Actions will queue until you reconnect.
          </div>
        ) : null}
        <main className="app-main page-transition">{children}</main>

        <div className="toast-stack">
          {toasts?.map((toast) => (
            <div key={toast.id} className={`toast toast-${toast.type || "info"}`}>
              {toast.message}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Layout;
