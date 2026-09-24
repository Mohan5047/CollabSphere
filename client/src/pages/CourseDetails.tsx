import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  FileCode,
  FileText,
  GraduationCap,
  HelpCircle,
  Link2,
  Loader2,
  PlayCircle,
  RefreshCw,
  Sparkles,
  Video,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  learningService,
  progressService,
  quizService,
  userService,
} from "../services/api";
import type {
  Course,
  CourseModule,
  Lesson,
  LessonResource,
  Quiz,
} from "../types";

const getResourceBadge = (type?: string) => {
  const upper = (type || "LINK").toUpperCase();
  switch (upper) {
    case "VIDEO":
    case "YOUTUBE":
      return { icon: <Video size={14} />, badge: "badge-primary", label: upper };
    case "PDF":
    case "NOTES":
      return {
        icon: <FileText size={14} />,
        badge: "badge-secondary",
        label: upper,
      };
    case "CODE":
      return {
        icon: <FileCode size={14} />,
        badge: "badge-warning",
        label: upper,
      };
    default:
      return {
        icon: <Link2 size={14} />,
        badge: "badge-neutral",
        label: upper,
      };
  }
};

const CourseDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const numericCourseId = Number(id);
  const isInvalidId =
    !id || Number.isNaN(numericCourseId) || numericCourseId <= 0;

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [lessonsByModule, setLessonsByModule] = useState<
    Map<number, Lesson[]>
  >(new Map());
  const [resourcesByLesson, setResourcesByLesson] = useState<
    Map<number, LessonResource[]>
  >(new Map());
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<number>>(
    new Set()
  );
  const [courseQuizzes, setCourseQuizzes] = useState<Quiz[]>([]);
  const [isEnrolled, setIsEnrolled] = useState<boolean>(false);

  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [isEnrolling, setIsEnrolling] = useState<boolean>(false);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState<boolean>(false);

  const loadCourseDetails = useCallback(async () => {
    if (isInvalidId) {
      setLoading(false);
      setError("Invalid course identifier.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [
        courseRes,
        modulesRes,
        allLessonsRes,
        allResourcesRes,
        quizzesRes,
        userProgressRes,
        dashboardRes,
      ] = await Promise.allSettled([
        learningService.getCourseById(numericCourseId),
        learningService.getModulesByCourse(numericCourseId),
        learningService.getLessons(),
        learningService.getLessonResources(),
        quizService.getAllQuizzes(),
        user?.id
          ? progressService.getUserProgress(user.id)
          : Promise.resolve(null),
        user?.id
          ? userService.getDashboard(user.id)
          : Promise.resolve(null),
      ]);

      // 1. Course
      if (courseRes.status === "fulfilled") {
        const found = courseRes.value.data || courseRes.value.course;
        if (!found) {
          throw new Error("Course not found.");
        }
        setCourse(found);
      } else {
        throw new Error(
          (courseRes.reason as Error)?.message || "Course not found."
        );
      }

      // 2. Modules for Course
      let courseModules: CourseModule[] = [];
      if (modulesRes.status === "fulfilled") {
        courseModules = Array.isArray(modulesRes.value.data)
          ? modulesRes.value.data
          : [];
      }
      setModules(courseModules);

      // 3. Lessons grouped by module_id
      const moduleIds = new Set(courseModules.map((m) => Number(m.id)));
      const lMap = new Map<number, Lesson[]>();
      let firstCourseLesson: Lesson | null = null;

      if (allLessonsRes.status === "fulfilled") {
        const allLessons: Lesson[] = Array.isArray(allLessonsRes.value.data)
          ? allLessonsRes.value.data
          : [];
        allLessons.forEach((lesson) => {
          const mid = Number(lesson.module_id);
          if (moduleIds.has(mid)) {
            const existing = lMap.get(mid) || [];
            existing.push(lesson);
            lMap.set(mid, existing);
            if (!firstCourseLesson) {
              firstCourseLesson = lesson;
            }
          }
        });
      }
      setLessonsByModule(lMap);

      if (!activeLesson && firstCourseLesson) {
        setActiveLesson(firstCourseLesson);
      }

      // 4. Lesson Resources grouped by lesson_id
      const rMap = new Map<number, LessonResource[]>();
      if (allResourcesRes.status === "fulfilled") {
        const allRes: LessonResource[] = Array.isArray(
          allResourcesRes.value.data
        )
          ? allResourcesRes.value.data
          : [];
        allRes.forEach((resItem) => {
          const lid = Number(resItem.lesson_id);
          const list = rMap.get(lid) || [];
          list.push(resItem);
          rMap.set(lid, list);
        });
      }
      setResourcesByLesson(rMap);

      // 5. Course Quizzes
      if (quizzesRes.status === "fulfilled") {
        const allQuizzes: Quiz[] = Array.isArray(quizzesRes.value.data)
          ? quizzesRes.value.data
          : [];
        setCourseQuizzes(
          allQuizzes.filter(
            (q) =>
              Number(q.course_id) === numericCourseId ||
              moduleIds.has(Number(q.module_id))
          )
        );
      }

      // 6. User Completed Lessons
      const completedSet = new Set<number>();
      if (userProgressRes.status === "fulfilled" && userProgressRes.value) {
        const rows = Array.isArray(userProgressRes.value.data)
          ? (userProgressRes.value.data as {
              lesson_id: number;
              status: string;
            }[])
          : [];
        rows.forEach((row) => {
          if ((row.status || "").toUpperCase() === "COMPLETED") {
            completedSet.add(Number(row.lesson_id));
          }
        });
      }
      setCompletedLessonIds(completedSet);

      // 7. Enrollment Status
      if (dashboardRes.status === "fulfilled" && dashboardRes.value) {
        const enrolledCourses = dashboardRes.value.courses || [];
        const match = enrolledCourses.some(
          (c) => Number(c.course_id) === numericCourseId
        );
        setIsEnrolled(match);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load course details from the server."
      );
    } finally {
      setLoading(false);
    }
  }, [activeLesson, isInvalidId, numericCourseId, user?.id]);

  useEffect(() => {
    void loadCourseDetails();
  }, [loadCourseDetails]);

  // Flatten all lessons in course order
  const allCourseLessons = useMemo(() => {
    const list: Lesson[] = [];
    modules.forEach((mod) => {
      const modLessons = lessonsByModule.get(Number(mod.id)) || [];
      list.push(...modLessons);
    });
    return list;
  }, [modules, lessonsByModule]);

  // Overall Progress Calculation
  const progressStats = useMemo(() => {
    const total = allCourseLessons.length;
    if (total === 0) return { completed: 0, total: 0, percentage: 0 };
    const completed = allCourseLessons.filter((l) =>
      completedLessonIds.has(Number(l.id))
    ).length;
    const percentage = Math.round((completed / total) * 100);
    return { completed, total, percentage };
  }, [allCourseLessons, completedLessonIds]);

  // Enroll Handler
  const handleEnroll = async () => {
    if (!user?.id) return;

    setActionError(null);
    setStatusNotice(null);
    setIsEnrolling(true);

    try {
      await learningService.enrollInCourse({
        user_id: Number(user.id),
        course_id: numericCourseId,
      });
      setIsEnrolled(true);
      setStatusNotice(
        "You are now enrolled in this course! Select any lesson below to begin."
      );
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to enroll in course."
      );
    } finally {
      setIsEnrolling(false);
    }
  };

  // Mark Lesson Complete Handler
  const handleMarkLessonComplete = async (lesson: Lesson) => {
    if (!user?.id) return;

    setActionError(null);
    setStatusNotice(null);
    setIsUpdatingProgress(true);

    try {
      await progressService.updateProgress({
        user_id: Number(user.id),
        lesson_id: Number(lesson.id),
        status: "COMPLETED",
        progress_percent: 100,
      });

      setCompletedLessonIds((prev) => {
        const next = new Set(prev);
        next.add(Number(lesson.id));
        return next;
      });

      setStatusNotice(`Marked "${lesson.title}" as completed!`);
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Could not save lesson completion status."
      );
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  // Continue Learning (Jump to first incomplete lesson)
  const handleContinueLearning = () => {
    const nextIncomplete =
      allCourseLessons.find((l) => !completedLessonIds.has(Number(l.id))) ||
      allCourseLessons[0] ||
      null;
    if (nextIncomplete) {
      setActiveLesson(nextIncomplete);
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="loading-state">
          <div className="spinner" aria-hidden="true" />
          <h3>Loading course curriculum...</h3>
          <p>Fetching modules, interactive lessons, and study resources.</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="page-content">
        <div className="error-state">
          <div className="error-state-icon">
            <AlertCircle size={26} />
          </div>
          <h3>Course Unavailable</h3>
          <p>{error || "The requested course could not be found."}</p>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <Link to="/learning" className="btn btn-secondary">
              <ArrowLeft size={16} />
              <span>Back to Learning Hub</span>
            </Link>
            {!isInvalidId && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void loadCourseDetails()}
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

  const activeLessonResources = activeLesson
    ? resourcesByLesson.get(Number(activeLesson.id)) || []
    : [];
  const isActiveLessonCompleted = activeLesson
    ? completedLessonIds.has(Number(activeLesson.id))
    : false;

  return (
    <div className="page-content">
      {/* Back Navigation */}
      <div style={{ marginBottom: "1rem" }}>
        <Link
          to="/learning"
          className="btn btn-ghost btn-sm"
          style={{ paddingLeft: "0.5rem" }}
        >
          <ArrowLeft size={15} />
          <span>Back to Learning Hub</span>
        </Link>
      </div>

      {/* Feedback Alerts */}
      {statusNotice && (
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
            {statusNotice}
          </span>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setStatusNotice(null)}
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
      {/* COURSE HERO HEADER                                                  */}
      {/* =================================================================== */}
      <div className="card" style={{ marginBottom: "1.75rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "1.5rem",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: "1 1 440px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                marginBottom: "0.65rem",
                flexWrap: "wrap",
              }}
            >
              <span
                className={`badge ${
                  isEnrolled ? "badge-success" : "badge-primary"
                }`}
              >
                {isEnrolled ? "Enrolled" : "Open Enrollment"}
              </span>
              {course.level && (
                <span className="badge badge-neutral">{course.level}</span>
              )}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                }}
              >
                <GraduationCap size={15} />
                {course.instructor || "CollabSphere Faculty"}
              </span>
            </div>

            <h1 style={{ fontSize: "1.75rem", marginBottom: "0.6rem" }}>
              {course.title}
            </h1>

            <p
              style={{
                fontSize: "0.95rem",
                color: "var(--text-muted)",
                lineHeight: 1.65,
                marginBottom: "1rem",
              }}
            >
              {course.description ||
                "Comprehensive software engineering course with structured modules, hands-on resources, and verification quizzes."}
            </p>

            {/* Progress Bar */}
            <div style={{ maxWidth: "460px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.8125rem",
                  marginBottom: "0.35rem",
                }}
              >
                <span style={{ color: "var(--text-muted)" }}>
                  Progress: {progressStats.completed} / {progressStats.total}{" "}
                  lessons completed
                </span>
                <strong style={{ color: "var(--primary)" }}>
                  {progressStats.percentage}%
                </strong>
              </div>
              <div
                style={{
                  width: "100%",
                  height: "8px",
                  borderRadius: "999px",
                  backgroundColor: "var(--surface)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${progressStats.percentage}%`,
                    height: "100%",
                    borderRadius: "999px",
                    background:
                      progressStats.percentage >= 100
                        ? "var(--success)"
                        : "linear-gradient(90deg, var(--primary), var(--secondary))",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Enrollment & Continue Controls */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.65rem",
              minWidth: "210px",
            }}
          >
            {!isEnrolled ? (
              <button
                type="button"
                className="btn btn-primary"
                disabled={isEnrolling}
                onClick={() => void handleEnroll()}
              >
                {isEnrolling ? (
                  <>
                    <Loader2
                      size={16}
                      style={{ animation: "spin 0.8s linear infinite" }}
                    />
                    <span>Enrolling...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Enroll in Course</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleContinueLearning}
              >
                <PlayCircle size={16} />
                <span>Continue Learning</span>
              </button>
            )}

            {courseQuizzes.length > 0 && (
              <Link
                to={`/quiz/${courseQuizzes[0].id}`}
                className="btn btn-secondary"
              >
                <HelpCircle size={16} />
                <span>Take Course Quiz</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* CURRICULUM SIDEBAR + INTERACTIVE LESSON VIEWER                      */}
      {/* =================================================================== */}
      <div className="grid-2" style={{ alignItems: "start" }}>
        {/* Left Column: Modules & Lessons Accordion List */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ fontSize: "1.1rem" }}>
                Course Modules ({modules.length})
              </h3>
              <p style={{ fontSize: "0.825rem", marginTop: "0.15rem" }}>
                Select a lesson to study and mark your progress
              </p>
            </div>
          </div>

          {modules.length === 0 ? (
            <div className="empty-state" style={{ padding: "2rem 1rem" }}>
              <div className="empty-state-icon">
                <BookOpen size={22} />
              </div>
              <h4>No Modules Published Yet</h4>
              <p>Course modules and lessons will appear here once added.</p>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              {modules.map((mod, modIndex) => {
                const modLessons = lessonsByModule.get(Number(mod.id)) || [];
                return (
                  <div
                    key={mod.id}
                    style={{
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border)",
                      backgroundColor: "var(--surface)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        padding: "0.85rem 1rem",
                        borderBottom: "1px solid var(--border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div style={{ fontWeight: 600, color: "var(--text)" }}>
                        Module {modIndex + 1}: {mod.title}
                      </div>
                      <span className="badge badge-neutral">
                        {modLessons.length}{" "}
                        {modLessons.length === 1 ? "lesson" : "lessons"}
                      </span>
                    </div>

                    {modLessons.length === 0 ? (
                      <div
                        style={{
                          padding: "0.75rem 1rem",
                          fontSize: "0.825rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        No lessons in this module.
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        {modLessons.map((lesson) => {
                          const isCompleted = completedLessonIds.has(
                            Number(lesson.id)
                          );
                          const isSelected =
                            activeLesson?.id === lesson.id;

                          return (
                            <button
                              key={lesson.id}
                              type="button"
                              onClick={() => setActiveLesson(lesson)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "0.75rem",
                                padding: "0.75rem 1rem",
                                textAlign: "left",
                                border: "none",
                                borderBottom: "1px solid var(--border)",
                                backgroundColor: isSelected
                                  ? "var(--primary-muted)"
                                  : "transparent",
                                color: isSelected
                                  ? "var(--text)"
                                  : "var(--text-muted)",
                                cursor: "pointer",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.6rem",
                                  minWidth: 0,
                                }}
                              >
                                <CheckCircle2
                                  size={16}
                                  style={{
                                    color: isCompleted
                                      ? "var(--success)"
                                      : "var(--text-subtle)",
                                    flexShrink: 0,
                                  }}
                                />
                                <span
                                  className="truncate"
                                  style={{
                                    fontWeight: isSelected ? 600 : 500,
                                    fontSize: "0.88rem",
                                  }}
                                >
                                  {lesson.title}
                                </span>
                              </div>
                              <ChevronRight size={15} />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Course Quizzes Section */}
          {courseQuizzes.length > 0 && (
            <div style={{ marginTop: "1.5rem" }}>
              <h4
                style={{
                  fontSize: "0.9rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  color: "var(--text-subtle)",
                  marginBottom: "0.75rem",
                }}
              >
                Assessments & Quizzes ({courseQuizzes.length})
              </h4>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.6rem",
                }}
              >
                {courseQuizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.85rem 1rem",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--surface)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--text)" }}>
                        {quiz.title}
                      </div>
                      <span
                        style={{
                          fontSize: "0.775rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        Passing Marks:{" "}
                        {quiz.passing_marks ?? quiz.passing_score ?? 60}
                      </span>
                    </div>
                    <Link
                      to={`/quiz/${quiz.id}`}
                      className="btn btn-primary btn-sm"
                    >
                      Start Quiz
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Active Lesson Content & Resources */}
        <div className="card">
          {!activeLesson ? (
            <div className="empty-state" style={{ padding: "2.5rem 1.25rem" }}>
              <div className="empty-state-icon">
                <PlayCircle size={24} />
              </div>
              <h3>Select a Lesson</h3>
              <p>
                Choose any lesson from the curriculum on the left to view its
                study notes, videos, and downloadable resources.
              </p>
            </div>
          ) : (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "1rem",
                  marginBottom: "1rem",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <span
                    className={`badge ${
                      isActiveLessonCompleted
                        ? "badge-success"
                        : "badge-secondary"
                    }`}
                    style={{ marginBottom: "0.45rem" }}
                  >
                    {isActiveLessonCompleted ? "Completed" : "In Progress"}
                  </span>
                  <h2 style={{ fontSize: "1.35rem" }}>{activeLesson.title}</h2>
                </div>

                <button
                  type="button"
                  className={`btn btn-sm ${
                    isActiveLessonCompleted ? "btn-secondary" : "btn-primary"
                  }`}
                  disabled={isUpdatingProgress || isActiveLessonCompleted}
                  onClick={() => void handleMarkLessonComplete(activeLesson)}
                >
                  {isUpdatingProgress ? (
                    <>
                      <Loader2
                        size={15}
                        style={{ animation: "spin 0.8s linear infinite" }}
                      />
                      <span>Saving...</span>
                    </>
                  ) : isActiveLessonCompleted ? (
                    <>
                      <CheckCircle2 size={15} />
                      <span>Completed</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      <span>Mark Complete</span>
                    </>
                  )}
                </button>
              </div>

              {/* Lesson Video URL if present */}
              {activeLesson.video_url && (
                <div
                  style={{
                    padding: "0.9rem 1rem",
                    marginBottom: "1.25rem",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "var(--surface)",
                    border: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.55rem",
                    }}
                  >
                    <Video size={18} style={{ color: "var(--primary)" }} />
                    <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                      Lesson Video Lecture
                    </span>
                  </div>
                  <a
                    href={activeLesson.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm"
                  >
                    <span>Watch Video</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              )}

              {/* Lesson Text Content */}
              <div
                style={{
                  padding: "1.25rem",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--border)",
                  marginBottom: "1.5rem",
                  lineHeight: 1.7,
                  fontSize: "0.925rem",
                  color: "var(--text)",
                  whiteSpace: "pre-wrap",
                }}
              >
                {activeLesson.content ||
                  "Review the attached study resources and practice materials below to master this lesson's objectives."}
              </div>

              {/* Lesson Resources Section (VIDEO, PDF, NOTES, CODE, LINK, YOUTUBE) */}
              <div>
                <h3 style={{ fontSize: "1.05rem", marginBottom: "0.75rem" }}>
                  Lesson Resources ({activeLessonResources.length})
                </h3>

                {activeLessonResources.length === 0 ? (
                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    No external resources attached to this lesson.
                  </p>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.65rem",
                    }}
                  >
                    {activeLessonResources.map((resItem) => {
                      const meta = getResourceBadge(resItem.resource_type);
                      return (
                        <div
                          key={resItem.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "0.75rem",
                            padding: "0.85rem 1rem",
                            borderRadius: "var(--radius-md)",
                            backgroundColor: "var(--surface)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.65rem",
                              minWidth: 0,
                            }}
                          >
                            <span
                              className={`badge ${meta.badge}`}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.3rem",
                              }}
                            >
                              {meta.icon}
                              {meta.label}
                            </span>
                            <span
                              className="truncate"
                              style={{
                                fontWeight: 600,
                                fontSize: "0.9rem",
                                color: "var(--text)",
                              }}
                            >
                              {resItem.title || resItem.resource_url}
                            </span>
                          </div>

                          <a
                            href={resItem.resource_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary btn-sm"
                          >
                            <span>Open</span>
                            <ExternalLink size={14} />
                          </a>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;
