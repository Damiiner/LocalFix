import { useEffect, useRef, useState } from "react";

const REVIEW_MAX = 500;

function CompletionFeedbackModal({ taskTitle, helperName, onSkip, onSubmit }) {
  const [stars, setStars] = useState(null);
  const [review, setReview] = useState("");
  const headingRef = useRef(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onSkip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onSkip]);

  const trimmed = review.trim();
  const canSend = stars != null || Boolean(trimmed);

  const submit = () => {
    if (!canSend) return;
    onSubmit({
      rating: stars,
      review: trimmed || undefined
    });
  };

  return (
    <div className="completion-modal-backdrop" role="presentation">
      <div
        className="completion-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="completion-modal-title"
      >
        <div className="completion-modal-glow" aria-hidden="true" />
        <h2 id="completion-modal-title" className="completion-modal-title" tabIndex={-1} ref={headingRef}>
          Task closed
        </h2>
        <p className="completion-modal-lead muted">
          <strong>{helperName}</strong> helped with <strong>{taskTitle}</strong>. Want to share feedback? Everything
          below is optional.
        </p>

        <div className="completion-modal-field">
          <span className="completion-modal-label">Rating</span>
          <div className="completion-modal-stars" role="group" aria-label="Optional star rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className={`completion-modal-star${stars != null && n <= stars ? " is-on" : ""}`}
                aria-pressed={stars != null && n <= stars ? "true" : "false"}
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
                onClick={() => setStars((prev) => (prev === n ? null : n))}
              >
                {"\u2605"}
              </button>
            ))}
            <span className="completion-modal-star-hint muted">Tap again to clear</span>
          </div>
        </div>

        <label className="completion-modal-field completion-modal-field--grow">
          <span className="completion-modal-label">Review</span>
          <textarea
            className="completion-modal-textarea"
            value={review}
            onChange={(e) => setReview(e.target.value.slice(0, REVIEW_MAX))}
            placeholder="What went well? (optional)"
            rows={4}
            maxLength={REVIEW_MAX}
          />
          <span className="completion-modal-counter muted">
            {review.length}/{REVIEW_MAX}
          </span>
        </label>

        <div className="completion-modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onSkip}>
            Skip
          </button>
          <button type="button" className="btn btn-primary-action" onClick={submit} disabled={!canSend}>
            Send feedback
          </button>
        </div>
      </div>
    </div>
  );
}

export default CompletionFeedbackModal;
