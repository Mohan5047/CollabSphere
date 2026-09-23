import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Activity as ActivityIcon,
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Crown,
  ExternalLink,
  FileText,
  FolderKanban,
  ListTodo,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  UserMinus,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  activityService,
  fileService,
  projectService,
  taskService,
  teamService,
} from "../services/api";
import {
  Activity,
  FileItem,
  Project,
  Task,
  TaskPriority,
  TaskStatus,
  Team,
  TeamMember,
} from "../types";

const formatDate = (isoString?: string | null): string => {
  if (!isoString) return "N/A";
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatFileSize = (bytes?: number | null): string => {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const TeamDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const numericTeamId = Number(id);
  const isInvalidId =
    !id || Number.isNaN(numericTeamId) || numericTeamId <= 0;

  const [team, setTeam] = useState<Team | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [isProjectOwner, setIsProjectOwner] = useState<boolean>(false);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Add Member Modal State
  const [isAddMemberOpen, setIsAddMemberOpen] = useState<boolean>(false);
  const [newMemberUserId, setNewMemberUserId] = useState<string>("");
  const [isAddingMember, setIsAddingMember] = useState<boolean>(false);

  // Create Task Modal State
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState<boolean>(false);
  const [taskTitle, setTaskTitle] = useState<string>("");
  const [taskDescription, setTaskDescription] = useState<string>("");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("MEDIUM");
  const [taskAssignedTo, setTaskAssignedTo] = useState<string>("");
  const [taskDueDate, setTaskDueDate] = useState<string>("");
  const [isCreatingTask, setIsCreatingTask] = useState<boolean>(false);

  // File Upload State
  const [isUploadingFile, setIsUploadingFile] = useState<boolean>(false);

  const loadTeamWorkspace = useCallback(async () => {
    if (isInvalidId) {
      setLoading(false);
      setError("Invalid team identifier in URL.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const teamRes = await teamService.getTeamById(numericTeamId);
      const foundTeam = teamRes.data?.team || teamRes.team;
      const foundMembers = Array.isArray(teamRes.data?.members)
        ? teamRes.data.members
        : Array.isArray(teamRes.members)
          ? teamRes.members
          : [];

      if (!foundTeam) {
        throw new Error("Team not found.");
      }

      setTeam(foundTeam);
      setMembers(foundMembers);

      // Load Project, Tasks, Files, and Activities concurrently
      const [projectRes, tasksRes, filesRes, activitiesRes] =
        await Promise.allSettled([
          projectService.getProjectById(foundTeam.project_id),
          taskService.getTeamTasks(numericTeamId),
          fileService.getTeamFiles(numericTeamId),
          activityService.getTeamActivities(numericTeamId),
        ]);

      if (projectRes.status === "fulfilled") {
        setProject(projectRes.value.project);
        setIsProjectOwner(Boolean(projectRes.value.isOwner));
      }

      if (tasksRes.status === "fulfilled") {
        const list = Array.isArray(tasksRes.value.tasks)
          ? tasksRes.value.tasks
          : Array.isArray(tasksRes.value.data)
            ? tasksRes.value.data
            : [];
        setTasks(list);
      }

      if (filesRes.status === "fulfilled") {
        const list = Array.isArray(filesRes.value.files)
          ? filesRes.value.files
          : Array.isArray(filesRes.value.data)
            ? filesRes.value.data
            : [];
        setFiles(list);
      }

      if (activitiesRes.status === "fulfilled") {
        const list = Array.isArray(activitiesRes.value.activities)
          ? activitiesRes.value.activities
          : Array.isArray(activitiesRes.value.data)
            ? activitiesRes.value.data
            : [];
        setActivities(list);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load team workspace."
      );
    } finally {
      setLoading(false);
    }
  }, [isInvalidId, numericTeamId]);

  useEffect(() => {
    void loadTeamWorkspace();
  }, [loadTeamWorkspace]);

  // Determine whether UI hints show administrative controls (backend always enforces RBAC)
  const currentUserMemberRecord = members.find(
    (m) => Number(m.user_id) === Number(user?.id)
  );
  const isTeamLead =
    (currentUserMemberRecord?.role || "").toUpperCase() === "TEAM_LEAD" ||
    (user?.role || "").toUpperCase() === "ADMIN";
  const canManageMembers = isProjectOwner || isTeamLead;

  // Add Member Action
  const handleAddMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setActionError(null);
    setStatusNotice(null);

    const parsedUserId = Number(newMemberUserId);
    if (!newMemberUserId.trim() || Number.isNaN(parsedUserId) || parsedUserId <= 0) {
      setActionError("Please enter a valid numeric User ID.");
      return;
    }

    setIsAddingMember(true);
    try {
      const res = await teamService.addTeamMember({
        team_id: numericTeamId,
        user_id: parsedUserId,
      });
      setIsAddMemberOpen(false);
      setNewMemberUserId("");
      setStatusNotice(res.message || "Member added to the team.");
      await loadTeamWorkspace();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to add team member."
      );
    } finally {
      setIsAddingMember(false);
    }
  };

  // Remove Member Action
  const handleRemoveMember = async (memberUserId: number, memberName?: string) => {
    const confirmed = window.confirm(
      `Remove ${memberName || `User #${memberUserId}`} from this team?`
    );
    if (!confirmed) return;

    setActionError(null);
    setStatusNotice(null);
    try {
      const res = await teamService.removeTeamMember(numericTeamId, memberUserId);
      setStatusNotice(res.message || "Member removed from the team.");
      await loadTeamWorkspace();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to remove team member."
      );
    }
  };

  // Assign Team Lead Action
  const handleAssignLead = async (memberUserId: number) => {
    setActionError(null);
    setStatusNotice(null);
    try {
      const res = await teamService.assignTeamLead(numericTeamId, memberUserId);
      setStatusNotice(res.message || "Team lead updated successfully.");
      await loadTeamWorkspace();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to assign team lead."
      );
    }
  };

  // Create Task Action
  const handleCreateTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setActionError(null);
    setStatusNotice(null);

    if (!taskTitle.trim()) {
      setActionError("Task title is required.");
      return;
    }

    setIsCreatingTask(true);
    try {
      await taskService.createTask({
        team_id: numericTeamId,
        title: taskTitle.trim(),
        description: taskDescription.trim() || undefined,
        priority: taskPriority,
        assigned_to: taskAssignedTo ? Number(taskAssignedTo) : null,
        due_date: taskDueDate || null,
      });

      setIsCreateTaskOpen(false);
      setTaskTitle("");
      setTaskDescription("");
      setTaskPriority("MEDIUM");
      setTaskAssignedTo("");
      setTaskDueDate("");
      setStatusNotice("Task created successfully!");
      await loadTeamWorkspace();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to create task."
      );
    } finally {
      setIsCreatingTask(false);
    }
  };

  // Update Task Status Inline
  const handleTaskStatusChange = async (
    taskId: number,
    nextStatus: TaskStatus
  ) => {
    setActionError(null);
    try {
      await taskService.updateTaskStatus(taskId, nextStatus);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t))
      );
      setStatusNotice(`Task #${taskId} updated to ${nextStatus}.`);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Unable to update task status."
      );
    }
  };

  // Upload File Action
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setActionError(null);
    setStatusNotice(null);
    setIsUploadingFile(true);

    try {
      await fileService.uploadFile(numericTeamId, selectedFile);
      setStatusNotice(`Uploaded "${selectedFile.name}" successfully.`);
      await loadTeamWorkspace();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to upload file."
      );
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Delete File Action
  const handleDeleteFile = async (fileId: number, fileName: string) => {
    const confirmed = window.confirm(`Delete file "${fileName}"?`);
    if (!confirmed) return;

    setActionError(null);
    try {
      await fileService.deleteFile(fileId);
      setStatusNotice(`Deleted "${fileName}".`);
      await loadTeamWorkspace();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to delete file."
      );
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="loading-state">
          <div className="spinner" aria-hidden="true" />
          <h3>Loading team workspace...</h3>
          <p>Syncing roster, sprint tasks, shared files, and activity logs.</p>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="page-content">
        <div className="error-state">
          <div className="error-state-icon">
            <AlertCircle size={26} />
          </div>
          <h3>Team Unavailable</h3>
          <p>{error || "The requested team could not be found."}</p>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <Link to="/teams" className="btn btn-secondary">
              <ArrowLeft size={16} />
              <span>Back to Teams</span>
            </Link>
            {!isInvalidId && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void loadTeamWorkspace()}
              >
                <RefreshCw size={16} />
                <span>Retry</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      {/* Back Link */}
      <div style={{ marginBottom: "1rem" }}>
        <Link
          to="/teams"
          className="btn btn-ghost btn-sm"
          style={{ paddingLeft: "0.5rem" }}
        >
          <ArrowLeft size={15} />
          <span>Back to Teams</span>
        </Link>
      </div>

      {/* Feedback Alerts */}
      {statusNotice && (
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
            {statusNotice}
          </span>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setStatusNotice(null)}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {actionError && (
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
            {actionError}
          </span>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setActionError(null)}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* =================================================================== */}
      {/* TEAM HEADER & ASSOCIATED PROJECT                                    */}
      {/* =================================================================== */}
      <div className="card" style={{ marginBottom: "1.75rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "1.25rem",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                marginBottom: "0.55rem",
                flexWrap: "wrap",
              }}
            >
              <span className="badge badge-primary">Team #{team.id}</span>
              {currentUserMemberRecord && (
                <span className="badge badge-success">
                  Your Role: {currentUserMemberRecord.role}
                </span>
              )}
              {isProjectOwner && (
                <span className="badge badge-secondary">Project Owner</span>
              )}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                }}
              >
                <Calendar size={14} />
                Created {formatDate(team.created_at)}
              </span>
            </div>

            <h1 style={{ fontSize: "1.75rem", marginBottom: "0.45rem" }}>
              {team.team_name}
            </h1>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.9rem",
                color: "var(--text-muted)",
              }}
            >
              <FolderKanban size={16} style={{ color: "var(--secondary)" }} />
              <span>Associated Project:</span>
              <Link
                to={`/projects/${team.project_id}`}
                style={{ fontWeight: 600, color: "var(--secondary)" }}
              >
                {project?.title || `Project #${team.project_id}`}
              </Link>
            </div>
          </div>

          {/* Primary Quick Actions */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.65rem",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsCreateTaskOpen(true)}
            >
              <Plus size={16} />
              <span>Create Task</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => void handleFileUpload(e)}
              style={{ display: "none" }}
              id="team-file-upload-input"
            />
            <button
              type="button"
              className="btn btn-secondary"
              disabled={isUploadingFile}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploadingFile ? (
                <>
                  <Loader2
                    size={16}
                    style={{ animation: "spin 0.8s linear infinite" }}
                  />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload size={16} />
                  <span>Upload File</span>
                </>
              )}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsAddMemberOpen(true)}
            >
              <UserPlus size={16} />
              <span>Add Member</span>
            </button>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* TEAM MEMBERS & TEAM TASKS                                           */}
      {/* =================================================================== */}
      <div className="grid-2" style={{ marginBottom: "1.75rem" }}>
        {/* Members & Roles Card */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ fontSize: "1.1rem" }}>
                Team Members ({members.length})
              </h3>
              <p style={{ fontSize: "0.825rem", marginTop: "0.15rem" }}>
                Collaborators and assigned workspace permissions
              </p>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setIsAddMemberOpen(true)}
            >
              <UserPlus size={15} />
              <span>Add</span>
            </button>
          </div>

          {members.length === 0 ? (
            <div className="empty-state" style={{ padding: "1.75rem 1rem" }}>
              <div className="empty-state-icon">
                <Users size={22} />
              </div>
              <h4>No Members Added Yet</h4>
              <p>
                Add collaborators by User ID or accept project applications.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.65rem",
              }}
            >
              {members.map((member) => {
                const isLead =
                  (member.role || "").toUpperCase() === "TEAM_LEAD";
                return (
                  <div
                    key={member.member_id || member.user_id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "0.75rem",
                      padding: "0.8rem 0.95rem",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--surface)",
                      border: "1px solid var(--border)",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.45rem",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: "0.925rem",
                            color: "var(--text)",
                          }}
                        >
                          {member.full_name || `User #${member.user_id}`}
                        </span>
                        <span
                          className={`badge ${
                            isLead ? "badge-primary" : "badge-neutral"
                          }`}
                        >
                          {member.role}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: "0.775rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        {member.email || `ID: ${member.user_id}`} · Joined{" "}
                        {formatDate(member.joined_at)}
                      </div>
                    </div>

                    {canManageMembers && (
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        {!isLead && isProjectOwner && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            title="Promote to Team Lead"
                            onClick={() =>
                              void handleAssignLead(Number(member.user_id))
                            }
                          >
                            <Crown size={14} />
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          title="Remove Member"
                          onClick={() =>
                            void handleRemoveMember(
                              Number(member.user_id),
                              member.full_name
                            )
                          }
                        >
                          <UserMinus size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Team Tasks Card */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ fontSize: "1.1rem" }}>Team Tasks ({tasks.length})</h3>
              <p style={{ fontSize: "0.825rem", marginTop: "0.15rem" }}>
                Track sprint tasks and update execution status
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setIsCreateTaskOpen(true)}
            >
              <Plus size={15} />
              <span>New Task</span>
            </button>
          </div>

          {tasks.length === 0 ? (
            <div className="empty-state" style={{ padding: "1.75rem 1rem" }}>
              <div className="empty-state-icon">
                <ListTodo size={22} />
              </div>
              <h4>No Team Tasks Yet</h4>
              <p>Create the first task to assign work across team members.</p>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.7rem",
              }}
            >
              {tasks.map((task) => (
                <div
                  key={task.id}
                  style={{
                    padding: "0.85rem 1rem",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "var(--surface)",
                    border: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        marginBottom: "0.2rem",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: "0.925rem",
                          color: "var(--text)",
                        }}
                      >
                        {task.title}
                      </span>
                      <span className="badge badge-neutral">
                        {task.priority || "MEDIUM"}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "0.775rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      Assignee:{" "}
                      {task.assigned_user_name ||
                        task.assigned_to_name ||
                        (task.assigned_to
                          ? `User #${task.assigned_to}`
                          : "Unassigned")}{" "}
                      · Due: {formatDate(task.due_date)}
                    </div>
                  </div>

                  <select
                    aria-label={`Status for ${task.title}`}
                    value={task.status || "TODO"}
                    onChange={(e) =>
                      void handleTaskStatusChange(
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* TEAM SHARED FILES & TEAM ACTIVITY                                   */}
      {/* =================================================================== */}
      <div className="grid-2">
        {/* Team Shared Files */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ fontSize: "1.1rem" }}>Shared Files ({files.length})</h3>
              <p style={{ fontSize: "0.825rem", marginTop: "0.15rem" }}>
                Project documentation, specs, and assets
              </p>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={isUploadingFile}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={14} />
              <span>Upload</span>
            </button>
          </div>

          {files.length === 0 ? (
            <div className="empty-state" style={{ padding: "1.75rem 1rem" }}>
              <div className="empty-state-icon">
                <FileText size={22} />
              </div>
              <h4>No Files Uploaded</h4>
              <p>Upload design docs, PDFs, or archives for your squad.</p>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.65rem",
              }}
            >
              {files.map((file) => {
                const downloadUrl = fileService.getFileDownloadUrl(
                  file.file_url
                );
                return (
                  <div
                    key={file.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "0.75rem",
                      padding: "0.8rem 0.95rem",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--surface)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        className="truncate"
                        style={{ fontWeight: 600, color: "var(--text)" }}
                      >
                        {file.original_name}
                      </div>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        {formatFileSize(file.file_size)} · Uploaded{" "}
                        {formatDate(file.created_at)}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      {downloadUrl && (
                        <a
                          href={downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                          title="View / Download File"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        title="Delete File"
                        onClick={() =>
                          void handleDeleteFile(file.id, file.original_name)
                        }
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Team Activity Log */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ fontSize: "1.1rem" }}>Team Activity</h3>
              <p style={{ fontSize: "0.825rem", marginTop: "0.15rem" }}>
                Real-time audit trail for this team
              </p>
            </div>
            <Link to="/activity" className="btn btn-ghost btn-sm">
              All Activity
            </Link>
          </div>

          {activities.length === 0 ? (
            <div className="empty-state" style={{ padding: "1.75rem 1rem" }}>
              <div className="empty-state-icon">
                <ActivityIcon size={22} />
              </div>
              <h4>No Activity Recorded</h4>
              <p>
                Member updates, task completions, and file uploads will appear
                here.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.7rem",
              }}
            >
              {activities.slice(0, 6).map((act) => (
                <div
                  key={act.id}
                  style={{
                    padding: "0.75rem 0.95rem",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "var(--surface)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "0.25rem",
                    }}
                  >
                    <span className="badge badge-neutral">
                      {act.action_type}
                    </span>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-subtle)",
                      }}
                    >
                      {formatDate(act.created_at)}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.85rem", color: "var(--text)" }}>
                    {act.action_description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* ADD MEMBER MODAL                                                    */}
      {/* =================================================================== */}
      {isAddMemberOpen && (
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
              <h3>Add Team Member</h3>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setIsAddMemberOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddMember}>
              <div className="form-group">
                <label className="form-label" htmlFor="add-member-userid">
                  User ID
                </label>
                <input
                  id="add-member-userid"
                  type="number"
                  min={1}
                  placeholder="Enter collaborator's numeric User ID"
                  value={newMemberUserId}
                  onChange={(e) => setNewMemberUserId(e.target.value)}
                  required
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
                  onClick={() => setIsAddMemberOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isAddingMember}
                >
                  {isAddingMember ? "Adding..." : "Add Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* CREATE TASK MODAL                                                   */}
      {/* =================================================================== */}
      {isCreateTaskOpen && (
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
            style={{ width: "100%", maxWidth: "500px", padding: "1.75rem" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "1.25rem",
              }}
            >
              <h3>Create Team Task</h3>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setIsCreateTaskOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label className="form-label" htmlFor="team-task-title">
                  Task Title
                </label>
                <input
                  id="team-task-title"
                  type="text"
                  placeholder="e.g. Implement JWT refresh & role guard"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid-2" style={{ gap: "0.75rem" }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="team-task-priority">
                    Priority
                  </label>
                  <select
                    id="team-task-priority"
                    value={taskPriority}
                    onChange={(e) =>
                      setTaskPriority(e.target.value as TaskPriority)
                    }
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="team-task-assignee">
                    Assign To
                  </label>
                  <select
                    id="team-task-assignee"
                    value={taskAssignedTo}
                    onChange={(e) => setTaskAssignedTo(e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.user_id} value={m.user_id}>
                        {m.full_name || `User #${m.user_id}`} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="team-task-due">
                  Due Date (Optional)
                </label>
                <input
                  id="team-task-due"
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="team-task-desc">
                  Description
                </label>
                <textarea
                  id="team-task-desc"
                  rows={3}
                  placeholder="Acceptance criteria and implementation notes..."
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
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
                  onClick={() => setIsCreateTaskOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isCreatingTask}
                >
                  {isCreatingTask ? "Creating..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamDetails;
