import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { helperHistories } from "../data/mockData";

function HistoryList({ title, items, emptyHint }) {
  if (!items?.length) {
    return (
      <div className="card card-muted">
        <h4 className="history-block-title">{title}</h4>
        <p className="muted">{emptyHint}</p>
      </div>
    );
  }

  return (
    <div className="card history-block">
      <h4 className="history-block-title">{title}</h4>
      <ul className="history-list">
        {items.map((item) => (
          <li key={item.id} className="history-item">
            <div className="history-item-main">
              <strong>{item.title}</strong>
              <span className="muted">{item.category}</span>
            </div>
            <div className="history-item-meta">
              <span className={`badge mini ${item.status.toLowerCase().replace(/\s+/g, "-")}`}>{item.status}</span>
              <span className="muted">{item.date}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

const BAND_LABELS = { now: "Often same day", week: "Within a few days", scheduled: "Set schedule" };

function bandBadgeClass(band) {
  if (band === "now") return "avail-badge avail-badge--now";
  if (band === "week") return "avail-badge avail-badge--week";
  return "avail-badge avail-badge--scheduled";
}

function formatShortDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function HelperProfilePage({
  allHelpers,
  helpersWithRatings = [],
  blockedHelperIds,
  onMessageHelper,
  onBlockHelper,
  onUnblockHelper,
  viewerUserId,
  onRateUser,
  userRatings = []
}) {
  const { helperId } = useParams();
  const base = allHelpers.find((item) => item.id === helperId);
  const live = helpersWithRatings.find((h) => h.id === helperId);
  const helper = base
    ? {
        ...base,
        rating: live?.rating ?? base.rating,
        ratingCount: live?.ratingCount ?? 0
      }
    : null;

  const history = helperHistories[helperId] || { posted: [], accepted: [] };
  const blocked = helper && blockedHelperIds.includes(helper.id);
  const band = helper?.availabilityBand || "week";

  const myRating =
    viewerUserId && helper
      ? userRatings.find((r) => r.fromUserId === viewerUserId && r.toUserId === helper.id)?.stars
      : undefined;

  const canRate = Boolean(viewerUserId && helper && onRateUser && viewerUserId !== helper.id);

  const receivedReviews = useMemo(() => {
    if (!helper) return [];
    return (userRatings || [])
      .filter((r) => r && r.toUserId === helper.id && r.review && String(r.review).trim())
      .sort((a, b) => String(b.at || "").localeCompare(String(a.at || "")));
  }, [userRatings, helper]);

  if (!helper) {
    return (
      <section>
        <p className="muted">Profile not found.</p>
        <Link to="/" className="btn btn-secondary">
          Back
        </Link>
      </section>
    );
  }

  return (
    <section className="profile-view">
      <div className="profile-toolbar">
        <Link to="/" className="link-back">
          ← Discover
        </Link>
      </div>

      {blocked ? (
        <div className="card profile-blocked-banner">
          <p>You hid this person from your map and lists.</p>
          {onUnblockHelper ? (
            <button type="button" className="btn btn-secondary" onClick={() => onUnblockHelper(helper.id)}>
              Show again
            </button>
          ) : null}
        </div>
      ) : null}

      <header className="card profile-hero">
        <div className="profile-hero-top">
          <div>
            <h2>{helper.name}</h2>
            <p className="muted">
              {helper.neighborhood} · ~{helper.distanceKm} km · {helper.availability}
            </p>
            <p className="profile-band-wrap">
              <span className={bandBadgeClass(band)}>{BAND_LABELS[band] || band}</span>
            </p>
          </div>
          <div className="profile-rating-pill">
            <span className="rating-lg">★ {helper.rating}</span>
            <span className="muted">
              {helper.ratingCount > 0 ? `${helper.ratingCount} ratings` : "community average"}
            </span>
          </div>
        </div>
        <p className="profile-bio">{helper.bio}</p>
        <div className="chips">
          {helper.skills.map((skill) => (
            <span key={skill} className="chip">
              {skill}
            </span>
          ))}
        </div>

        {canRate ? (
          <div className="profile-rate-block">
            <span className="profile-rate-label muted">{myRating != null ? "Your rating" : "Rate this person"}</span>
            <div className="task-rate-stars profile-rate-stars">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`task-rate-star${myRating === n ? " task-rate-star--mine" : ""}`}
                  aria-label={`${n} stars`}
                  onClick={() => onRateUser(helper.id, n)}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="profile-actions">
          {!blocked ? (
            <>
              {onMessageHelper ? (
                <button className="btn" type="button" onClick={() => onMessageHelper(helper.id)}>
                  Message
                </button>
              ) : null}
              {onBlockHelper ? (
                <button type="button" className="btn btn-ghost" onClick={() => onBlockHelper(helper.id)}>
                  Hide from my lists
                </button>
              ) : null}
            </>
          ) : null}
        </div>
      </header>

      <div className="grid two-col profile-history-grid">
        <HistoryList
          title="Posted (as requester)"
          items={history.posted}
          emptyHint="Nothing here yet."
        />
        <HistoryList
          title="Help given"
          items={history.accepted}
          emptyHint="Nothing here yet."
        />
      </div>

      <div className="card history-block profile-reviews-block">
        <h4 className="history-block-title">Reviews</h4>
        {receivedReviews.length === 0 ? (
          <p className="muted">No reviews yet.</p>
        ) : (
          <ul className="history-list">
            {receivedReviews.map((r) => (
              <li key={r.id} className="history-item">
                <div className="history-item-main">
                  <strong>{r.fromUserName || "Member"}</strong>
                  {r.taskTitle ? <span className="muted">on “{r.taskTitle}”</span> : null}
                </div>
                <div className="history-item-meta">
                  <span className="muted">
                    {typeof r.stars === "number" ? `★ ${r.stars}` : "Note"}
                    {r.at ? ` · ${formatShortDate(r.at)}` : ""}
                  </span>
                </div>
                <blockquote className="task-helper-review" style={{ marginTop: "0.6rem" }}>
                  <p>{String(r.review)}</p>
                </blockquote>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default HelperProfilePage;
