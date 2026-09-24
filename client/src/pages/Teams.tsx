import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FolderKanban,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Send,
  Shield,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  applicationService,
  projectService,
  teamService,
} from "../services/api";
import type { Project, Team, TeamMember } from "../types";

type TeamTab = "all" | "my_teams";

interface EnrichedTeam extends Team {
  projectObj?: Project;
  userRoleInTeam?: string | null;
  isProjectOwner: boolean;
}

const Teams: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [teams, setTeams] = useState<Team[]>([]);
  const [projectsMap, setProjectsMap] = useState<Map<number, Project>>(
    new Map()
  );
  const [myOwnedProjects, setMyOwnedProjects] = useState<Project[]>([]);
  const [userTeamRoles, setUserTeamRoles] = useState<Map<number, string>>(
    new Map()
  );

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  // Filters
  const [activeTab, setActiveTab] = useState<TeamTab>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Create Team Modal State
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [newTeamName, setNewTeamName] = useState<string>("");
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [applyingProjectId, setApplyingProjectId] = useState<number | null>(
    null
  );

  const loadTeamsWorkspace = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [teamsRes, allProjectsRes, myProjectsRes] =
        await Promise.allSettled([
          teamService.getAllTeams(),
          projectService.getAllProjects(),
          projectService.getMyProjects(),
        ]);

      let fetchedTeams: Team[] = [];
      if (teamsRes.status === "fulfilled") {
        fetchedTeams = Array.isArray(teamsRes.value.data)
          ? teamsRes.value.data
          : Array.isArray(teamsRes.value.teams)
            ? teamsRes.value.teams
            : [];
        setTeams(fetchedTeams);
      } else {
        throw new Error(
          (teamsRes.reason as Error)?.message || "Unable to fetch teams."
        );
      }

      const pMap = new Map<number, Project>();
      if (allProjectsRes.status === "fulfilled") {
        const list = Array.isArray(allProjectsRes.value.projects)
          ? allProjectsRes.value.projects
          : Array.isArray(allProjectsRes.value.data)
            ? allProjectsRes.value.data
            : [];
        list.forEach((p) => pMap.set(Number(p.id), p));
      }

      if (myProjectsRes.status === "fulfilled") {
        const myList = Array.isArray(myProjectsRes.value.projects)
          ? myProjectsRes.value.projects
          : Array.isArray(myProjectsRes.value.data)
            ? myProjectsRes.value.data
            : [];
        setMyOwnedProjects(myList);
        if (myList.length > 0 && !selectedProjectId) {
          setSelectedProjectId(String(myList[0].id));
        }
        myList.forEach((p) => {
          if (!pMap.has(Number(p.id))) {
            pMap.set(Number(p.id), p);
          }
        });
      }

      setProjectsMap(pMap);

      // Inspect membership roles for current user across teams
      if (user?.id && fetchedTeams.length > 0) {
        const roleMap = new Map<number, string>();
        const detailChecks = await Promise.allSettled(
          fetchedTeams.slice(0, 12).map((t) => teamService.getTeamById(t.id))
        );

        detailChecks.forEach((result, index) => {
          if (result.status === "fulfilled") {
            const teamId = fetchedTeams[index].id;
            const memberList: TeamMember[] = Array.isArray(
              result.value.data?.members
            )
              ? result.value.data.members
              : Array.isArray(result.value.members)
                ? result.value.members
                : [];
            const match = memberList.find(
              (m) => Number(m.user_id) === Number(user.id)
            );
            if (match) {
              roleMap.set(Number(teamId), match.role || "MEMBER");
            }
          }
        });

        setUserTeamRoles(roleMap);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load teams from the server."
      );
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId, user?.id]);

  useEffect(() => {
    void loadTeamsWorkspace();
  }, [loadTeamsWorkspace]);

  const ownedProjectIds = useMemo(
    () => new Set(myOwnedProjects.map((p) => Number(p.id))),
    [myOwnedProjects]
  );

  // Enrich teams with project info and user's role
  const enrichedTeams: EnrichedTeam[] = useMemo(() => {
    return teams.map((team) => {
      const pid = Number(team.project_id);
      const projectObj = projectsMap.get(pid);
      const isProjectOwner = ownedProjectIds.has(pid);
      const memberRole = userTeamRoles.get(Number(team.id)) || null;

      return {
        ...team,
        projectObj,
        isProjectOwner,
        userRoleInTeam:
          memberRole || (isProjectOwner ? "PROJECT_OWNER" : null),
      };
    });
  }, [teams, projectsMap, ownedProjectIds, userTeamRoles]);

  const myTeamsCount = useMemo(
    () => enrichedTeams.filter((t) => Boolean(t.userRoleInTeam)).length,
    [enrichedTeams]
  );

  const filteredTeams = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return enrichedTeams.filter((team) => {
      if (activeTab === "my_teams" && !team.userRoleInTeam) {
        return false;
      }

      if (!q) return true;

      const nameMatch = (team.team_name || "").toLowerCase().includes(q);
      const projectMatch = (team.projectObj?.title || "")
        .toLowerCase()
        .includes(q);
      const descMatch = (team.projectObj?.description || "")
        .toLowerCase()
        .includes(q);

      return nameMatch || projectMatch || descMatch;
    });
  }, [enrichedTeams, activeTab, searchQuery]);

  // Create Team Submit
  const handleCreateTeam = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedbackError(null);
    setFeedbackMessage(null);

    if (!selectedProjectId) {
      setFeedbackError(
        "Please select a project you own. Create a project first if you haven't yet."
      );
      return;
    }

    if (!newTeamName.trim()) {
      setFeedbackError("Please enter a team name.");
      return;
    }

    setIsCreating(true);
    try {
      const res = await teamService.createTeam({
        project_id: Number(selectedProjectId),
        team_name: newTeamName.trim(),
      });
      setIsCreateOpen(false);
      setNewTeamName("");
      setFeedbackMessage("Team created successfully!");
      await loadTeamsWorkspace();

      const createdTeam = res.data || res.team;
      if (createdTeam?.id) {
        navigate(`/teams/${createdTeam.id}`);
      }
    } catch (err) {
      setFeedbackError(
        err instanceof Error ? err.message : "Failed to create team."
      );
    } finally {
      setIsCreating(false);
    }
  };

  // Apply to Join Team's Project
  const handleApplyToJoinTeam = async (projectId: number) => {
    setFeedbackError(null);
    setFeedbackMessage(null);
    setApplyingProjectId(projectId);

    try {
      const res = await applicationService.applyToProject({
        project_id: projectId,
      });
      setFeedbackMessage(
        res.message ||
          "Application sent! Once the project owner accepts your application, you will be added to the team."
      );
    } catch (err) {
      setFeedbackError(
        err instanceof Error
          ? err.message
          : "Could not apply to this team's project."
      );
    } finally {
      setApplyingProjectId(null);
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="loading-state">
          <div className="spinner" aria-hidden="true" />
          <h3>Loading teams workspace...</h3>
          <p>Fetching project squads, member rosters, and roles.</p>
        </div>
      </div>
    );
  }

  if (error && teams.length === 0) {
    return (
      <div className="page-content">
        <div className="error-state">
          <div className="error-state-icon">
            <AlertCircle size={26} />
          </div>
          <h3>Unable to Load Teams</h3>
          <p>{error}</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => void loadTeamsWorkspace()}
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
      {/* HEADER                                                              */}
      {/* =================================================================== */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Teams Management</h1>
          <p>
            Collaborate in agile squads, coordinate project deliverables, or
            apply to join open teams.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setFeedbackError(null);
            setIsCreateOpen(true);
          }}
        >
          <Plus size={17} />
          <span>Create Team</span>
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

      {/* =================================================================== */}
      {/* TABS & SEARCH BAR                                                   */}
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
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            className={`btn btn-sm ${
              activeTab === "all" ? "btn-primary" : "btn-secondary"
            }`}
            onClick={() => setActiveTab("all")}
          >
            All Teams ({enrichedTeams.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${
              activeTab === "my_teams" ? "btn-primary" : "btn-secondary"
            }`}
            onClick={() => setActiveTab("my_teams")}
          >
            My Teams ({myTeamsCount})
          </button>
        </div>

        <div style={{ position: "relative", flex: "1 1 260px", maxWidth: "420px" }}>
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
            placeholder="Search teams or associated projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: "2.55rem" }}
          />
        </div>
      </div>

      {/* =================================================================== */}
      {/* TEAM CARDS GRID / EMPTY STATE                                       */}
      {/* =================================================================== */}
      {filteredTeams.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Users size={24} />
          </div>
          <h3>
            {activeTab === "my_teams"
              ? "You Haven't Joined Any Teams Yet"
              : "No Teams Found"}
          </h3>
          <p>
            {activeTab === "my_teams"
              ? "Create a team for one of your projects or apply to an open project to join its collaborative squad."
              : "No teams match your current search query."}
          </p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {activeTab === "my_teams" && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setActiveTab("all")}
              >
                Explore All Teams
              </button>
            )}
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus size={16} />
              <span>Create Team</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid-3">
          {filteredTeams.map((team) => {
            const roleLabel = team.userRoleInTeam
              ? team.userRoleInTeam.replace("_", " ")
              : "Open Squad";

            return (
              <div
                key={team.id}
                className="card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "1.1rem",
                }}
              >
                <div>
                  {/* Role Badge & Member Count */}
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
                        team.userRoleInTeam ? "badge-primary" : "badge-neutral"
                      }`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.3rem",
                      }}
                    >
                      <Shield size={12} />
                      {roleLabel}
                    </span>

                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        fontSize: "0.8rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      <Users size={14} />
                      <span>
                        {team.member_count ?? 0}{" "}
                        {Number(team.member_count) === 1 ? "member" : "members"}
                      </span>
                    </span>
                  </div>

                  {/* Team Name */}
                  <h3 style={{ fontSize: "1.15rem", marginBottom: "0.35rem" }}>
                    <Link
                      to={`/teams/${team.id}`}
                      style={{ color: "var(--text)", textDecoration: "none" }}
                    >
                      {team.team_name}
                    </Link>
                  </h3>

                  {/* Associated Project */}
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      fontSize: "0.8125rem",
                      color: "var(--secondary)",
                      marginBottom: "0.65rem",
                    }}
                  >
                    <FolderKanban size={14} />
                    <Link
                      to={`/projects/${team.project_id}`}
                      style={{ color: "var(--secondary)" }}
                    >
                      {team.projectObj?.title || `Project #${team.project_id}`}
                    </Link>
                  </div>

                  {/* Description */}
                  <p
                    style={{
                      fontSize: "0.865rem",
                      color: "var(--text-muted)",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {team.projectObj?.description ||
                      "Collaborative engineering squad working on project tasks, shared documents, and milestones."}
                  </p>
                </div>

                {/* Card Actions */}
                <div
                  style={{
                    paddingTop: "0.85rem",
                    borderTop: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.6rem",
                  }}
                >
                  {!team.userRoleInTeam ? (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={applyingProjectId === Number(team.project_id)}
                      onClick={() =>
                        void handleApplyToJoinTeam(Number(team.project_id))
                      }
                    >
                      {applyingProjectId === Number(team.project_id) ? (
                        <>
                          <Loader2
                            size={14}
                            style={{ animation: "spin 0.8s linear infinite" }}
                          />
                          <span>Applying...</span>
                        </>
                      ) : (
                        <>
                          <Send size={13} />
                          <span>Apply to Join</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <span
                      style={{
                        fontSize: "0.775rem",
                        color: "var(--success)",
                        fontWeight: 500,
                      }}
                    >
                      Active Member
                    </span>
                  )}

                  <Link
                    to={`/teams/${team.id}`}
                    className="btn btn-primary btn-sm"
                  >
                    <span>Open Team</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =================================================================== */}
      {/* CREATE TEAM MODAL                                                   */}
      {/* =================================================================== */}
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
            style={{ width: "100%", maxWidth: "480px", padding: "1.75rem" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "1.25rem",
              }}
            >
              <div>
                <h2 style={{ fontSize: "1.25rem" }}>Create Project Team</h2>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  Provision a new team for one of your owned projects
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setIsCreateOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            {myOwnedProjects.length === 0 ? (
              <div style={{ padding: "1rem 0" }}>
                <p style={{ marginBottom: "1rem", fontSize: "0.9rem" }}>
                  Only project owners can create teams. You don&apos;t own any
                  projects yet — create your first project to provision a team!
                </p>
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
                  <Link to="/projects" className="btn btn-primary">
                    Go to Projects
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateTeam}>
                <div className="form-group">
                  <label htmlFor="team-project-select" className="form-label">
                    Select Project
                  </label>
                  <select
                    id="team-project-select"
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    required
                  >
                    {myOwnedProjects.map((proj) => (
                      <option key={proj.id} value={proj.id}>
                        {proj.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="team-name-input" className="form-label">
                    Team Name
                  </label>
                  <input
                    id="team-name-input"
                    type="text"
                    placeholder="e.g. Frontend & Design Squad"
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
                    marginTop: "1.25rem",
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
                    disabled={isCreating}
                  >
                    {isCreating ? "Creating..." : "Create Team"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Teams;
