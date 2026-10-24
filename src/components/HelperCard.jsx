import { Link } from "react-router-dom";

const BAND_LABELS = { now: "Often same day", week: "Few days", scheduled: "Scheduled" };

function bandBadgeClass(band) {
  if (band === "now") return "avail-badge avail-badge--now";
  if (band === "week") return "avail-badge avail-badge--week";
  return "avail-badge avail-badge--scheduled";
}

function HelperCard({ helper, onMessage, onBlockHelper }) {
  const band = helper.availabilityBand || "week";
  return (
    <article className="card card-lift helper-card">
      <div className="card-head">
        <h3>{helper.name}</h3>
        <span className="rating">
          {"\u2605"} {helper.rating}
          {helper.ratingCount > 0 ? (
            <span className="helper-card-rating-n muted"> ({helper.ratingCount})</span>
          ) : null}
        </span>
      </div>
      <p className="muted helper-card-meta-line">
        {helper.neighborhood} • {helper.distanceKm} km ·{" "}
        <span className={bandBadgeClass(band)}>{BAND_LABELS[band] || band}</span>
      </p>
      <p className="muted">Available: {helper.availability}</p>
      <p>{helper.bio}</p>
      <div className="chips">
        {helper.skills.map((skill) => (
          <span key={skill} className="chip">
            {skill}
          </span>
        ))}
      </div>
      <div className="helper-card-actions">
        {onMessage ? (
          <button className="btn" type="button" onClick={() => onMessage(helper.id)}>
            Message
          </button>
        ) : null}
        <Link className="btn btn-secondary" to={`/profile/${helper.id}`}>
          View profile
        </Link>
        {onBlockHelper ? (
          <button type="button" className="btn btn-ghost btn-small" onClick={() => onBlockHelper(helper.id)}>
            Hide
          </button>
        ) : null}
      </div>
    </article>
  );
}

export default HelperCard;
