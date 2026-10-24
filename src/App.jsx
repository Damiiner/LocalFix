import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import CompletionFeedbackModal from "./components/CompletionFeedbackModal";
import Layout from "./components/Layout";
import TasksPage from "./pages/TasksPage";
import HelpersPage from "./pages/HelpersPage";
import MessagesPage from "./pages/MessagesPage";
import RequesterPage from "./pages/RequesterPage";
import MapPage from "./pages/MapPage";
import ReportPage from "./pages/ReportPage";
import AuthPage from "./pages/AuthPage";
import HelperProfilePage from "./pages/HelperProfilePage";
import SettingsPage from "./pages/SettingsPage";
import AdminPage from "./pages/AdminPage";
import NotificationsPage from "./pages/NotificationsPage";
import {
  helpers as allHelpers,
  initialConversations,
  neighborhoods,
  taskCategories,
  tasks as seedTasks,
  trustSafetyTeam
} from "./data/mockData";
import { createAuditEntry } from "./utils/auditLog";
import { hasPasswordHash, hashPassword, verifyPassword } from "./utils/passwordCrypto";
import { validatePublicEmail, validateTaskForm } from "./utils/validation";
import { clearPersistedState, loadPersistedState, savePersistedState } from "./utils/persistState";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const ADMIN_EMAIL = "admin@localfix.app";

function normalizeAccount(a) {
  return {
    ...a,
    skills: a.skills ?? "",
    availability: a.availability ?? "",
    paused: Boolean(a.paused),
    bio: a.bio ?? "",
    avatarUrl: a.avatarUrl ?? "",
    banned: Boolean(a.banned),
    createdAt: a.createdAt || new Date().toISOString(),
    lastLoginAt: a.lastLoginAt ?? null,
    emailVerified: Boolean(a.emailVerified),
    adminNotes: typeof a.adminNotes === "string" ? a.adminNotes : "",
    passwordHash: a.passwordHash,
    password: a.password
  };
}

function migrateConversations(list) {
  return (list || []).map((c) => ({
    ...c,
    messages: (c.messages || []).map((m) => ({
      ...m,
      read: m.read === false ? false : true
    }))
  }));
}

async function accountPasswordMatches(account, plain) {
  if (hasPasswordHash(account)) {
    return verifyPassword(plain, account.passwordHash);
  }
  return account.password === plain;
}

function buildSeedAccounts() {
  const created = new Date().toISOString();
  return [
    {
      id: "admin1",
      name: "Platform Admin",
      email: ADMIN_EMAIL,
      password: "admin123",
      role: "admin",
      skills: "",
      availability: "",
      paused: false,
      bio: "",
      avatarUrl: "",
      banned: false,
      createdAt: created,
      lastLoginAt: null,
      emailVerified: true,
      adminNotes: ""
    },
    ...allHelpers.map((helper) => ({
      id: helper.id,
      name: helper.name,
      email: helper.email,
      password: "123456",
      skills: (helper.skills || []).join(", "),
      availability: helper.availability || "",
      paused: false,
      bio: helper.bio || "",
      avatarUrl: "",
      banned: false,
      createdAt: created,
      lastLoginAt: null,
      emailVerified: true,
      adminNotes: ""
    }))
  ];
}

function buildInitialAppState() {
  const seedAccounts = buildSeedAccounts().map(normalizeAccount);
  const loaded = loadPersistedState();
  if (loaded && Array.isArray(loaded.accounts) && (loaded.v === 4 || loaded.v === 5)) {
    let accounts = loaded.accounts.map(normalizeAccount);
    const adminOk = accounts.some(
      (a) => a.role === "admin" && String(a.email || "").toLowerCase() === ADMIN_EMAIL
    );
    if (!adminOk) {
      const seedAdmin = seedAccounts.find((a) => a.role === "admin");
      if (seedAdmin) {
        accounts = [seedAdmin, ...accounts.filter((a) => a.id !== seedAdmin.id)];
      }
    }
    const authUser = loaded.authUserId
      ? accounts.find((a) => a.id === loaded.authUserId && !a.banned)
      : null;
    const convSource =
      Array.isArray(loaded.conversations) && loaded.conversations.length
        ? loaded.conversations
        : initialConversations;
    return {
      accounts,
      tasks: Array.isArray(loaded.tasks) && loaded.tasks.length ? loaded.tasks : seedTasks,
      conversations: migrateConversations(convSource),
      activeConversationId:
        loaded.activeConversationId ??
        (Array.isArray(loaded.conversations) && loaded.conversations[0]?.id) ??
        initialConversations[0]?.id ??
        null,
      reports: Array.isArray(loaded.reports) ? loaded.reports : [],
      notifications: Array.isArray(loaded.notifications) ? loaded.notifications : [],
      blockedHelperIds: Array.isArray(loaded.blockedHelperIds) ? loaded.blockedHelperIds : [],
      selectedHelperIdForReport: loaded.selectedHelperIdForReport || "",
      authUser: authUser ? normalizeAccount(authUser) : null,
      auditLog: Array.isArray(loaded.auditLog) ? loaded.auditLog : [],
      offlineQueue: Array.isArray(loaded.offlineQueue) ? loaded.offlineQueue : [],
      userRatings: Array.isArray(loaded.userRatings) ? loaded.userRatings : []
    };
  }
  return {
    accounts: seedAccounts,
    tasks: seedTasks,
    conversations: migrateConversations(initialConversations),
    activeConversationId: initialConversations[0]?.id || null,
    reports: [],
    notifications: [],
    blockedHelperIds: [],
    selectedHelperIdForReport: "",
    authUser: null,
    auditLog: [],
    offlineQueue: [],
    userRatings: []
  };
}

const INIT = buildInitialAppState();

function App() {
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState(() => INIT.accounts);
  const [authUser, setAuthUser] = useState(() => INIT.authUser);
  const [tasks, setTasks] = useState(() => INIT.tasks);
  const [conversations, setConversations] = useState(() => INIT.conversations);
  const conversationsRef = useRef(INIT.conversations);
  conversationsRef.current = conversations;
  const [activeConversationId, setActiveConversationId] = useState(() => INIT.activeConversationId);
  const [reports, setReports] = useState(() => INIT.reports);
  const [notifications, setNotifications] = useState(() => INIT.notifications);
  const [selectedHelperIdForReport, setSelectedHelperIdForReport] = useState(
    () => INIT.selectedHelperIdForReport
  );
  const [toasts, setToasts] = useState([]);
  const [applyingTaskId, setApplyingTaskId] = useState(null);
  const [blockedHelperIds, setBlockedHelperIds] = useState(() => INIT.blockedHelperIds);
  const [auditLog, setAuditLog] = useState(() => INIT.auditLog || []);
  const [offlineQueue, setOfflineQueue] = useState(() => INIT.offlineQueue || []);
  const [userRatings, setUserRatings] = useState(() => INIT.userRatings || []);
  const [completionFeedback, setCompletionFeedback] = useState(null);
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const appendAudit = useCallback((action, detail) => {
    const entry = createAuditEntry(authUser?.id ?? null, authUser?.name ?? "System", action, detail);
    setAuditLog((prev) => [entry, ...prev].slice(0, 200));
  }, [authUser?.id, authUser?.name]);

  useEffect(() => {
    const accountsForSave = accounts.map((a) => {
      if (a.passwordHash) {
        const { password: _legacy, ...rest } = a;
        return rest;
      }
      return a;
    });
    savePersistedState({
      accounts: accountsForSave,
      tasks,
      conversations,
      activeConversationId,
      reports,
      notifications,
      blockedHelperIds,
      selectedHelperIdForReport,
      authUserId: authUser?.id ?? null,
      auditLog,
      offlineQueue,
      userRatings
    });
  }, [
    accounts,
    tasks,
    conversations,
    activeConversationId,
    reports,
    notifications,
    blockedHelperIds,
    selectedHelperIdForReport,
    authUser,
    auditLog,
    offlineQueue,
    userRatings
  ]);

  useEffect(() => {
    const up = () => setIsOnline(true);
    const down = () => setIsOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  useEffect(() => {
    if (authUser && authUser.banned) {
      setAuthUser(null);
      navigate("/login");
    }
  }, [authUser, navigate]);

  const helpersWithRatings = useMemo(() => {
    const agg = new Map();
    for (const r of userRatings) {
      if (!r || !r.toUserId) continue;
      if (typeof r.stars !== "number" || !Number.isFinite(r.stars)) continue;
      if (!agg.has(r.toUserId)) agg.set(r.toUserId, { sum: 0, n: 0 });
      const x = agg.get(r.toUserId);
      x.sum += r.stars;
      x.n += 1;
    }
    return allHelpers.map((h) => {
      const a = agg.get(h.id);
      if (!a || !a.n) {
        return { ...h, ratingCount: 0 };
      }
      const avg = Math.round((a.sum / a.n) * 10) / 10;
      return { ...h, rating: avg, ratingCount: a.n };
    });
  }, [userRatings]);

  const visibleHelpers = useMemo(
    () => helpersWithRatings.filter((helper) => !blockedHelperIds.includes(helper.id)),
    [helpersWithRatings, blockedHelperIds]
  );

  const isAdmin = authUser?.role === "admin";

  const appendNotification = useCallback((userId, text) => {
    if (!userId || !text) return;
    setNotifications((prev) => [
      {
        id: `n-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        userId,
        text,
        read: false,
        at: new Date().toISOString()
      },
      ...prev
    ]);
  }, []);

  const notifyByName = useCallback(
    (name, text) => {
      const acct = accounts.find((a) => a.name === name);
      if (acct) appendNotification(acct.id, text);
    },
    [accounts, appendNotification]
  );

  const notifyAdmins = useCallback(
    (text) => {
      accounts.filter((a) => a.role === "admin").forEach((a) => appendNotification(a.id, text));
    },
    [accounts, appendNotification]
  );

  const pushToast = (message, type = "info") => {
    const id = `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 2600);
  };

  const handleLogin = async ({ email, password }) => {
    await sleep(300);
    const emailCheck = validatePublicEmail(email);
    if (!emailCheck.ok) {
      return { ok: false, error: emailCheck.error };
    }
    const account = accounts.find((item) => item.email.toLowerCase() === emailCheck.email);
    if (!account) {
      return { ok: false, error: "Invalid email or password." };
    }
    const match = await accountPasswordMatches(account, password);
    if (!match) {
      return { ok: false, error: "Invalid email or password." };
    }
    if (account.banned) {
      return { ok: false, error: "This account has been suspended." };
    }
    if (account.paused) {
      return { ok: false, error: "This account is paused. Use Reactivate below.", code: "paused" };
    }
    const now = new Date().toISOString();
    let nextHash = account.passwordHash;
    if (!hasPasswordHash(account)) {
      nextHash = await hashPassword(password);
    }
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === account.id
          ? { ...a, lastLoginAt: now, passwordHash: nextHash, password: undefined }
          : a
      )
    );
    const refreshed = normalizeAccount({
      ...account,
      lastLoginAt: now,
      passwordHash: nextHash,
      password: undefined
    });
    setAuthUser(refreshed);
    pushToast("Welcome back!", "success");
    return { ok: true };
  };

  const handleReactivateAccount = async ({ email, password }) => {
    await sleep(300);
    const emailCheck = validatePublicEmail(email);
    if (!emailCheck.ok) {
      return { ok: false, error: emailCheck.error };
    }
    const account = accounts.find((item) => item.email.toLowerCase() === emailCheck.email);
    if (!account || !(await accountPasswordMatches(account, password))) {
      return { ok: false, error: "Invalid email or password." };
    }
    if (!account.paused) {
      return { ok: false, error: "This account is not paused — try logging in." };
    }
    let nextHash = account.passwordHash;
    if (!hasPasswordHash(account)) {
      nextHash = await hashPassword(password);
    }
    setAccounts((prev) =>
      prev.map((item) =>
        item.id === account.id
          ? { ...item, paused: false, passwordHash: nextHash, password: undefined }
          : item
      )
    );
    const cleared = {
      ...account,
      paused: false,
      passwordHash: nextHash,
      password: undefined
    };
    setAuthUser(normalizeAccount(cleared));
    pushToast("Account reactivated — welcome back.", "success");
    return { ok: true };
  };

  const handleRegister = async ({ name, email, password }) => {
    await sleep(350);
    if (!name.trim() || !email.trim() || !password.trim()) {
      return { ok: false, error: "All fields are required." };
    }
    const emailCheck = validatePublicEmail(email);
    if (!emailCheck.ok) {
      return { ok: false, error: emailCheck.error };
    }
    if (password.trim().length < 6) {
      return { ok: false, error: "Password must be at least 6 characters." };
    }
    const exists = accounts.some((item) => item.email.toLowerCase() === emailCheck.email);
    if (exists) {
      return { ok: false, error: "An account with this email already exists." };
    }
    const passwordHash = await hashPassword(password.trim());
    const newAccount = {
      id: `u${Date.now()}`,
      name: name.trim(),
      email: emailCheck.email,
      password: undefined,
      passwordHash,
      skills: "",
      availability: "",
      paused: false,
      bio: "",
      avatarUrl: "",
      banned: false,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      emailVerified: true,
      adminNotes: ""
    };
    setAccounts((prev) => [newAccount, ...prev]);
    setAuthUser(normalizeAccount(newAccount));
    pushToast("Account created successfully.", "success");
    return { ok: true };
  };

  const handleLogout = () => {
    setAuthUser(null);
    navigate("/login");
  };

  const handlePauseAccount = () => {
    if (!authUser) return;
    if (authUser.role === "admin") {
      pushToast("The administrator account cannot be paused.", "info");
      return;
    }
    if (
      !window.confirm(
        "Pause your account? You will be signed out. Sign in again and choose Reactivate to resume."
      )
    ) {
      return;
    }
    setAccounts((prev) =>
      prev.map((account) =>
        account.id === authUser.id ? { ...account, paused: true } : account
      )
    );
    setAuthUser(null);
    navigate("/login");
    pushToast("Account paused.", "info");
  };

  const handleResetLocalData = () => {
    if (!window.confirm("Reset all data stored in this browser for LocalFix? This cannot be undone.")) {
      return;
    }
    clearPersistedState();
    window.location.reload();
  };

  const handleBlockHelper = (helperId) => {
    setBlockedHelperIds((prev) => (prev.includes(helperId) ? prev : [...prev, helperId]));
    pushToast("Hidden from lists and map. Manage in Settings.", "info");
  };

  const handleUnblockHelper = (helperId) => {
    setBlockedHelperIds((prev) => prev.filter((id) => id !== helperId));
    pushToast("Helper visible again.", "success");
  };

  const handleApply = async (taskId) => {
    if (authUser?.role === "admin") {
      pushToast("Administrator accounts cannot offer help on tasks.", "info");
      return;
    }
    const helperName = authUser?.name || "Member";
    const task = tasks.find((t) => t.id === taskId);
    if (!task) {
      return;
    }
    if (task.requester === helperName) {
      pushToast("You can't accept a task you posted.", "info");
      return;
    }
    if (task.status !== "Open") {
      pushToast("This task is no longer open.", "info");
      return;
    }
    setApplyingTaskId(taskId);
    await sleep(450);
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, status: "In Progress", acceptedBy: helperName } : t
      )
    );
    setApplyingTaskId(null);
    pushToast("You're connected — message the requester to coordinate.", "success");
    notifyByName(task.requester, `${helperName} accepted your task “${task.title}”.`);
  };

  const handleCompleteTask = (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.requester !== authUser?.name) {
      pushToast("Only the requester can mark a task complete.", "info");
      return;
    }
    if (task.status !== "In Progress" && task.status !== "Accepted") {
      pushToast("This task can't be completed yet.", "info");
      return;
    }
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        if (t.requester !== authUser?.name) return t;
        if (t.status !== "In Progress" && t.status !== "Accepted") return t;
        return { ...t, status: "Completed" };
      })
    );
    if (task.acceptedBy) {
      notifyByName(task.acceptedBy, `“${task.title}” was marked complete by ${task.requester}.`);
    }
    pushToast("Task marked complete.", "success");
    if (task.acceptedBy) {
      setCompletionFeedback({
        taskId,
        taskTitle: task.title,
        helperName: task.acceptedBy
      });
    }
  };

  const handleSubmitHelperFeedback = (taskId, { rating, review }) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.requester !== authUser?.name || task.status !== "Completed") {
      setCompletionFeedback(null);
      return;
    }
    const stars = rating != null ? Math.min(5, Math.max(1, Math.round(Number(rating)))) : null;
    const rev = review && String(review).trim() ? String(review).trim().slice(0, 500) : null;
    if (stars == null && !rev) {
      setCompletionFeedback(null);
      return;
    }
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const next = { ...t };
        if (stars != null) next.helperRating = stars;
        if (rev) next.helperReview = rev;
        return next;
      })
    );
    const helperName = task.acceptedBy;
    const helperAccountId =
      accounts.find((a) => a.name === helperName)?.id ||
      allHelpers.find((h) => h.name === helperName)?.id ||
      null;
    if (authUser && helperAccountId) {
      setUserRatings((prev) => {
        const rest = prev.filter((r) => {
          if (!r) return false;
          if (r.fromUserId !== authUser.id) return true;
          if (r.toUserId !== helperAccountId) return true;
          return r.taskId !== taskId;
        });
        return [
          ...rest,
          {
            id: `ur-${Date.now()}`,
            fromUserId: authUser.id,
            fromUserName: authUser.name,
            toUserId: helperAccountId,
            stars: stars == null ? null : stars,
            review: rev || null,
            taskId,
            taskTitle: task.title,
            at: new Date().toISOString()
          }
        ];
      });
    }
    if (helperName) {
      if (stars != null && rev) {
        notifyByName(
          helperName,
          `${task.requester} rated you ${stars}/5 and left a note for “${task.title}”.`
        );
      } else if (stars != null) {
        notifyByName(helperName, `${task.requester} rated you ${stars}/5 for “${task.title}”.`);
      } else if (rev) {
        notifyByName(helperName, `${task.requester} left a note for “${task.title}”.`);
      }
    }
    setCompletionFeedback(null);
    pushToast("Feedback saved.", "success");
  };

  const handleRateUser = (toUserId, rating) => {
    if (!authUser || authUser.id === toUserId) {
      return;
    }
    const stars = Math.min(5, Math.max(1, Math.round(Number(rating))));
    setUserRatings((prev) => {
      const rest = prev.filter((r) => !(r.fromUserId === authUser.id && r.toUserId === toUserId));
      return [
        ...rest,
        {
          id: `ur-${Date.now()}`,
          fromUserId: authUser.id,
          fromUserName: authUser.name,
          toUserId,
          stars,
          review: null,
          taskId: null,
          taskTitle: null,
          at: new Date().toISOString()
        }
      ];
    });
    const named =
      accounts.find((a) => a.id === toUserId)?.name ||
      allHelpers.find((h) => h.id === toUserId)?.name ||
      "";
    pushToast(named ? `You rated ${named}.` : "Rating saved.", "success");
    appendNotification(toUserId, `${authUser.name} gave you ${stars}★.`);
  };

  const handleCreateTask = async (form) => {
    if (authUser?.role === "admin") {
      return { ok: false, errors: { title: "Administrators cannot post tasks." } };
    }
    const validation = validateTaskForm(form);
    if (!validation.isValid) {
      return { ok: false, errors: validation.errors };
    }

    await sleep(500);
    const newTask = {
      id: `t${Date.now()}`,
      requester: authUser?.name || "Member",
      status: "Open",
      helperRating: null,
      helperReview: null,
      ...form,
      title: validation.title,
      description: validation.description,
      attachments: Array.isArray(form.attachments) ? form.attachments : []
    };
    setTasks((prev) => [newTask, ...prev]);
    pushToast("Task published successfully.", "success");
    return { ok: true };
  };

  const handleUpdateTask = async (taskId, form) => {
    if (authUser?.role === "admin") {
      return { ok: false, error: "Administrators cannot edit tasks." };
    }
    const target = tasks.find((t) => t.id === taskId);
    if (!target || target.status !== "Open") {
      return { ok: false, error: "Only open tasks can be edited." };
    }
    const validation = validateTaskForm(form);
    if (!validation.isValid) {
      return { ok: false, errors: validation.errors };
    }
    await sleep(400);
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              ...form,
              title: validation.title,
              description: validation.description,
              attachments: Array.isArray(form.attachments) ? form.attachments : task.attachments || []
            }
          : task
      )
    );
    pushToast("Task updated.", "success");
    return { ok: true };
  };

  const handleDeleteTask = (taskId) => {
    if (authUser?.role === "admin") {
      pushToast("Administrators cannot delete tasks.", "info");
      return;
    }
    const target = tasks.find((t) => t.id === taskId);
    if (!target || target.status !== "Open") {
      pushToast("Only open tasks can be deleted.", "info");
      return;
    }
    if (!window.confirm("Delete this task? This cannot be undone.")) {
      return;
    }
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
    pushToast("Task removed.", "info");
  };

  const flushMessageQueue = useCallback(() => {
    setOfflineQueue((queue) => {
      if (!queue.length) return queue;
      const batch = [...queue];
      const senderName = authUser?.name || "Member";
      void (async () => {
        for (const item of batch) {
          await sleep(250);
          const conv = conversationsRef.current.find((c) => c.id === item.conversationId);
          const peerForNotify = conv?.peerName;
          const taskTitle = conv?.taskTitle || "a task";
          const now = new Date();
          const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
          setConversations((prev) =>
            prev.map((c) =>
              c.id === item.conversationId
                ? {
                    ...c,
                    messages: [
                      ...c.messages,
                      {
                        id: `m${Date.now()}-${Math.random().toString(16).slice(2)}`,
                        from: senderName,
                        content: item.content,
                        time,
                        read: true,
                        imageDataUrl: item.imageDataUrl || undefined
                      }
                    ]
                  }
                : c
            )
          );
          if (peerForNotify) {
            notifyByName(peerForNotify, `New message about “${taskTitle}”.`);
          }
        }
        pushToast("Queued messages sent.", "success");
      })();
      return [];
    });
  }, [authUser?.name, notifyByName]);

  useEffect(() => {
    window.addEventListener("online", flushMessageQueue);
    return () => window.removeEventListener("online", flushMessageQueue);
  }, [flushMessageQueue]);

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.onLine) {
      flushMessageQueue();
    }
  }, [flushMessageQueue]);

  const handleSendMessage = async (conversationId, content, options = {}) => {
    const { imageDataUrl } = options;
    const text = String(content || "").trim();
    if (!text && !imageDataUrl) {
      return { ok: false, error: "Add text or an image." };
    }
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setOfflineQueue((q) => [...q, { conversationId, content: text, imageDataUrl }]);
      pushToast("You're offline — message queued for when you're back online.", "info");
      return { ok: true };
    }
    await sleep(350);
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const conversation = conversations.find((c) => c.id === conversationId);
    const msg = {
      id: `m${Date.now()}-${Math.random().toString(16).slice(2)}`,
      from: authUser?.name || "Member",
      content: text,
      time,
      read: true
    };
    if (imageDataUrl) msg.imageDataUrl = imageDataUrl;
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId ? { ...c, messages: [...c.messages, msg] } : c
      )
    );
    if (conversation?.peerName) {
      notifyByName(
        conversation.peerName,
        `New message about “${conversation.taskTitle || "a task"}”.`
      );
    }
    return { ok: true };
  };

  const handleMarkConversationRead = (conversationId) => {
    const me = authUser?.name;
    if (!me) return;
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== conversationId) return c;
        return {
          ...c,
          messages: c.messages.map((m) => (m.from !== me ? { ...m, read: true } : m))
        };
      })
    );
  };

  const handleOpenConversationWithHelper = (helperId) => {
    const existing = conversations.find((conversation) => conversation.helperId === helperId);
    if (existing) {
      setActiveConversationId(existing.id);
      navigate(`/messages?helper=${helperId}`);
      return;
    }

    const helper = allHelpers.find((item) => item.id === helperId);
    if (!helper) {
      return;
    }

    const newConversation = {
      id: `c${Date.now()}`,
      helperId: helper.id,
      taskId: null,
      peerKind: "helper",
      peerName: helper.name,
      helperName: helper.name,
      taskTitle: "General discussion",
      messages: [
        {
          id: `m${Date.now()}-seed`,
          from: helper.name,
          content: "hi",
          time: "Now"
        }
      ]
    };

    setConversations((prev) => [newConversation, ...prev]);
    setActiveConversationId(newConversation.id);
    navigate(`/messages?helper=${helperId}`);
    pushToast(`Started a chat with ${helper.name}.`, "info");
  };

  const handleOpenConversationWithRequester = (taskId) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) {
      return;
    }
    const existing = conversations.find(
      (conversation) => conversation.taskId === taskId && conversation.peerKind === "requester"
    );
    if (existing) {
      setActiveConversationId(existing.id);
      navigate(`/messages?task=${encodeURIComponent(taskId)}`);
      return;
    }

    const newConversation = {
      id: `c${Date.now()}`,
      helperId: null,
      taskId: task.id,
      peerKind: "requester",
      peerName: task.requester,
      helperName: task.requester,
      taskTitle: task.title,
      messages: [
        {
          id: `m${Date.now()}-seed`,
          from: task.requester,
          content: "hi",
          time: "Now"
        }
      ]
    };

    setConversations((prev) => [newConversation, ...prev]);
    setActiveConversationId(newConversation.id);
    navigate(`/messages?task=${encodeURIComponent(taskId)}`);
    pushToast(`Opening chat with ${task.requester}.`, "info");
  };

  const handleOpenReportWithHelper = (helperId) => {
    setSelectedHelperIdForReport(helperId);
    navigate("/report");
  };

  const handleSubmitReport = ({
    helperId,
    title,
    reason,
    reasonCategory,
    severity,
    details,
    attachments = [],
    source = "flag_page"
  }) => {
    const helper = allHelpers.find((item) => item.id === helperId);
    const timestamp = new Date().toLocaleString();
    setReports((prev) => [
      {
        id: `r${Date.now()}`,
        helperId,
        helperName: helper?.name || "Unknown",
        title: title?.trim() || "Report",
        reason,
        reasonCategory: reasonCategory || "other",
        severity: severity || "standard",
        details,
        source,
        attachments: Array.isArray(attachments) ? attachments : [],
        time: timestamp,
        reporterId: authUser?.id ?? null,
        reporterName: authUser?.name ?? "Unknown",
        status: "Open",
        assignee: null,
        resolutionNote: "",
        verified: false
      },
      ...prev
    ]);
    notifyAdmins(`New report: ${title?.trim() || "Untitled"} — ${helper?.name || "Unknown"}.`);
    pushToast("Report submitted.", "success");
  };

  const handleVerifyReport = (reportId, verified) => {
    setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, verified: Boolean(verified) } : r)));
    pushToast(verified ? "Report marked verified." : "Verification cleared.", "info");
    appendAudit(verified ? "report.verified" : "report.unverified", `Report ${reportId}`);
  };

  const handleBanUser = (accountId) => {
    const target = accounts.find((a) => a.id === accountId);
    if (target?.role === "admin") {
      pushToast("The platform administrator cannot be suspended.", "info");
      return;
    }
    if (accountId === authUser?.id) {
      pushToast("You can't ban your own session from here.", "info");
      return;
    }
    setAccounts((prev) =>
      prev.map((a) => (a.id === accountId ? { ...a, banned: true, paused: true } : a))
    );
    appendAudit("user.suspended", `${target.name} <${target.email}>`);
    pushToast("User suspended.", "success");
  };

  const handleUnbanUser = (accountId) => {
    const target = accounts.find((a) => a.id === accountId);
    setAccounts((prev) =>
      prev.map((a) => (a.id === accountId ? { ...a, banned: false, paused: false } : a))
    );
    appendAudit("user.unsuspended", target ? `${target.name} <${target.email}>` : accountId);
    pushToast("Suspension lifted.", "success");
  };

  const handleAdminBroadcast = (text) => {
    const msg = String(text || "").trim();
    if (!msg) return;
    accounts.forEach((a) => {
      if (a.role === "admin") return;
      appendNotification(a.id, `Announcement: ${msg}`);
    });
    appendAudit("admin.broadcast", msg.slice(0, 120));
    pushToast("Message sent to all users.", "success");
  };

  const handleAssignReport = (reportId, assigneeName) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? { ...r, status: "Assigned", assignee: assigneeName || r.assignee }
          : r
      )
    );
    appendAudit("report.assigned", `${reportId} → ${assigneeName}`);
    pushToast("Report assigned.", "success");
  };

  const handleReopenReport = (reportId) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId ? { ...r, status: "Open", assignee: null, resolutionNote: "" } : r
      )
    );
    appendAudit("report.reopened", reportId);
    pushToast("Report reopened.", "info");
  };

  const handleResolveReport = (reportId, note) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId ? { ...r, status: "Resolved", resolutionNote: note || r.resolutionNote } : r
      )
    );
    appendAudit("report.resolved", `${reportId}: ${(note || "").slice(0, 80)}`);
    pushToast("Report resolved.", "success");
  };

  const handleUpdateProfile = async ({ name, email, skills, availability, bio, avatarUrl }) => {
    await sleep(350);
    const trimmedName = name.trim();
    const emailCheck = validatePublicEmail(email);
    if (!trimmedName || !email?.trim()) {
      return { ok: false, error: "Name and email are required." };
    }
    if (!emailCheck.ok) {
      return { ok: false, error: emailCheck.error };
    }
    const trimmedEmail = emailCheck.email;
    const taken = accounts.some(
      (account) =>
        account.id !== authUser.id && account.email.toLowerCase() === trimmedEmail
    );
    if (taken) {
      return { ok: false, error: "That email is already in use." };
    }
    const skillsVal = typeof skills === "string" ? skills.trim() : "";
    const availVal = typeof availability === "string" ? availability.trim() : "";
    const bioVal = typeof bio === "string" ? bio.trim() : "";
    const avatarVal = typeof avatarUrl === "string" ? avatarUrl : authUser.avatarUrl || "";
    setAccounts((prev) =>
      prev.map((account) =>
        account.id === authUser.id
          ? {
              ...account,
              name: trimmedName,
              email: trimmedEmail,
              skills: skillsVal,
              availability: availVal,
              bio: bioVal,
              avatarUrl: avatarVal
            }
          : account
      )
    );
    setAuthUser((prev) =>
      prev
        ? {
            ...prev,
            name: trimmedName,
            email: trimmedEmail,
            skills: skillsVal,
            availability: availVal,
            bio: bioVal,
            avatarUrl: avatarVal
          }
        : prev
    );
    setTasks((prev) =>
      prev.map((task) =>
        task.requester === authUser.name ? { ...task, requester: trimmedName } : task
      )
    );
    pushToast("Profile saved.", "success");
    return { ok: true };
  };

  const handleChangePassword = async ({ currentPassword, newPassword }) => {
    await sleep(250);
    if (!authUser) return { ok: false, error: "Not signed in." };
    if (!newPassword || newPassword.length < 6) {
      return { ok: false, error: "New password must be at least 6 characters." };
    }
    const acct = accounts.find((a) => a.id === authUser.id);
    if (!acct || !(await accountPasswordMatches(acct, currentPassword))) {
      return { ok: false, error: "Current password is incorrect." };
    }
    const ph = await hashPassword(newPassword);
    setAccounts((prev) =>
      prev.map((a) => (a.id === authUser.id ? { ...a, passwordHash: ph, password: undefined } : a))
    );
    setAuthUser((prev) => (prev ? { ...prev, passwordHash: ph, password: undefined } : prev));
    pushToast("Password updated.", "success");
    appendAudit("password.changed", authUser.email);
    return { ok: true };
  };

  const handleUpdateAdminNotes = (accountId, notes) => {
    setAccounts((prev) =>
      prev.map((a) => (a.id === accountId ? { ...a, adminNotes: String(notes) } : a))
    );
    appendAudit("admin.notes_updated", `Account ${accountId}`);
  };

  const handleDeleteAccount = () => {
    if (authUser?.role === "admin") {
      pushToast("The administrator account cannot be deleted.", "info");
      return;
    }
    setAccounts((prev) => prev.filter((account) => account.id !== authUser.id));
    setAuthUser(null);
    setTasks((prev) => prev.filter((task) => task.requester !== authUser.name));
    navigate("/login");
    pushToast("Account deleted.", "info");
  };

  const handleMarkNotificationRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const myNotifications = useMemo(
    () => (authUser ? notifications.filter((n) => n.userId === authUser.id) : []),
    [notifications, authUser]
  );
  const unreadNotificationCount = useMemo(
    () => myNotifications.filter((n) => !n.read).length,
    [myNotifications]
  );

  if (!authUser) {
    return (
      <Routes>
        <Route
          path="/login"
          element={
            <AuthPage
              mode="login"
              onLogin={handleLogin}
              onRegister={handleRegister}
              onReactivate={handleReactivateAccount}
            />
          }
        />
        <Route
          path="/register"
          element={<AuthPage mode="register" onLogin={handleLogin} onRegister={handleRegister} />}
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <>
      <Layout
        toasts={toasts}
        currentUserName={authUser.name}
        onLogout={handleLogout}
        isAdmin={isAdmin}
        unreadNotifications={unreadNotificationCount}
        isOnline={isOnline}
      >
        <Routes>
        <Route
          path="/"
          element={
            <HelpersPage
              helpers={visibleHelpers}
              categories={taskCategories}
              onMessageHelper={isAdmin ? undefined : handleOpenConversationWithHelper}
              onBlockHelper={isAdmin ? undefined : handleBlockHelper}
              isDirectoryOnly={isAdmin}
            />
          }
        />
        <Route path="/helpers" element={<Navigate to="/" replace />} />
        <Route
          path="/tasks"
          element={
            <TasksPage
              tasks={tasks}
              categories={taskCategories}
              onApply={handleApply}
              onMessageRequester={handleOpenConversationWithRequester}
              onCompleteTask={handleCompleteTask}
              currentUserName={authUser.name}
              applyingTaskId={applyingTaskId}
              canActAsHelper={authUser.role !== "admin"}
              isAdminObserver={authUser.role === "admin"}
            />
          }
        />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/register" element={<Navigate to="/" replace />} />
        <Route
          path="/profile/:helperId"
          element={
            <HelperProfilePage
              allHelpers={allHelpers}
              helpersWithRatings={helpersWithRatings}
              blockedHelperIds={blockedHelperIds}
              onMessageHelper={isAdmin ? undefined : handleOpenConversationWithHelper}
              onBlockHelper={isAdmin ? undefined : handleBlockHelper}
              onUnblockHelper={isAdmin ? undefined : handleUnblockHelper}
              viewerUserId={authUser.id}
              onRateUser={isAdmin ? undefined : handleRateUser}
              userRatings={userRatings}
            />
          }
        />
        <Route
          path="/settings"
          element={
            <SettingsPage
              authUser={authUser}
              tasks={tasks}
              reports={reports}
              blockedHelperIds={blockedHelperIds}
              allHelpers={allHelpers}
              onUpdateProfile={handleUpdateProfile}
              onChangePassword={handleChangePassword}
              onDeleteAccount={handleDeleteAccount}
              onPauseAccount={handlePauseAccount}
              onResetLocalData={handleResetLocalData}
              onUnblockHelper={handleUnblockHelper}
              onMessageRequester={handleOpenConversationWithRequester}
              onCompleteTask={handleCompleteTask}
              currentUserName={authUser.name}
              isAdmin={authUser.role === "admin"}
            />
          }
        />
        <Route
          path="/messages"
          element={
            authUser.role === "admin" ? (
              <Navigate to="/admin" replace />
            ) : (
              <MessagesPage
                conversations={conversations}
                activeConversationId={activeConversationId}
                onSelectConversation={setActiveConversationId}
                onSendMessage={handleSendMessage}
                currentUserName={authUser.name}
                onMarkConversationRead={handleMarkConversationRead}
              />
            )
          }
        />
        <Route
          path="/notifications"
          element={
            <NotificationsPage
              items={myNotifications}
              onMarkRead={handleMarkNotificationRead}
              onMarkAllRead={handleMarkAllNotificationsRead}
            />
          }
        />
        <Route
          path="/map"
          element={
            <MapPage
              helpers={visibleHelpers}
              categories={taskCategories}
              neighborhoods={neighborhoods}
              onMessageHelper={isAdmin ? undefined : handleOpenConversationWithHelper}
              onReportHelper={isAdmin ? undefined : handleOpenReportWithHelper}
              onBlockHelper={isAdmin ? undefined : handleBlockHelper}
            />
          }
        />
        <Route
          path="/report"
          element={
            authUser.role === "admin" ? (
              <Navigate to="/admin" replace />
            ) : (
              <ReportPage
                helpers={allHelpers}
                selectedHelperId={selectedHelperIdForReport}
                onSubmitReport={handleSubmitReport}
                reports={reports}
              />
            )
          }
        />
        <Route
          path="/requester"
          element={
            authUser.role === "admin" ? (
              <Navigate to="/tasks" replace />
            ) : (
              <RequesterPage
                categories={taskCategories}
                neighborhoods={neighborhoods}
                onCreateTask={handleCreateTask}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                onMessageRequester={handleOpenConversationWithRequester}
                onCompleteTask={handleCompleteTask}
                tasks={tasks}
                currentUserName={authUser.name}
              />
            )
          }
        />
        <Route
          path="/admin"
          element={
            isAdmin ? (
              <AdminPage
                accounts={accounts}
                tasks={tasks}
                reports={reports}
                trustTeam={trustSafetyTeam}
                auditLog={auditLog}
                onAssignReport={handleAssignReport}
                onResolveReport={handleResolveReport}
                onReopenReport={handleReopenReport}
                onVerifyReport={handleVerifyReport}
                onBanUser={handleBanUser}
                onUnbanUser={handleUnbanUser}
                onBroadcast={handleAdminBroadcast}
                onUpdateAdminNotes={handleUpdateAdminNotes}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route path="/post-task" element={<Navigate to="/requester" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
      {completionFeedback ? (
        <CompletionFeedbackModal
          taskTitle={completionFeedback.taskTitle}
          helperName={completionFeedback.helperName}
          onSkip={() => setCompletionFeedback(null)}
          onSubmit={(payload) => handleSubmitHelperFeedback(completionFeedback.taskId, payload)}
        />
      ) : null}
    </>
  );
}

export default App;
