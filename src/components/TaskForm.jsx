import { useState } from "react";
import {
  TASK_DESCRIPTION_MAX,
  TASK_DESCRIPTION_MIN,
  TASK_TITLE_MAX,
  TASK_TITLE_MIN,
  validateTaskForm
} from "../utils/validation";

const defaultForm = {
  title: "",
  category: "Homework Help",
  categoryOther: "",
  neighborhood: "Monastir Centre",
  budget: "Free",
  urgency: "Today",
  description: ""
};

const MAX_FILES = 3;
const MAX_BYTES = 320000;

function readFilesAsAttachments(fileList) {
  const files = Array.from(fileList || []).slice(0, MAX_FILES);
  return Promise.all(
    files.map(
      (file) =>
        new Promise((resolve, reject) => {
          if (file.size > MAX_BYTES) {
            reject(new Error(`"${file.name}" is too large (max ~${Math.round(MAX_BYTES / 1024)} KB).`));
            return;
          }
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              id: `att-${file.name}-${file.size}-${Date.now()}`,
              name: file.name,
              type: file.type || "application/octet-stream",
              dataUrl: typeof reader.result === "string" ? reader.result : ""
            });
          };
          reader.onerror = () => reject(new Error(`Could not read "${file.name}".`));
          reader.readAsDataURL(file);
        })
    )
  );
}

function TaskForm({
  categories,
  neighborhoods,
  onSubmit,
  submitLabel = "Publish Task",
  initialValues = null,
  onCancel = null
}) {
  const [form, setForm] = useState(() =>
    initialValues ? { ...defaultForm, ...initialValues } : { ...defaultForm }
  );
  const [errors, setErrors] = useState({ title: "", description: "", files: "", categoryOther: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "title" || field === "description") {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
    if (field === "categoryOther") {
      setErrors((prev) => ({ ...prev, categoryOther: "" }));
    }
  };

  const submit = (event) => {
    event.preventDefault();
    const otherMissing = form.category === "Other" && !String(form.categoryOther || "").trim();
    if (otherMissing) {
      setErrors((prev) => ({ ...prev, categoryOther: "Please name your category." }));
      return;
    }
    const resolvedCategory =
      form.category === "Other" ? String(form.categoryOther || "").trim() : form.category;
    const formForValidation = { ...form, category: resolvedCategory };
    const validation = validateTaskForm(formForValidation);
    setErrors((prev) => ({
      ...prev,
      title: validation.errors.title,
      description: validation.errors.description,
      categoryOther: otherMissing ? prev.categoryOther : ""
    }));
    if (!validation.isValid) {
      return;
    }

    setIsSubmitting(true);
    const existing = Array.isArray(form.attachments) ? form.attachments : [];
    const run = async () => {
      try {
        let nextAttachments = [...existing];
        if (pendingFiles.length > 0) {
          const incoming = await readFilesAsAttachments(pendingFiles);
          nextAttachments = [...nextAttachments, ...incoming].slice(-MAX_FILES);
        }
        setErrors((prev) => ({ ...prev, files: "" }));
        const payload = {
          ...form,
          category: resolvedCategory,
          title: validation.title,
          description: validation.description,
          attachments: nextAttachments
        };
        delete payload.categoryOther;
        const result = await Promise.resolve(onSubmit(payload));
        setIsSubmitting(false);
        if (!result?.ok) {
          if (result?.errors) {
            setErrors((e) => ({ ...e, ...result.errors }));
          }
          return;
        }
        if (!initialValues) {
          setForm({ ...defaultForm });
          setPendingFiles([]);
          setErrors({ title: "", description: "", files: "", categoryOther: "" });
        } else {
          setPendingFiles([]);
        }
      } catch (err) {
        setIsSubmitting(false);
        setErrors((prev) => ({ ...prev, files: err?.message || "Could not attach files." }));
      }
    };
    void run();
  };

  const existingAttachments = Array.isArray(form.attachments) ? form.attachments : [];
  const showOtherCategory = form.category === "Other";

  return (
    <form className="card task-form task-form-elevated" onSubmit={submit}>
      <label>
        Task title
        <input
          value={form.title}
          onChange={(event) => updateField("title", event.target.value)}
          placeholder="Example: need help carrying a few boxes"
          aria-invalid={Boolean(errors.title)}
          maxLength={TASK_TITLE_MAX}
        />
        <small className="muted field-counter">
          {form.title.trim().length}/{TASK_TITLE_MAX} (min {TASK_TITLE_MIN})
        </small>
        {errors.title ? <small className="form-error">{errors.title}</small> : null}
      </label>

      <div className="grid two-col">
        <label>
          Category
          <select value={form.category} onChange={(event) => updateField("category", event.target.value)}>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label>
          Neighborhood
          <select value={form.neighborhood} onChange={(event) => updateField("neighborhood", event.target.value)}>
            {neighborhoods.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>

      {showOtherCategory ? (
        <label>
          Your category
          <input
            value={form.categoryOther || ""}
            onChange={(event) => updateField("categoryOther", event.target.value)}
            placeholder="e.g. Pet care, translation…"
            aria-invalid={Boolean(errors.categoryOther)}
          />
          {errors.categoryOther ? <small className="form-error">{errors.categoryOther}</small> : null}
        </label>
      ) : null}

      <div className="grid two-col">
        <label>
          Budget (TND)
          <input
            value={form.budget}
            onChange={(event) => updateField("budget", event.target.value)}
            placeholder="e.g. 25, Free, or negotiable"
          />
        </label>

        <label>
          Urgency
          <select value={form.urgency} onChange={(event) => updateField("urgency", event.target.value)}>
            <option>Today</option>
            <option>Tomorrow</option>
            <option>This week</option>
          </select>
        </label>
      </div>

      <label>
        Description
        <textarea
          value={form.description}
          onChange={(event) => updateField("description", event.target.value)}
          placeholder="Describe what you need and your preferred time."
          aria-invalid={Boolean(errors.description)}
          maxLength={TASK_DESCRIPTION_MAX}
        />
        <small className="muted field-counter">
          {form.description.trim().length}/{TASK_DESCRIPTION_MAX} (min {TASK_DESCRIPTION_MIN})
        </small>
        {errors.description ? <small className="form-error">{errors.description}</small> : null}
      </label>

      <label className="task-file-label">
        Attachments
        <input
          type="file"
          multiple
          accept="image/*,.pdf"
          onChange={(e) => {
            setPendingFiles(Array.from(e.target.files || []).slice(0, MAX_FILES));
            setErrors((prev) => ({ ...prev, files: "" }));
            e.target.value = "";
          }}
        />
        {errors.files ? <small className="form-error">{errors.files}</small> : null}
        {pendingFiles.length > 0 ? (
          <small className="muted field-counter">{pendingFiles.length} new file(s) will be added on save.</small>
        ) : null}
        {existingAttachments.length > 0 ? (
          <ul className="task-existing-files">
            {existingAttachments.map((f) => (
              <li key={f.id || f.name}>{f.name}</li>
            ))}
          </ul>
        ) : null}
      </label>

      <div className="form-actions-row">
        {onCancel ? (
          <button className="btn btn-ghost" type="button" onClick={onCancel}>
            Cancel edit
          </button>
        ) : null}
        <button className="btn btn-primary-action" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default TaskForm;
export { defaultForm };
