import { useEffect, useMemo, useRef, useState } from "react";

function displayTaskStatus(status) {
  if (status === "Done") return "Completed";
  if (status === "Accepted") return "In Progress";
  return status || "Open";
}

const PAGE_SIZE = 8;

function formatShortDate(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "—";
  }
}

function AdminPage({
  accounts,
  tasks,
  reports,
  trustTeam,
  auditLog = [],
  onAssignReport,
  onResolveReport,
  onReopenReport,
  onVerifyReport,
  onBanUser,
  onUnbanUser,
  onBroadcast,
  onUpdateAdminNotes
}) {
  const [resolveId, setResolveId] = useState(null);
  const [resolutionDraft, setResolutionDraft] = useState("");
  const [broadcastText, setBroadcastText] = useState("");
  const resolveModalTitleRef = useRef(null);
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [userPage, setUserPage] = useState(1);

  useEffect(() => {
    if (!resolveId) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        setResolveId(null);
        setResolutionDraft("");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [resolveId]);

  useEffect(() => {
    if (resolveId) {
      requestAnimationFrame(() => resolveModalTitleRef.current?.focus());
    }
  }, [resolveId]);

  const stats = useMemo(() => {
    const byStatus = tasks.reduce((acc, t) => {
      const s = t.status === "Done" ? "Completed" : t.status === "Accepted" ? "In Progress" : t.status;
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});
    return {
      users: accounts.length,
      openReports: reports.filter((r) => r.status !== "Resolved").length,
      tasksTotal: tasks.length,
      byStatus,
      verifiedReports: reports.filter((r) => r.verified).length
    };
  }, [accounts, tasks, reports]);

  const sortedTasks = useMemo(
    () =>
      [...tasks].sort((a, b) => {
        const ta = String(a.title || "").toLowerCase();
        const tb = String(b.title || "").toLowerCase();
        return ta.localeCompare(tb);
      }),
    [tasks]
  );

  const sortedReports = useMemo(
    () =>
      [...reports].sort((a, b) => {
        const order = { Open: 0, Assigned: 1, Resolved: 2 };
        return (order[a.status] ?? 9) - (order[b.status] ?? 9);
      }),
    [reports]
  );

  const filteredAccounts = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    const rows = accounts.filter((a) => {
      const matchQ =
        !q ||
        String(a.name || "").toLowerCase().includes(q) ||
        String(a.email || "").toLowerCase().includes(q);
      const matchRole =
        roleFilter === "all" ||
        (roleFilter === "admin" && a.role === "admin") ||
        (roleFilter === "user" && a.role !== "admin");
      const st = a.banned ? "suspended" : a.paused ? "paused" : "active";
      const matchStatus = statusFilter === "all" || st === statusFilter;
      return matchQ && matchRole && matchStatus;
    });
    const dir = sortDir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      if (sortKey === "email") {
        return dir * String(a.email || "").localeCompare(String(b.email || ""));
      }
      if (sortKey === "created") {
        return dir * String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
      }
      if (sortKey === "login") {
        return dir * String(a.lastLoginAt || "0").localeCompare(String(b.lastLoginAt || "0"));
      }
      return dir * String(a.name || "").localeCompare(String(b.name || ""));
    });
  }, [accounts, userSearch, roleFilter, statusFilter, sortKey, sortDir]);

  useEffect(() => {
    setUserPage(1);
  }, [userSearch, roleFilter, statusFilter]);

  const userPageCount = Math.max(1, Math.ceil(filteredAccounts.length / PAGE_SIZE));
  const pagedAccounts = useMemo(() => {
    const start = (userPage - 1) * PAGE_SIZE;
    return filteredAccounts.slice(start, start + PAGE_SIZE);
  }, [filteredAccounts, userPage]);

  const sendBroadcast = () => {
    onBroadcast(broadcastText);
    setBroadcastText("");
  };

  return (
    <section className="admin-page">
      <header className="page-hero admin-hero">
        <p className="admin-eyebrow">Console</p>
        <h2>Operations</h2>
        <p className="muted page-hero-sub">
          Read-only task register, account suspension, reports, and broadcasts — operator accounts cannot post or
          accept work.
        </p>
      </header>

      <div className="admin-stat-grid">
        <article className="card admin-stat-card admin-stat-card--accent">
          <span className="admin-stat-value">{stats.users}</span>
          <span className="admin-stat-label">Accounts</span>
        </article>
        <article className="card admin-stat-card">
          <span className="admin-stat-value">{stats.tasksTotal}</span>
          <span className="admin-stat-label">Tasks</span>
        </article>
        <article className="card admin-stat-card">
          <span className="admin-stat-value">{stats.openReports}</span>
          <span className="admin-stat-label">Open reports</span>
        </article>
        <article className="card admin-stat-card">
          <span className="admin-stat-value">{stats.byStatus["Completed"] ?? stats.byStatus["Done"] ?? 0}</span>
          <span className="admin-stat-label">Completed tasks</span>
        </article>
      </div>

      <div className="card admin-broadcast">
        <h3 className="section-title">Message all users</h3>
        <p className="muted settings-hint">Sends an in-app notification to every non-admin account.</p>
        <label>
          Announcement
          <textarea
            rows={3}
            value={broadcastText}
            onChange={(e) => setBroadcastText(e.target.value)}
            placeholder="Short update or reminder…"
          />
        </label>
        <button type="button" className="btn" onClick={sendBroadcast} disabled={!broadcastText.trim()}>
          Send to all users
        </button>
      </div>

      <div className="admin-panels grid two-col">
        <div className="card admin-panel">
          <h3 className="section-title">Task status</h3>
          <ul className="admin-status-list">
            {["Open", "In Progress", "Completed"].map((label) => (
              <li key={label}>
                <span>{label}</span>
                <strong>{stats.byStatus[label] ?? 0}</strong>
              </li>
            ))}
          </ul>
        </div>
        <div className="card admin-panel">
          <h3 className="section-title">Reports verified</h3>
          <p className="admin-big-metric">{stats.verifiedReports}</p>
          <p className="muted">Use verify on each report after you&apos;ve checked evidence.</p>
        </div>
      </div>

      <h3 className="section-title section-title-spaced">Task register</h3>
      <p className="muted settings-hint">Every task in the current session (view only).</p>
      <div className="card admin-account-table-wrap admin-task-table-wrap">
        <table className="admin-account-table admin-task-table">
          <thead>
            <tr>
              <th scope="col">Title</th>
              <th scope="col">Requester</th>
              <th scope="col">Status</th>
              <th scope="col">Helper</th>
              <th scope="col">Area</th>
            </tr>
          </thead>
          <tbody>
            {sortedTasks.map((t) => (
              <tr key={t.id}>
                <td>{t.title}</td>
                <td className="muted admin-account-email">{t.requester}</td>
                <td className="admin-task-status-cell">{displayTaskStatus(t.status)}</td>
                <td className="muted">{t.acceptedBy || "—"}</td>
                <td className="muted">{t.neighborhood}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="section-title section-title-spaced">Accounts</h3>
      <p className="muted settings-hint">Suspend users who break rules. They cannot sign in until lifted.</p>
      <div className="card admin-account-toolbar">
        <input
          type="search"
          className="admin-user-search"
          placeholder="Search name or email"
          value={userSearch}
          onChange={(e) => setUserSearch(e.target.value)}
          aria-label="Search accounts"
        />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} aria-label="Filter by role">
          <option value="all">All roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="suspended">Suspended</option>
        </select>
        <select value={`${sortKey}:${sortDir}`} onChange={(e) => {
          const [k, d] = e.target.value.split(":");
          setSortKey(k);
          setSortDir(d);
        }} aria-label="Sort accounts">
          <option value="name:asc">Name A–Z</option>
          <option value="name:desc">Name Z–A</option>
          <option value="email:asc">Email A–Z</option>
          <option value="created:desc">Newest joined</option>
          <option value="created:asc">Oldest joined</option>
          <option value="login:desc">Recent activity</option>
        </select>
      </div>
      <p className="muted admin-table-meta">
        Showing {filteredAccounts.length === 0 ? 0 : (userPage - 1) * PAGE_SIZE + 1}–
        {Math.min(userPage * PAGE_SIZE, filteredAccounts.length)} of {filteredAccounts.length}
      </p>
      <div className="card admin-account-table-wrap">
        <table className="admin-account-table">
          <caption className="visually-hidden">User accounts and moderation actions</caption>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Email</th>
              <th scope="col">Role</th>
              <th scope="col">Status</th>
              <th scope="col">Joined</th>
              <th scope="col">Last active</th>
              <th scope="col">Internal notes</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagedAccounts.map((a) => (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td className="muted admin-account-email">{a.email}</td>
                <td>{a.role === "admin" ? "Admin" : "User"}</td>
                <td>
                  {a.banned ? <span className="admin-pill admin-pill--banned">Suspended</span> : null}
                  {a.paused && !a.banned ? <span className="admin-pill admin-pill--paused">Paused</span> : null}
                  {!a.banned && !a.paused ? <span className="muted">Active</span> : null}
                </td>
                <td className="muted admin-date-cell">{formatShortDate(a.createdAt)}</td>
                <td className="muted admin-date-cell">{formatShortDate(a.lastLoginAt)}</td>
                <td className="admin-notes-cell">
                  {onUpdateAdminNotes ? (
                    <textarea
                      key={a.id}
                      className="admin-notes-input"
                      rows={2}
                      defaultValue={a.adminNotes || ""}
                      onBlur={(e) => onUpdateAdminNotes(a.id, e.target.value)}
                      placeholder="Moderator notes…"
                      aria-label={`Internal notes for ${a.name}`}
                    />
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
                <td className="admin-account-actions">
                  {a.role !== "admin" ? (
                    a.banned ? (
                      <button type="button" className="btn btn-ghost btn-small" onClick={() => onUnbanUser(a.id)}>
                        Lift suspension
                      </button>
                    ) : (
                      <button type="button" className="btn btn-danger btn-small" onClick={() => onBanUser(a.id)}>
                        Suspend
                      </button>
                    )
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredAccounts.length === 0 ? <p className="muted admin-table-empty">No accounts match filters.</p> : null}
      </div>
      {filteredAccounts.length > PAGE_SIZE ? (
        <div className="admin-pagination">
          <button
            type="button"
            className="btn btn-ghost btn-small"
            disabled={userPage <= 1}
            onClick={() => setUserPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span className="muted">
            Page {userPage} / {userPageCount}
          </span>
          <button
            type="button"
            className="btn btn-ghost btn-small"
            disabled={userPage >= userPageCount}
            onClick={() => setUserPage((p) => Math.min(userPageCount, p + 1))}
          >
            Next
          </button>
        </div>
      ) : null}

      <h3 className="section-title section-title-spaced">Audit log</h3>
      <p className="muted settings-hint">Recent moderation actions in this session (newest first).</p>
      <div className="card admin-account-table-wrap">
        {auditLog.length === 0 ? (
          <p className="muted admin-table-empty">No entries yet.</p>
        ) : (
          <table className="admin-account-table admin-audit-table">
            <caption className="visually-hidden">Audit log</caption>
            <thead>
              <tr>
                <th scope="col">Time</th>
                <th scope="col">Actor</th>
                <th scope="col">Action</th>
                <th scope="col">Detail</th>
              </tr>
            </thead>
            <tbody>
              {auditLog.slice(0, 50).map((entry) => (
                <tr key={entry.id}>
                  <td className="muted admin-date-cell">
                    {entry.at ? new Date(entry.at).toLocaleString() : "—"}
                  </td>
                  <td>{entry.actorName || "—"}</td>
                  <td>
                    <code className="admin-audit-code">{entry.action}</code>
                  </td>
                  <td className="muted">{entry.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <h3 className="section-title section-title-spaced">User reports</h3>
      <p className="muted settings-hint">Open → Assigned → Resolved. Verify after you confirm the facts.</p>
      <div className="stack admin-report-stack">
        {sortedReports.length === 0 ? (
          <p className="muted card card-muted">No reports filed yet.</p>
        ) : (
          sortedReports.map((report) => (
            <article key={report.id} className="card admin-report-card">
              <div className="admin-report-head">
                <div>
                  <h3>{report.title || "Report"}</h3>
                  <p className="muted">
                    {report.helperName} · {report.reason} · filed by {report.reporterName}
                  </p>
                </div>
                <div className="admin-report-badges">
                  {report.verified ? <span className="admin-pill admin-pill--verified">Verified</span> : null}
                  <span className={`admin-pill admin-pill--${(report.status || "Open").toLowerCase().replace(/\s+/g, "-")}`}>
                    {report.status || "Open"}
                  </span>
                </div>
              </div>
              <p className="admin-report-body">{report.details}</p>
              {report.attachments?.length ? (
                <ul className="report-attachment-thumbs admin-report-thumbs">
                  {report.attachments.map((att) =>
                    att.dataUrl ? (
                      <li key={att.id || att.name}>
                        <a href={att.dataUrl} target="_blank" rel="noreferrer" className="report-thumb-link">
                          <img src={att.dataUrl} alt="" />
                        </a>
                      </li>
                    ) : null
                  )}
                </ul>
              ) : null}
              <small className="muted">{report.time}</small>
              {report.assignee ? (
                <p className="admin-assignee-line">
                  <span className="muted">Assigned to</span> <strong>{report.assignee}</strong>
                </p>
              ) : null}
              {report.status === "Resolved" && report.resolutionNote ? (
                <p className="admin-resolution">
                  <span className="muted">Resolution</span> {report.resolutionNote}
                </p>
              ) : null}
              <div className="admin-report-actions">
                <button
                  type="button"
                  className={`btn btn-small ${report.verified ? "btn-secondary" : "btn-ghost"}`}
                  onClick={() => onVerifyReport(report.id, !report.verified)}
                >
                  {report.verified ? "Unverify" : "Mark verified"}
                </button>
                {report.status === "Open" ? (
                  <label className="admin-inline-label">
                    <span className="muted">Assign to</span>
                    <select
                      className="admin-select"
                      defaultValue=""
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v) onAssignReport(report.id, v);
                        e.target.value = "";
                      }}
                    >
                      <option value="" disabled>
                        Choose moderator…
                      </option>
                      {trustTeam.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                {report.status === "Assigned" ? (
                  <>
                    <button type="button" className="btn btn-secondary" onClick={() => setResolveId(report.id)}>
                      Mark resolved
                    </button>
                    <button type="button" className="btn btn-ghost btn-small" onClick={() => onReopenReport(report.id)}>
                      Reopen
                    </button>
                  </>
                ) : null}
              </div>
            </article>
          ))
        )}
      </div>

      {resolveId ? (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-resolve-title"
        >
          <div className="modal-card admin-resolve-modal">
            <h3 id="admin-resolve-title" tabIndex={-1} ref={resolveModalTitleRef}>
              Resolve report
            </h3>
            <p className="muted">Add a short internal note for the audit trail.</p>
            <label>
              Resolution note
              <textarea
                value={resolutionDraft}
                onChange={(e) => setResolutionDraft(e.target.value)}
                rows={4}
                placeholder="e.g. Spoke with both parties; warning issued."
              />
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setResolveId(null);
                  setResolutionDraft("");
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  onResolveReport(resolveId, resolutionDraft.trim() || "Resolved.");
                  setResolveId(null);
                  setResolutionDraft("");
                }}
              >
                Confirm resolved
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default AdminPage;
