import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Compass,
  Filter,
  GraduationCap,
  Layers,
  Loader2,
  PlayCircle,
  RefreshCw,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { learningService, userService } from "../services/api";
import {
  Course,
  DashboardData,
  LearningCategory,
  LearningTrack,
} from "../types";

interface EnrolledCourseInfo {
  course_id: number;
  course_title: string;
  progress_percentage: number;
  progress_status: string;
  completed_modules: number;
  completed_lessons: number;
  last_accessed?: string;
}

const Learning: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<LearningCategory[]>([]);
  const [tracks, setTracks] = useState<LearningTrack[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledMap, setEnrolledMap] = useState<
    Map<number, EnrolledCourseInfo>
  >(new Map());

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("ALL");
  const [selectedTrackId, setSelectedTrackId] = useState<string>("ALL");
  const [onlyEnrolled, setOnlyEnrolled] = useState<boolean>(false);
  const [enrollingCourseId, setEnrollingCourseId] = useState<number | null>(
    null
  );

  const loadLearningHub = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [categoriesRes, tracksRes, coursesRes, dashboardRes] =
        await Promise.allSettled([
          learningService.getCategories(),
          learningService.getTracks(),
          learningService.getCourses(),
          user?.id
            ? userService.getDashboard(user.id)
            : Promise.resolve(null),
        ]);

      if (categoriesRes.status === "fulfilled") {
        const list = Array.isArray(categoriesRes.value.data)
          ? categoriesRes.value.data
          : [];
        setCategories(list);
      }

      if (tracksRes.status === "fulfilled") {
        const list = Array.isArray(tracksRes.value.data)
          ? tracksRes.value.data
          : [];
        setTracks(list);
      }

      if (coursesRes.status === "fulfilled") {
        const list = Array.isArray(coursesRes.value.data)
          ? coursesRes.value.data
          : Array.isArray(coursesRes.value.courses)
            ? coursesRes.value.courses
            : [];
        setCourses(list);
      } else {
        throw new Error(
          (coursesRes.reason as Error)?.message || "Failed to load courses."
        );
      }

      const eMap = new Map<number, EnrolledCourseInfo>();
      if (dashboardRes.status === "fulfilled" && dashboardRes.value) {
        const dash: DashboardData = dashboardRes.value;
        (dash.courses || []).forEach((c) => {
          eMap.set(Number(c.course_id), {
            course_id: Number(c.course_id),
            course_title: c.course_title,
            progress_percentage: Number(c.progress_percentage || 0),
            progress_status: c.progress_status || "IN_PROGRESS",
            completed_modules: Number(c.completed_modules || 0),
            completed_lessons: Number(c.completed_lessons || 0),
          });
        });
      }
      setEnrolledMap(eMap);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load learning hub data."
      );
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void loadLearningHub();
  }, [loadLearningHub]);

  // Track ID -> Track Object lookup
  const trackMap = useMemo(() => {
    const map = new Map<number, LearningTrack>();
    tracks.forEach((t) => map.set(Number(t.id), t));
    return map;
  }, [tracks]);

  // Category ID -> Category Object lookup
  const categoryMap = useMemo(() => {
    const map = new Map<number, LearningCategory>();
    categories.forEach((c) => map.set(Number(c.id), c));
    return map;
  }, [categories]);

  // Visible Tracks filtered by selected Category
  const visibleTracks = useMemo(() => {
    if (selectedCategoryId === "ALL") return tracks;
    return tracks.filter(
      (t) => String(t.category_id) === String(selectedCategoryId)
    );
  }, [tracks, selectedCategoryId]);

  // Filtered Courses
  const filteredCourses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return courses.filter((course) => {
      const isEnrolled = enrolledMap.has(Number(course.id));
      if (onlyEnrolled && !isEnrolled) return false;

      const track = course.track_id
        ? trackMap.get(Number(course.track_id))
        : undefined;
      const catId = course.category_id ?? track?.category_id;

      if (
        selectedCategoryId !== "ALL" &&
        String(catId) !== String(selectedCategoryId)
      ) {
        return false;
      }

      if (
        selectedTrackId !== "ALL" &&
        String(course.track_id) !== String(selectedTrackId)
      ) {
        return false;
      }

      if (!q) return true;

      const titleMatch = (course.title || "").toLowerCase().includes(q);
      const descMatch = (course.description || "").toLowerCase().includes(q);
      const trackMatch = (track?.title || "").toLowerCase().includes(q);

      return titleMatch || descMatch || trackMatch;
    });
  }, [
    courses,
    searchQuery,
    selectedCategoryId,
    selectedTrackId,
    onlyEnrolled,
    enrolledMap,
    trackMap,
  ]);

  // Recently Accessed / Enrolled Courses
  const recentlyEnrolledList = useMemo(
    () => Array.from(enrolledMap.values()).slice(0, 3),
    [enrolledMap]
  );

  // Enroll in Course Handler
  const handleEnroll = async (courseId: number) => {
    if (!user?.id) return;

    setFeedbackError(null);
    setFeedbackMessage(null);
    setEnrollingCourseId(courseId);

    try {
      await learningService.enrollInCourse({
        user_id: Number(user.id),
        course_id: courseId,
      });
      setFeedbackMessage("Enrolled successfully! Opening course workspace...");
      await loadLearningHub();
      navigate(`/learning/${courseId}`);
    } catch (err) {
      setFeedbackError(
        err instanceof Error ? err.message : "Failed to enroll in course."
      );
    } finally {
      setEnrollingCourseId(null);
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="loading-state">
          <div className="spinner" aria-hidden="true" />
          <h3>Loading CollabSphere Learning Hub...</h3>
          <p>Fetching categories, structured tracks, and interactive courses.</p>
        </div>
      </div>
    );
  }

  if (error && courses.length === 0) {
    return (
      <div className="page-content">
        <div className="error-state">
          <div className="error-state-icon">
            <AlertCircle size={26} />
          </div>
          <h3>Unable to Load Learning Catalog</h3>
          <p>{error}</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => void loadLearningHub()}
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
          <h1>Learning Hub</h1>
          <p>
            Master software engineering tracks, complete interactive modules,
            and earn verified certificates.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.65rem" }}>
          <Link to="/certificates" className="btn btn-secondary">
            <Award size={16} />
            <span>My Certificates</span>
          </Link>
        </div>
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
      {/* CONTINUE LEARNING / RECENTLY ACCESSED COURSES                       */}
      {/* =================================================================== */}
      {recentlyEnrolledList.length > 0 && (
        <div style={{ marginBottom: "2rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "0.9rem",
            }}
          >
            <h2 style={{ fontSize: "1.2rem" }}>Continue Learning</h2>
            <span style={{ fontSize: "0.825rem", color: "var(--text-muted)" }}>
              {enrolledMap.size} enrolled{" "}
              {enrolledMap.size === 1 ? "course" : "courses"}
            </span>
          </div>

          <div className="grid-3">
            {recentlyEnrolledList.map((enrolled) => {
              const pct = Math.min(
                100,
                Math.max(0, Math.round(enrolled.progress_percentage))
              );
              return (
                <div
                  key={enrolled.course_id}
                  className="card"
                  style={{
                    borderLeft: "4px solid var(--primary)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "0.85rem",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "0.45rem",
                      }}
                    >
                      <span className="badge badge-primary">
                        {enrolled.progress_status.replace("_", " ")}
                      </span>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: "0.85rem",
                          color: "var(--primary)",
                        }}
                      >
                        {pct}%
                      </span>
                    </div>

                    <h3 style={{ fontSize: "1.05rem", marginBottom: "0.5rem" }}>
                      {enrolled.course_title}
                    </h3>

                    <div
                      style={{
                        width: "100%",
                        height: "7px",
                        borderRadius: "999px",
                        backgroundColor: "var(--surface)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          borderRadius: "999px",
                          background:
                            "linear-gradient(90deg, var(--primary), var(--secondary))",
                        }}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.775rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {enrolled.completed_lessons} lessons completed
                    </span>
                    <Link
                      to={`/learning/${enrolled.course_id}`}
                      className="btn btn-primary btn-sm"
                    >
                      <PlayCircle size={14} />
                      <span>Continue</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SEARCH & CATEGORY / TRACK FILTER BAR                                */}
      {/* =================================================================== */}
      <div
        className="card"
        style={{
          marginBottom: "1.5rem",
          padding: "1rem 1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
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
              placeholder="Search courses by title, topic, or learning track..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: "2.55rem" }}
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.65rem",
              flexWrap: "wrap",
            }}
          >
            <Filter size={15} style={{ color: "var(--text-muted)" }} />

            <select
              aria-label="Filter by category"
              value={selectedCategoryId}
              onChange={(e) => {
                setSelectedCategoryId(e.target.value);
                setSelectedTrackId("ALL");
              }}
              style={{ width: "auto", padding: "0.45rem 0.75rem" }}
            >
              <option value="ALL">All Categories ({categories.length})</option>
              {categories.map((cat) => (
                <option key={cat.id} value={String(cat.id)}>
                  {cat.name}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by learning track"
              value={selectedTrackId}
              onChange={(e) => setSelectedTrackId(e.target.value)}
              style={{ width: "auto", padding: "0.45rem 0.75rem" }}
            >
              <option value="ALL">All Tracks ({visibleTracks.length})</option>
              {visibleTracks.map((trk) => (
                <option key={trk.id} value={String(trk.id)}>
                  {trk.title}
                </option>
              ))}
            </select>

            <button
              type="button"
              className={`btn btn-sm ${
                onlyEnrolled ? "btn-primary" : "btn-secondary"
              }`}
              onClick={() => setOnlyEnrolled((prev) => !prev)}
            >
              My Enrolled ({enrolledMap.size})
            </button>
          </div>
        </div>

        {/* Category Quick Pills */}
        {categories.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              className={`btn btn-sm ${
                selectedCategoryId === "ALL" ? "btn-primary" : "btn-ghost"
              }`}
              onClick={() => {
                setSelectedCategoryId("ALL");
                setSelectedTrackId("ALL");
              }}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`btn btn-sm ${
                  selectedCategoryId === String(cat.id)
                    ? "btn-primary"
                    : "btn-ghost"
                }`}
                onClick={() => {
                  setSelectedCategoryId(String(cat.id));
                  setSelectedTrackId("ALL");
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* COURSE CARDS GRID / EMPTY STATE                                     */}
      {/* =================================================================== */}
      {filteredCourses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <BookOpen size={24} />
          </div>
          <h3>No Courses Found</h3>
          <p>
            {courses.length === 0
              ? "No courses have been published in the backend catalog yet."
              : "No courses match your current category, track, or search filters."}
          </p>
          {(searchQuery ||
            selectedCategoryId !== "ALL" ||
            selectedTrackId !== "ALL" ||
            onlyEnrolled) && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategoryId("ALL");
                setSelectedTrackId("ALL");
                setOnlyEnrolled(false);
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid-3">
          {filteredCourses.map((course) => {
            const enrollment = enrolledMap.get(Number(course.id));
            const isEnrolled = Boolean(enrollment);
            const pct = Math.min(
              100,
              Math.max(
                0,
                Math.round(
                  enrollment?.progress_percentage ??
                    course.progress_percentage ??
                    0
                )
              )
            );
            const track = course.track_id
              ? trackMap.get(Number(course.track_id))
              : undefined;
            const category = track?.category_id
              ? categoryMap.get(Number(track.category_id))
              : undefined;

            return (
              <div
                key={course.id}
                className="card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "1.1rem",
                }}
              >
                <div>
                  {/* Badges */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "0.5rem",
                      marginBottom: "0.75rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      className={`badge ${
                        isEnrolled ? "badge-success" : "badge-secondary"
                      }`}
                    >
                      {isEnrolled ? "Enrolled" : course.level || "Course"}
                    </span>

                    {category && (
                      <span className="badge badge-neutral">
                        {category.name}
                      </span>
                    )}
                  </div>

                  {/* Course Title */}
                  <h3 style={{ fontSize: "1.15rem", marginBottom: "0.45rem" }}>
                    <Link
                      to={`/learning/${course.id}`}
                      style={{ color: "var(--text)", textDecoration: "none" }}
                    >
                      {course.title}
                    </Link>
                  </h3>

                  {/* Track Name */}
                  {track && (
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        fontSize: "0.8rem",
                        color: "var(--secondary)",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <Compass size={13} />
                      <span>{track.title}</span>
                    </div>
                  )}

                  {/* Description */}
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--text-muted)",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      marginBottom: "0.9rem",
                    }}
                  >
                    {course.description ||
                      "Structured interactive curriculum with hands-on modules, resources, and skill assessments."}
                  </p>

                  {/* Progress Bar if Enrolled */}
                  {isEnrolled && (
                    <div style={{ marginTop: "0.5rem" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                          marginBottom: "0.35rem",
                        }}
                      >
                        <span>Course Progress</span>
                        <strong style={{ color: "var(--text)" }}>{pct}%</strong>
                      </div>
                      <div
                        style={{
                          width: "100%",
                          height: "6px",
                          borderRadius: "999px",
                          backgroundColor: "var(--surface)",
                          overflow: "hidden",
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
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div
                  style={{
                    paddingTop: "0.85rem",
                    borderTop: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.65rem",
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      fontSize: "0.78rem",
                      color: "var(--text-subtle)",
                    }}
                  >
                    <GraduationCap size={14} />
                    <span>{course.instructor || "CollabSphere Faculty"}</span>
                  </span>

                  {isEnrolled ? (
                    <Link
                      to={`/learning/${course.id}`}
                      className="btn btn-primary btn-sm"
                    >
                      <span>Continue Learning</span>
                      <ArrowRight size={14} />
                    </Link>
                  ) : (
                    <div style={{ display: "flex", gap: "0.45rem" }}>
                      <Link
                        to={`/learning/${course.id}`}
                        className="btn btn-secondary btn-sm"
                      >
                        Syllabus
                      </Link>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={enrollingCourseId === course.id}
                        onClick={() => void handleEnroll(course.id)}
                      >
                        {enrollingCourseId === course.id ? (
                          <Loader2
                            size={14}
                            style={{ animation: "spin 0.8s linear infinite" }}
                          />
                        ) : (
                          <Sparkles size={14} />
                        )}
                        <span>Enroll</span>
                      </button>
                    </div>
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

export default Learning;
