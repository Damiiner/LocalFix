export function displayTaskStatus(status) {
  if (status === "Done") return "Completed";
  if (status === "Accepted") return "In Progress";
  return status || "Open";
}

/** Criteria shape matches TasksPage filter state + { enabled: true }. */
export function taskMatchesWatch(task, c) {
  if (!c?.enabled) return false;
  const q = String(c.query || "").toLowerCase();
  if (q && !String(task.title || "").toLowerCase().includes(q)) return false;
  if (c.category !== "All" && task.category !== c.category) return false;
  const shown = displayTaskStatus(task.status);
  if (c.statusFilter !== "All" && shown !== c.statusFilter) return false;
  if (c.neighborhood !== "All" && task.neighborhood !== c.neighborhood) return false;
  if (c.urgency && c.urgency !== "All" && task.urgency !== c.urgency) return false;
  return true;
}
