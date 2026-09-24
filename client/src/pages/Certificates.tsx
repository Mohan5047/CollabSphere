import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  Search,
  ShieldCheck,
  Calendar,
  ExternalLink,
  Printer,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  Sparkles,
  BookOpen,
  X,
  CheckCircle2,
  User as UserIcon,
  Hash,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  certificateService,
  progressService,
  learningService,
  getErrorMessage,
} from "../services/api";
import type { Certificate, Course } from "../types";

const Certificates: React.FC = () => {
  const { user } = useAuth();

  // Primary state
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [allCoursesMap, setAllCoursesMap] = useState<Record<number, Course>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Selected certificate for detailed preview / print modal
  const [selectedCertificate, setSelectedCertificate] =
    useState<Certificate | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Certificate Verification Tool state
  const [verifyInput, setVerifyInput] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verifiedRecord, setVerifiedRecord] = useState<Certificate | null>(
    null
  );
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Claim / Generate new certificate state
  const [claimingCourseId, setClaimingCourseId] = useState<number | null>(null);
  const [claimFeedback, setClaimFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const fetchCertificatesData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    setError(null);

    try {
      const [certsRes, enrolledRes, coursesRes] = await Promise.allSettled([
        certificateService.getUserCertificates(user.id),
        progressService.getUserEnrolledCourses(user.id),
        learningService.getAllCourses(),
      ]);

      if (certsRes.status === "fulfilled") {
        const list = Array.isArray(certsRes.value.data)
          ? certsRes.value.data
          : [];
        setCertificates(list);
      } else {
        throw certsRes.reason;
      }

      if (enrolledRes.status === "fulfilled") {
        const enrolledList = Array.isArray(enrolledRes.value.data)
          ? enrolledRes.value.data
          : [];
        setEnrolledCourses(enrolledList);
      }

      if (coursesRes.status === "fulfilled") {
        const courseList = Array.isArray(coursesRes.value.data)
          ? coursesRes.value.data
          : [];
        const map: Record<number, Course> = {};
        courseList.forEach((c) => {
          map[c.id] = c;
        });
        setAllCoursesMap(map);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchCertificatesData();
  }, [fetchCertificatesData]);

  const getCertCode = (cert: Certificate): string => {
    return (
      cert.certificate_number ||
      cert.certificate_code ||
      `COLLAB-${String(cert.id).padStart(6, "0")}`
    );
  };

  const getCourseTitle = useCallback(
    (cert: Certificate): string => {
      if (cert.course_title) return cert.course_title;
      if (allCoursesMap[cert.course_id]?.title) {
        return allCoursesMap[cert.course_id].title;
      }
      return `Course #${cert.course_id}`;
    },
    [allCoursesMap]
  );

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return "Issued Recently";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(code);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback ignored
    }
  };

  const handleVerifyCertificate = async (e?: React.FormEvent, codeOverride?: string) => {
    if (e) e.preventDefault();
    const codeToVerify = (codeOverride ?? verifyInput).trim();
    if (!codeToVerify) return;

    setVerifyInput(codeToVerify);
    setIsVerifying(true);
    setVerifyError(null);
    setVerifiedRecord(null);

    try {
      const res = await certificateService.verifyCertificate(codeToVerify);
      if (res.data) {
        setVerifiedRecord(res.data);
      } else {
        setVerifyError("No matching certificate found for this ID.");
      }
    } catch (err) {
      setVerifyError(getErrorMessage(err));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClaimCertificate = async (courseId: number) => {
    if (!user?.id) return;
    setClaimingCourseId(courseId);
    setClaimFeedback(null);

    try {
      const res = await certificateService.generateCertificate({
        user_id: user.id,
        course_id: courseId,
      });
      const newCert = res.data;
      setClaimFeedback({
        type: "success",
        message: "Certificate issued and verified on your profile!",
      });
      await fetchCertificatesData();
      if (newCert) {
        setSelectedCertificate(newCert);
      }
    } catch (err) {
      setClaimFeedback({
        type: "error",
        message: getErrorMessage(err),
      });
    } finally {
      setClaimingCourseId(null);
    }
  };

  // Courses completed (>=100% progress) that don't have a certificate yet
  const claimableCourses = useMemo(() => {
    const certifiedCourseIds = new Set(certificates.map((c) => c.course_id));
    return enrolledCourses.filter(
      (course) =>
        !certifiedCourseIds.has(course.id) &&
        Number(course.progress_percentage ?? 0) >= 100
    );
  }, [enrolledCourses, certificates]);

  // Filtered certificates
  const filteredCertificates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return certificates;

    return certificates.filter((cert) => {
      const courseTitle = getCourseTitle(cert).toLowerCase();
      const certCode = getCertCode(cert).toLowerCase();
      const holderName = (cert.full_name || user?.name || "").toLowerCase();
      return (
        courseTitle.includes(q) ||
        certCode.includes(q) ||
        holderName.includes(q)
      );
    });
  }, [certificates, searchQuery, getCourseTitle, user?.name]);

  const handlePrintCertificate = () => {
    window.print();
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
            <Award size={14} />
            VERIFIED CREDENTIALS
          </div>
          <h1 className="page-title" style={{ margin: 0 }}>
            Earned Certificates
          </h1>
          <p className="page-subtitle" style={{ marginTop: "0.35rem" }}>
            View, verify, and download official CollabSphere course completion
            credentials.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={fetchCertificatesData}
            disabled={isLoading}
          >
            <RefreshCw size={16} className={isLoading ? "spin" : ""} />
            Refresh
          </button>
          <Link to="/learning" className="btn btn-primary">
            <BookOpen size={16} />
            Explore Courses
          </Link>
        </div>
      </div>

      {/* Stats & Verification Bar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "1.25rem",
          marginBottom: "1.75rem",
        }}
      >
        {/* Summary Card */}
        <div
          className="card"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1.5rem",
            background:
              "linear-gradient(135deg, rgba(99, 102, 241, 0.14), rgba(16, 185, 129, 0.06))",
            borderColor: "rgba(99, 102, 241, 0.28)",
          }}
        >
          <div>
            <span
              style={{
                fontSize: "0.82rem",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontWeight: 600,
              }}
            >
              Total Credentials Earned
            </span>
            <div
              style={{
                fontSize: "2.25rem",
                fontWeight: 800,
                color: "var(--text)",
                marginTop: "0.25rem",
                lineHeight: 1.1,
              }}
            >
              {certificates.length}
            </div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                marginTop: "0.65rem",
                fontSize: "0.82rem",
                color: "var(--success)",
                fontWeight: 500,
              }}
            >
              <ShieldCheck size={15} />
              Cryptographically indexed by Certificate ID
            </div>
          </div>
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "16px",
              background: "rgba(99, 102, 241, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--primary)",
            }}
          >
            <Award size={32} />
          </div>
        </div>

        {/* Instant Certificate Verification Lookup */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "0.65rem",
            }}
          >
            <ShieldCheck size={18} style={{ color: "var(--success)" }} />
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>
              Credential Verification Lookup
            </h3>
          </div>
          <p
            style={{
              fontSize: "0.85rem",
              color: "var(--text-muted)",
              marginBottom: "0.9rem",
            }}
          >
            Enter any CollabSphere Certificate ID (e.g.{" "}
            <code>COLLAB-171000-1</code>) to verify authenticity with the
            backend registry.
          </p>

          <form
            onSubmit={(e) => handleVerifyCertificate(e)}
            style={{ display: "flex", gap: "0.6rem" }}
          >
            <input
              type="text"
              className="form-input"
              placeholder="Enter Certificate ID..."
              value={verifyInput}
              onChange={(e) => setVerifyInput(e.target.value)}
              style={{ flex: 1 }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isVerifying || !verifyInput.trim()}
            >
              {isVerifying ? "Verifying..." : "Verify"}
            </button>
          </form>

          {verifyError && (
            <div
              style={{
                marginTop: "0.75rem",
                padding: "0.65rem 0.85rem",
                borderRadius: "8px",
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "var(--danger)",
                fontSize: "0.84rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <AlertCircle size={15} />
              <span>{verifyError}</span>
            </div>
          )}

          {verifiedRecord && (
            <div
              style={{
                marginTop: "0.85rem",
                padding: "0.85rem 1rem",
                borderRadius: "10px",
                background: "rgba(16, 185, 129, 0.1)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    color: "var(--success)",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                  }}
                >
                  <CheckCircle2 size={16} />
                  Authentic CollabSphere Certificate
                </div>
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--text)",
                    marginTop: "0.2rem",
                  }}
                >
                  <strong>{getCourseTitle(verifiedRecord)}</strong> — Issued to{" "}
                  <strong>
                    {verifiedRecord.full_name || user?.name || `User #${verifiedRecord.user_id}`}
                  </strong>{" "}
                  on {formatDate(verifiedRecord.issued_at || verifiedRecord.created_at)}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: "0.35rem 0.65rem", fontSize: "0.78rem" }}
                onClick={() => setSelectedCertificate(verifiedRecord)}
              >
                Inspect
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Claimable Certificates Banner (if user completed 100% of a course without claiming yet) */}
      {claimableCourses.length > 0 && (
        <div
          className="card"
          style={{
            marginBottom: "1.5rem",
            padding: "1.25rem 1.5rem",
            borderColor: "rgba(16, 185, 129, 0.4)",
            background: "rgba(16, 185, 129, 0.07)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "var(--success)",
              fontWeight: 700,
              marginBottom: "0.5rem",
            }}
          >
            <Sparkles size={18} />
            <span>Ready to Claim: Completed Courses</span>
          </div>
          <p
            style={{
              fontSize: "0.88rem",
              color: "var(--text-muted)",
              marginBottom: "0.9rem",
            }}
          >
            You have completed the following course(s). Generate your official
            certificate now:
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
            {claimableCourses.map((course) => (
              <div
                key={course.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.6rem 0.95rem",
                  borderRadius: "10px",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                }}
              >
                <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                  {course.title}
                </span>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
                  disabled={claimingCourseId === course.id}
                  onClick={() => handleClaimCertificate(course.id)}
                >
                  {claimingCourseId === course.id
                    ? "Issuing..."
                    : "Claim Certificate"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {claimFeedback && (
        <div
          className={
            claimFeedback.type === "error" ? "error-state" : "card"
          }
          style={{
            marginBottom: "1.25rem",
            padding: "0.85rem 1.1rem",
            borderColor:
              claimFeedback.type === "success"
                ? "var(--success)"
                : "var(--danger)",
          }}
        >
          {claimFeedback.message}
        </div>
      )}

      {/* Filter Bar */}
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
            flex: "1 1 280px",
            maxWidth: "460px",
          }}
        >
          <Search
            size={17}
            style={{
              position: "absolute",
              left: "0.9rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
            }}
          />
          <input
            type="text"
            className="form-input"
            placeholder="Search certificates by course, title, or Certificate ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: "2.5rem" }}
          />
        </div>
        <div style={{ fontSize: "0.86rem", color: "var(--text-muted)" }}>
          Showing <strong>{filteredCertificates.length}</strong> of{" "}
          <strong>{certificates.length}</strong> earned credential
          {certificates.length === 1 ? "" : "s"}
        </div>
      </div>

      {/* Loading / Error / Empty / Gallery */}
      {isLoading ? (
        <div className="loading-state" style={{ padding: "4rem 1.5rem" }}>
          <div className="spinner" />
          <p style={{ marginTop: "1rem", color: "var(--text-muted)" }}>
            Loading your earned certificates...
          </p>
        </div>
      ) : error ? (
        <div className="error-state" style={{ padding: "3rem 1.5rem" }}>
          <AlertCircle size={36} style={{ marginBottom: "0.75rem" }} />
          <h3 style={{ marginBottom: "0.4rem" }}>
            Unable to Load Certificates
          </h3>
          <p style={{ marginBottom: "1.25rem" }}>{error}</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={fetchCertificatesData}
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      ) : filteredCertificates.length === 0 ? (
        <div className="empty-state" style={{ padding: "4rem 1.5rem" }}>
          <Award
            size={48}
            style={{ color: "var(--primary)", marginBottom: "1rem", opacity: 0.85 }}
          />
          <h3 style={{ marginBottom: "0.4rem" }}>
            {searchQuery
              ? "No Matching Certificates Found"
              : "No Certificates Earned Yet"}
          </h3>
          <p
            style={{
              maxWidth: "460px",
              margin: "0 auto 1.5rem",
              color: "var(--text-muted)",
            }}
          >
            {searchQuery
              ? "Try clearing your search filter or searching by another course title or Certificate ID."
              : "Complete lessons and pass course assessments in the CollabSphere Learning Hub to earn verified digital certificates."}
          </p>
          {searchQuery ? (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setSearchQuery("")}
            >
              Clear Search
            </button>
          ) : (
            <Link to="/learning" className="btn btn-primary">
              <BookOpen size={16} />
              Browse Learning Catalog
            </Link>
          )}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {filteredCertificates.map((cert) => {
            const certCode = getCertCode(cert);
            const courseTitle = getCourseTitle(cert);
            const recipientName =
              cert.full_name || user?.name || "CollabSphere Scholar";
            const issueDate = formatDate(cert.issued_at || cert.created_at);

            return (
              <div
                key={cert.id}
                className="card"
                style={{
                  padding: 0,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  border: "1px solid var(--border)",
                  transition: "transform 0.2s ease, border-color 0.2s ease",
                }}
              >
                {/* Decorative Top Ribbon Banner */}
                <div
                  style={{
                    padding: "1.35rem 1.5rem",
                    background:
                      "linear-gradient(135deg, rgba(99, 102, 241, 0.22) 0%, rgba(15, 23, 42, 0.92) 100%)",
                    borderBottom: "1px solid var(--border)",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "0.75rem",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        fontSize: "0.74rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        padding: "0.25rem 0.65rem",
                        borderRadius: "999px",
                        background: "rgba(16, 185, 129, 0.16)",
                        color: "var(--success)",
                      }}
                    >
                      <ShieldCheck size={13} />
                      Verified Credential
                    </span>

                    <Award size={26} style={{ color: "var(--primary)" }} />
                  </div>

                  <div
                    style={{
                      fontSize: "0.76rem",
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginTop: "1rem",
                    }}
                  >
                    Certificate of Completion
                  </div>
                  <h3
                    style={{
                      fontSize: "1.18rem",
                      fontWeight: 700,
                      color: "var(--text)",
                      margin: "0.3rem 0 0",
                      lineHeight: 1.35,
                    }}
                  >
                    {courseTitle}
                  </h3>
                </div>

                {/* Certificate Metadata Body */}
                <div
                  style={{
                    padding: "1.25rem 1.5rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.85rem",
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "0.75rem",
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
                        <UserIcon size={12} />
                        Recipient
                      </div>
                      <div
                        style={{
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          marginTop: "0.15rem",
                        }}
                      >
                        {recipientName}
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
                        <Calendar size={12} />
                        Issued Date
                      </div>
                      <div
                        style={{
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          marginTop: "0.15rem",
                        }}
                      >
                        {issueDate}
                      </div>
                    </div>
                  </div>

                  {/* Certificate ID Box */}
                  <div
                    style={{
                      padding: "0.65rem 0.85rem",
                      borderRadius: "8px",
                      background: "var(--bg)",
                      border: "1px solid var(--border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "0.5rem",
                    }}
                  >
                    <div style={{ overflow: "hidden" }}>
                      <div
                        style={{
                          fontSize: "0.7rem",
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                        }}
                      >
                        <Hash size={11} />
                        Certificate ID
                      </div>
                      <code
                        style={{
                          fontSize: "0.82rem",
                          color: "var(--primary)",
                          fontWeight: 600,
                        }}
                      >
                        {certCode}
                      </code>
                    </div>

                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: "0.35rem 0.6rem", fontSize: "0.75rem" }}
                      onClick={() => handleCopyCode(certCode)}
                      title="Copy Certificate ID"
                    >
                      {copiedId === certCode ? (
                        <>
                          <Check size={13} />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div
                  style={{
                    padding: "1rem 1.5rem",
                    borderTop: "1px solid var(--border)",
                    background: "rgba(15, 23, 42, 0.35)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.6rem",
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ flex: 1, fontSize: "0.84rem" }}
                    onClick={() => setSelectedCertificate(cert)}
                  >
                    <Award size={15} />
                    View & Print
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: "0.84rem" }}
                    onClick={() => handleVerifyCertificate(undefined, certCode)}
                    title="Verify against live registry"
                  >
                    <ShieldCheck size={15} />
                    Verify
                  </button>

                  {cert.course_id && (
                    <Link
                      to={`/learning/${cert.course_id}`}
                      className="btn btn-secondary"
                      style={{ padding: "0.5rem 0.65rem" }}
                      title="Go to Course"
                    >
                      <ExternalLink size={15} />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Printable Full Certificate Modal */}
      {selectedCertificate && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(2, 6, 23, 0.82)",
            backdropFilter: "blur(6px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
          }}
          onClick={() => setSelectedCertificate(null)}
        >
          <div
            className="card"
            style={{
              maxWidth: "780px",
              width: "100%",
              padding: "2.5rem",
              position: "relative",
              background:
                "radial-gradient(circle at top right, rgba(99, 102, 241, 0.16), transparent 60%), var(--card)",
              border: "2px solid rgba(99, 102, 241, 0.45)",
              boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.7)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedCertificate(null)}
              style={{
                position: "absolute",
                top: "1.25rem",
                right: "1.25rem",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                padding: "0.4rem",
                color: "var(--text-muted)",
                cursor: "pointer",
              }}
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            {/* Official Certificate Frame */}
            <div
              style={{
                border: "1px solid rgba(99, 102, 241, 0.3)",
                borderRadius: "12px",
                padding: "2.25rem 2rem",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  background: "rgba(99, 102, 241, 0.18)",
                  color: "var(--primary)",
                  marginBottom: "1rem",
                }}
              >
                <Award size={34} />
              </div>

              <div
                style={{
                  fontSize: "0.82rem",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--primary)",
                  fontWeight: 700,
                }}
              >
                CollabSphere Academy • Official Credential
              </div>

              <h2
                style={{
                  fontSize: "2rem",
                  fontWeight: 800,
                  margin: "0.5rem 0 1.25rem",
                }}
              >
                Certificate of Completion
              </h2>

              <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
                This is to certify that
              </p>

              <div
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 700,
                  color: "var(--text)",
                  margin: "0.6rem auto",
                  paddingBottom: "0.5rem",
                  borderBottom: "1px solid var(--border)",
                  maxWidth: "460px",
                }}
              >
                {selectedCertificate.full_name ||
                  user?.name ||
                  "CollabSphere Member"}
              </div>

              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "0.95rem",
                  marginTop: "1rem",
                }}
              >
                has successfully completed the course and curriculum requirements
                for
              </p>

              <h3
                style={{
                  fontSize: "1.4rem",
                  fontWeight: 700,
                  color: "var(--primary)",
                  margin: "0.65rem 0 1.75rem",
                }}
              >
                {getCourseTitle(selectedCertificate)}
              </h3>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "space-around",
                  gap: "1.25rem",
                  paddingTop: "1.25rem",
                  borderTop: "1px solid var(--border)",
                  fontSize: "0.85rem",
                }}
              >
                <div>
                  <div style={{ color: "var(--text-muted)" }}>Issue Date</div>
                  <div style={{ fontWeight: 600, marginTop: "0.2rem" }}>
                    {formatDate(
                      selectedCertificate.issued_at ||
                        selectedCertificate.created_at
                    )}
                  </div>
                </div>

                <div>
                  <div style={{ color: "var(--text-muted)" }}>
                    Certificate ID
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      color: "var(--primary)",
                      marginTop: "0.2rem",
                    }}
                  >
                    {getCertCode(selectedCertificate)}
                  </div>
                </div>

                <div>
                  <div style={{ color: "var(--text-muted)" }}>
                    Verification Status
                  </div>
                  <div
                    style={{
                      fontWeight: 600,
                      color: "var(--success)",
                      marginTop: "0.2rem",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.3rem",
                    }}
                  >
                    <ShieldCheck size={15} />
                    Verified Authentic
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.75rem",
                marginTop: "1.5rem",
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() =>
                  handleCopyCode(getCertCode(selectedCertificate))
                }
              >
                <Copy size={16} />
                Copy Credential ID
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handlePrintCertificate}
              >
                <Printer size={16} />
                Print / Save as PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Certificates;
