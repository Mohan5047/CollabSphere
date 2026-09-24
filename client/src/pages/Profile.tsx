import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  User as UserIcon,
  Mail,
  Shield,
  Calendar,
  Edit3,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Award,
  FolderKanban,
  Users,
  FileText,
  HelpCircle,
  RefreshCw,
  ExternalLink,
  Lock,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  userService,
  projectService,
  teamService,
  applicationService,
  certificateService,
  progressService,
  quizService,
  getErrorMessage,
} from "../services/api";
import type { Course, Certificate, Project } from "../types";

interface ProfileRecord {
  id: number;
  full_name: string;
  email: string;
  role: string;
  created_at?: string;
}

const Profile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const currentUserId = Number(user?.id || 0);

  // Profile Data State
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Statistics State
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [quizAttemptsCount, setQuizAttemptsCount] = useState<number>(0);
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [teamsCount, setTeamsCount] = useState<number>(0);
  const [applicationsCount, setApplicationsCount] = useState<number>(0);

  // Edit Form State (only full_name is supported by PUT /api/auth/profile)
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [fullNameInput, setFullNameInput] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadProfileAndStats = useCallback(async () => {
    if (!currentUserId) return;
    setIsLoading(true);
    setError(null);

    try {
      const [
        profileRes,
        coursesRes,
        certsRes,
        quizzesRes,
        myProjectsRes,
        teamsRes,
        appsRes,
      ] = await Promise.allSettled([
        userService.getProfile(),
        progressService.getUserEnrolledCourses(currentUserId),
        certificateService.getUserCertificates(currentUserId),
        quizService.getUserQuizAttempts(currentUserId),
        projectService.getMyProjects(),
        teamService.getAllTeams(),
        applicationService.getMyApplications(),
      ]);

      if (profileRes.status === "fulfilled") {
        const raw = profileRes.value.profile || profileRes.value.user;
        if (raw) {
          const record: ProfileRecord = {
            id: Number(raw.id),
            full_name: raw.full_name || raw.name || user?.name || "",
            email: raw.email || user?.email || "",
            role: raw.role || user?.role || "member",
            created_at: raw.created_at,
          };
          setProfile(record);
          setFullNameInput(record.full_name);
        }
      } else if (user) {
        const fallbackRecord: ProfileRecord = {
          id: Number(user.id),
          full_name: user.full_name || user.name || "",
          email: user.email,
          role: user.role || "member",
          created_at: user.created_at,
        };
        setProfile(fallbackRecord);
        setFullNameInput(fallbackRecord.full_name);
      } else {
        throw profileRes.reason;
      }

      if (coursesRes.status === "fulfilled") {
        const cList = Array.isArray(coursesRes.value.data)
          ? coursesRes.value.data
          : [];
        setEnrolledCourses(cList);
      }

      if (certsRes.status === "fulfilled") {
        const certList = Array.isArray(certsRes.value.data)
          ? certsRes.value.data
          : [];
        setCertificates(certList);
      }

      if (quizzesRes.status === "fulfilled") {
        const qList = Array.isArray(quizzesRes.value.data)
          ? quizzesRes.value.data
          : [];
        setQuizAttemptsCount(qList.length);
      }

      if (myProjectsRes.status === "fulfilled") {
        const pList = Array.isArray(myProjectsRes.value.projects)
          ? myProjectsRes.value.projects
          : Array.isArray(myProjectsRes.value.data)
          ? myProjectsRes.value.data
          : [];
        setMyProjects(pList);
      }

      if (teamsRes.status === "fulfilled") {
        const tList = Array.isArray(teamsRes.value.data)
          ? teamsRes.value.data
          : [];
        setTeamsCount(tList.length);
      }

      if (appsRes.status === "fulfilled") {
        const aList = Array.isArray(appsRes.value.applications)
          ? appsRes.value.applications
          : Array.isArray(appsRes.value.data)
          ? appsRes.value.data
          : [];
        setApplicationsCount(aList.length);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, user]);

  useEffect(() => {
    loadProfileAndStats();
  }, [loadProfileAndStats]);

  const handleStartEditing = () => {
    setSaveSuccess(null);
    setSaveError(null);
    setFullNameInput(profile?.full_name || user?.name || "");
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setSaveError(null);
    setFullNameInput(profile?.full_name || user?.name || "");
    setIsEditing(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = fullNameInput.trim();

    if (!trimmedName) {
      setSaveError("Full name cannot be empty.");
      return;
    }

    if (trimmedName.length < 2) {
      setSaveError("Full name must be at least 2 characters.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const res = await userService.updateProfile({ full_name: trimmedName });
      const updated = res.profile || res.user;

      if (updated) {
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                full_name: updated.full_name || trimmedName,
              }
            : {
                id: Number(updated.id || currentUserId),
                full_name: updated.full_name || trimmedName,
                email: updated.email || user?.email || "",
                role: updated.role || user?.role || "member",
                created_at: updated.created_at,
              }
        );
      } else {
        setProfile((prev) =>
          prev ? { ...prev, full_name: trimmedName } : prev
        );
      }

      // Sync updated profile with global AuthContext (updates Navbar & Sidebar)
      await refreshUser();

      setSaveSuccess("Your profile information has been updated successfully.");
      setIsEditing(false);
    } catch (err) {
      setSaveError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Active Account";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getInitials = (name?: string) => {
    if (!name) return "CS";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const completedCoursesCount = enrolledCourses.filter(
    (c) => Number(c.progress_percentage ?? 0) >= 100
  ).length;

  const displayName = profile?.full_name || user?.name || "CollabSphere User";
  const displayEmail = profile?.email || user?.email || "—";
  const displayRole = (profile?.role || user?.role || "member").toUpperCase();

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
            <UserIcon size={14} />
            ACCOUNT & CREDENTIALS
          </div>
          <h1 className="page-title" style={{ margin: 0 }}>
            My Profile
          </h1>
          <p className="page-subtitle" style={{ marginTop: "0.35rem" }}>
            Manage your personal profile information, account settings, and
            platform statistics.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={loadProfileAndStats}
          disabled={isLoading}
        >
          <RefreshCw size={16} className={isLoading ? "spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Global Success / Error Banners */}
      {saveSuccess && (
        <div
          className="card"
          style={{
            marginBottom: "1.25rem",
            padding: "0.9rem 1.2rem",
            borderColor: "var(--success)",
            background: "rgba(16, 185, 129, 0.1)",
            color: "var(--success)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <CheckCircle2 size={18} />
            <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
              {saveSuccess}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSaveSuccess(null)}
            style={{
              background: "none",
              border: "none",
              color: "inherit",
              cursor: "pointer",
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error ? (
        <div className="error-state" style={{ padding: "3rem 1.5rem" }}>
          <AlertCircle size={36} style={{ marginBottom: "0.75rem" }} />
          <h3 style={{ marginBottom: "0.4rem" }}>Unable to Load Profile</h3>
          <p style={{ marginBottom: "1.25rem" }}>{error}</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={loadProfileAndStats}
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      ) : isLoading ? (
        <div className="loading-state" style={{ padding: "4rem 1.5rem" }}>
          <div className="spinner" />
          <p style={{ marginTop: "1rem", color: "var(--text-muted)" }}>
            Loading your profile and statistics...
          </p>
        </div>
      ) : (
        <>
          {/* Hero Identity Banner */}
          <div
            className="card"
            style={{
              padding: "2rem",
              marginBottom: "1.5rem",
              background:
                "linear-gradient(135deg, rgba(99, 102, 241, 0.18) 0%, rgba(15, 23, 42, 0.9) 100%)",
              borderColor: "rgba(99, 102, 241, 0.35)",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1.5rem",
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "1.35rem",
              }}
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "22px",
                  background:
                    "linear-gradient(135deg, var(--primary), #4f46e5)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.85rem",
                  fontWeight: 800,
                  boxShadow: "0 12px 28px rgba(99, 102, 241, 0.35)",
                }}
              >
                {getInitials(displayName)}
              </div>

              <div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: "0.65rem",
                  }}
                >
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "1.6rem",
                      fontWeight: 800,
                      color: "var(--text)",
                    }}
                  >
                    {displayName}
                  </h2>
                  <span
                    style={{
                      fontSize: "0.74rem",
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      padding: "0.22rem 0.65rem",
                      borderRadius: "999px",
                      background: "rgba(99, 102, 241, 0.2)",
                      color: "var(--primary)",
                      border: "1px solid rgba(99, 102, 241, 0.4)",
                    }}
                  >
                    {displayRole}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: "1.25rem",
                    marginTop: "0.55rem",
                    fontSize: "0.88rem",
                    color: "var(--text-muted)",
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                    }}
                  >
                    <Mail size={14} />
                    {displayEmail}
                  </span>

                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                    }}
                  >
                    <Calendar size={14} />
                    Joined {formatDate(profile?.created_at)}
                  </span>
                </div>
              </div>
            </div>

            {!isEditing && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleStartEditing}
              >
                <Edit3 size={16} />
                Edit Profile
              </button>
            )}
          </div>

          {/* Two-Column Layout: Profile Details / Edit Form & Account Details */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
              gap: "1.5rem",
              marginBottom: "1.75rem",
            }}
          >
            {/* Left Card: Personal Profile & Edit Form */}
            <div className="card" style={{ padding: "1.6rem" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "1.25rem",
                }}
              >
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>
                  Profile Information
                </h3>
                {!isEditing && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
                    onClick={handleStartEditing}
                  >
                    <Edit3 size={14} />
                    Edit
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleSaveProfile}>
                  {saveError && (
                    <div
                      className="error-state"
                      style={{
                        padding: "0.75rem 1rem",
                        marginBottom: "1rem",
                        fontSize: "0.85rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <AlertCircle size={16} />
                      <span>{saveError}</span>
                    </div>
                  )}

                  <div className="form-group" style={{ marginBottom: "1rem" }}>
                    <label className="form-label" htmlFor="profile-full-name">
                      Full Name *
                    </label>
                    <input
                      id="profile-full-name"
                      type="text"
                      className="form-input"
                      value={fullNameInput}
                      onChange={(e) => setFullNameInput(e.target.value)}
                      placeholder="Enter your full name"
                      disabled={isSaving}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: "1rem" }}>
                    <label
                      className="form-label"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                      }}
                    >
                      Email Address
                      <Lock size={12} style={{ color: "var(--text-muted)" }} />
                    </label>
                    <input
                      type="email"
                      className="form-input"
                      value={displayEmail}
                      disabled
                      readOnly
                      style={{ opacity: 0.65, cursor: "not-allowed" }}
                    />
                    <small
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                        display: "block",
                        marginTop: "0.25rem",
                      }}
                    >
                      Email address is bound to your account identity and cannot
                      be changed.
                    </small>
                  </div>

                  <div
                    className="form-group"
                    style={{ marginBottom: "1.35rem" }}
                  >
                    <label
                      className="form-label"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                      }}
                    >
                      Account Role
                      <Lock size={12} style={{ color: "var(--text-muted)" }} />
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={displayRole}
                      disabled
                      readOnly
                      style={{ opacity: 0.65, cursor: "not-allowed" }}
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
                      onClick={handleCancelEditing}
                      disabled={isSaving}
                    >
                      <X size={15} />
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isSaving || !fullNameInput.trim()}
                    >
                      <Save size={15} />
                      {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                  }}
                >
                  <div
                    style={{
                      padding: "0.85rem 1rem",
                      borderRadius: "10px",
                      background: "var(--bg)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                        marginBottom: "0.2rem",
                      }}
                    >
                      Full Name
                    </div>
                    <div style={{ fontWeight: 600, fontSize: "0.96rem" }}>
                      {displayName}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "0.85rem 1rem",
                      borderRadius: "10px",
                      background: "var(--bg)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                        marginBottom: "0.2rem",
                      }}
                    >
                      Primary Email
                    </div>
                    <div style={{ fontWeight: 600, fontSize: "0.96rem" }}>
                      {displayEmail}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "0.85rem 1rem",
                      borderRadius: "10px",
                      background: "var(--bg)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                        marginBottom: "0.2rem",
                      }}
                    >
                      Platform Role
                    </div>
                    <div style={{ fontWeight: 600, fontSize: "0.96rem" }}>
                      {displayRole}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Card: Account & Security Overview */}
            <div className="card" style={{ padding: "1.6rem" }}>
              <h3
                style={{
                  margin: "0 0 1.25rem",
                  fontSize: "1.1rem",
                  fontWeight: 700,
                }}
              >
                Account Information
              </h3>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                <div
                  style={{
                    padding: "0.85rem 1rem",
                    borderRadius: "10px",
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      Member Account ID
                    </div>
                    <div style={{ fontWeight: 700, marginTop: "0.15rem" }}>
                      #{profile?.id || currentUserId}
                    </div>
                  </div>
                  <Shield size={20} style={{ color: "var(--primary)" }} />
                </div>

                <div
                  style={{
                    padding: "0.85rem 1rem",
                    borderRadius: "10px",
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      Member Since
                    </div>
                    <div style={{ fontWeight: 600, marginTop: "0.15rem" }}>
                      {formatDate(profile?.created_at)}
                    </div>
                  </div>
                  <Calendar size={20} style={{ color: "var(--primary)" }} />
                </div>

                <div
                  style={{
                    padding: "0.85rem 1rem",
                    borderRadius: "10px",
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      Session & Authentication
                    </div>
                    <div
                      style={{
                        fontWeight: 600,
                        marginTop: "0.15rem",
                        color: "var(--success)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                      }}
                    >
                      <CheckCircle2 size={15} />
                      Authenticated JWT Session
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Learning Statistics Section */}
          <div style={{ marginBottom: "1.75rem" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1rem",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700 }}>
                Learning Statistics
              </h3>
              <Link
                to="/learning"
                style={{
                  fontSize: "0.85rem",
                  color: "var(--primary)",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  fontWeight: 600,
                }}
              >
                Open Learning Hub
                <ExternalLink size={14} />
              </Link>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                gap: "1rem",
              }}
            >
              <div className="card" style={{ padding: "1.25rem" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    color: "var(--primary)",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--text-muted)",
                      fontWeight: 600,
                    }}
                  >
                    Enrolled Courses
                  </span>
                  <BookOpen size={18} />
                </div>
                <div style={{ fontSize: "1.8rem", fontWeight: 800 }}>
                  {enrolledCourses.length}
                </div>
              </div>

              <div className="card" style={{ padding: "1.25rem" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    color: "#10b981",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--text-muted)",
                      fontWeight: 600,
                    }}
                  >
                    Completed Courses
                  </span>
                  <CheckCircle2 size={18} />
                </div>
                <div style={{ fontSize: "1.8rem", fontWeight: 800 }}>
                  {completedCoursesCount}
                </div>
              </div>

              <div className="card" style={{ padding: "1.25rem" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    color: "#ec4899",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--text-muted)",
                      fontWeight: 600,
                    }}
                  >
                    Quiz Attempts
                  </span>
                  <HelpCircle size={18} />
                </div>
                <div style={{ fontSize: "1.8rem", fontWeight: 800 }}>
                  {quizAttemptsCount}
                </div>
              </div>

              <div className="card" style={{ padding: "1.25rem" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    color: "#f59e0b",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--text-muted)",
                      fontWeight: 600,
                    }}
                  >
                    Certificates Earned
                  </span>
                  <Award size={18} />
                </div>
                <div style={{ fontSize: "1.8rem", fontWeight: 800 }}>
                  {certificates.length}
                </div>
              </div>
            </div>
          </div>

          {/* Project & Team Statistics Section */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1rem",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700 }}>
                Project & Team Statistics
              </h3>
              <Link
                to="/projects"
                style={{
                  fontSize: "0.85rem",
                  color: "var(--primary)",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  fontWeight: 600,
                }}
              >
                View Projects
                <ExternalLink size={14} />
              </Link>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "1rem",
              }}
            >
              <div className="card" style={{ padding: "1.25rem" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    color: "var(--primary)",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--text-muted)",
                      fontWeight: 600,
                    }}
                  >
                    Owned Projects
                  </span>
                  <FolderKanban size={18} />
                </div>
                <div style={{ fontSize: "1.8rem", fontWeight: 800 }}>
                  {myProjects.length}
                </div>
              </div>

              <div className="card" style={{ padding: "1.25rem" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    color: "#a855f7",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--text-muted)",
                      fontWeight: 600,
                    }}
                  >
                    Platform Teams
                  </span>
                  <Users size={18} />
                </div>
                <div style={{ fontSize: "1.8rem", fontWeight: 800 }}>
                  {teamsCount}
                </div>
              </div>

              <div className="card" style={{ padding: "1.25rem" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    color: "#38bdf8",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--text-muted)",
                      fontWeight: 600,
                    }}
                  >
                    Submitted Applications
                  </span>
                  <FileText size={18} />
                </div>
                <div style={{ fontSize: "1.8rem", fontWeight: 800 }}>
                  {applicationsCount}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Profile;
