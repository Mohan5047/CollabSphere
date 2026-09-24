import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Edit3,
  Filter,
  FolderKanban,
  ListTodo,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  User as UserIcon,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { projectService, taskService, teamService } from "../services/api";
import type {
  Project,
  Task,
  TaskPriority,
  TaskStatus,
  Team,
  TeamMember,
} from "../types";

interface EnrichedTask extends Task {
  team_name?: string;
  project_id?: number;
  project_title?: string;
}

const formatDate = (isoString?: string | null): string => {
  if (!isoString) return "No due date";
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) return "No due date";
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const Tasks: React.FC = () => {
  const { user } = useAuth();

  const [teams, setTeams] = useState<Team[]>([]);
  const [, setProjectsMap] = useState<Map<number, Project>>(
    new Map()
  );
  const [teamMembersMap, setTeamMembersMap] = useState<
    Map<number, TeamMember[]>
  >(new Map());
  const [tasks, setTasks] = useState<EnrichedTask[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [teamFilter, setTeamFilter] = useState<string>("ALL");

  // Create Task Modal State
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Edit / Reassign Task Modal State
  const [editingTask, setEditingTask] = useState<EnrichedTask | null>(null);
  const [editStatus, setEditStatus] = useState<TaskStatus>("TODO");
  const [editAssignee, setEditAssignee] = useState<string>("");
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);

  const loadTasksWorkspace = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [teamsRes, projectsRes] = await Promise.allSettled([
        teamService.getAllTeams(),
        projectService.getAllProjects(),
      ]);

      const pMap = new Map<number, Project>();
      if (projectsRes.status === "fulfilled") {
        const pList = Array.isArray(projectsRes.value.projects)
          ? projectsRes.value.projects
          : Array.isArray(projectsRes.value.data)
            ? projectsRes.value.data
            : [];
        pList.forEach((p) => pMap.set(Number(p.id), p));
      }
      setProjectsMap(pMap);

      let fetchedTeams: Team[] = [];
      if (teamsRes.status === "fulfilled") {
        fetchedTeams = Array.isArray(teamsRes.value.data)
          ? teamsRes.value.data
          : Array.isArray(teamsRes.value.teams)
            ? teamsRes.value.teams
            : [];
        setTeams(fetchedTeams);
        if (fetchedTeams.length > 0 && !selectedTeamId) {
          setSelectedTeamId(String(fetchedTeams[0].id));
        }
      } else {
        throw new Error(
          (teamsRes.reason as Error)?.message || "Failed to fetch teams."
        );
      }

      if (fetchedTeams.length === 0) {
        setTasks([]);
        setLoading(false);
        return;
      }

      // Fetch tasks and members for each team
      const [taskResults, detailResults] = await Promise.all([
        Promise.allSettled(
          fetchedTeams.map((t) => taskService.getTeamTasks(t.id))
        ),
        Promise.allSettled(
          fetchedTeams.map((t) => teamService.getTeamById(t.id))
        ),
      ]);

      const membersMap = new Map<number, TeamMember[]>();
      detailResults.forEach((dr, idx) => {
        if (dr.status === "fulfilled") {
          const teamId = Number(fetchedTeams[idx].id);
          const mList = Array.isArray(dr.value.data?.members)
            ? dr.value.data.members
            : Array.isArray(dr.value.members)
              ? dr.value.members
              : [];
          membersMap.set(teamId, mList);
        }
      });
      setTeamMembersMap(membersMap);

      const allTasks: EnrichedTask[] = [];
      const seenIds = new Set<number>();

      taskResults.forEach((tr, idx) => {
        const team = fetchedTeams[idx];
        const proj = pMap.get(Number(team.project_id));

        if (tr.status === "fulfilled") {
          const list = Array.isArray(tr.value.tasks)
            ? tr.value.tasks
            : Array.isArray(tr.value.data)
              ? tr.value.data
              : [];
          list.forEach((item) => {
            if (!seenIds.has(item.id)) {
              seenIds.add(item.id);
              allTasks.push({
                ...item,
                team_id: Number(item.team_id || team.id),
                team_name: team.team_name,
                project_id: Number(team.project_id),
                project_title: proj?.title || `Project #${team.project_id}`,
              });
            }
          });
        }
      });

      setTasks(allTasks);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load tasks workspace."
      );
    } finally {
      setLoading(false);
    }
  }, [selectedTeamId]);

  useEffect(() => {
    void loadTasksWorkspace();
  }, [loadTasksWorkspace]);

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return tasks.filter((task) => {
      const normalizedStatus = (task.status || "TODO").toUpperCase();
      const normalizedPriority = (task.priority || "MEDIUM").toUpperCase();

      if (statusFilter !== "ALL" && normalizedStatus !== statusFilter) {
        return false;
      }
      if (priorityFilter !== "ALL" && normalizedPriority !== priorityFilter) {
        return false;
      }
      if (teamFilter !== "ALL" && String(task.team_id) !== teamFilter) {
        return false;
      }

      if (!q) return true;

      const titleMatch = (task.title || "").toLowerCase().includes(q);
      const descMatch = (task.description || "").toLowerCase().includes(q);
      const assigneeMatch = (
        task.assigned_user_name ||
        task.assigned_to_name ||
        ""
      )
        .toLowerCase()
        .includes(q);
      const teamMatch = (task.team_name || "").toLowerCase().includes(q);

      return titleMatch || descMatch || assigneeMatch || teamMatch;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter, teamFilter]);

  const counts = useMemo(() => {
    let todo = 0;
    let inProgress = 0;
    let completed = 0;
    tasks.forEach((t) => {
      const s = (t.status || "TODO").toUpperCase();
      if (s === "COMPLETED") completed += 1;
      else if (s === "IN_PROGRESS") inProgress += 1;
      else todo += 1;
    });
    return { todo, inProgress, completed };
  }, [tasks]);

  // Create Task Submit
  const handleCreateTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedbackError(null);
    setFeedbackMessage(null);

    if (!selectedTeamId) {
      setFeedbackError("Please select a target team.");
      return;
    }
    if (!title.trim()) {
      setFeedbackError("Task title is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await taskService.createTask({
        team_id: Number(selectedTeamId),
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        assigned_to: assignedTo ? Number(assignedTo) : null,
        due_date: dueDate || null,
      });

      setIsCreateOpen(false);
      setTitle("");
      setDescription("");
      setPriority("MEDIUM");
      setAssignedTo("");
      setDueDate("");
      setFeedbackMessage("Task created successfully!");
      await loadTasksWorkspace();
    } catch (err) {
      setFeedbackError(
        err instanceof Error ? err.message : "Failed to create task."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Status Inline
  const handleStatusChange = async (taskId: number, newStatus: TaskStatus) => {
    setFeedbackError(null);
    try {
      await taskService.updateTaskStatus(taskId, newStatus);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
      setFeedbackMessage(`Task #${taskId} moved to ${newStatus}.`);
    } catch (err) {
      setFeedbackError(
        err instanceof Error ? err.message : "Failed to update task status."
      );
    }
  };

  // Save Edit (Status + Assignee)
  const handleSaveEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTask) return;

    setIsSavingEdit(true);
    setFeedbackError(null);
    try {
      await taskService.updateTaskStatus(editingTask.id, editStatus);
      if (editAssignee) {
        await taskService.assignTask(editingTask.id, Number(editAssignee));
      }
      setEditingTask(null);
      setFeedbackMessage(`Updated task "${editingTask.title}".`);
      await loadTasksWorkspace();
    } catch (err) {
      setFeedbackError(
        err instanceof Error ? err.message : "Failed to update task."
      );
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId: number, taskTitle: string) => {
    const confirmed = window.confirm(
      `Delete task "${taskTitle}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    setFeedbackError(null);
    try {
      await taskService.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setFeedbackMessage(`Deleted task "${taskTitle}".`);
    } catch (err) {
      setFeedbackError(
        err instanceof Error ? err.message : "Not authorized to delete task."
      );
    }
  };

  const activeTeamMembers = useMemo(() => {
    const tid = Number(selectedTeamId);
    return teamMembersMap.get(tid) || [];
  }, [selectedTeamId, teamMembersMap]);

  if (loading) {
    return (
      <div className="page-content">
        <div className="loading-state">
          <div className="spinner" aria-hidden="true" />
          <h3>Loading task management board...</h3>
          <p>Fetching team sprint deliverables, priorities, and assignees.</p>
        </div>
      </div>
    );
  }

  if (error && tasks.length === 0 && teams.length === 0) {
    return (
      <div className="page-content">
        <div className="error-state">
          <div className="error-state-icon">
            <AlertCircle size={26} />
          </div>
          <h3>Unable to Load Tasks</h3>
          <p>{error}</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => void loadTasksWorkspace()}
          >
            <RefreshCw size={16} />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      {/* HEADER */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Task Management</h1>
          <p>
            Track TODO, IN_PROGRESS, and COMPLETED tasks across your teams and
            projects.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          disabled={teams.length === 0}
          onClick={() => {
            setFeedbackError(null);
            setIsCreateOpen(true);
          }}
        >
          <Plus size={17} />
          <span>Create Task</span>
        </button>
      </div>

      {/* Feedback Alerts */}
      {feedbackMessage && (
        <div
          role="status"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.85rem 1rem",
            marginBottom: "1.25rem",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--success-muted)",
            border: "1px solid rgba(16, 185, 129, 0.35)",
            color: "#34d399",
            fontSize: "0.875rem",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <CheckCircle2 size={17} />
            {feedbackMessage}
          </span>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setFeedbackMessage(null)}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {feedbackError && (
        <div
          role="alert"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.85rem 1rem",
            marginBottom: "1.25rem",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--danger-muted)",
            border: "1px solid rgba(239, 68, 68, 0.35)",
            color: "#f87171",
            fontSize: "0.875rem",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <AlertCircle size={17} />
            {feedbackError}
          </span>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setFeedbackError(null)}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* STATUS SUMMARY BAR */}
      <div className="grid-3" style={{ marginBottom: "1.5rem" }}>
        <div className="stat-card">
          <span className="stat-label">TODO</span>
          <div className="stat-value">{counts.todo}</div>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Awaiting execution
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">IN_PROGRESS</span>
          <div className="stat-value" style={{ color: "var(--secondary)" }}>
            {counts.inProgress}
          </div>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Currently active
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">COMPLETED</span>
          <div className="stat-value" style={{ color: "var(--success)" }}>
            {counts.completed}
          </div>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Shipped deliverables
          </span>
        </div>
      </div>

      {/* SEARCH & FILTER BAR */}
      <div
        className="card"
        style={{
          marginBottom: "1.5rem",
          padding: "1rem 1.25rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{ position: "relative", flex: "1 1 240px" }}>
          <Search
            size={17}
            style={{
              position: "absolute",
              left: "0.85rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-subtle)",
              pointerEvents: "none",
            }}
          />
          <input
            type="search"
            placeholder="Search tasks by title, description, assignee, or team..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: "2.55rem" }}
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.65rem",
            flexWrap: "wrap",
          }}
        >
          <Filter size={15} style={{ color: "var(--text-muted)" }} />

          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: "auto", padding: "0.45rem 0.75rem" }}
          >
            <option value="ALL">All Statuses</option>
            <option value="TODO">TODO</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>

          <select
            aria-label="Filter by priority"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{ width: "auto", padding: "0.45rem 0.75rem" }}
          >
            <option value="ALL">All Priorities</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>

          <select
            aria-label="Filter by team"
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            style={{ width: "auto", padding: "0.45rem 0.75rem" }}
          >
            <option value="ALL">All Teams</option>
            {teams.map((t) => (
              <option key={t.id} value={String(t.id)}>
                {t.team_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TASK LIST / EMPTY STATE */}
      {filteredTasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <ListTodo size={24} />
          </div>
          <h3>No Tasks Found</h3>
          <p>
            {teams.length === 0
              ? "Join or create a project team first to start managing sprint tasks."
              : "No tasks match your current search or filter selection."}
          </p>
          {teams.length > 0 && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus size={16} />
              <span>Create First Task</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid-2">
          {filteredTasks.map((task) => {
            const normStatus = (task.status || "TODO").toUpperCase();
            const normPriority = (task.priority || "MEDIUM").toUpperCase();

            const priorityBadge =
              normPriority === "HIGH"
                ? "badge-danger"
                : normPriority === "MEDIUM"
                  ? "badge-warning"
                  : "badge-neutral";

            const statusBadge =
              normStatus === "COMPLETED"
                ? "badge-success"
                : normStatus === "IN_PROGRESS"
                  ? "badge-secondary"
                  : "badge-neutral";

            return (
              <div
                key={task.id}
                className="card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "1rem",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "0.5rem",
                      marginBottom: "0.65rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ display: "flex", gap: "0.45rem" }}>
                      <span className={`badge ${statusBadge}`}>
                        {normStatus}
                      </span>
                      <span className={`badge ${priorityBadge}`}>
                        {normPriority}
                      </span>
                    </div>

                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      <Calendar size={13} />
                      Due: {formatDate(task.due_date)}
                    </span>
                  </div>

                  <h3 style={{ fontSize: "1.05rem", marginBottom: "0.35rem" }}>
                    {task.title}
                  </h3>

                  {task.description && (
                    <p
                      style={{
                        fontSize: "0.86rem",
                        color: "var(--text-muted)",
                        marginBottom: "0.85rem",
                      }}
                    >
                      {task.description}
                    </p>
                  )}

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "0.85rem",
                      fontSize: "0.8rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                      }}
                    >
                      <Users size={13} style={{ color: "var(--primary)" }} />
                      <Link to={`/teams/${task.team_id}`}>
                        {task.team_name || `Team #${task.team_id}`}
                      </Link>
                    </span>

                    {task.project_id && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                        }}
                      >
                        <FolderKanban
                          size={13}
                          style={{ color: "var(--secondary)" }}
                        />
                        <Link to={`/projects/${task.project_id}`}>
                          {task.project_title}
                        </Link>
                      </span>
                    )}

                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                      }}
                    >
                      <UserIcon size={13} />
                      <span>
                        {task.assigned_user_name ||
                          task.assigned_to_name ||
                          (task.assigned_to
                            ? `User #${task.assigned_to}`
                            : "Unassigned")}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Task Controls */}
                <div
                  style={{
                    paddingTop: "0.85rem",
                    borderTop: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.65rem",
                    flexWrap: "wrap",
                  }}
                >
                  <select
                    aria-label={`Change status for ${task.title}`}
                    value={normStatus}
                    onChange={(e) =>
                      void handleStatusChange(
                        task.id,
                        e.target.value as TaskStatus
                      )
                    }
                    style={{
                      width: "auto",
                      padding: "0.35rem 0.65rem",
                      fontSize: "0.8rem",
                    }}
                  >
                    <option value="TODO">TODO</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>

                  <div style={{ display: "flex", gap: "0.45rem" }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setEditingTask(task);
                        setEditStatus((task.status || "TODO") as TaskStatus);
                        setEditAssignee(
                          task.assigned_to ? String(task.assigned_to) : ""
                        );
                      }}
                    >
                      <Edit3 size={14} />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => void handleDeleteTask(task.id, task.title)}
                      title="Delete Task"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {isCreateOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            backgroundColor: "rgba(3, 7, 18, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.25rem",
          }}
        >
          <div
            className="card"
            style={{ width: "100%", maxWidth: "520px", padding: "1.75rem" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "1.25rem",
              }}
            >
              <h3>Create New Task</h3>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setIsCreateOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label className="form-label" htmlFor="create-task-team">
                  Team
                </label>
                <select
                  id="create-task-team"
                  value={selectedTeamId}
                  onChange={(e) => {
                    setSelectedTeamId(e.target.value);
                    setAssignedTo("");
                  }}
                  required
                >
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.team_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="create-task-title">
                  Task Title
                </label>
                <input
                  id="create-task-title"
                  type="text"
                  placeholder="e.g. Build REST endpoint for analytics export"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid-2" style={{ gap: "0.75rem" }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="create-task-priority">
                    Priority
                  </label>
                  <select
                    id="create-task-priority"
                    value={priority}
                    onChange={(e) =>
                      setPriority(e.target.value as TaskPriority)
                    }
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="create-task-assignee">
                    Assignee
                  </label>
                  <select
                    id="create-task-assignee"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {activeTeamMembers.map((m) => (
                      <option key={m.user_id} value={m.user_id}>
                        {m.full_name || `User #${m.user_id}`} ({m.role})
                      </option>
                    ))}
                    {user?.id &&
                      !activeTeamMembers.some(
                        (m) => Number(m.user_id) === Number(user.id)
                      ) && (
                        <option value={user.id}>
                          {user.full_name} (You)
                        </option>
                      )}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="create-task-due">
                  Due Date
                </label>
                <input
                  id="create-task-due"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="create-task-desc">
                  Description
                </label>
                <textarea
                  id="create-task-desc"
                  rows={3}
                  placeholder="Task requirements and acceptance criteria..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "0.75rem",
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2
                        size={16}
                        style={{ animation: "spin 0.8s linear infinite" }}
                      />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Task</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TASK MODAL */}
      {editingTask && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            backgroundColor: "rgba(3, 7, 18, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.25rem",
          }}
        >
          <div
            className="card"
            style={{ width: "100%", maxWidth: "440px", padding: "1.75rem" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "1.25rem",
              }}
            >
              <h3>Edit Task #{editingTask.id}</h3>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setEditingTask(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="form-group">
                <label className="form-label">Task</label>
                <input type="text" value={editingTask.title} disabled />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-task-status">
                  Status
                </label>
                <select
                  id="edit-task-status"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as TaskStatus)}
                >
                  <option value="TODO">TODO</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-task-assignee">
                  Assign To (User ID or Member)
                </label>
                <select
                  id="edit-task-assignee"
                  value={editAssignee}
                  onChange={(e) => setEditAssignee(e.target.value)}
                >
                  <option value="">Keep current / Unassigned</option>
                  {(teamMembersMap.get(Number(editingTask.team_id)) || []).map(
                    (m) => (
                      <option key={m.user_id} value={m.user_id}>
                        {m.full_name || `User #${m.user_id}`} ({m.role})
                      </option>
                    )
                  )}
                </select>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "0.75rem",
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingTask(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSavingEdit}
                >
                  {isSavingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
