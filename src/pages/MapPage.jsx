import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import L from "leaflet";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Tooltip,
  useMap
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { haversineKm, mockTravelLabels } from "../utils/geo";

const monastirCenter = [35.7772, 10.8262];
const MAP_PREFS_KEY = "localfix-map-prefs-v1";

const TILES = {
  voyager: {
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
  }
};

function readMapPrefs() {
  try {
    const raw = localStorage.getItem(MAP_PREFS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function markerStyleForRating(rating) {
  if (rating >= 4.8) {
    return { color: "#7a5c3b", fill: "#c9a227" };
  }
  if (rating >= 4.65) {
    return { color: "#4a5d44", fill: "#8faa84" };
  }
  return { color: "#6b4a3e", fill: "#c17f59" };
}

function markerRadiusForRating(rating) {
  const base = 9;
  return base + Math.min(5, Math.round((rating - 4.4) * 8));
}

function createDotIcon(helper) {
  const r = markerRadiusForRating(helper.rating);
  const { fill } = markerStyleForRating(helper.rating);
  const size = r * 2;
  return L.divIcon({
    className: "map-dot-marker-wrap",
    html: `<div class="map-dot-marker-dot" style="width:${size}px;height:${size}px;background:${fill};box-shadow:0 0 0 2px rgba(244,238,228,0.9),0 2px 10px rgba(15,14,12,0.35);border-radius:50%"></div>`,
    iconSize: [size, size],
    iconAnchor: [r, r]
  });
}

function FitBounds({ points, reduceMotion }) {
  const map = useMap();

  useEffect(() => {
    const anim = !reduceMotion;
    if (!points.length) {
      map.setView(monastirCenter, 12, { animate: anim });
      return;
    }
    const bounds = L.latLngBounds(points.map((p) => L.latLng(p[0], p[1])));
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [56, 56], maxZoom: 13, animate: anim });
    }
  }, [map, points, reduceMotion]);

  return null;
}

function MapEscapeClosePopup() {
  const map = useMap();
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        map.closePopup();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [map]);
  return null;
}

function WiderViewControl() {
  const map = useMap();
  const [reduceMotion, setReduceMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fn = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return (
    <div className="map-floating-control map-floating-control--tr">
      <button
        type="button"
        className="btn btn-ghost map-float-btn"
        onClick={() => map.setView(monastirCenter, 11, { animate: !reduceMotion })}
      >
        City view
      </button>
    </div>
  );
}

function Stars({ value }) {
  return (
    <span className="map-popup-stars" title={`${value} average`}>
      <span className="map-popup-stars-num">{value.toFixed(1)}</span>
      <span className="map-popup-stars-icon" aria-hidden="true">
        {"\u2605"}
      </span>
    </span>
  );
}

const BAND_LABELS = {
  all: "Any timing",
  now: "Often same day",
  week: "Within a few days",
  scheduled: "Set schedule"
};

function MapPage({ helpers, categories, neighborhoods, onMessageHelper, onReportHelper, onBlockHelper }) {
  const prefs = readMapPrefs();
  const [searchParams] = useSearchParams();
  const searchRef = useRef(null);

  const [skill, setSkill] = useState(prefs?.skill ?? "All");
  const [neighborhood, setNeighborhood] = useState(prefs?.neighborhood ?? "All");
  const [minRating, setMinRating] = useState(prefs?.minRating ?? "0");
  const [query, setQuery] = useState(prefs?.query ?? "");
  const [basemap, setBasemap] = useState(prefs?.basemap ?? "voyager");
  const [availabilityBand, setAvailabilityBand] = useState(prefs?.availabilityBand ?? "all");
  const [userLoc, setUserLoc] = useState(null);
  const [locHint, setLocHint] = useState("");

  const [reduceMotion, setReduceMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fn = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  useEffect(() => {
    const n = searchParams.get("neighborhood");
    if (n && neighborhoods.includes(n)) {
      setNeighborhood(n);
    }
  }, [searchParams, neighborhoods]);

  useEffect(() => {
    localStorage.setItem(
      MAP_PREFS_KEY,
      JSON.stringify({
        skill,
        neighborhood,
        minRating,
        query,
        basemap,
        availabilityBand
      })
    );
  }, [skill, neighborhood, minRating, query, basemap, availabilityBand]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.target?.isContentEditable) {
        return;
      }
      e.preventDefault();
      searchRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const refPoint = userLoc || monastirCenter;

  const requestLocation = () => {
    setLocHint("");
    if (!navigator.geolocation) {
      setLocHint("Geolocation not available in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLoc([pos.coords.latitude, pos.coords.longitude]);
        setLocHint("Using your location for distances.");
      },
      () => setLocHint("Could not read location — distances use city center."),
      { enableHighAccuracy: false, timeout: 12000 }
    );
  };

  const clearAllFilters = useCallback(() => {
    setSkill("All");
    setNeighborhood("All");
    setMinRating("0");
    setQuery("");
    setAvailabilityBand("all");
  }, []);

  const filteredHelpers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return helpers.filter((helper) => {
      const matchSkill = skill === "All" || helper.skills.includes(skill);
      const matchNeighborhood = neighborhood === "All" || helper.neighborhood === neighborhood;
      const matchRating = helper.rating >= Number(minRating);
      const band = helper.availabilityBand || "week";
      const matchBand = availabilityBand === "all" || band === availabilityBand;
      const matchQuery =
        !q ||
        helper.name.toLowerCase().includes(q) ||
        helper.neighborhood.toLowerCase().includes(q) ||
        helper.skills.some((s) => s.toLowerCase().includes(q));
      return matchSkill && matchNeighborhood && matchRating && matchBand && matchQuery;
    });
  }, [helpers, skill, neighborhood, minRating, query, availabilityBand]);

  const boundsPoints = useMemo(() => filteredHelpers.map((h) => h.location), [filteredHelpers]);

  const tile = TILES[basemap] || TILES.voyager;

  const bandBadgeClass = (band) => {
    if (band === "now") return "avail-badge avail-badge--now";
    if (band === "week") return "avail-badge avail-badge--week";
    return "avail-badge avail-badge--scheduled";
  };

  return (
    <section className="map-page">
      <header className="page-hero map-hero">
        <div className="map-hero-text">
          <p className="map-hero-eyebrow">Atlas</p>
          <h2>People near you</h2>
          <p className="muted page-hero-sub">
            Marker colors reflect ratings. Press <kbd className="kbd-hint">/</kbd> to focus search.
          </p>
        </div>
        <div className="map-hero-badge" aria-hidden="true">
          <span className="map-hero-badge-inner">{filteredHelpers.length}</span>
          <span className="map-hero-badge-label">on map</span>
        </div>
      </header>

      <div className="map-layout">
        <aside className="card map-panel" aria-label="Map filters">
          <h3 className="map-panel-title">Refine</h3>
          <label className="map-field">
            <span>Search</span>
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name, skill, area…"
              autoComplete="off"
            />
          </label>
          <label className="map-field">
            <span>Skill</span>
            <select value={skill} onChange={(e) => setSkill(e.target.value)}>
              <option value="All">All skills</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="map-field">
            <span>Neighborhood</span>
            <select value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)}>
              <option value="All">Everywhere</option>
              {neighborhoods.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="map-field">
            <span>Availability</span>
            <select value={availabilityBand} onChange={(e) => setAvailabilityBand(e.target.value)}>
              <option value="all">{BAND_LABELS.all}</option>
              <option value="now">{BAND_LABELS.now}</option>
              <option value="week">{BAND_LABELS.week}</option>
              <option value="scheduled">{BAND_LABELS.scheduled}</option>
            </select>
          </label>
          <label className="map-field">
            <span>Minimum rating</span>
            <select value={minRating} onChange={(e) => setMinRating(e.target.value)}>
              <option value="0">Any</option>
              <option value="4.5">4.5+</option>
              <option value="4.7">4.7+</option>
              <option value="4.8">4.8+</option>
            </select>
          </label>

          <div className="map-field">
            <span>Map style</span>
            <div className="map-segmented" role="group" aria-label="Basemap">
              <button
                type="button"
                className={basemap === "voyager" ? "is-active" : ""}
                onClick={() => setBasemap("voyager")}
              >
                Day
              </button>
              <button
                type="button"
                className={basemap === "dark" ? "is-active" : ""}
                onClick={() => setBasemap("dark")}
              >
                Night
              </button>
            </div>
          </div>

          <div className="map-field map-field--row">
            <button type="button" className="btn btn-ghost map-locate-btn" onClick={requestLocation}>
              Use my location
            </button>
          </div>
          {locHint ? <p className="map-locate-hint muted">{locHint}</p> : null}

          <div className="map-legend">
            <p className="map-legend-title">Markers</p>
            <ul className="map-legend-list">
              <li>
                <span className="map-legend-dot map-legend-dot--high" /> 4.8+ top picks
              </li>
              <li>
                <span className="map-legend-dot map-legend-dot--mid" /> 4.65–4.79
              </li>
              <li>
                <span className="map-legend-dot map-legend-dot--soft" /> 4.5–4.64
              </li>
            </ul>
          </div>

          {filteredHelpers.length === 0 ? (
            <div className="map-panel-empty-block">
              <p className="map-panel-empty muted">Nothing matches these filters.</p>
              <button type="button" className="btn btn-secondary map-panel-clear" onClick={clearAllFilters}>
                Clear filters
              </button>
            </div>
          ) : null}
        </aside>

        <div className="map-stage">
          <div className="card map-card map-card--stage">
            <MapContainer center={monastirCenter} zoom={12} scrollWheelZoom className="map-view">
              <TileLayer attribution={tile.attribution} url={tile.url} />
              <FitBounds points={boundsPoints} reduceMotion={reduceMotion} />
              <MapEscapeClosePopup />
              <WiderViewControl />
              {userLoc ? (
                <CircleMarker
                  center={userLoc}
                  radius={8}
                  pathOptions={{ color: "#5a7d6c", fillColor: "#8faa84", fillOpacity: 0.85, weight: 2 }}
                >
                  <Tooltip direction="top" opacity={1}>
                    Your position (approx.)
                  </Tooltip>
                </CircleMarker>
              ) : null}
              <MarkerClusterGroup
                chunkedLoading
                maxClusterRadius={52}
                spiderfyDistanceMultiplier={1.15}
                showCoverageOnHover={false}
              >
                {filteredHelpers.map((helper) => {
                  const km = haversineKm(refPoint, helper.location);
                  const { walkMin, driveMin } = mockTravelLabels(km);
                  const icon = createDotIcon(helper);
                  const band = helper.availabilityBand || "week";
                  return (
                    <Marker key={helper.id} position={helper.location} icon={icon}>
                      <Tooltip direction="top" offset={[0, -10]} opacity={1} className="map-tooltip-wrap">
                        <div className="map-tooltip">
                          <strong>{helper.name}</strong>
                          <span className="map-tooltip-rating">★ {helper.rating}</span>
                          <span className={bandBadgeClass(band)}>{BAND_LABELS[band] || band}</span>
                          <span>{helper.neighborhood}</span>
                          <span className="map-tooltip-eta muted">
                            ~{km.toFixed(1)} km · ~{walkMin} min walk · ~{driveMin} min drive
                          </span>
                          <span className="map-tooltip-skills">{helper.skills.join(" · ")}</span>
                        </div>
                      </Tooltip>
                      <Popup className="map-popup-outer">
                        <div className="map-popup">
                          <div className="map-popup-head">
                            <strong>{helper.name}</strong>
                            <Stars value={helper.rating} />
                          </div>
                          <p className="map-popup-area">{helper.neighborhood}</p>
                          <span className={bandBadgeClass(band)}>{BAND_LABELS[band] || band}</span>
                          <p className="map-popup-skills">{helper.skills.join(" · ")}</p>
                          <p className="map-popup-avail muted">{helper.availability}</p>
                          <p className="map-popup-eta muted">
                            ~{km.toFixed(1)} km straight-line · walk / drive times are rough estimates
                          </p>
                          <div className="map-popup-contact">
                            <span>{helper.phone}</span>
                            <span>{helper.email}</span>
                          </div>
                          <div className="map-popup-actions">
                            {onMessageHelper ? (
                              <button
                                type="button"
                                className="btn btn-message"
                                onClick={() => onMessageHelper(helper.id)}
                              >
                                Message
                              </button>
                            ) : null}
                            <Link className="btn btn-secondary" to={`/profile/${helper.id}`}>
                              Profile
                            </Link>
                            {onReportHelper ? (
                              <button
                                type="button"
                                className="btn btn-danger btn-compact"
                                onClick={() => onReportHelper(helper.id)}
                              >
                                Report
                              </button>
                            ) : null}
                          </div>
                          {onBlockHelper ? (
                            <button
                              type="button"
                              className="link-block-helper"
                              onClick={() => onBlockHelper(helper.id)}
                            >
                              Hide from my map &amp; lists
                            </button>
                          ) : null}
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MarkerClusterGroup>
            </MapContainer>

            {filteredHelpers.length === 0 ? (
              <div className="map-empty-overlay">
                <p>No helpers here — try a wider area or reset filters.</p>
                <div className="map-empty-overlay-actions">
                  <button type="button" className="btn" onClick={clearAllFilters}>
                    Clear all filters
                  </button>
                  <span className="map-empty-or muted">or</span>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setNeighborhood("All");
                      setSkill("All");
                      setMinRating("0");
                    }}
                  >
                    Widen neighborhood
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

export default MapPage;
