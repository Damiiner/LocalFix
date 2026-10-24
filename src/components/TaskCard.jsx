function displayStatus(status) {
  if (status === "Done") return "Completed";
  if (status === "Accepted") return "In Progress";
  return status || "Open";
}

function statusSlug(status) {
  const d = displayStatus(status);
  return String(d).toLowerCase().replace(/\s+/g, "-");
}

function TaskCard({
  task,
  onApply,
  onMessageRequester,
  onCompleteTask,
  currentUserName,
  canActAsHelper = true,
  isApplying = false,
  onEdit,
  onDelete,
  isHighlighted = false
}) {
  const shownStatus = displayStatus(task.status);
  const isOpen = shownStatus === "Open";
  const isInProgress = shownStatus === "In Progress";
  const isCompleted = shownStatus === "Completed";

  const canOfferHelp =
    canActAsHelper && onApply && task.requester !== currentUserName && task.status === "Open";
  const showMessageRequester =
    Boolean(onMessageRequester) &&
    isInProgress &&
    task.acceptedBy === currentUserName &&
    task.requester !== currentUserName;
  const showMessageAsRequester =
    Boolean(onMessageRequester) &&
    isInProgress &&
    task.requester === currentUserName &&
    task.acceptedBy &&
    task.acceptedBy !== currentUserName;

  const requesterCanComplete =
    Boolean(onCompleteTask) && isInProgress && task.requester === currentUserName;

  const isOwner = task.requester === currentUserName;
  const canEditOrDelete = isOwner && isOpen && (onEdit || onDelete);

  const attachments = Array.isArray(task.attachments) ? task.attachments : [];

  return (
    <article
      className={`card card-lift task-card${isHighlighted ? " task-card--highlight" : ""}`}
      id={`task-${task.id}`}
    >
      <div className="card-head">
        <h3>{task.title}</h3>
        <span className={`badge badge-status badge--${statusSlug(task.status)}`}>{shownStatus}</span>
      </div>
      <p className="muted">
        {task.category} • {task.neighborhood} • {task.urgency}
      </p>
      <p>{task.description}</p>
      {isInProgress || isCompleted ? (
        <p className="task-helper-line muted">
          {isCompleted ? "Completed with" : "Helper:"}{" "}
          <strong>{task.acceptedBy || "—"}</strong>
        </p>
      ) : null}
      {isCompleted && task.helperRating != null ? (
        <p className="task-rating-line muted">
          Your rating: <span className="task-stars">{"★".repeat(task.helperRating)}{"☆".repeat(5 - task.helperRating)}</span>
        </p>
      ) : null}
      {isCompleted && task.helperReview ? (
        <blockquote className="task-helper-review">
          <span className="muted task-helper-review-label">Your note</span>
          <p>{task.helperReview}</p>
        </blockquote>
      ) : null}
      <div className="task-meta">
        <span>Requester: {task.requester}</span>
        <strong>{task.budget}</strong>
      </div>
      {attachments.length > 0 ? (
        <div className="task-attachments">
          <span className="muted task-attachments-label">Attachments</span>
          <ul className="task-attachments-list">
            {attachments.map((file) => (
              <li key={file.id || file.name}>
                {file.dataUrl && String(file.type || "").startsWith("image/") ? (
                  <a href={file.dataUrl} target="_blank" rel="noreferrer" className="task-attachment-thumb">
                    <img src={file.dataUrl} alt="" />
                    <span>{file.name}</span>
                  </a>
                ) : (
                  <a href={file.dataUrl} download={file.name} className="task-attachment-link">
                    {file.name}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {canEditOrDelete ? (
        <div className="task-owner-actions">
          {onEdit ? (
            <button className="btn btn-secondary" type="button" onClick={() => onEdit(task.id)}>
              Edit
            </button>
          ) : null}
          {onDelete ? (
            <button className="btn btn-danger" type="button" onClick={() => onDelete(task.id)}>
              Delete
            </button>
          ) : null}
        </div>
      ) : null}
      {canOfferHelp || showMessageRequester || showMessageAsRequester || requesterCanComplete ? (
        <div className="task-card-actions">
          {canOfferHelp ? (
            <button className="btn" type="button" onClick={() => onApply(task.id)} disabled={isApplying}>
              {isApplying ? "Applying..." : "Offer help"}
            </button>
          ) : null}
          {requesterCanComplete ? (
            <button className="btn btn-primary-action" type="button" onClick={() => onCompleteTask(task.id)}>
              Mark complete
            </button>
          ) : null}
          {showMessageRequester ? (
            <button className="btn btn-message" type="button" onClick={() => onMessageRequester(task.id)}>
              Message {task.requester}
            </button>
          ) : null}
          {showMessageAsRequester ? (
            <button className="btn btn-message" type="button" onClick={() => onMessageRequester(task.id)}>
              Message {task.acceptedBy}
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export default TaskCard;
