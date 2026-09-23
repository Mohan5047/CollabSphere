import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Code2,
  Filter,
  FolderKanban,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  User as UserIcon,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { projectService, teamService } from "../services/api";
import { Project, Team } from "../types";

type FilterMode = "all" | "mine" | "with_teams";

const formatDate = (isoString?: string): string => {
  if (!isoString) return "Recently created";
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) return "Recently created";
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const parseTechStack = (techStack?: string): string[] => {
  if (!techStack) return [];
  return techStack
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const Projects: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [myProjectIds, setMyProjectIds] = useState<Set<number>>(new Set());
  const [teams, setTeams] = useState<Team[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  // Create Project Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [techStack, setTechStack] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const loadProjectsData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [allProjectsRes, myProjectsRes, teamsRes] =
        await Promise.allSettled([
          projectService.getAllProjects(),
          projectService.getMyProjects(),
          teamService.getAllTeams(),
        ]);

      if (allProjectsRes.status === "fulfilled") {
        const rawList = Array.isArray(allProjectsRes.value.projects)
          ? allProjectsRes.value.projects
          : Array.isArray(allProjectsRes.value.data)
            ? allProjectsRes.value.data
            : [];
        setProjects(rawList);
      } else {
        throw new Error(
          (allProjectsRes.reason as Error)?.message ||
            "Failed to load projects."
        );
      }

      if (myProjectsRes.status === "fulfilled") {
        const myList = Array.isArray(myProjectsRes.value.projects)
          ? myProjectsRes.value.projects
          : Array.isArray(myProjectsRes.value.data)
            ? myProjectsRes.value.data
            : [];
        setMyProjectIds(new Set(myList.map((p) => Number(p.id))));
      }

      if (teamsRes.status === "fulfilled") {
        const teamList = Array.isArray(teamsRes.value.data)
          ? teamsRes.value.data
          : Array.isArray(teamsRes.value.teams)
            ? teamsRes.value.teams
            : [];
        setTeams(teamList);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load projects from the server."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProjectsData();
  }, [loadProjectsData]);

  // Map project_id -> { teamCount, totalMembers }
  const projectTeamStats = useMemo(() => {
    const map = new Map<number, { teamCount: number; totalMembers: number }>();
    teams.forEach((team) => {
      const pid = Number(team.project_id);
      const current = map.get(pid) || { teamCount: 0, totalMembers: 0 };
      current.teamCount += 1;
      current.totalMembers += Number(team.member_count || 0);
      map.set(pid, current);
    });
    return map;
  }, [teams]);

  // Filtered Projects
  const filteredProjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return projects.filter((project) => {
      const isMine =
        myProjectIds.has(Number(project.id)) ||
        (project.owner_id !== undefined &&
          Number(project.owner_id) === Number(user?.id));

      const stats = projectTeamStats.get(Number(project.id));

      if (filterMode === "mine" && !isMine) return false;
      if (filterMode === "with_teams" && (!stats || stats.teamCount === 0)) {
        return false;
      }

      if (!query) return true;

      const matchesTitle = (project.title || "").toLowerCase().includes(query);
      const matchesDesc = (project.description || "")
        .toLowerCase()
        .includes(query);
      const matchesTech = (project.tech_stack || "")
        .toLowerCase()
        .includes(query);
      const matchesOwner = (project.owner_name || "")
        .toLowerCase()
        .includes(query);

      return matchesTitle || matchesDesc || matchesTech || matchesOwner;
    });
  }, [projects, searchQuery, filterMode, myProjectIds, user?.id, projectTeamStats]);

  // Create Project Form Submit
  const handleCreateProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const trimmedTechStack = techStack.trim();

    if (!trimmedTitle) {
      setFormError("Project title is required.");
      return;
    }
    if (!trimmedDescription) {
      setFormError("Project description is required.");
      return;
    }
    if (!trimmedTechStack) {
      setFormError("Please specify at least one technology in Tech Stack.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await projectService.createProject({
        title: trimmedTitle,
        description: trimmedDescription,
        tech_stack: trimmedTechStack,
      });

      const createdProject = res.project || res.data;
      setIsModalOpen(false);
      setTitle("");
      setDescription("");
      setTechStack("");

      await loadProjectsData();

      if (createdProject?.id) {
        navigate(`/projects/${createdProject.id}`);
      }
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Failed to create project. Please check your inputs."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="loading-state">
          <div className="spinner" aria-hidden="true" />
          <h3>Loading projects directory...</h3>
          <p>Fetching collaborative software and research initiatives.</p>
        </div>
      </div>
    );
  }

  if (error && projects.length === 0) {
    return (
      <div className="page-content">
        <div className="error-state">
          <div className="error-state-icon">
            <AlertCircle size={26} />
          </div>
          <h3>Unable to Load Projects</h3>
          <p>{error}</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => void loadProjectsData()}
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
      {/* =================================================================== */}
      {/* PAGE HEADER                                                         */}
      {/* =================================================================== */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Projects Directory</h1>
          <p>
            Explore collaborative initiatives, apply to open projects, or launch
            your own workspace.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setFormError(null);
            setIsModalOpen(true);
          }}
        >
          <Plus size={17} />
          <span>Create Project</span>
        </button>
      </div>

      {/* =================================================================== */}
      {/* SEARCH & FILTER BAR                                                 */}
      {/* =================================================================== */}
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
        {/* Search Input */}
        <div style={{ position: "relative", flex: "1 1 280px" }}>
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
            placeholder="Search by title, description, tech stack, or owner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: "2.55rem" }}
            aria-label="Search projects"
          />
        </div>

        {/* Filter Buttons */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              fontSize: "0.8125rem",
              color: "var(--text-muted)",
              marginRight: "0.25rem",
            }}
          >
            <Filter size={14} />
            <span>Filter:</span>
          </span>

          <button
            type="button"
            className={`btn btn-sm ${
              filterMode === "all" ? "btn-primary" : "btn-secondary"
            }`}
            onClick={() => setFilterMode("all")}
          >
            All Projects ({projects.length})
          </button>

          <button
            type="button"
            className={`btn btn-sm ${
              filterMode === "mine" ? "btn-primary" : "btn-secondary"
            }`}
            onClick={() => setFilterMode("mine")}
          >
            My Projects ({myProjectIds.size})
          </button>

          <button
            type="button"
            className={`btn btn-sm ${
              filterMode === "with_teams" ? "btn-primary" : "btn-secondary"
            }`}
            onClick={() => setFilterMode("with_teams")}
          >
            Active Teams
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* PROJECTS GRID / EMPTY STATE                                         */}
      {/* =================================================================== */}
      {filteredProjects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <FolderKanban size={24} />
          </div>
          <h3>No Matching Projects Found</h3>
          <p>
            {projects.length === 0
              ? "No projects have been created yet. Start by launching the first project in CollabSphere."
              : "No projects match your current search query or filter criteria."}
          </p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {searchQuery || filterMode !== "all" ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setSearchQuery("");
                  setFilterMode("all");
                }}
              >
                Reset Filters
              </button>
            ) : null}
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus size={16} />
              <span>Create Project</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid-3">
          {filteredProjects.map((project) => {
            const isOwner =
              myProjectIds.has(Number(project.id)) ||
              (project.owner_id !== undefined &&
                Number(project.owner_id) === Number(user?.id));
            const teamStats = projectTeamStats.get(Number(project.id)) || {
              teamCount: 0,
              totalMembers: 0,
            };
            const stackItems = parseTechStack(project.tech_stack);
            const statusLabel = isOwner
              ? "Owner"
              : teamStats.teamCount > 0
                ? "Active Squad"
                : "Open for Applications";

            return (
              <div
                key={project.id}
                className="card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "1.1rem",
                }}
              >
                <div>
                  {/* Status Badge & Date */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "0.5rem",
                      marginBottom: "0.75rem",
                    }}
                  >
                    <span
                      className={`badge ${
                        isOwner
                          ? "badge-primary"
                          : teamStats.teamCount > 0
                            ? "badge-success"
                            : "badge-secondary"
                      }`}
                    >
                      {statusLabel}
                    </span>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        fontSize: "0.75rem",
                        color: "var(--text-subtle)",
                      }}
                    >
                      <Calendar size={13} />
                      {formatDate(project.created_at)}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 style={{ fontSize: "1.125rem", marginBottom: "0.45rem" }}>
                    <Link
                      to={`/projects/${project.id}`}
                      style={{ color: "var(--text)", textDecoration: "none" }}
                    >
                      {project.title}
                    </Link>
                  </h3>

                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--text-muted)",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      marginBottom: "1rem",
                    }}
                  >
                    {project.description}
                  </p>

                  {/* Tech Stack Tags */}
                  {stackItems.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "0.4rem",
                        marginBottom: "0.9rem",
                      }}
                    >
                      {stackItems.slice(0, 5).map((tech, idx) => (
                        <span
                          key={`${project.id}-tech-${idx}`}
                          className="badge badge-neutral"
                          style={{
                            fontSize: "0.72rem",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                          }}
                        >
                          <Code2 size={11} />
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Metadata & Action */}
                <div
                  style={{
                    paddingTop: "0.85rem",
                    borderTop: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.2rem",
                      minWidth: 0,
                    }}
                  >
                    <span
                      className="truncate"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        fontSize: "0.8rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      <UserIcon size={13} />
                      <span>
                        {project.owner_name ||
                          (isOwner ? user?.full_name || "You" : "Project Lead")}
                      </span>
                    </span>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        fontSize: "0.75rem",
                        color: "var(--text-subtle)",
                      }}
                    >
                      <Users size={13} />
                      <span>
                        {teamStats.teamCount}{" "}
                        {teamStats.teamCount === 1 ? "team" : "teams"} ·{" "}
                        {teamStats.totalMembers}{" "}
                        {teamStats.totalMembers === 1 ? "member" : "members"}
                      </span>
                    </span>
                  </div>

                  <Link
                    to={`/projects/${project.id}`}
                    className="btn btn-secondary btn-sm"
                  >
                    <span>Details</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =================================================================== */}
      {/* CREATE PROJECT MODAL                                                */}
      {/* =================================================================== */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-project-title"
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
            style={{
              width: "100%",
              maxWidth: "520px",
              padding: "1.75rem",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1.25rem",
              }}
            >
              <div>
                <h2 id="create-project-title" style={{ fontSize: "1.25rem" }}>
                  Create New Project
                </h2>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  Define your project goals and required technology stack
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div
                role="alert"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.55rem",
                  padding: "0.75rem 0.9rem",
                  marginBottom: "1rem",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--danger-muted)",
                  border: "1px solid rgba(239, 68, 68, 0.35)",
                  color: "#f87171",
                  fontSize: "0.85rem",
                }}
              >
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateProject} noValidate>
              <div className="form-group">
                <label htmlFor="project-title" className="form-label">
                  Project Title
                </label>
                <input
                  id="project-title"
                  type="text"
                  placeholder="e.g. AI Study Companion & Flashcard Generator"
                  value={title}
                  disabled={isSubmitting}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="project-tech-stack" className="form-label">
                  Tech Stack (comma-separated)
                </label>
                <input
                  id="project-tech-stack"
                  type="text"
                  placeholder="e.g. React, TypeScript, Node.js, PostgreSQL"
                  value={techStack}
                  disabled={isSubmitting}
                  onChange={(e) => setTechStack(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="project-description" className="form-label">
                  Project Description
                </label>
                <textarea
                  id="project-description"
                  rows={4}
                  placeholder="Describe the problem statement, architecture goals, and roles needed..."
                  value={description}
                  disabled={isSubmitting}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "0.75rem",
                  marginTop: "1.25rem",
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={isSubmitting}
                  onClick={() => setIsModalOpen(false)}
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
                    <>
                      <Plus size={16} />
                      <span>Create Project</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
