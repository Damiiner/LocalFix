import { useMemo, useState } from "react";
import TaskForm from "../components/TaskForm";
import TaskCard from "../components/TaskCard";

function taskToFormValues(task, categories) {
  const cat = task.category;
  const isPreset = categories.includes(cat);
  return {
    title: task.title,
    category: isPreset ? cat : "Other",
    categoryOther: isPreset ? "" : cat,
    neighborhood: task.neighborhood,
    budget: task.budget,
    urgency: task.urgency,
    description: task.description,
    attachments: Array.isArray(task.attachments) ? task.attachments : []
  };
}

function RequesterPage({
  categories,
  neighborhoods,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onMessageRequester,
  onCompleteTask,
  tasks,
  currentUserName
}) {
  const myTasks = useMemo(
    () => tasks.filter((task) => task.requester === currentUserName),
    [tasks, currentUserName]
  );
  const [editingId, setEditingId] = useState(null);
  const editingTask = editingId ? tasks.find((task) => task.id === editingId) : null;

  return (
    <section className="requester-page">
      <header className="page-hero">
        <h2>Requester</h2>
        <p className="muted page-hero-sub">
          Publish tasks for neighbors and manage what you have posted.
        </p>
      </header>

      <div className="grid two-col requester-grid">
        <div className="stack">
          <h3 className="section-title">{editingTask ? "Edit task" : "Post a new task"}</h3>
          {!editingTask ? (
            <TaskForm
              key="create"
              categories={categories}
              neighborhoods={neighborhoods}
              onSubmit={onCreateTask}
              submitLabel="Publish task"
            />
          ) : (
            <TaskForm
              key={editingTask.id}
              initialValues={taskToFormValues(editingTask, categories)}
              categories={categories}
              neighborhoods={neighborhoods}
              onSubmit={async (form) => {
                const result = await onUpdateTask(editingTask.id, form);
                if (result?.ok) {
                  setEditingId(null);
                }
                return result;
              }}
              submitLabel="Save changes"
              onCancel={() => setEditingId(null)}
            />
          )}
        </div>

        <div className="stack">
          <h3 className="section-title">Your posted tasks</h3>
          {myTasks.length === 0 ? (
            <p className="muted card card-muted">You have not posted any tasks yet.</p>
          ) : (
            myTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                currentUserName={currentUserName}
                canActAsHelper={false}
                onEdit={setEditingId}
                onDelete={onDeleteTask}
                onMessageRequester={onMessageRequester}
                onCompleteTask={onCompleteTask}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}

export default RequesterPage;
