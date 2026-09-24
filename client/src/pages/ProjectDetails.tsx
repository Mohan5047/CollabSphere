import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Activity as ActivityIcon,
  AlertCircle,
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Code2,
  Edit3,
  FileText,
  ListTodo,
  Loader2,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  User as UserIcon,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  activityService,
  applicationService,
  fileService,
  projectService,
  taskService,
  teamService,
} from "../services/api";
import type {
  Activity,
  Application,
  FileItem,
  Project,
  Task,
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

const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const numericProjectId = Number(id);
  const isInvalidId = !id || Number.isNaN(numericProjectId) || numericProjectId <= 0;

  const [project, setProject] = useState<Project | null>(null);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [projectTeams, setProjectTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Apply State
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [hasApplied, setHasApplied] = useState<boolean>(false);

  // Edit Project Modal State
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [editTitle, setEditTitle] = useState<string>("");
  const [editDescription, setEditDescription] = useState<string>("");
  const [editTechStack, setEditTechStack] = useState<string>("");
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);

  // Create Team Modal State
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState<boolean>(false);
  const [newTeamName, setNewTeamName] = useState<string>("");
  const [isCreatingTeam, setIsCreatingTeam] = useState<boolean>(false);

  const loadProjectWorkspace = useCallback(async () => {
    if (isInvalidId) {
      setLoading(false);
      setError("Invalid project identifier in URL.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const projectRes = await projectService.getProjectById(numericProjectId);
      const foundProject = projectRes.project;
      const ownerMatch =
        Boolean(projectRes.isOwner) ||
        (foundProject.owner_id !== undefined &&
          Number(foundProject.owner_id) === Number(user?.id));

      setProject(foundProject);
      setIsOwner(ownerMatch);
      setEditTitle(foundProject.title || "");
      setEditDescription(foundProject.description || "");
      setEditTechStack(foundProject.tech_stack || "");

      // Fetch all teams and filter those belonging to this project
      const [teamsRes, appsRes] = await Promise.allSettled([
        teamService.getAllTeams(),
        ownerMatch
          ? applicationService.getApplications()
          : Promise.resolve(null),
      ]);

      let matchedTeams: Team[] = [];
      if (teamsRes.status === "fulfilled") {
        const allTeams = Array.isArray(teamsRes.value.data)
          ? teamsRes.value.data
          : Array.isArray(teamsRes.value.teams)
            ? teamsRes.value.teams
            : [];
        matchedTeams = allTeams.filter(
          (t) => Number(t.project_id) === numericProjectId
        );
        setProjectTeams(matchedTeams);
      }

      if (appsRes.status === "fulfilled" && appsRes.value) {
        const allApps = Array.isArray(appsRes.value.applications)
          ? appsRes.value.applications
          : Array.isArray(appsRes.value.data)
            ? appsRes.value.data
            : [];
        setApplications(
          allApps.filter((a) => Number(a.project_id) === numericProjectId)
        );
      }

      // If project has one or more teams, load members, tasks, files, and activities
      if (matchedTeams.length > 0) {
        const primaryTeamId = matchedTeams[0].id;
        const [teamDetailRes, tasksRes, filesRes, activitiesRes] =
          await Promise.allSettled([
            teamService.getTeamById(primaryTeamId),
            taskService.getTeamTasks(primaryTeamId),
            fileService.getTeamFiles(primaryTeamId),
            activityService.getTeamActivities(primaryTeamId),
          ]);

        if (teamDetailRes.status === "fulfilled") {
          const detailData = teamDetailRes.value.data;
          const memberList = Array.isArray(detailData?.members)
            ? detailData.members
            : Array.isArray(teamDetailRes.value.members)
              ? teamDetailRes.value.members
              : [];
          setMembers(memberList);
        }

        if (tasksRes.status === "fulfilled") {
          const taskList = Array.isArray(tasksRes.value.tasks)
            ? tasksRes.value.tasks
            : Array.isArray(tasksRes.value.data)
              ? tasksRes.value.data
              : [];
          setTasks(taskList);
        }

        if (filesRes.status === "fulfilled") {
          const fileList = Array.isArray(filesRes.value.files)
            ? filesRes.value.files
            : Array.isArray(filesRes.value.data)
              ? filesRes.value.data
              : [];
          setFiles(fileList);
        }

        if (activitiesRes.status === "fulfilled") {
          const actList = Array.isArray(activitiesRes.value.activities)
            ? activitiesRes.value.activities
            : Array.isArray(activitiesRes.value.data)
              ? activitiesRes.value.data
              : [];
          setActivities(actList);
        }
      } else {
        setMembers([]);
        setTasks([]);
        setFiles([]);
        setActivities([]);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load project information."
      );
    } finally {
      setLoading(false);
    }
  }, [isInvalidId, numericProjectId, user?.id]);

  useEffect(() => {
    void loadProjectWorkspace();
  }, [loadProjectWorkspace]);

  // Apply to Project
  const handleApplyToProject = async () => {
    setActionError(null);
    setActionMessage(null);
    setIsApplying(true);

    try {
      const res = await applicationService.applyToProject({
        project_id: numericProjectId,
      });
      setHasApplied(true);
      setActionMessage(
        res.message || "Application submitted successfully to the project owner!"
      );
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Could not submit application."
      );
    } finally {
      setIsApplying(false);
    }
  };

  // Accept or Reject Application (Owner)
  const handleApplicationDecision = async (
    applicationId: number,
    decision: "accept" | "reject"
  ) => {
    setActionError(null);
    setActionMessage(null);

    try {
      if (decision === "accept") {
        await applicationService.acceptApplication(applicationId);
        setActionMessage(
          "Application accepted! Applicant has been added to the project team."
        );
      } else {
        await applicationService.rejectApplication(applicationId);
        setActionMessage("Application rejected.");
      }
      await loadProjectWorkspace();
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Failed to process application decision."
      );
    }
  };

  // Update Project (Owner)
  const handleUpdateProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editTitle.trim() || !editDescription.trim() || !editTechStack.trim()) {
      setActionError("Title, description, and tech stack are required.");
      return;
    }

    setIsSavingEdit(true);
    setActionError(null);
    try {
      await projectService.updateProject(numericProjectId, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        tech_stack: editTechStack.trim(),
      });
      setIsEditOpen(false);
      setActionMessage("Project updated successfully.");
      await loadProjectWorkspace();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to update project."
      );
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Delete Project (Owner)
  const handleDeleteProject = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this project? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      await projectService.deleteProject(numericProjectId);
      navigate("/projects", { replace: true });
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to delete project."
      );
    }
  };

  // Create Team for Project (Owner)
  const handleCreateTeam = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newTeamName.trim()) {
      setActionError("Team name is required.");
      return;
    }

    setIsCreatingTeam(true);
    setActionError(null);
    try {
      await teamService.createTeam({
        project_id: numericProjectId,
        team_name: newTeamName.trim(),
      });
      setNewTeamName("");
      setIsCreateTeamOpen(false);
      setActionMessage("Team created successfully for this project!");
      await loadProjectWorkspace();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to create team."
      );
    } finally {
      setIsCreatingTeam(false);
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="loading-state">
          <div className="spinner" aria-hidden="true" />
          <h3>Loading project workspace...</h3>
          <p>Fetching teams, members, tasks, files, and applications.</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="page-content">
        <div className="error-state">
          <div className="error-state-icon">
            <AlertCircle size={26} />
          </div>
          <h3>Project Unavailable</h3>
          <p>{error || "The requested project could not be found."}</p>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <Link to="/projects" className="btn btn-secondary">
              <ArrowLeft size={16} />
              <span>Back to Projects</span>
            </Link>
            {!isInvalidId && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void loadProjectWorkspace()}
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

  const techItems = (project.tech_stack || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const isMember = members.some(
    (m) => Number(m.user_id) === Number(user?.id)
  );

  return (
    <div className="page-content">
      {/* Back Navigation */}
      <div style={{ marginBottom: "1rem" }}>
        <Link
          to="/projects"
          className="btn btn-ghost btn-sm"
          style={{ paddingLeft: "0.5rem" }}
        >
          <ArrowLeft size={15} />
          <span>Back to Projects Directory</span>
        </Link>
      </div>

      {/* Feedback Banners */}
      {actionMessage && (
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
            {actionMessage}
          </span>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setActionMessage(null)}
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
      {/* PROJECT HERO HEADER                                                 */}
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
          <div style={{ flex: "1 1 420px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                marginBottom: "0.65rem",
                flexWrap: "wrap",
              }}
            >
              <span className="badge badge-primary">
                Project #{project.id}
              </span>
              {isOwner && (
                <span className="badge badge-success">Project Owner</span>
              )}
              {isMember && !isOwner && (
                <span className="badge badge-secondary">Team Member</span>
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
                Created {formatDate(project.created_at)}
              </span>
            </div>

            <h1 style={{ fontSize: "1.75rem", marginBottom: "0.65rem" }}>
              {project.title}
            </h1>

            <p
              style={{
                fontSize: "0.95rem",
                color: "var(--text-muted)",
                marginBottom: "1.1rem",
                lineHeight: 1.65,
              }}
            >
              {project.description}
            </p>

            {/* Tech Stack */}
            {techItems.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.45rem",
                  marginBottom: "1rem",
                }}
              >
                {techItems.map((tech, i) => (
                  <span
                    key={i}
                    className="badge badge-neutral"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.3rem",
                    }}
                  >
                    <Code2 size={12} />
                    {tech}
                  </span>
                ))}
              </div>
            )}

            {/* Owner Metadata */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.85rem",
                color: "var(--text-muted)",
              }}
            >
              <UserIcon size={15} style={{ color: "var(--primary)" }} />
              <span>
                Lead Owner:{" "}
                <strong style={{ color: "var(--text)" }}>
                  {project.owner_name ||
                    (isOwner ? user?.full_name : "Project Owner")}
                </strong>
              </span>
            </div>
          </div>

          {/* Permission-Based Action Controls */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.65rem",
              flexWrap: "wrap",
            }}
          >
            {isOwner ? (
              <>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setIsCreateTeamOpen(true)}
                >
                  <Plus size={16} />
                  <span>Create Team</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsEditOpen(true)}
                >
                  <Edit3 size={16} />
                  <span>Edit Project</span>
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => void handleDeleteProject()}
                >
                  <Trash2 size={16} />
                  <span>Delete</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                disabled={isApplying || hasApplied || isMember}
                onClick={() => void handleApplyToProject()}
              >
                {isApplying ? (
                  <>
                    <Loader2
                      size={16}
                      style={{ animation: "spin 0.8s linear infinite" }}
                    />
                    <span>Submitting...</span>
                  </>
                ) : hasApplied ? (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Application Sent</span>
                  </>
                ) : isMember ? (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Already in Team</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Apply to Join Project</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* TEAMS & MEMBERS + APPLICATIONS (OR TASKS)                           */}
      {/* =================================================================== */}
      <div className="grid-2" style={{ marginBottom: "1.75rem" }}>
        {/* Project Teams & Members */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ fontSize: "1.1rem" }}>Project Teams & Members</h3>
              <p style={{ fontSize: "0.825rem", marginTop: "0.15rem" }}>
                Active squads and collaborators assigned to this project
              </p>
            </div>
            {projectTeams.length > 0 && (
              <Link
                to={`/teams/${projectTeams[0].id}`}
                className="btn btn-secondary btn-sm"
              >
                Open Team Workspace
              </Link>
            )}
          </div>

          {projectTeams.length === 0 ? (
            <div className="empty-state" style={{ padding: "1.75rem 1rem" }}>
              <div className="empty-state-icon">
                <Users size={22} />
              </div>
              <h4>No Team Created Yet</h4>
              <p>
                {isOwner
                  ? "Create a team for this project or accept an application to automatically provision one."
                  : "A squad has not been provisioned for this project yet."}
              </p>
              {isOwner && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setIsCreateTeamOpen(true)}
                >
                  <Plus size={15} />
                  <span>Create Team</span>
                </button>
              )}
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.85rem",
              }}
            >
              {projectTeams.map((team) => (
                <div
                  key={team.id}
                  style={{
                    padding: "0.9rem 1rem",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "var(--surface)",
                    border: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--text)" }}>
                      {team.team_name}
                    </div>
                    <span
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {team.member_count ?? members.length} members
                    </span>
                  </div>
                  <Link
                    to={`/teams/${team.id}`}
                    className="btn btn-secondary btn-sm"
                  >
                    Manage Team
                  </Link>
                </div>
              ))}

              {members.length > 0 && (
                <div style={{ marginTop: "0.5rem" }}>
                  <h4
                    style={{
                      fontSize: "0.85rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      color: "var(--text-subtle)",
                      marginBottom: "0.6rem",
                    }}
                  >
                    Active Roster ({members.length})
                  </h4>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    }}
                  >
                    {members.map((m) => (
                      <div
                        key={m.member_id || m.user_id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "0.6rem 0.85rem",
                          borderRadius: "var(--radius-sm)",
                          backgroundColor: "var(--bg-elevated)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: "0.875rem",
                              fontWeight: 600,
                              color: "var(--text)",
                            }}
                          >
                            {m.full_name || `User #${m.user_id}`}
                          </div>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--text-muted)",
                            }}
                          >
                            {m.email}
                          </div>
                        </div>
                        <span className="badge badge-primary">{m.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Project Tasks Overview */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ fontSize: "1.1rem" }}>Project Tasks</h3>
              <p style={{ fontSize: "0.825rem", marginTop: "0.15rem" }}>
                Deliverables and milestones tracked by the project team
              </p>
            </div>
            <Link to="/tasks" className="btn btn-ghost btn-sm">
              All Tasks
            </Link>
          </div>

          {tasks.length === 0 ? (
            <div className="empty-state" style={{ padding: "1.75rem 1rem" }}>
              <div className="empty-state-icon">
                <ListTodo size={22} />
              </div>
              <h4>No Tasks Assigned</h4>
              <p>
                Tasks created inside this project&apos;s team workspace will
                appear here.
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
              {tasks.slice(0, 5).map((task) => (
                <div
                  key={task.id}
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
                  <div style={{ minWidth: 0 }}>
                    <div
                      className="truncate"
                      style={{ fontWeight: 600, color: "var(--text)" }}
                    >
                      {task.title}
                    </div>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      Priority: {task.priority} · Due:{" "}
                      {formatDate(task.due_date)}
                    </span>
                  </div>
                  <span
                    className={`badge ${
                      task.status === "COMPLETED"
                        ? "badge-success"
                        : task.status === "IN_PROGRESS"
                          ? "badge-secondary"
                          : "badge-neutral"
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* APPLICATIONS (OWNER VIEW) + FILES & ACTIVITY                        */}
      {/* =================================================================== */}
      <div className="grid-2">
        {/* Applications or Shared Files */}
        {isOwner ? (
          <div className="card">
            <div className="card-header">
              <div>
                <h3 style={{ fontSize: "1.1rem" }}>
                  Candidate Applications ({applications.length})
                </h3>
                <p style={{ fontSize: "0.825rem", marginTop: "0.15rem" }}>
                  Review and approve students applying to join this project
                </p>
              </div>
              <Link to="/applications" className="btn btn-ghost btn-sm">
                All Applications
              </Link>
            </div>

            {applications.length === 0 ? (
              <div className="empty-state" style={{ padding: "1.75rem 1rem" }}>
                <h4>No Applications Yet</h4>
                <p>
                  When students apply to join this project, their requests will
                  be listed here.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                {applications.map((app) => {
                  const statusUpper = (app.status || "PENDING").toUpperCase();
                  return (
                    <div
                      key={app.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "0.75rem",
                        padding: "0.85rem 1rem",
                        borderRadius: "var(--radius-md)",
                        backgroundColor: "var(--surface)",
                        border: "1px solid var(--border)",
                        flexWrap: "wrap",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--text)" }}>
                          {app.full_name || `Applicant #${app.user_id}`}
                        </div>
                        <div
                          style={{
                            fontSize: "0.775rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          {app.email} · Applied {formatDate(app.applied_at)}
                        </div>
                      </div>

                      {statusUpper === "PENDING" ? (
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() =>
                              void handleApplicationDecision(app.id, "accept")
                            }
                          >
                            <Check size={14} />
                            <span>Accept</span>
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() =>
                              void handleApplicationDecision(app.id, "reject")
                            }
                          >
                            <X size={14} />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <span
                          className={`badge ${
                            statusUpper === "ACCEPTED"
                              ? "badge-success"
                              : "badge-danger"
                          }`}
                        >
                          {statusUpper}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="card">
            <div className="card-header">
              <div>
                <h3 style={{ fontSize: "1.1rem" }}>Project Shared Files</h3>
                <p style={{ fontSize: "0.825rem", marginTop: "0.15rem" }}>
                  Documents and resources uploaded by the team
                </p>
              </div>
              <Link to="/files" className="btn btn-ghost btn-sm">
                File Repository
              </Link>
            </div>

            {files.length === 0 ? (
              <div className="empty-state" style={{ padding: "1.75rem 1rem" }}>
                <div className="empty-state-icon">
                  <FileText size={22} />
                </div>
                <h4>No Files Uploaded</h4>
                <p>Shared team files and attachments will appear here.</p>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.65rem",
                }}
              >
                {files.slice(0, 5).map((file) => (
                  <div
                    key={file.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.75rem 0.95rem",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--surface)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <span
                      className="truncate"
                      style={{ fontWeight: 500, color: "var(--text)" }}
                    >
                      {file.original_name}
                    </span>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {formatDate(file.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Project Activity Log */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ fontSize: "1.1rem" }}>Project Activity</h3>
              <p style={{ fontSize: "0.825rem", marginTop: "0.15rem" }}>
                Recent events across this project&apos;s team workspace
              </p>
            </div>
            <Link to="/activity" className="btn btn-ghost btn-sm">
              Full Log
            </Link>
          </div>

          {activities.length === 0 ? (
            <div className="empty-state" style={{ padding: "1.75rem 1rem" }}>
              <div className="empty-state-icon">
                <ActivityIcon size={22} />
              </div>
              <h4>No Activity Yet</h4>
              <p>
                Team updates, task changes, and file uploads will be logged
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
              {activities.slice(0, 5).map((act) => (
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
      {/* EDIT PROJECT MODAL                                                  */}
      {/* =================================================================== */}
      {isEditOpen && (
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
              <h3>Edit Project Details</h3>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setIsEditOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateProject}>
              <div className="form-group">
                <label className="form-label" htmlFor="edit-project-title">
                  Title
                </label>
                <input
                  id="edit-project-title"
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-project-tech">
                  Tech Stack
                </label>
                <input
                  id="edit-project-tech"
                  type="text"
                  value={editTechStack}
                  onChange={(e) => setEditTechStack(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-project-desc">
                  Description
                </label>
                <textarea
                  id="edit-project-desc"
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
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
                  onClick={() => setIsEditOpen(false)}
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

      {/* =================================================================== */}
      {/* CREATE TEAM MODAL                                                   */}
      {/* =================================================================== */}
      {isCreateTeamOpen && (
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
            style={{ width: "100%", maxWidth: "460px", padding: "1.75rem" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "1.25rem",
              }}
            >
              <h3>Create Project Team</h3>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setIsCreateTeamOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTeam}>
              <div className="form-group">
                <label className="form-label" htmlFor="new-team-name">
                  Team Name
                </label>
                <input
                  id="new-team-name"
                  type="text"
                  placeholder="e.g. Core Engineering Squad"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
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
                  onClick={() => setIsCreateTeamOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isCreatingTeam}
                >
                  {isCreatingTeam ? "Creating..." : "Create Team"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
