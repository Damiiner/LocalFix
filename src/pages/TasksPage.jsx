import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import TaskCard from "../components/TaskCard";

function displayStatus(status) {
  if (status === "Done") return "Completed";
  if (status === "Accepted") return "In Progress";
  return status || "Open";
}

const URGENCY_RANK = { Today: 0, Tomorrow: 1, "This week": 2 };

function TasksPage({
  tasks,
  categories,
  onApply,
  onMessageRequester,
  onCompleteTask,
  currentUserName,
  applyingTaskId,
  canActAsHelper = true,
  isAdminObserver = false
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [neighborhood, setNeighborhood] = useState("All");
  const [urgencyFilter, setUrgencyFilter] = useState("All");
  const [sortBy, setSortBy] = useState("urgency");

  const highlightTaskId = searchParams.get("task") || "";

  useEffect(() => {
    if (!highlightTaskId) return;
    requestAnimationFrame(() => {
      document.getElementById(`task-${highlightTaskId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [highlightTaskId, tasks]);

  const neighborhoodOptions = useMemo(() => {
    const set = new Set(tasks.map((t) => t.neighborhood).filter(Boolean));
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [tasks]);

  const visibleTasks = useMemo(() => {
    const q = query.toLowerCase();
    const filtered = tasks.filter((task) => {
      const matchQuery = task.title.toLowerCase().includes(q);
      const matchCategory = category === "All" || task.category === category;
      const shown = displayStatus(task.status);
      const matchStatus = statusFilter === "All" || shown === statusFilter;
      const matchHood = neighborhood === "All" || task.neighborhood === neighborhood;
      const matchUrgency = urgencyFilter === "All" || task.urgency === urgencyFilter;
      return matchQuery && matchCategory && matchStatus && matchHood && matchUrgency;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "title") {
        return String(a.title || "").localeCompare(String(b.title || ""));
      }
      if (sortBy === "newest") {
        return String(b.id || "").localeCompare(String(a.id || ""));
      }
      const ua = URGENCY_RANK[a.urgency] ?? 9;
      const ub = URGENCY_RANK[b.urgency] ?? 9;
      if (ua !== ub) return ua - ub;
      return String(a.title || "").localeCompare(String(b.title || ""));
    });

    return sorted;
  }, [tasks, query, category, statusFilter, neighborhood, urgencyFilter, sortBy]);

  const clearHighlight = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("task");
    setSearchParams(next, { replace: true });
  };

  return (
    <section className="tasks-page">
      <header className="page-hero">
        <h2>{isAdminObserver ? "Task board (view only)" : "Board"}</h2>
        <p className="muted page-hero-sub">
          {isAdminObserver
            ? "Operator view: posting and accepting are disabled for this role."
            : "Find work that fits, or follow new posts that match your filters."}
        </p>
      </header>

      <div className="filters">
        <input
          placeholder="Search task title"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search tasks by title"
        />
        <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter by category">
          <option value="All">All categories</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter by status"
        >
          <option value="All">All statuses</option>
          <option value="Open">Open</option>
          <option value="In Progress">In progress</option>
          <option value="Completed">Completed</option>
        </select>
        <select
          value={neighborhood}
          onChange={(event) => setNeighborhood(event.target.value)}
          aria-label="Filter by neighborhood"
        >
          <option value="All">All neighborhoods</option>
          {neighborhoodOptions.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <select
          value={urgencyFilter}
          onChange={(event) => setUrgencyFilter(event.target.value)}
          aria-label="Filter by urgency"
        >
          <option value="All">All urgency</option>
          <option value="Today">Today</option>
          <option value="Tomorrow">Tomorrow</option>
          <option value="This week">This week</option>
        </select>
        <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} aria-label="Sort tasks">
          <option value="urgency">Sort: urgency</option>
          <option value="newest">Sort: newest first</option>
          <option value="title">Sort: title A–Z</option>
        </select>
      </div>

      {highlightTaskId ? (
        <p className="tasks-highlight-banner muted">
          Highlighted task —{" "}
          <button type="button" className="link-subtle-destructive" onClick={clearHighlight}>
            clear highlight
          </button>
        </p>
      ) : null}

      <div className="stack">
        {visibleTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onApply={onApply}
            onMessageRequester={onMessageRequester}
            onCompleteTask={onCompleteTask}
            currentUserName={currentUserName}
            canActAsHelper={canActAsHelper}
            isApplying={applyingTaskId === task.id}
            isHighlighted={highlightTaskId === task.id}
          />
        ))}
        {visibleTasks.length === 0 ? (
          <p className="muted">No tasks match your filters.</p>
        ) : null}
      </div>
    </section>
  );
}

export default TasksPage;
