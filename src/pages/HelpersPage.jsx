import { useMemo, useState } from "react";
import HelperCard from "../components/HelperCard";

function HelpersPage({ helpers, categories, onMessageHelper, onBlockHelper, isDirectoryOnly = false }) {
  const [skill, setSkill] = useState("All");

  const filtered = useMemo(() => {
    if (skill === "All") {
      return helpers;
    }
    return helpers.filter((helper) => helper.skills.includes(skill));
  }, [helpers, skill]);

  return (
    <section className="helpers-page">
      <header className="page-hero">
        <h2>{isDirectoryOnly ? "Network directory" : "Helpers"}</h2>
        <p className="muted page-hero-sub">
          {isDirectoryOnly
            ? "Directory view for operators. Use Console for accounts and safety."
            : "People nearby, with ratings from the community."}
        </p>
      </header>

      <div className="filters">
        <select value={skill} onChange={(event) => setSkill(event.target.value)}>
          <option value="All">All skills</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div className="stack">
        {filtered.length === 0 ? (
          <p className="muted">No helpers match your selected skill.</p>
        ) : (
          filtered.map((helper) => (
            <HelperCard
              key={helper.id}
              helper={helper}
              onMessage={onMessageHelper}
              onBlockHelper={onBlockHelper}
            />
          ))
        )}
      </div>
    </section>
  );
}

export default HelpersPage;
