import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Activity as ActivityIcon,
  FolderKanban,
  Users,
  CheckSquare,
  FileUp,
  FileX,
  BookOpen,
  Award,
  HelpCircle,
  Search,
  RefreshCw,
  AlertCircle,
  Clock,
  User as UserIcon,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  activityService,
  teamService,
  projectService,
  getErrorMessage,
} from "../services/api";
import type { Activity as ActivityItem, Team, Project } from "../types";

type ScopeFilter = "USER" | "TEAM" | "PROJECT";
type CategoryFilter =
  | "ALL"
  | "PROJECT"
  | "TEAM"
  | "TASK"
  | "FILE"
  | "LEARNING";

const Activity: React.FC = () => {
  const { user } = useAuth();
  const currentUserId = Number(user?.id || 0);

  // Scope & context entities
  const [scope, setScope] = useState<ScopeFilter>("USER");
  const [teams, setTeams] = useState<Team[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  // Activities list
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Load lookup maps for teams and projects
  useEffect(() => {
    const fetchLookups = async () => {
      const [teamsRes, projectsRes] = await Promise.allSettled([
        teamService.getAllTeams(),
        projectService.getAllProjects(),
      ]);

      if (teamsRes.status === "fulfilled") {
        const tList = Array.isArray(teamsRes.value.data)
          ? teamsRes.value.data
          : [];
        setTeams(tList);
        if (tList.length > 0) {
          setSelectedTeamId(String(tList[0].id));
        }
      }

      if (projectsRes.status === "fulfilled") {
        const pList = Array.isArray(projectsRes.value.projects)
          ? projectsRes.value.projects
          : Array.isArray(projectsRes.value.data)
          ? projectsRes.value.data
          : [];
        setProjects(pList);
        if (pList.length > 0) {
          setSelectedProjectId(String(pList[0].id));
        }
      }
    };

    fetchLookups();
  }, []);

  const teamsMap = useMemo(() => {
    const map: Record<number, Team> = {};
    teams.forEach((t) => {
      map[t.id] = t;
    });
    return map;
  }, [teams]);

  const projectsMap = useMemo(() => {
    const map: Record<number, Project> = {};
    projects.forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, [projects]);

  // Fetch activities based on active scope
  const fetchActivities = useCallback(async () => {
    if (!currentUserId) return;
    setIsLoading(true);
    setError(null);

    try {
      if (scope === "USER") {
        const res = await activityService.getUserActivities(currentUserId);
        setActivities(Array.isArray(res.data) ? res.data : []);
      } else if (scope === "TEAM") {
        if (!selectedTeamId) {
          setActivities([]);
        } else {
          const res = await activityService.getTeamActivities(selectedTeamId);
          setActivities(Array.isArray(res.data) ? res.data : []);
        }
      } else if (scope === "PROJECT") {
        if (!selectedProjectId) {
          setActivities([]);
        } else {
          const res = await activityService.getProjectActivities(
            selectedProjectId
          );
          setActivities(Array.isArray(res.data) ? res.data : []);
        }
      }
    } catch (err) {
      setActivities([]);
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, scope, selectedTeamId, selectedProjectId]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Classify activity type into icon, color, and category
  const getActivityPresentation = (activityType?: string) => {
    const type = (activityType || "ACTIVITY").toUpperCase();

    if (type.includes("FILE_DELETED") || type.includes("DELETE_FILE")) {
      return {
        category: "FILE" as CategoryFilter,
        label: "File Deleted",
        icon: FileX,
        color: "#ef4444",
        bg: "rgba(239, 68, 68, 0.14)",
        border: "rgba(239, 68, 68, 0.3)",
      };
    }
    if (type.includes("FILE")) {
      return {
        category: "FILE" as CategoryFilter,
        label: "File Uploaded",
        icon: FileUp,
        color: "#38bdf8",
        bg: "rgba(56, 189, 248, 0.14)",
        border: "rgba(56, 189, 248, 0.3)",
      };
    }
    if (type.includes("TASK_COMPLETED") || type.includes("COMPLETE_TASK")) {
      return {
        category: "TASK" as CategoryFilter,
        label: "Task Completed",
        icon: CheckCircle2,
        color: "#10b981",
        bg: "rgba(16, 185, 129, 0.14)",
        border: "rgba(16, 185, 129, 0.3)",
      };
    }
    if (type.includes("TASK")) {
      return {
        category: "TASK" as CategoryFilter,
        label: "Task Activity",
        icon: CheckSquare,
        color: "#0ea5e9",
        bg: "rgba(14, 165, 233, 0.14)",
        border: "rgba(14, 165, 233, 0.3)",
      };
    }
    if (type.includes("TEAM") || type.includes("MEMBER")) {
      return {
        category: "TEAM" as CategoryFilter,
        label: "Team Activity",
        icon: Users,
        color: "#a855f7",
        bg: "rgba(168, 85, 247, 0.14)",
        border: "rgba(168, 85, 247, 0.3)",
      };
    }
    if (type.includes("PROJECT") || type.includes("APPLICATION")) {
      return {
        category: "PROJECT" as CategoryFilter,
        label: "Project Activity",
        icon: FolderKanban,
        color: "#6366f1",
        bg: "rgba(99, 102, 241, 0.14)",
        border: "rgba(99, 102, 241, 0.3)",
      };
    }
    if (type.includes("CERT")) {
      return {
        category: "LEARNING" as CategoryFilter,
        label: "Certificate Earned",
        icon: Award,
        color: "#f59e0b",
        bg: "rgba(245, 158, 11, 0.14)",
        border: "rgba(245, 158, 11, 0.3)",
      };
    }
    if (type.includes("QUIZ")) {
      return {
        category: "LEARNING" as CategoryFilter,
        label: "Quiz Completed",
        icon: HelpCircle,
        color: "#ec4899",
        bg: "rgba(236, 72, 153, 0.14)",
        border: "rgba(236, 72, 153, 0.3)",
      };
    }
    if (
      type.includes("COURSE") ||
      type.includes("LESSON") ||
      type.includes("ENROLL")
    ) {
      return {
        category: "LEARNING" as CategoryFilter,
        label: "Learning Progress",
        icon: BookOpen,
        color: "#10b981",
        bg: "rgba(16, 185, 129, 0.14)",
        border: "rgba(16, 185, 129, 0.3)",
      };
    }

    return {
      category: "PROJECT" as CategoryFilter,
      label: type.replace(/_/g, " "),
      icon: ActivityIcon,
      color: "var(--primary)",
      bg: "rgba(99, 102, 241, 0.14)",
      border: "rgba(99, 102, 241, 0.3)",
    };
  };

  const filteredActivities = useMemo(() => {
    return activities.filter((item) => {
      const pres = getActivityPresentation(item.activity_type);
      if (categoryFilter !== "ALL" && pres.category !== categoryFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchDesc = (item.description || "").toLowerCase().includes(q);
        const matchType = (item.activity_type || "").toLowerCase().includes(q);
        const matchUser = (item.user_name || "").toLowerCase().includes(q);
        if (!matchDesc && !matchType && !matchUser) return false;
      }

      return true;
    });
  }, [activities, categoryFilter, searchQuery]);

  const formatTimestamp = (dateStr?: string) => {
    if (!dateStr) return { relative: "Recently", full: "" };
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { relative: dateStr, full: dateStr };

    const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
    let relative = "";
    if (diffSec < 60) relative = "Just now";
    else if (diffSec < 3600) relative = `${Math.floor(diffSec / 60)}m ago`;
    else if (diffSec < 86400) relative = `${Math.floor(diffSec / 3600)}h ago`;
    else if (diffSec < 604800)
      relative = `${Math.floor(diffSec / 86400)}d ago`;
    else
      relative = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

    const full = d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    return { relative, full };
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div
        className="page-header"
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "1rem",
          marginBottom: "1.75rem",
        }}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.3rem 0.75rem",
              borderRadius: "999px",
              background: "rgba(99, 102, 241, 0.12)",
              color: "var(--primary)",
              fontSize: "0.78rem",
              fontWeight: 600,
              marginBottom: "0.6rem",
            }}
          >
            <ActivityIcon size={14} />
            AUDIT & COLLABORATION STREAM
          </div>
          <h1 className="page-title" style={{ margin: 0 }}>
            Activity Timeline
          </h1>
          <p className="page-subtitle" style={{ marginTop: "0.35rem" }}>
            Chronological audit trail of projects, teams, tasks, files, and
            learning milestones.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={fetchActivities}
          disabled={isLoading}
        >
          <RefreshCw size={16} className={isLoading ? "spin" : ""} />
          Refresh Stream
        </button>
      </div>

      {/* Scope Selector + Context Selector Card */}
      <div
        className="card"
        style={{
          padding: "1.15rem 1.35rem",
          marginBottom: "1.25rem",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            padding: "0.25rem",
            borderRadius: "10px",
            background: "var(--bg)",
            border: "1px solid var(--border)",
            gap: "0.25rem",
          }}
        >
          <button
            type="button"
            onClick={() => setScope("USER")}
            style={{
              padding: "0.45rem 0.95rem",
              borderRadius: "8px",
              border: "none",
              fontSize: "0.84rem",
              fontWeight: 600,
              cursor: "pointer",
              background: scope === "USER" ? "var(--primary)" : "transparent",
              color: scope === "USER" ? "#fff" : "var(--text-muted)",
            }}
          >
            My Activity
          </button>
          <button
            type="button"
            onClick={() => setScope("TEAM")}
            style={{
              padding: "0.45rem 0.95rem",
              borderRadius: "8px",
              border: "none",
              fontSize: "0.84rem",
              fontWeight: 600,
              cursor: "pointer",
              background: scope === "TEAM" ? "var(--primary)" : "transparent",
              color: scope === "TEAM" ? "#fff" : "var(--text-muted)",
            }}
          >
            By Team
          </button>
          <button
            type="button"
            onClick={() => setScope("PROJECT")}
            style={{
              padding: "0.45rem 0.95rem",
              borderRadius: "8px",
              border: "none",
              fontSize: "0.84rem",
              fontWeight: 600,
              cursor: "pointer",
              background:
                scope === "PROJECT" ? "var(--primary)" : "transparent",
              color: scope === "PROJECT" ? "#fff" : "var(--text-muted)",
            }}
          >
            By Project
          </button>
        </div>

        {/* Dynamic Team or Project Selector */}
        {scope === "TEAM" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              minWidth: "250px",
            }}
          >
            <Users size={16} style={{ color: "var(--primary)" }} />
            <select
              className="form-select"
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
            >
              {teams.length === 0 ? (
                <option value="">No teams found</option>
              ) : (
                teams.map((t) => (
                  <option key={t.id} value={String(t.id)}>
                    {t.name}
                  </option>
                ))
              )}
            </select>
          </div>
        )}

        {scope === "PROJECT" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              minWidth: "250px",
            }}
          >
            <FolderKanban size={16} style={{ color: "var(--primary)" }} />
            <select
              className="form-select"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              {projects.length === 0 ? (
                <option value="">No projects found</option>
              ) : (
                projects.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.title}
                  </option>
                ))
              )}
            </select>
          </div>
        )}
      </div>

      {/* Search & Category Filter Pills */}
      <div
        className="card"
        style={{
          padding: "1rem 1.25rem",
          marginBottom: "1.75rem",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <div
          style={{
            position: "relative",
            flex: "1 1 260px",
            maxWidth: "400px",
          }}
        >
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "0.85rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
            }}
          />
          <input
            type="text"
            className="form-input"
            placeholder="Search activity description or member..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: "2.4rem" }}
          />
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
          {(
            [
              { key: "ALL", label: "All Events" },
              { key: "PROJECT", label: "Projects" },
              { key: "TEAM", label: "Teams" },
              { key: "TASK", label: "Tasks" },
              { key: "FILE", label: "Files" },
              { key: "LEARNING", label: "Learning" },
            ] as { key: CategoryFilter; label: string }[]
          ).map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setCategoryFilter(cat.key)}
              className={
                categoryFilter === cat.key
                  ? "btn btn-primary"
                  : "btn btn-secondary"
              }
              style={{ padding: "0.4rem 0.85rem", fontSize: "0.78rem" }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Content */}
      {isLoading ? (
        <div className="loading-state" style={{ padding: "4rem 1.5rem" }}>
          <div className="spinner" />
          <p style={{ marginTop: "1rem", color: "var(--text-muted)" }}>
            Loading activity timeline...
          </p>
        </div>
      ) : error ? (
        <div className="error-state" style={{ padding: "3rem 1.5rem" }}>
          <AlertCircle size={36} style={{ marginBottom: "0.75rem" }} />
          <h3 style={{ marginBottom: "0.4rem" }}>
            Unable to Load Activity Timeline
          </h3>
          <p style={{ marginBottom: "1.25rem" }}>{error}</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={fetchActivities}
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="empty-state" style={{ padding: "4rem 1.5rem" }}>
          <ActivityIcon
            size={48}
            style={{
              color: "var(--primary)",
              marginBottom: "1rem",
              opacity: 0.85,
            }}
          />
          <h3 style={{ marginBottom: "0.4rem" }}>No Activity Recorded Yet</h3>
          <p
            style={{
              maxWidth: "440px",
              margin: "0 auto",
              color: "var(--text-muted)",
            }}
          >
            {activities.length === 0
              ? "Actions such as creating projects, completing tasks, uploading team files, and earning certificates will appear here."
              : "No events match your current filter criteria."}
          </p>
        </div>
      ) : (
        <div
          style={{
            position: "relative",
            paddingLeft: "2rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          {/* Vertical Timeline Spine */}
          <div
            style={{
              position: "absolute",
              left: "15px",
              top: "12px",
              bottom: "12px",
              width: "2px",
              background: "var(--border)",
            }}
          />

          {filteredActivities.map((item) => {
            const pres = getActivityPresentation(item.activity_type);
            const IconComponent = pres.icon;
            const timeInfo = formatTimestamp(item.created_at);
            const relatedTeam = item.team_id ? teamsMap[item.team_id] : null;
            const relatedProject = item.project_id
              ? projectsMap[item.project_id]
              : null;

            return (
              <div
                key={item.id}
                className="card"
                style={{
                  position: "relative",
                  padding: "1.15rem 1.4rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.65rem",
                }}
              >
                {/* Timeline Node Dot */}
                <div
                  style={{
                    position: "absolute",
                    left: "-2.15rem",
                    top: "1.25rem",
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    background: pres.bg,
                    border: `2px solid ${pres.color}`,
                    color: pres.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 0 0 4px var(--bg)",
                  }}
                >
                  <IconComponent size={14} />
                </div>

                {/* Top Meta Row */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      gap: "0.55rem",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        padding: "0.18rem 0.6rem",
                        borderRadius: "999px",
                        background: pres.bg,
                        color: pres.color,
                        border: `1px solid ${pres.border}`,
                      }}
                    >
                      {pres.label}
                    </span>

                    <span
                      style={{
                        fontSize: "0.82rem",
                        color: "var(--text-muted)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.3rem",
                      }}
                    >
                      <UserIcon size={13} />
                      <strong style={{ color: "var(--text)" }}>
                        {item.user_name || user?.name || `User #${item.user_id}`}
                      </strong>
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--text-muted)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.3rem",
                    }}
                    title={timeInfo.full}
                  >
                    <Clock size={12} />
                    {timeInfo.relative}
                    {timeInfo.full && ` • ${timeInfo.full}`}
                  </span>
                </div>

                {/* Description */}
                <div
                  style={{
                    fontSize: "0.95rem",
                    color: "var(--text)",
                    lineHeight: 1.5,
                  }}
                >
                  {item.description}
                </div>

                {/* Related Project / Team Links */}
                {(item.project_id || item.team_id) && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      gap: "0.65rem",
                      paddingTop: "0.35rem",
                    }}
                  >
                    {item.project_id && (
                      <Link
                        to={`/projects/${item.project_id}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          fontSize: "0.78rem",
                          padding: "0.25rem 0.65rem",
                          borderRadius: "6px",
                          background: "var(--surface)",
                          border: "1px solid var(--border)",
                          color: "var(--text)",
                          textDecoration: "none",
                        }}
                      >
                        <FolderKanban
                          size={12}
                          style={{ color: "var(--primary)" }}
                        />
                        <span>
                          {relatedProject?.title ||
                            `Project #${item.project_id}`}
                        </span>
                        <ExternalLink size={11} />
                      </Link>
                    )}

                    {item.team_id && (
                      <Link
                        to={`/teams/${item.team_id}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          fontSize: "0.78rem",
                          padding: "0.25rem 0.65rem",
                          borderRadius: "6px",
                          background: "var(--surface)",
                          border: "1px solid var(--border)",
                          color: "var(--text)",
                          textDecoration: "none",
                        }}
                      >
                        <Users size={12} style={{ color: "#a855f7" }} />
                        <span>
                          {relatedTeam?.name || `Team #${item.team_id}`}
                        </span>
                        <ExternalLink size={11} />
                      </Link>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Activity;
