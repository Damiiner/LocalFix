const ALLOWED_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "yahoo.com",
  "yahoo.co.uk",
  "yahoo.fr",
  "yahoo.de",
  "ymail.com",
  "rocketmail.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "protonmail.com",
  "proton.me",
  "zoho.com",
  "gmx.com",
  "mail.com",
  "aol.com",
  "fastmail.com",
  "hey.com",
  "tutanota.com",
  "tutanota.de",
  "yandex.com",
  "yandex.ru",
  "inbox.com",
  "localfix.app",
  "localfix.demo"
]);

export function validatePublicEmail(raw) {
  const trimmed = String(raw || "").trim().toLowerCase();
  if (!trimmed) {
    return { ok: false, error: "Email is required." };
  }
  const at = trimmed.indexOf("@");
  if (at <= 0 || at === trimmed.length - 1) {
    return { ok: false, error: "Enter a valid email address." };
  }
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  if (!local || !domain || domain.includes(" ") || domain.includes("@")) {
    return { ok: false, error: "Enter a valid email address." };
  }
  const domainParts = domain.split(".");
  if (domainParts.length < 2) {
    return { ok: false, error: "Enter a valid email address." };
  }
  const tld = domainParts[domainParts.length - 1];
  if (!tld || tld.length < 2) {
    return { ok: false, error: "Enter a valid email address." };
  }
  if (domainParts.some((p) => !p || p.length < 1)) {
    return { ok: false, error: "Enter a valid email address." };
  }
  if (ALLOWED_EMAIL_DOMAINS.has(domain)) {
    return { ok: true, email: trimmed };
  }
  if (domain.startsWith("yahoo.") && domain.length > 6) {
    return { ok: true, email: trimmed };
  }
  return {
    ok: false,
    error:
      "Use an email from a recognized provider (Gmail, Outlook, Yahoo, iCloud, Proton, etc.)."
  };
}

export const PROFILE_AVATAR_MAX_BYTES = 1_500_000;
const AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export function validateProfileAvatarFile(file) {
  if (!file || !file.size) {
    return { ok: false, error: "Choose an image file." };
  }
  if (file.size > PROFILE_AVATAR_MAX_BYTES) {
    return { ok: false, error: `Image must be under ${Math.round(PROFILE_AVATAR_MAX_BYTES / 1_000_000)} MB.` };
  }
  const t = (file.type || "").toLowerCase();
  if (!AVATAR_TYPES.has(t)) {
    return { ok: false, error: "Use JPEG, PNG, WebP, or GIF." };
  }
  return { ok: true };
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}

export const TASK_TITLE_MIN = 5;
export const TASK_TITLE_MAX = 80;
export const TASK_DESCRIPTION_MIN = 20;
export const TASK_DESCRIPTION_MAX = 500;

export function validateTaskForm(form) {
  const title = form.title.trim();
  const description = form.description.trim();
  const errors = {
    title: "",
    description: ""
  };

  if (!title) {
    errors.title = "Title cannot be empty.";
  } else if (title.length < TASK_TITLE_MIN) {
    errors.title = `Title must be at least ${TASK_TITLE_MIN} characters.`;
  } else if (title.length > TASK_TITLE_MAX) {
    errors.title = `Title must be at most ${TASK_TITLE_MAX} characters.`;
  }

  if (!description) {
    errors.description = "Description cannot be empty.";
  } else if (description.length < TASK_DESCRIPTION_MIN) {
    errors.description = `Description must be at least ${TASK_DESCRIPTION_MIN} characters.`;
  } else if (description.length > TASK_DESCRIPTION_MAX) {
    errors.description = `Description must be at most ${TASK_DESCRIPTION_MAX} characters.`;
  }

  return {
    title,
    description,
    errors,
    isValid: !errors.title && !errors.description
  };
}
