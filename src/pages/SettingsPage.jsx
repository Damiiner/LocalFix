import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import TaskCard from "../components/TaskCard";
import { readFileAsDataUrl, validateProfileAvatarFile } from "../utils/validation";

function initialsFromName(name) {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function SettingsPage({
  authUser,
  tasks,
  reports = [],
  blockedHelperIds = [],
  allHelpers = [],
  onUpdateProfile,
  onChangePassword,
  onDeleteAccount,
  onPauseAccount,
  onResetLocalData,
  onUnblockHelper,
  onMessageRequester,
  onCompleteTask,
  currentUserName,
  isAdmin = false
}) {
  const [name, setName] = useState(authUser.name);
  const [email, setEmail] = useState(authUser.email);
  const [bio, setBio] = useState(authUser.bio || "");
  const [skills, setSkills] = useState(authUser.skills || "");
  const [availability, setAvailability] = useState(authUser.availability || "");
  const [avatarUrl, setAvatarUrl] = useState(authUser.avatarUrl || "");
  const [error, setError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [saving, setSaving] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const copyTimerRef = useRef(null);

  useEffect(() => {
    setName(authUser.name);
    setEmail(authUser.email);
    setBio(authUser.bio || "");
    setSkills(authUser.skills || "");
    setAvailability(authUser.availability || "");
    setAvatarUrl(authUser.avatarUrl || "");
  }, [
    authUser.id,
    authUser.name,
    authUser.email,
    authUser.bio,
    authUser.skills,
    authUser.availability,
    authUser.avatarUrl
  ]);

  const myPosted = useMemo(
    () => tasks.filter((task) => task.requester === currentUserName),
    [tasks, currentUserName]
  );

  const acceptedCount = useMemo(
    () => tasks.filter((task) => task.acceptedBy === currentUserName).length,
    [tasks, currentUserName]
  );

  const myReports = useMemo(
    () => reports.filter((r) => r.reporterId === authUser.id),
    [reports, authUser.id]
  );

  const blockedHelpers = useMemo(
    () => allHelpers.filter((h) => blockedHelperIds.includes(h.id)),
    [allHelpers, blockedHelperIds]
  );

  const postedCount = myPosted.length;

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    };
  }, []);

  const copyEmail = () => {
    const addr = String(email || "").trim();
    if (!addr || !navigator.clipboard?.writeText) return;
    void navigator.clipboard.writeText(addr).then(() => {
      setCopyFeedback(true);
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = window.setTimeout(() => setCopyFeedback(false), 2000);
    });
  };

  const saveProfile = (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    Promise.resolve(
      onUpdateProfile({
        name: name.trim(),
        email: email.trim(),
        skills,
        availability,
        bio,
        avatarUrl
      })
    )
      .then((result) => {
        setSaving(false);
        if (!result?.ok) {
          setError(result?.error || "Could not save.");
          return;
        }
      })
      .catch(() => setSaving(false));
  };

  const savePassword = (event) => {
    event.preventDefault();
    if (!onChangePassword) return;
    setPwError("");
    if (newPassword !== confirmNewPassword) {
      setPwError("New passwords do not match.");
      return;
    }
    setPwSaving(true);
    onChangePassword({ currentPassword, newPassword })
      .then((result) => {
        setPwSaving(false);
        if (!result?.ok) {
          setPwError(result?.error || "Could not update password.");
          return;
        }
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      })
      .catch(() => setPwSaving(false));
  };

  const onAvatarPick = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setAvatarError("");
    const check = validateProfileAvatarFile(file);
    if (!check.ok) {
      setAvatarError(check.error);
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setAvatarUrl(dataUrl);
    } catch (e) {
      setAvatarError(e?.message || "Could not load image.");
    }
  };

  const confirmDelete = () => {
    if (
      !window.confirm(
        "This will sign you out and remove your profile from this session. Continue?"
      )
    ) {
      return;
    }
    onDeleteAccount();
  };

  const downloadMyData = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      note: "LocalFix export",
      profile: { id: authUser.id, name: authUser.name, email: authUser.email, bio: authUser.bio },
      tasksPosted: myPosted,
      tasksAccepted: tasks.filter((t) => t.acceptedBy === currentUserName),
      reportsFiled: myReports,
      blockedHelperIds
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `localfix-export-${authUser.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="settings-page">
      <header className="page-hero settings-hero">
        <h2>{isAdmin ? "Operator" : "Profile"}</h2>
        <p className="muted page-hero-sub">
          {isAdmin
            ? "The admin account is for moderation only: no task posting, accepting, or end-user messaging."
            : "Your public bio and tasks you've posted."}
        </p>
      </header>

      <div className="settings-main-layout">
        <div className="settings-overview card">
          <div className="settings-identity">
            <div className="settings-avatar settings-avatar--photo" aria-hidden="true">
              {avatarUrl ? <img src={avatarUrl} alt="" className="settings-avatar-img" /> : initialsFromName(name)}
            </div>
            <div className="settings-identity-text">
              <p className="settings-display-name">{name || "Your name"}</p>
              <div className="settings-email-row">
                <p className="settings-email-line muted">{email}</p>
                <button type="button" className="btn btn-ghost btn-small" onClick={copyEmail}>
                  Copy email
                </button>
              </div>
              {copyFeedback ? (
                <p className="settings-copy-feedback" role="status">
                  Copied to clipboard
                </p>
              ) : null}
              {bio ? <p className="settings-bio-preview">{bio}</p> : null}
            </div>
          </div>
          <div className="settings-stat-grid settings-stat-grid--two">
            {isAdmin ? (
              <>
                <div className="settings-stat">
                  <span className="settings-stat-value">—</span>
                  <span className="settings-stat-label">Tasks posted</span>
                </div>
                <div className="settings-stat">
                  <span className="settings-stat-value">—</span>
                  <span className="settings-stat-label">Helping</span>
                </div>
              </>
            ) : (
              <>
                <Link to="/requester" className="settings-stat settings-stat--link">
                  <span className="settings-stat-value">{postedCount}</span>
                  <span className="settings-stat-label">Posted</span>
                </Link>
                <Link to="/tasks" className="settings-stat settings-stat--link">
                  <span className="settings-stat-value">{acceptedCount}</span>
                  <span className="settings-stat-label">Helping</span>
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="settings-profile-wrap settings-profile-grid">
        <form className="card task-form settings-form settings-form-card" onSubmit={saveProfile}>
          <div className="settings-form-head">
            <h3 className="section-title settings-form-title">Account</h3>
            <p className="muted settings-form-lead">Sign-in, photo, and how neighbors see you.</p>
          </div>

          {!isAdmin ? (
            <label className="settings-avatar-upload">
              Profile photo
              <span className="muted settings-upload-hint">JPEG, PNG, WebP, or GIF · max ~1.5 MB</span>
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={onAvatarPick} />
              <div className="settings-avatar-actions">
                {avatarUrl ? (
                  <button type="button" className="btn btn-ghost btn-small" onClick={() => setAvatarUrl("")}>
                    Remove photo
                  </button>
                ) : null}
              </div>
              {avatarError ? <p className="form-error">{avatarError}</p> : null}
            </label>
          ) : null}

          <label>
            Display name
            <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
          </label>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
          </label>
          {!isAdmin ? (
            <label>
              Bio
              <textarea
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                placeholder="A short line about you — skills, languages, or how you like to help."
                rows={5}
                maxLength={400}
              />
              <small className="muted field-counter">{bio.length}/400</small>
            </label>
          ) : null}
          {!isAdmin ? (
            <label>
              Skills <span className="muted">(comma-separated)</span>
              <input
                value={skills}
                onChange={(event) => setSkills(event.target.value)}
                placeholder="e.g. Tech support, tutoring"
                autoComplete="off"
              />
            </label>
          ) : null}
          {!isAdmin ? (
            <label>
              Availability
              <input
                value={availability}
                onChange={(event) => setAvailability(event.target.value)}
                placeholder="e.g. Weekday evenings"
                autoComplete="off"
              />
            </label>
          ) : null}
          {error ? <p className="form-error">{error}</p> : null}
          <div className="settings-form-actions">
            <button className="btn" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>

        {onChangePassword ? (
          <form className="card task-form settings-form settings-form-card settings-password-card" onSubmit={savePassword}>
            <div className="settings-form-head">
              <h3 className="section-title settings-form-title">Change password</h3>
              <p className="muted settings-form-lead">Use your current password, then pick a new one (min. 6 characters).</p>
            </div>
            <label>
              Current password
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </label>
            <label>
              New password
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                minLength={6}
              />
            </label>
            <label>
              Confirm new password
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                autoComplete="new-password"
                minLength={6}
              />
            </label>
            {pwError ? <p className="form-error">{pwError}</p> : null}
            <button type="submit" className="btn btn-secondary" disabled={pwSaving}>
              {pwSaving ? "Updating…" : "Update password"}
            </button>
          </form>
        ) : null}
        </div>
      </div>

      {!isAdmin && myReports.length > 0 ? (
        <>
          <h3 className="section-title section-title-spaced">Your reports</h3>
          <p className="muted settings-hint">Trust &amp; safety log for this session ({myReports.length} total).</p>
          <ul className="card settings-report-list">
            {myReports.map((r) => (
              <li key={r.id} className="settings-report-item">
                <strong>{r.title || "Report"}</strong>
                <span className="muted">{r.helperName}</span>
                <span className="muted">{r.reason}</span>
                <span className="settings-report-status">
                  {r.status || "Open"}
                  {r.assignee ? ` · ${r.assignee}` : ""}
                  {r.verified ? " · Verified" : ""}
                </span>
                <span className="muted settings-report-time">{r.time}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {!isAdmin && blockedHelpers.length > 0 ? (
        <>
          <h3 className="section-title section-title-spaced">Hidden helpers</h3>
          <p className="muted settings-hint">They stay out of your map and helper list until you show them again.</p>
          <ul className="stack settings-blocked-list">
            {blockedHelpers.map((h) => (
              <li key={h.id} className="card settings-blocked-row">
                <span>{h.name}</span>
                {onUnblockHelper ? (
                  <button type="button" className="btn btn-ghost btn-small" onClick={() => onUnblockHelper(h.id)}>
                    Show
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {!isAdmin ? (
        <>
          <h3 className="section-title section-title-spaced">Your posted tasks</h3>
          <div className="stack">
            {myPosted.length === 0 ? (
              <p className="muted card card-muted">No tasks posted yet.</p>
            ) : (
              myPosted.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  currentUserName={currentUserName}
                  canActAsHelper={false}
                  onMessageRequester={onMessageRequester}
                  onCompleteTask={onCompleteTask}
                />
              ))
            )}
          </div>

          <p className="muted settings-hint settings-after-tasks">
            Browse open tasks for others on the <Link to="/tasks">Tasks</Link> page.
          </p>
        </>
      ) : null}

      <div className="settings-advanced card">
        <button
          type="button"
          className="settings-advanced-trigger"
          aria-expanded={advancedOpen}
          onClick={() => setAdvancedOpen((o) => !o)}
        >
          <span className="settings-advanced-label">Session &amp; data</span>
          <span className="settings-advanced-hint muted">Data</span>
          <span className={`settings-advanced-chevron${advancedOpen ? " is-open" : ""}`} aria-hidden="true" />
        </button>
        {advancedOpen ? (
          <div className="settings-advanced-body">
            <p className="muted settings-advanced-copy">
              Data lives in this browser tab until you close it. Export saves a JSON snapshot; clearing storage resets
              the session and signs you out.
            </p>
            <div className="settings-advanced-actions">
              <button type="button" className="btn btn-secondary" onClick={downloadMyData}>
                Download my data (JSON)
              </button>
              {onPauseAccount && !isAdmin ? (
                <button type="button" className="btn btn-ghost" onClick={onPauseAccount}>
                  Pause account
                </button>
              ) : null}
              {onResetLocalData ? (
                <button type="button" className="btn btn-ghost settings-danger-outline" onClick={onResetLocalData}>
                  Clear stored data
                </button>
              ) : null}
            </div>
            {!isAdmin ? (
              <p className="settings-advanced-foot muted">
                <button type="button" className="link-subtle-destructive" onClick={confirmDelete}>
                  Remove profile from this session
                </button>
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default SettingsPage;
