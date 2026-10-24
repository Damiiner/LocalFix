import { useEffect, useState } from "react";

const MAX_REPORT_IMAGES = 4;
const MAX_IMG_BYTES = 2_500_000;

const REPORT_GROUPS = [
  {
    category: "conduct",
    label: "Conduct & safety",
    reasons: ["Harassment or threats", "Unsafe behavior", "Discrimination", "Other (conduct)"]
  },
  {
    category: "reliability",
    label: "Reliability",
    reasons: ["No show", "Poor quality of help", "Other (reliability)"]
  },
  {
    category: "misuse",
    label: "Spam & misuse",
    reasons: ["Spam or scam", "Fake profile", "Soliciting off-platform payment", "Other (misuse)"]
  }
];

const SEVERITY_OPTIONS = [
  { value: "low", label: "Low — heads-up" },
  { value: "standard", label: "Standard — needs review" },
  { value: "urgent", label: "Urgent — safety concern" }
];

function readReportImages(fileList) {
  const files = Array.from(fileList || []).slice(0, MAX_REPORT_IMAGES);
  return Promise.all(
    files.map(
      (file) =>
        new Promise((resolve, reject) => {
          if (!String(file.type || "").startsWith("image/")) {
            reject(new Error(`"${file.name}" must be an image.`));
            return;
          }
          if (file.size > MAX_IMG_BYTES) {
            reject(new Error(`"${file.name}" is too large (max ~${Math.round(MAX_IMG_BYTES / 1_000_000)} MB).`));
            return;
          }
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              id: `rep-img-${file.name}-${Date.now()}`,
              name: file.name,
              type: file.type || "image/jpeg",
              dataUrl: typeof reader.result === "string" ? reader.result : ""
            });
          };
          reader.onerror = () => reject(new Error(`Could not read "${file.name}".`));
          reader.readAsDataURL(file);
        })
    )
  );
}

function ReportPage({ helpers, selectedHelperId, onSubmitReport, reports }) {
  const [form, setForm] = useState({
    title: "",
    helperId: selectedHelperId || "",
    reasonCategory: "reliability",
    reason: "No show",
    severity: "standard",
    details: ""
  });
  const [errors, setErrors] = useState({ helperId: "", details: "", title: "", files: "" });
  const [pendingConfirmation, setPendingConfirmation] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);

  useEffect(() => {
    setForm((prev) => ({ ...prev, helperId: selectedHelperId || prev.helperId }));
  }, [selectedHelperId]);

  useEffect(() => {
    if (!pendingConfirmation) return;
    const onKey = (e) => {
      if (e.key === "Escape") setPendingConfirmation(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pendingConfirmation]);

  const submit = (event) => {
    event.preventDefault();
    const titleErr =
      !form.title.trim() ? "Please add a short title." : form.title.trim().length < 3 ? "Title is too short." : "";
    const nextErrors = {
      title: titleErr,
      helperId: form.helperId ? "" : "Please select a helper.",
      details:
        !form.details.trim()
          ? "Please provide report details."
          : form.details.trim().length < 10
            ? "Details must be at least 10 characters."
            : "",
      files: ""
    };
    setErrors(nextErrors);

    if (nextErrors.helperId || nextErrors.details || nextErrors.title) {
      return;
    }

    setPendingConfirmation({
      title: form.title.trim(),
      helperId: form.helperId,
      reason: form.reason,
      reasonCategory: form.reasonCategory,
      severity: form.severity,
      details: form.details.trim(),
      pendingFiles: [...pendingFiles]
    });
  };

  const confirmSubmit = async () => {
    if (!pendingConfirmation) {
      return;
    }
    setIsSubmitting(true);
    try {
      let attachments = [];
      if (pendingConfirmation.pendingFiles?.length) {
        attachments = await readReportImages(pendingConfirmation.pendingFiles);
      }
      onSubmitReport({
        title: pendingConfirmation.title,
        helperId: pendingConfirmation.helperId,
        reason: pendingConfirmation.reason,
        reasonCategory: pendingConfirmation.reasonCategory,
        severity: pendingConfirmation.severity,
        details: pendingConfirmation.details,
        attachments,
        source: "flag_page"
      });
      setForm((prev) => ({ ...prev, details: "", title: "" }));
      setPendingFiles([]);
      setPendingConfirmation(null);
    } catch (e) {
      setErrors((prev) => ({ ...prev, files: e?.message || "Could not attach images." }));
    }
    setIsSubmitting(false);
  };

  return (
    <section className="report-page">
      <header className="page-hero">
        <h2>Report someone</h2>
        <p className="muted page-hero-sub">Be specific. The team reviews every report.</p>
      </header>

      <div className="grid two-col report-page-grid">
        <div>
          <h3 className="section-title">Submit a report</h3>
          <form className="card task-form" onSubmit={submit}>
            <label>
              Report title
              <input
                value={form.title}
                onChange={(event) => {
                  setForm((prev) => ({ ...prev, title: event.target.value }));
                  setErrors((prev) => ({ ...prev, title: "" }));
                }}
                placeholder="Short summary, e.g. Rude messages in chat"
                aria-invalid={Boolean(errors.title)}
              />
              {errors.title ? <small className="form-error">{errors.title}</small> : null}
            </label>

            <label>
              Reported person
              <select
                value={form.helperId}
                onChange={(event) => {
                  setForm((prev) => ({ ...prev, helperId: event.target.value }));
                  setErrors((prev) => ({ ...prev, helperId: "" }));
                }}
                aria-invalid={Boolean(errors.helperId)}
              >
                <option value="">Select helper</option>
                {helpers.map((helper) => (
                  <option key={helper.id} value={helper.id}>
                    {helper.name} — {helper.neighborhood}
                  </option>
                ))}
              </select>
              {errors.helperId ? <small className="form-error">{errors.helperId}</small> : null}
            </label>

            <label>
              Category
              <select
                value={form.reasonCategory}
                onChange={(event) => {
                  const cat = event.target.value;
                  const group = REPORT_GROUPS.find((g) => g.category === cat);
                  setForm((prev) => ({
                    ...prev,
                    reasonCategory: cat,
                    reason: group?.reasons[0] || prev.reason
                  }));
                }}
              >
                {REPORT_GROUPS.map((g) => (
                  <option key={g.category} value={g.category}>
                    {g.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Specific reason
              <select
                value={form.reason}
                onChange={(event) => setForm((prev) => ({ ...prev, reason: event.target.value }))}
              >
                {(REPORT_GROUPS.find((g) => g.category === form.reasonCategory) || REPORT_GROUPS[0]).reasons.map(
                  (r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  )
                )}
              </select>
            </label>
            <label>
              Severity
              <select
                value={form.severity}
                onChange={(event) => setForm((prev) => ({ ...prev, severity: event.target.value }))}
              >
                {SEVERITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Details
              <textarea
                value={form.details}
                onChange={(event) => {
                  setForm((prev) => ({ ...prev, details: event.target.value }));
                  setErrors((prev) => ({ ...prev, details: "" }));
                }}
                placeholder="What happened? Include dates and context if you can."
                aria-invalid={Boolean(errors.details)}
              />
              {errors.details ? <small className="form-error">{errors.details}</small> : null}
            </label>

            <label className="task-file-label">
              Screenshots
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => {
                  setPendingFiles(Array.from(e.target.files || []).slice(0, MAX_REPORT_IMAGES));
                  setErrors((prev) => ({ ...prev, files: "" }));
                  e.target.value = "";
                }}
              />
              {errors.files ? <small className="form-error">{errors.files}</small> : null}
              {pendingFiles.length > 0 ? (
                <small className="muted field-counter">{pendingFiles.length} image(s) will be attached.</small>
              ) : null}
            </label>

            <button className="btn btn-danger btn-primary-action" type="submit" disabled={isSubmitting}>
              Review &amp; submit
            </button>
          </form>
        </div>

        <div>
          <h3 className="section-title">Recent reports</h3>
          <div className="stack">
            {reports.length === 0 ? (
              <p className="muted">No reports submitted yet.</p>
            ) : (
              reports.map((report) => (
                <article key={report.id} className="card report-card">
                  <div className="report-card-head">
                    <h3>{report.title || "Report"}</h3>
                    <span
                      className={`report-status report-status--${String(report.status || "Open")
                        .toLowerCase()
                        .replace(/\s+/g, "-")}`}
                    >
                      {report.status || "Open"}
                    </span>
                  </div>
                  <p className="muted">
                    {report.helperName} · {report.reasonCategory ? `${report.reasonCategory} · ` : ""}
                    {report.reason}
                    {report.severity ? ` · ${report.severity}` : ""}
                  </p>
                  <p>{report.details}</p>
                  {report.attachments?.length ? (
                    <ul className="report-attachment-thumbs">
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
                  {report.assignee ? (
                    <p className="muted report-assignee">
                      Assigned: <strong>{report.assignee}</strong>
                    </p>
                  ) : null}
                  {report.status === "Resolved" && report.resolutionNote ? (
                    <p className="report-resolution">{report.resolutionNote}</p>
                  ) : null}
                  <small className="muted">{report.time}</small>
                </article>
              ))
            )}
          </div>
        </div>
      </div>

      {pendingConfirmation ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h3>Confirm report</h3>
            <p className="muted">
              <strong>{pendingConfirmation.title}</strong>
            </p>
            <p className="muted">You are about to submit this report. Continue?</p>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setPendingConfirmation(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={() => void confirmSubmit()} disabled={isSubmitting}>
                {isSubmitting ? "Submitting…" : "Submit report"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default ReportPage;
