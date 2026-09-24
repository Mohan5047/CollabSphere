import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  FolderOpen,
  Upload,
  Download,
  Trash2,
  FileText,
  FileImage,
  FileArchive,
  FileCode,
  FileSpreadsheet,
  File as FileIcon,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Users,
  Calendar,
  User as UserIcon,
  HardDrive,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  fileService,
  teamService,
  projectService,
  getErrorMessage,
} from "../services/api";
import type { FileItem, Team, Project } from "../types";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const Files: React.FC = () => {
  const { user } = useAuth();
  const currentUserId = Number(user?.id || 0);

  // Teams & Projects state
  const [teams, setTeams] = useState<Team[]>([]);
  const [projectsMap, setProjectsMap] = useState<Record<number, Project>>({});
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [isLoadingTeams, setIsLoadingTeams] = useState<boolean>(true);

  // Team files state
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(false);
  const [filesError, setFilesError] = useState<string | null>(null);

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Action busy tracking
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  // 1. Load accessible teams and projects
  const loadTeamsAndProjects = useCallback(async () => {
    setIsLoadingTeams(true);
    try {
      const [teamsRes, projectsRes] = await Promise.allSettled([
        teamService.getAllTeams(),
        projectService.getAllProjects(),
      ]);

      const projRecord: Record<number, Project> = {};
      if (projectsRes.status === "fulfilled") {
        const pList = Array.isArray(projectsRes.value.projects)
          ? projectsRes.value.projects
          : Array.isArray(projectsRes.value.data)
          ? projectsRes.value.data
          : [];
        pList.forEach((p) => {
          projRecord[p.id] = p;
        });
        setProjectsMap(projRecord);
      }

      if (teamsRes.status === "fulfilled") {
        const tList = Array.isArray(teamsRes.value.data)
          ? teamsRes.value.data
          : [];
        setTeams(tList);
        if (tList.length > 0 && !selectedTeamId) {
          setSelectedTeamId(String(tList[0].id));
        }
      }
    } catch (err) {
      setFeedback({
        type: "error",
        message: getErrorMessage(err),
      });
    } finally {
      setIsLoadingTeams(false);
    }
  }, [selectedTeamId]);

  useEffect(() => {
    loadTeamsAndProjects();
  }, [loadTeamsAndProjects]);

  // 2. Load files for the selected team
  const loadTeamFiles = useCallback(async () => {
    if (!selectedTeamId) {
      setFiles([]);
      return;
    }

    setIsLoadingFiles(true);
    setFilesError(null);

    try {
      const res = await fileService.getTeamFiles(selectedTeamId);
      const list = Array.isArray(res.data) ? res.data : [];
      setFiles(list);
    } catch (err) {
      setFiles([]);
      setFilesError(getErrorMessage(err));
    } finally {
      setIsLoadingFiles(false);
    }
  }, [selectedTeamId]);

  useEffect(() => {
    loadTeamFiles();
  }, [loadTeamFiles]);

  // Handle file selection with 10 MB limit validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFeedback(null);
    const file = e.target.files?.[0] || null;

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setFeedback({
        type: "error",
        message: `File "${file.name}" exceeds the maximum allowed size of 10 MB (${formatFileSize(
          file.size
        )}).`,
      });
      return;
    }

    setSelectedFile(file);
  };

  // Handle multipart/form-data file upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId) {
      setFeedback({
        type: "error",
        message: "Please select a team before uploading a file.",
      });
      return;
    }

    if (!selectedFile) {
      setFeedback({
        type: "error",
        message: "Please choose a file to upload.",
      });
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setFeedback({
        type: "error",
        message: "File exceeds the 10 MB maximum size limit.",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setFeedback(null);

    try {
      await fileService.uploadFile(
        selectedTeamId,
        selectedFile,
        (progressPercent) => {
          setUploadProgress(progressPercent);
        }
      );

      setFeedback({
        type: "success",
        message: `Successfully uploaded "${selectedFile.name}" to the team repository.`,
      });
      setSelectedFile(null);
      setUploadProgress(100);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      await loadTeamFiles();
    } catch (err) {
      setFeedback({
        type: "error",
        message: getErrorMessage(err),
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file download
  const handleDownloadFile = async (file: FileItem) => {
    setDownloadingId(file.id);
    setFeedback(null);

    try {
      await fileService.downloadFile(file.id, file.original_name);
    } catch (err) {
      setFeedback({
        type: "error",
        message: `Failed to download "${file.original_name}": ${getErrorMessage(
          err
        )}`,
      });
    } finally {
      setDownloadingId(null);
    }
  };

  // Handle file delete
  const handleDeleteFile = async (file: FileItem) => {
    if (!window.confirm(`Delete "${file.original_name}" permanently?`)) {
      return;
    }

    setDeletingId(file.id);
    setFeedback(null);

    try {
      await fileService.deleteFile(file.id);
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
      setFeedback({
        type: "success",
        message: `Deleted "${file.original_name}" successfully.`,
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message: getErrorMessage(err),
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Check if current user can delete a file (uploader or project owner)
  const canDeleteFile = (file: FileItem): boolean => {
    if (Number(file.uploaded_by) === currentUserId) return true;
    const activeTeam = teams.find((t) => Number(t.id) === Number(file.team_id));
    if (activeTeam && projectsMap[activeTeam.project_id]) {
      return (
        Number(projectsMap[activeTeam.project_id].owner_id) === currentUserId
      );
    }
    return false;
  };

  // Format bytes into human-readable string
  const formatFileSize = (bytes?: number): string => {
    const size = Number(bytes || 0);
    if (size === 0) return "0 B";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return "Recently";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getFileVisuals = (mimeType?: string, fileName?: string) => {
    const mime = (mimeType || "").toLowerCase();
    const ext = (fileName?.split(".").pop() || "FILE").toUpperCase();

    if (mime.startsWith("image/")) {
      return {
        category: "IMAGE",
        ext,
        icon: FileImage,
        color: "#ec4899",
        bg: "rgba(236, 72, 153, 0.14)",
      };
    }
    if (
      mime.includes("zip") ||
      mime.includes("tar") ||
      mime.includes("compressed") ||
      ["ZIP", "RAR", "7Z", "TAR", "GZ"].includes(ext)
    ) {
      return {
        category: "ARCHIVE",
        ext,
        icon: FileArchive,
        color: "#f59e0b",
        bg: "rgba(245, 158, 11, 0.14)",
      };
    }
    if (
      mime.includes("spreadsheet") ||
      mime.includes("csv") ||
      ["CSV", "XLS", "XLSX"].includes(ext)
    ) {
      return {
        category: "SPREADSHEET",
        ext,
        icon: FileSpreadsheet,
        color: "#10b981",
        bg: "rgba(16, 185, 129, 0.14)",
      };
    }
    if (
      mime.includes("javascript") ||
      mime.includes("json") ||
      mime.includes("html") ||
      ["JS", "TS", "TSX", "JSX", "PY", "SQL", "JSON", "HTML", "CSS"].includes(
        ext
      )
    ) {
      return {
        category: "CODE",
        ext,
        icon: FileCode,
        color: "#38bdf8",
        bg: "rgba(56, 189, 248, 0.14)",
      };
    }
    if (mime.includes("pdf") || mime.includes("text") || mime.includes("word")) {
      return {
        category: "DOCUMENT",
        ext,
        icon: FileText,
        color: "#6366f1",
        bg: "rgba(99, 102, 241, 0.14)",
      };
    }
    return {
      category: "OTHER",
      ext,
      icon: FileIcon,
      color: "#94a3b8",
      bg: "rgba(148, 163, 184, 0.14)",
    };
  };

  // Filtered files
  const filteredFiles = useMemo(() => {
    return files.filter((file) => {
      const visuals = getFileVisuals(file.mime_type, file.original_name);
      if (categoryFilter !== "ALL" && visuals.category !== categoryFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (file.original_name || "").toLowerCase().includes(q);
        const matchUploader = (file.uploaded_by_name || "")
          .toLowerCase()
          .includes(q);
        const matchMime = (file.mime_type || "").toLowerCase().includes(q);
        if (!matchName && !matchUploader && !matchMime) return false;
      }

      return true;
    });
  }, [files, categoryFilter, searchQuery]);

  const totalStorageUsed = useMemo(
    () => files.reduce((acc, f) => acc + Number(f.file_size || 0), 0),
    [files]
  );

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
            <FolderOpen size={14} />
            TEAM REPOSITORY
          </div>
          <h1 className="page-title" style={{ margin: 0 }}>
            Team File Sharing
          </h1>
          <p className="page-subtitle" style={{ marginTop: "0.35rem" }}>
            Upload, organize, and download shared project deliverables and
            documentation (up to 10 MB per file).
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={loadTeamFiles}
          disabled={isLoadingFiles || !selectedTeamId}
        >
          <RefreshCw size={16} className={isLoadingFiles ? "spin" : ""} />
          Refresh Files
        </button>
      </div>

      {/* Top Grid: Team Selector + Upload Card */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "1.25rem",
          marginBottom: "1.5rem",
        }}
      >
        {/* Team Selection & Storage Summary Card */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "0.85rem",
            }}
          >
            <Users size={18} style={{ color: "var(--primary)" }} />
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>
              Active Workspace Team
            </h3>
          </div>

          <div className="form-group" style={{ marginBottom: "1rem" }}>
            <label className="form-label" htmlFor="team-select">
              Select Team Repository
            </label>
            <select
              id="team-select"
              className="form-select"
              value={selectedTeamId}
              onChange={(e) => {
                setSelectedTeamId(e.target.value);
                setFeedback(null);
              }}
              disabled={isLoadingTeams || teams.length === 0}
            >
              {teams.length === 0 ? (
                <option value="">No teams available</option>
              ) : (
                teams.map((team) => {
                  const projectTitle = projectsMap[team.project_id]?.title;
                  return (
                    <option key={team.id} value={String(team.id)}>
                      {team.name}
                      {projectTitle ? ` — (${projectTitle})` : ""}
                    </option>
                  );
                })
              )}
            </select>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem",
              padding: "0.9rem 1rem",
              borderRadius: "10px",
              background: "var(--bg)",
              border: "1px solid var(--border)",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                }}
              >
                <FolderOpen size={12} />
                Total Files
              </div>
              <div
                style={{
                  fontSize: "1.15rem",
                  fontWeight: 700,
                  marginTop: "0.2rem",
                }}
              >
                {files.length}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                }}
              >
                <HardDrive size={12} />
                Team Storage Used
              </div>
              <div
                style={{
                  fontSize: "1.15rem",
                  fontWeight: 700,
                  marginTop: "0.2rem",
                }}
              >
                {formatFileSize(totalStorageUsed)}
              </div>
            </div>
          </div>
        </div>

        {/* File Upload Card */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "0.85rem",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <Upload size={18} style={{ color: "var(--primary)" }} />
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>
                Upload Team File
              </h3>
            </div>
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                background: "var(--surface)",
                padding: "0.2rem 0.55rem",
                borderRadius: "6px",
                border: "1px solid var(--border)",
              }}
            >
              Max 10 MB
            </span>
          </div>

          <form onSubmit={handleUploadSubmit}>
            <div className="form-group" style={{ marginBottom: "0.9rem" }}>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="form-input"
                disabled={!selectedTeamId || isUploading}
                style={{ padding: "0.55rem" }}
              />
            </div>

            {selectedFile && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.55rem 0.85rem",
                  borderRadius: "8px",
                  background: "rgba(99, 102, 241, 0.1)",
                  border: "1px solid rgba(99, 102, 241, 0.3)",
                  marginBottom: "0.85rem",
                  fontSize: "0.84rem",
                }}
              >
                <span
                  style={{
                    fontWeight: 600,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                  }}
                  title="Remove file"
                >
                  <X size={15} />
                </button>
              </div>
            )}

            {/* Upload Progress Bar */}
            {isUploading && (
              <div style={{ marginBottom: "0.85rem" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.78rem",
                    color: "var(--text-muted)",
                    marginBottom: "0.3rem",
                  }}
                >
                  <span>Uploading to team workspace...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div
                  style={{
                    height: "7px",
                    borderRadius: "999px",
                    background: "var(--surface)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${uploadProgress}%`,
                      height: "100%",
                      background: "var(--primary)",
                      transition: "width 0.2s ease",
                    }}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={!selectedTeamId || !selectedFile || isUploading}
              style={{ width: "100%" }}
            >
              <Upload size={16} />
              {isUploading ? "Uploading..." : "Upload File"}
            </button>
          </form>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className="card"
          style={{
            marginBottom: "1.25rem",
            padding: "0.85rem 1.15rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem",
            borderColor:
              feedback.type === "success" ? "var(--success)" : "var(--danger)",
            background:
              feedback.type === "success"
                ? "rgba(16, 185, 129, 0.1)"
                : "rgba(239, 68, 68, 0.1)",
            color:
              feedback.type === "success" ? "var(--success)" : "var(--danger)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            {feedback.type === "success" ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>
              {feedback.message}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
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

      {/* Search & Category Filter Bar */}
      <div
        className="card"
        style={{
          padding: "1rem 1.25rem",
          marginBottom: "1.5rem",
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
            maxWidth: "420px",
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
            placeholder="Search by filename, file type, or uploader..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: "2.4rem" }}
          />
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
          {[
            "ALL",
            "DOCUMENT",
            "IMAGE",
            "CODE",
            "SPREADSHEET",
            "ARCHIVE",
          ].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={
                categoryFilter === cat ? "btn btn-primary" : "btn btn-secondary"
              }
              style={{ padding: "0.4rem 0.8rem", fontSize: "0.78rem" }}
            >
              {cat === "ALL" ? "All Types" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Files List / States */}
      {isLoadingFiles ? (
        <div className="loading-state" style={{ padding: "4rem 1.5rem" }}>
          <div className="spinner" />
          <p style={{ marginTop: "1rem", color: "var(--text-muted)" }}>
            Loading team files...
          </p>
        </div>
      ) : filesError ? (
        <div className="error-state" style={{ padding: "3rem 1.5rem" }}>
          <AlertCircle size={36} style={{ marginBottom: "0.75rem" }} />
          <h3 style={{ marginBottom: "0.4rem" }}>
            Unable to Access Team Files
          </h3>
          <p style={{ marginBottom: "1.25rem" }}>{filesError}</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={loadTeamFiles}
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="empty-state" style={{ padding: "4rem 1.5rem" }}>
          <FolderOpen
            size={48}
            style={{
              color: "var(--primary)",
              marginBottom: "1rem",
              opacity: 0.85,
            }}
          />
          <h3 style={{ marginBottom: "0.4rem" }}>
            {files.length === 0
              ? "No Files Uploaded Yet"
              : "No Matching Files Found"}
          </h3>
          <p
            style={{
              maxWidth: "440px",
              margin: "0 auto",
              color: "var(--text-muted)",
            }}
          >
            {files.length === 0
              ? "Use the upload panel above to share project documents, code archives, or design assets with your team."
              : "Try clearing your search or switching the file type filter."}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))",
            gap: "1.15rem",
          }}
        >
          {filteredFiles.map((file) => {
            const visuals = getFileVisuals(file.mime_type, file.original_name);
            const IconComponent = visuals.icon;
            const authorizedToDelete = canDeleteFile(file);

            return (
              <div
                key={file.id}
                className="card"
                style={{
                  padding: "1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "1rem",
                }}
              >
                {/* Top Row: File Icon + Name + Extension Badge */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.9rem",
                  }}
                >
                  <div
                    style={{
                      width: "46px",
                      height: "46px",
                      borderRadius: "12px",
                      background: visuals.bg,
                      color: visuals.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <IconComponent size={24} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.45rem",
                        marginBottom: "0.25rem",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          padding: "0.12rem 0.5rem",
                          borderRadius: "999px",
                          background: visuals.bg,
                          color: visuals.color,
                        }}
                      >
                        {visuals.ext}
                      </span>
                      <span
                        style={{
                          fontSize: "0.78rem",
                          color: "var(--text-muted)",
                          fontWeight: 600,
                        }}
                      >
                        {formatFileSize(Number(file.file_size || 0))}
                      </span>
                    </div>

                    <h3
                      style={{
                        margin: 0,
                        fontSize: "0.96rem",
                        fontWeight: 700,
                        color: "var(--text)",
                        wordBreak: "break-word",
                      }}
                      title={file.original_name}
                    >
                      {file.original_name}
                    </h3>

                    <div
                      style={{
                        fontSize: "0.74rem",
                        color: "var(--text-muted)",
                        marginTop: "0.2rem",
                      }}
                    >
                      {file.mime_type || "application/octet-stream"}
                    </div>
                  </div>
                </div>

                {/* Metadata: Uploaded By + Upload Date */}
                <div
                  style={{
                    padding: "0.7rem 0.85rem",
                    borderRadius: "8px",
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    fontSize: "0.78rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.35rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "0.5rem",
                    }}
                  >
                    <span
                      style={{
                        color: "var(--text-muted)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.3rem",
                      }}
                    >
                      <UserIcon size={12} />
                      Uploaded by
                    </span>
                    <span style={{ fontWeight: 600, color: "var(--text)" }}>
                      {file.uploaded_by_name || `User #${file.uploaded_by}`}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "0.5rem",
                    }}
                  >
                    <span
                      style={{
                        color: "var(--text-muted)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.3rem",
                      }}
                    >
                      <Calendar size={12} />
                      Uploaded on
                    </span>
                    <span style={{ color: "var(--text)" }}>
                      {formatDate(file.created_at)}
                    </span>
                  </div>
                </div>

                {/* Actions: Download + Delete where authorized */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ flex: 1, fontSize: "0.84rem" }}
                    disabled={downloadingId === file.id}
                    onClick={() => handleDownloadFile(file)}
                  >
                    <Download size={15} />
                    {downloadingId === file.id ? "Downloading..." : "Download"}
                  </button>

                  {authorizedToDelete && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{
                        color: "var(--danger)",
                        padding: "0.5rem 0.7rem",
                      }}
                      disabled={deletingId === file.id}
                      onClick={() => handleDeleteFile(file)}
                      title="Delete file"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Files;
