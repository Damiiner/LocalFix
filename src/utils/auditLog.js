export function createAuditEntry(actorId, actorName, action, detail) {
  return {
    id: `audit-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    at: new Date().toISOString(),
    actorId: actorId || null,
    actorName: actorName || "System",
    action,
    detail: String(detail || "").slice(0, 500)
  };
}
