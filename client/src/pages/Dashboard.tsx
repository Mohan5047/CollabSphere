import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity as ActivityIcon,
  AlertCircle,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  FolderKanban,
  ListTodo,
  Plus,
  RefreshCw,
  Sparkles,
  Users,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";
import {
  activityService,
  projectService,
  taskService,
  teamService,
  userService,
} from "../services/api";
import type {
  Activity,
  DashboardData,
  Project,
  Task,
  Team,
} from "../types";

const formatDate = (isoString?: string | null): string => {
  if (!isoString) return "Recently";
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) return "Recently";
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [
        dashboardResult,
        projectsResult,
        teamsResult,
        activitiesResult,
      ] = await Promise.allSettled([
        userService.getDashboard(user.id),
        projectService.getAllProjects(),
        teamService.getAllTeams(),
        activityService.getUserActivities(user.id),
      ]);

      // 1. User Learning & Certificate Dashboard
      if (dashboardResult.status === "fulfilled") {
        setDashboardData(dashboardResult.value);
      }

      // 2. Projects
      if (projectsResult.status === "fulfilled") {
        const res = projectsResult.value;
        const list = Array.isArray(res.projects)
          ? res.projects
          : Array.isArray(res.data)
            ? res.data
            : [];
        setProjects(list);
      }

      // 3. Teams + Team Tasks
      let fetchedTeams: Team[] = [];
      if (teamsResult.status === "fulfilled") {
        const res = teamsResult.value;
        fetchedTeams = Array.isArray(res.teams)
          ? res.teams
          : Array.isArray(res.data)
            ? res.data
            : [];
        setTeams(fetchedTeams);
      }

      // Fetch tasks across up to 5 active teams to compute real task status breakdowns
      if (fetchedTeams.length > 0) {
        const teamsToSample = fetchedTeams.slice(0, 5);
        const taskResults = await Promise.allSettled(
          teamsToSample.map((team) => taskService.getTeamTasks(team.id))
        );

        const aggregatedTasks: Task[] = [];
        const seenTaskIds = new Set<number>();

        taskResults.forEach((tr) => {
          if (tr.status === "fulfilled") {
            const items = Array.isArray(tr.value.tasks)
              ? tr.value.tasks
              : Array.isArray(tr.value.data)
                ? tr.value.data
                : [];
            items.forEach((task) => {
              if (!seenTaskIds.has(task.id)) {
                seenTaskIds.add(task.id);
                aggregatedTasks.push(task);
              }
            });
          }
        });

        setTasks(aggregatedTasks);
      } else {
        setTasks([]);
      }

      // 4. Recent Activity Timeline
      if (activitiesResult.status === "fulfilled") {
        const res = activitiesResult.value;
        const list = Array.isArray(res.activities)
          ? res.activities
          : Array.isArray(res.data)
            ? res.data
            : [];
        setActivities(list);
      }

      // Check if every primary endpoint rejected
      if (
        dashboardResult.status === "rejected" &&
        projectsResult.status === "rejected" &&
        teamsResult.status === "rejected"
      ) {
        const reason =
          (dashboardResult.reason as Error)?.message ||
          "Unable to load dashboard data from the server.";
        setError(reason);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while loading your dashboard."
      );
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  // Computed Task Breakdown
  const taskBreakdown = useMemo(() => {
    let todo = 0;
    let inProgress = 0;
    let completed = 0;

    tasks.forEach((t) => {
      const normalized = (t.status || "TODO").toUpperCase();
      if (normalized === "COMPLETED") {
        completed += 1;
      } else if (normalized === "IN_PROGRESS") {
        inProgress += 1;
      } else {
        todo += 1;
      }
    });

    return {
      todo,
      inProgress,
      completed,
      total: tasks.length,
    };
  }, [tasks]);

  // Computed Learning Progress Average
  const averageLearningProgress = useMemo(() => {
    const enrolledCourses = dashboardData?.courses ?? [];
    if (enrolledCourses.length === 0) return 0;
    const sum = enrolledCourses.reduce(
      (acc, c) => acc + Number(c.progress_percentage || 0),
      0
    );
    return Math.round(sum / enrolledCourses.length);
  }, [dashboardData]);

  // Loading State
  if (loading) {
    return (
      <div className="page-content">
        <div className="loading-state">
          <div className="spinner" aria-hidden="true" />
          <h3>Loading your CollabSphere workspace...</h3>
          <p>Syncing projects, teams, tasks, and learning tracks.</p>
        </div>
      </div>
    );
  }

  // Critical Error State
  if (error && !dashboardData && projects.length === 0) {
    return (
      <div className="page-content">
        <div className="error-state">
          <div className="error-state-icon">
            <AlertCircle size={26} />
          </div>
          <h3>Unable to Load Dashboard</h3>
          <p>{error}</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => void loadDashboard()}
          >
            <RefreshCw size={16} />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  const enrolledCourses = dashboardData?.courses ?? [];
  const certificatesCount = dashboardData?.stats?.certificates ?? 0;
  const completedCoursesCount = dashboardData?.stats?.completed_courses ?? 0;

  return (
    <div className="page-content">
      {/* =================================================================== */}
      {/* 1. WELCOME HEADER & QUICK ACTIONS                                   */}
      {/* =================================================================== */}
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <Logo variant="icon" size="lg" />
          <div className="page-title-group">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.65rem",
                flexWrap: "wrap",
              }}
            >
              <h1>
                Welcome back, {user?.full_name?.split(" ")[0] || "Collaborator"}
              </h1>
              <span className="badge badge-primary" style={{ textTransform: "capitalize" }}>
                {user?.role?.replace("_", " ") || "Student"}
              </span>
            </div>
            <p>
              Here is what is happening across your projects, agile teams, and
              learning tracks today.
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
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
            onClick={() => navigate("/projects")}
          >
            <Plus size={16} />
            <span>Create Project</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate("/teams")}
          >
            <Users size={16} />
            <span>Join Team</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate("/learning")}
          >
            <BookOpen size={16} />
            <span>Browse Learning</span>
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => navigate("/tasks")}
          >
            <ListTodo size={16} />
            <span>View Tasks</span>
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. TOP KPI STATISTICS CARDS                                         */}
      {/* =================================================================== */}
      <div className="grid-4" style={{ marginBottom: "1.75rem" }}>
        {/* Total Projects */}
        <div className="stat-card">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span className="stat-label">Total Projects</span>
            <span
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: "var(--primary-muted)",
                color: "var(--primary)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FolderKanban size={18} />
            </span>
          </div>
          <div className="stat-value">{projects.length}</div>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            {
              projects.filter(
                (p) => (p.status || "open").toLowerCase() !== "completed"
              ).length
            }{" "}
            active in workspace
          </span>
        </div>

        {/* Total Teams */}
        <div className="stat-card">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span className="stat-label">Total Teams</span>
            <span
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: "var(--secondary-muted)",
                color: "var(--secondary)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Users size={18} />
            </span>
          </div>
          <div className="stat-value">{teams.length}</div>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Collaborative project squads
          </span>
        </div>

        {/* Tasks Completed */}
        <div className="stat-card">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span className="stat-label">Tasks Completed</span>
            <span
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: "var(--success-muted)",
                color: "var(--success)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircle2 size={18} />
            </span>
          </div>
          <div className="stat-value">{taskBreakdown.completed}</div>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            {taskBreakdown.inProgress} in progress · {taskBreakdown.todo} to do
          </span>
        </div>

        {/* Learning Progress / Certificates */}
        <div className="stat-card">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span className="stat-label">Learning & Certificates</span>
            <span
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: "var(--warning-muted)",
                color: "var(--warning)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Award size={18} />
            </span>
          </div>
          <div className="stat-value">{averageLearningProgress}%</div>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            {completedCoursesCount} completed · {certificatesCount} certificates
          </span>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 3. PROJECTS OVERVIEW & TASK BREAKDOWN                               */}
      {/* =================================================================== */}
      <div className="grid-2" style={{ marginBottom: "1.75rem" }}>
        {/* Project Overview Section */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ fontSize: "1.1rem" }}>Active Projects Overview</h3>
              <p style={{ fontSize: "0.825rem", marginTop: "0.15rem" }}>
                Recent software and research initiatives
              </p>
            </div>
            <Link to="/projects" className="btn btn-ghost btn-sm">
              <span>All Projects</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          {projects.length === 0 ? (
            <div className="empty-state" style={{ padding: "2rem 1.25rem" }}>
              <div className="empty-state-icon">
                <FolderKanban size={22} />
              </div>
              <h4>No Projects Yet</h4>
              <p>
                Launch your first collaborative project or explore open student
                initiatives.
              </p>
              <Link to="/projects" className="btn btn-primary btn-sm">
                <Plus size={15} />
                <span>Create First Project</span>
              </Link>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.85rem",
              }}
            >
              {projects.slice(0, 4).map((project) => {
                const status = (project.status || "open").toLowerCase();
                const badgeClass =
                  status === "completed"
                    ? "badge-success"
                    : status === "in_progress"
                      ? "badge-secondary"
                      : "badge-primary";

                return (
                  <div
                    key={project.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "1rem",
                      padding: "0.9rem 1rem",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--surface)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          marginBottom: "0.25rem",
                        }}
                      >
                        <Link
                          to={`/projects/${project.id}`}
                          style={{
                            fontWeight: 600,
                            color: "var(--text)",
                            fontSize: "0.95rem",
                          }}
                          className="truncate"
                        >
                          {project.title}
                        </Link>
                        <span className={`badge ${badgeClass}`}>
                          {status.replace("_", " ")}
                        </span>
                      </div>
                      <p
                        className="truncate"
                        style={{ fontSize: "0.825rem", margin: 0 }}
                      >
                        {project.description ||
                          "Collaborative project workspace"}
                      </p>
                    </div>

                    <Link
                      to={`/projects/${project.id}`}
                      className="btn btn-secondary btn-sm"
                    >
                      Open
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Task Status Overview Section */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ fontSize: "1.1rem" }}>Task Status Breakdown</h3>
              <p style={{ fontSize: "0.825rem", marginTop: "0.15rem" }}>
                Real-time distribution across team sprint boards
              </p>
            </div>
            <Link to="/tasks" className="btn btn-ghost btn-sm">
              <span>Task Board</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          {/* Status Pill Counters */}
          <div
            className="grid-3"
            style={{ gap: "0.75rem", marginBottom: "1.25rem" }}
          >
            <div
              style={{
                padding: "0.85rem",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
                textAlign: "center",
              }}
            >
              <span
                className="badge badge-neutral"
                style={{ marginBottom: "0.4rem" }}
              >
                TODO
              </span>
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "var(--text)",
                }}
              >
                {taskBreakdown.todo}
              </div>
            </div>

            <div
              style={{
                padding: "0.85rem",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
                textAlign: "center",
              }}
            >
              <span
                className="badge badge-secondary"
                style={{ marginBottom: "0.4rem" }}
              >
                IN_PROGRESS
              </span>
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "var(--secondary)",
                }}
              >
                {taskBreakdown.inProgress}
              </div>
            </div>

            <div
              style={{
                padding: "0.85rem",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
                textAlign: "center",
              }}
            >
              <span
                className="badge badge-success"
                style={{ marginBottom: "0.4rem" }}
              >
                COMPLETED
              </span>
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "var(--success)",
                }}
              >
                {taskBreakdown.completed}
              </div>
            </div>
          </div>

          {/* Recent Tasks List */}
          {tasks.length === 0 ? (
            <div className="empty-state" style={{ padding: "1.5rem 1rem" }}>
              <p style={{ marginBottom: "0.75rem" }}>
                No team tasks assigned yet. Create or join a team to track
                sprint deliverables.
              </p>
              <Link to="/tasks" className="btn btn-secondary btn-sm">
                Go to Tasks
              </Link>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.65rem",
              }}
            >
              {tasks.slice(0, 3).map((task) => {
                const normalizedStatus = (task.status || "TODO").toUpperCase();
                const statusBadge =
                  normalizedStatus === "COMPLETED"
                    ? "badge-success"
                    : normalizedStatus === "IN_PROGRESS"
                      ? "badge-secondary"
                      : "badge-neutral";

                return (
                  <div
                    key={task.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "0.75rem",
                      padding: "0.75rem 0.95rem",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--surface)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        className="truncate"
                        style={{
                          fontWeight: 600,
                          fontSize: "0.88rem",
                          color: "var(--text)",
                        }}
                      >
                        {task.title}
                      </div>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        Due: {formatDate(task.due_date)}
                      </span>
                    </div>
                    <span className={`badge ${statusBadge}`}>
                      {normalizedStatus}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* 4. LEARNING PROGRESS & RECENT ACTIVITY TIMELINE                     */}
      {/* =================================================================== */}
      <div className="grid-2">
        {/* Learning Progress Section */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ fontSize: "1.1rem" }}>Learning Track Progress</h3>
              <p style={{ fontSize: "0.825rem", marginTop: "0.15rem" }}>
                Courses, modules, and verified skill credentials
              </p>
            </div>
            <Link to="/learning" className="btn btn-ghost btn-sm">
              <span>Catalog</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          {enrolledCourses.length === 0 ? (
            <div className="empty-state" style={{ padding: "2rem 1.25rem" }}>
              <div className="empty-state-icon">
                <BookOpen size={22} />
              </div>
              <h4>No Enrolled Courses</h4>
              <p>
                Enroll in structured courses to build skills, pass assessments,
                and earn certificates.
              </p>
              <Link to="/learning" className="btn btn-primary btn-sm">
                <Sparkles size={15} />
                <span>Browse Learning Tracks</span>
              </Link>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.95rem",
              }}
            >
              {enrolledCourses.slice(0, 4).map((course) => {
                const pct = Math.min(
                  100,
                  Math.max(0, Number(course.progress_percentage || 0))
                );
                return (
                  <div
                    key={course.enrollment_id || course.course_id}
                    style={{
                      padding: "0.95rem 1rem",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--surface)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "0.75rem",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <Link
                        to={`/learning/${course.course_id}`}
                        style={{
                          fontWeight: 600,
                          fontSize: "0.925rem",
                          color: "var(--text)",
                        }}
                      >
                        {course.course_title}
                      </Link>
                      <span
                        className={`badge ${
                          pct >= 100 ? "badge-success" : "badge-primary"
                        }`}
                      >
                        {pct}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div
                      style={{
                        width: "100%",
                        height: "7px",
                        borderRadius: "999px",
                        backgroundColor: "var(--bg)",
                        overflow: "hidden",
                        marginBottom: "0.45rem",
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          borderRadius: "999px",
                          background:
                            pct >= 100
                              ? "var(--success)"
                              : "linear-gradient(90deg, var(--primary), var(--secondary))",
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.775rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      <span>
                        {course.completed_modules} modules ·{" "}
                        {course.completed_lessons} lessons completed
                      </span>
                      <span>{(course.progress_status || "IN_PROGRESS").replace("_", " ")}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Activity Section */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ fontSize: "1.1rem" }}>Recent Activity</h3>
              <p style={{ fontSize: "0.825rem", marginTop: "0.15rem" }}>
                Latest audit events and updates from your workspace
              </p>
            </div>
            <Link to="/activity" className="btn btn-ghost btn-sm">
              <span>Full Timeline</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          {activities.length === 0 ? (
            <div className="empty-state" style={{ padding: "2rem 1.25rem" }}>
              <div className="empty-state-icon">
                <ActivityIcon size={22} />
              </div>
              <h4>No Activity Recorded Yet</h4>
              <p>
                Actions such as creating projects, completing tasks, and
                uploading files will appear here automatically.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.8rem",
              }}
            >
              {activities.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.85rem",
                    padding: "0.8rem 0.95rem",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "var(--surface)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <span
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      backgroundColor: "var(--primary-muted)",
                      color: "var(--primary)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: "0.1rem",
                    }}
                  >
                    <Clock size={15} />
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "0.5rem",
                      }}
                    >
                      <span
                        className="badge badge-neutral"
                        style={{ fontSize: "0.7rem" }}
                      >
                        {item.action_type}
                      </span>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-subtle)",
                        }}
                      >
                        {formatDate(item.created_at)}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: "0.865rem",
                        color: "var(--text)",
                        marginTop: "0.3rem",
                      }}
                    >
                      {item.action_description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
