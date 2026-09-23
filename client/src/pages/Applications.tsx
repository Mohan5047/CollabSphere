import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  ClipboardList,
  Filter,
  FolderKanban,
  Loader2,
  Mail,
  Plus,
  RefreshCw,
  Search,
  Send,
  User as UserIcon,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { applicationService, projectService } from "../services/api";
import { Application, Project } from "../types";

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

const Applications: React.FC = () => {
  const { user } = useAuth();

  const [applications, setApplications] = useState<Application[]>([]);
  const [openProjects, setOpenProjects] = useState<Project[]>([]);
  const [myProjectIds, setMyProjectIds] = useState<Set<number>>(new Set());

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Apply Modal State
  const [isApplyModalOpen, setIsApplyModalOpen] = useState<boolean>(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const loadApplicationsData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [appsRes, allProjectsRes, myProjectsRes] =
        await Promise.allSettled([
          applicationService.getApplications(),
          projectService.getAllProjects(),
          projectService.getMyProjects(),
        ]);

      if (appsRes.status === "fulfilled") {
        const list = Array.isArray(appsRes.value.applications)
          ? appsRes.value.applications
          : Array.isArray(appsRes.value.data)
            ? appsRes.value.data
            : [];
        setApplications(list);
      } else {
        throw new Error(
          (appsRes.reason as Error)?.message ||
            "Unable to load project applications."
        );
      }

      let myIds = new Set<number>();
      if (myProjectsRes.status === "fulfilled") {
        const myList = Array.isArray(myProjectsRes.value.projects)
          ? myProjectsRes.value.projects
          : Array.isArray(myProjectsRes.value.data)
            ? myProjectsRes.value.data
            : [];
        myIds = new Set(myList.map((p) => Number(p.id)));
        setMyProjectIds(myIds);
      }

      if (allProjectsRes.status === "fulfilled") {
        const allList = Array.isArray(allProjectsRes.value.projects)
          ? allProjectsRes.value.projects
          : Array.isArray(allProjectsRes.value.data)
            ? allProjectsRes.value.data
            : [];
        const eligibleToApply = allList.filter(
          (p) =>
            !myIds.has(Number(p.id)) &&
            Number(p.owner_id) !== Number(user?.id)
        );
        setOpenProjects(eligibleToApply);
        if (eligibleToApply.length > 0 && !selectedProjectId) {
          setSelectedProjectId(String(eligibleToApply[0].id));
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load applications from the server."
      );
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId, user?.id]);

  useEffect(() => {
    void loadApplicationsData();
  }, [loadApplicationsData]);

  // Filtered Applications
  const filteredApplications = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return applications.filter((app) => {
      const normStatus = (app.status || "PENDING").toUpperCase();
      if (statusFilter !== "ALL" && normStatus !== statusFilter) {
        return false;
      }

      if (!q) return true;

      const applicantMatch = (app.full_name || "").toLowerCase().includes(q);
      const emailMatch = (app.email || "").toLowerCase().includes(q);
      const projectMatch = (app.title || app.project_title || "")
        .toLowerCase()
        .includes(q);

      return applicantMatch || emailMatch || projectMatch;
    });
  }, [applications, statusFilter, searchQuery]);

  // Counts
  const stats = useMemo(() => {
    let pending = 0;
    let accepted = 0;
    let rejected = 0;
    applications.forEach((a) => {
      const s = (a.status || "PENDING").toUpperCase();
      if (s === "ACCEPTED") accepted += 1;
      else if (s === "REJECTED") rejected += 1;
      else pending += 1;
    });
    return { pending, accepted, rejected };
  }, [applications]);

  // Approve / Reject Handler
  const handleDecision = async (
    applicationId: number,
    decision: "accept" | "reject"
  ) => {
    setFeedbackError(null);
    setFeedbackMessage(null);
    setProcessingId(applicationId);

    try {
      if (decision === "accept") {
        const res = await applicationService.acceptApplication(applicationId);
        setFeedbackMessage(
          res.message ||
            "Application approved! The applicant has been added to the project team."
        );
      } else {
        const res = await applicationService.rejectApplication(applicationId);
        setFeedbackMessage(res.message || "Application rejected.");
      }
      await loadApplicationsData();
    } catch (err) {
      setFeedbackError(
        err instanceof Error
          ? err.message
          : "Failed to update application status."
      );
    } finally {
      setProcessingId(null);
    }
  };

  // Apply to Project Submit
  const handleApplySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedbackError(null);
    setFeedbackMessage(null);

    if (!selectedProjectId) {
      setFeedbackError("Please select a project to apply to.");
      return;
    }

    setIsApplying(true);
    try {
      const res = await applicationService.applyToProject({
        project_id: Number(selectedProjectId),
      });
      setIsApplyModalOpen(false);
      setFeedbackMessage(
        res.message || "Your project application has been submitted!"
      );
      await loadApplicationsData();
    } catch (err) {
      setFeedbackError(
        err instanceof Error ? err.message : "Could not submit application."
      );
    } finally {
      setIsApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="loading-state">
          <div className="spinner" aria-hidden="true" />
          <h3>Loading project applications...</h3>
          <p>Fetching incoming candidate applications and project requests.</p>
        </div>
      </div>
    );
  }

  if (error && applications.length === 0) {
    return (
      <div className="page-content">
        <div className="error-state">
          <div className="error-state-icon">
            <AlertCircle size={26} />
          </div>
          <h3>Unable to Load Applications</h3>
          <p>{error}</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => void loadApplicationsData()}
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
          <h1>Applications Center</h1>
          <p>
            Review candidate applications for projects you own, or apply to join
            open collaborative projects.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setFeedbackError(null);
            setIsApplyModalOpen(true);
          }}
        >
          <Plus size={17} />
          <span>Apply to a Project</span>
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

      {/* KPI SUMMARY CARDS */}
      <div className="grid-3" style={{ marginBottom: "1.5rem" }}>
        <div className="stat-card">
          <span className="stat-label">PENDING REVIEW</span>
          <div className="stat-value" style={{ color: "var(--warning)" }}>
            {stats.pending}
          </div>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Awaiting owner decision
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-label">APPROVED</span>
          <div className="stat-value" style={{ color: "var(--success)" }}>
            {stats.accepted}
          </div>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Onboarded to project teams
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-label">REJECTED</span>
          <div className="stat-value" style={{ color: "var(--danger)" }}>
            {stats.rejected}
          </div>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Closed applications
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
        <div style={{ position: "relative", flex: "1 1 260px" }}>
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
            placeholder="Search by applicant name, email, or project title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: "2.55rem" }}
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            flexWrap: "wrap",
          }}
        >
          <Filter size={15} style={{ color: "var(--text-muted)" }} />
          {(["ALL", "PENDING", "ACCEPTED", "REJECTED"] as const).map((st) => (
            <button
              key={st}
              type="button"
              className={`btn btn-sm ${
                statusFilter === st ? "btn-primary" : "btn-secondary"
              }`}
              onClick={() => setStatusFilter(st)}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* APPLICATIONS LIST */}
      {filteredApplications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <ClipboardList size={24} />
          </div>
          <h3>No Applications Found</h3>
          <p>
            {applications.length === 0
              ? myProjectIds.size === 0
                ? "You haven't received applications because you don't own any projects yet, or you can apply to an open project now."
                : "No candidates have applied to your projects yet."
              : "No applications match your current search or filter."}
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsApplyModalOpen(true)}
          >
            <Send size={16} />
            <span>Apply to an Open Project</span>
          </button>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.9rem",
          }}
        >
          {filteredApplications.map((app) => {
            const normStatus = (app.status || "PENDING").toUpperCase();
            const isOwnerOfTargetProject = myProjectIds.has(
              Number(app.project_id)
            );
            const badgeClass =
              normStatus === "ACCEPTED"
                ? "badge-success"
                : normStatus === "REJECTED"
                  ? "badge-danger"
                  : "badge-warning";

            return (
              <div
                key={app.id}
                className="card"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "1.25rem",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ flex: "1 1 340px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.6rem",
                      marginBottom: "0.45rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <span className={`badge ${badgeClass}`}>{normStatus}</span>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        fontSize: "0.78rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      <Calendar size={13} />
                      Applied {formatDate(app.applied_at || app.created_at)}
                    </span>
                  </div>

                  {/* Applicant Name & Email */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      marginBottom: "0.35rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        fontSize: "1.05rem",
                        fontWeight: 600,
                        color: "var(--text)",
                      }}
                    >
                      <UserIcon size={16} style={{ color: "var(--primary)" }} />
                      {app.full_name || `Applicant #${app.user_id}`}
                    </span>

                    {app.email && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          fontSize: "0.825rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        <Mail size={13} />
                        {app.email}
                      </span>
                    )}
                  </div>

                  {/* Target Project */}
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      fontSize: "0.85rem",
                      color: "var(--secondary)",
                    }}
                  >
                    <FolderKanban size={14} />
                    <span>Project:</span>
                    <Link
                      to={`/projects/${app.project_id}`}
                      style={{ fontWeight: 600, color: "var(--secondary)" }}
                    >
                      {app.title ||
                        app.project_title ||
                        `Project #${app.project_id}`}
                    </Link>
                  </div>

                  {app.message && (
                    <p
                      style={{
                        marginTop: "0.5rem",
                        fontSize: "0.85rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {app.message}
                    </p>
                  )}
                </div>

                {/* Permission-Based Actions */}
                <div style={{ display: "flex", gap: "0.6rem" }}>
                  {normStatus === "PENDING" && isOwnerOfTargetProject ? (
                    <>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={processingId === app.id}
                        onClick={() => void handleDecision(app.id, "accept")}
                      >
                        {processingId === app.id ? (
                          <Loader2
                            size={14}
                            style={{ animation: "spin 0.8s linear infinite" }}
                          />
                        ) : (
                          <Check size={14} />
                        )}
                        <span>Approve</span>
                      </button>

                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        disabled={processingId === app.id}
                        onClick={() => void handleDecision(app.id, "reject")}
                      >
                        <X size={14} />
                        <span>Reject</span>
                      </button>
                    </>
                  ) : (
                    <Link
                      to={`/projects/${app.project_id}`}
                      className="btn btn-secondary btn-sm"
                    >
                      View Project
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* APPLY TO PROJECT MODAL */}
      {isApplyModalOpen && (
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
              <div>
                <h3 style={{ fontSize: "1.2rem" }}>Apply to Open Project</h3>
                <p style={{ fontSize: "0.825rem", color: "var(--text-muted)" }}>
                  Select a project to send your application to its owner
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setIsApplyModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            {openProjects.length === 0 ? (
              <div>
                <p style={{ fontSize: "0.9rem", marginBottom: "1rem" }}>
                  There are currently no external open projects available to
                  apply to.
                </p>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsApplyModalOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleApplySubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="apply-project-select">
                    Choose Project
                  </label>
                  <select
                    id="apply-project-select"
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    required
                  >
                    {openProjects.map((proj) => (
                      <option key={proj.id} value={proj.id}>
                        {proj.title} ({proj.tech_stack})
                      </option>
                    ))}
                  </select>
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
                    onClick={() => setIsApplyModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isApplying}
                  >
                    {isApplying ? "Submitting..." : "Submit Application"}
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

export default Applications;
