import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  Clock,
  HelpCircle,
  Loader2,
  RefreshCw,
  RotateCcw,
  Send,
  XCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { learningService, quizService } from "../services/api";
import type { Quiz as QuizType, QuizAttempt, QuizQuestion } from "../types";

type OptionKey = "A" | "B" | "C" | "D";

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

const Quiz: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const numericQuizId = Number(id);
  const isInvalidId = !id || Number.isNaN(numericQuizId) || numericQuizId <= 0;

  const [quiz, setQuiz] = useState<QuizType | null>(null);
  const [resolvedCourseId, setResolvedCourseId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [attemptsHistory, setAttemptsHistory] = useState<QuizAttempt[]>([]);

  // Active Question & User Selections (question_id -> "A" | "B" | "C" | "D")
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<number, OptionKey>
  >({});

  // Submission & Result State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionResult, setSubmissionResult] = useState<QuizAttempt | null>(
    null
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadQuizData = useCallback(async () => {
    if (isInvalidId) {
      setLoading(false);
      setError("Invalid quiz identifier.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [quizRes, questionsRes, modulesRes, attemptsRes] =
        await Promise.allSettled([
          quizService.getQuizById(numericQuizId),
          quizService.getQuestionsByQuiz(numericQuizId),
          learningService.getModules(),
          user?.id
            ? quizService.getUserQuizAttempts(user.id)
            : Promise.resolve(null),
        ]);

      let loadedQuiz: QuizType | null = null;
      if (quizRes.status === "fulfilled") {
        const foundQuiz = quizRes.value.data || quizRes.value.quiz;
        if (!foundQuiz) {
          throw new Error("Quiz not found.");
        }
        loadedQuiz = foundQuiz;
        setQuiz(foundQuiz);
      } else {
        throw new Error(
          (quizRes.reason as Error)?.message || "Quiz could not be loaded."
        );
      }

      // Resolve parent course_id from quiz.course_id or via quiz.module_id -> module.course_id
      if (loadedQuiz.course_id) {
        setResolvedCourseId(Number(loadedQuiz.course_id));
      } else if (
        loadedQuiz.module_id &&
        modulesRes.status === "fulfilled" &&
        Array.isArray(modulesRes.value.data)
      ) {
        const matchedModule = modulesRes.value.data.find(
          (m) => Number(m.id) === Number(loadedQuiz?.module_id)
        );
        if (matchedModule?.course_id) {
          setResolvedCourseId(Number(matchedModule.course_id));
        }
      }

      if (questionsRes.status === "fulfilled") {
        const rawQuestions: QuizQuestion[] = Array.isArray(
          questionsRes.value.data
        )
          ? questionsRes.value.data
          : [];
        // Map backend `question` column or `question_text` cleanly and strip any `correct_option`
        const sanitized: QuizQuestion[] = rawQuestions.map((q) => ({
          id: Number(q.id),
          quiz_id: Number(q.quiz_id),
          question_text:
            q.question_text || q.question || `Question #${q.id}`,
          question: q.question || q.question_text,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          marks: q.marks !== undefined ? Number(q.marks) : 1,
        }));
        setQuestions(sanitized);
      }

      if (attemptsRes.status === "fulfilled" && attemptsRes.value) {
        const allAttempts = Array.isArray(attemptsRes.value.data)
          ? attemptsRes.value.data
          : [];
        setAttemptsHistory(
          allAttempts.filter((a) => Number(a.quiz_id) === numericQuizId)
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load quiz assessment from the server."
      );
    } finally {
      setLoading(false);
    }
  }, [isInvalidId, numericQuizId, user?.id]);

  useEffect(() => {
    void loadQuizData();
  }, [loadQuizData]);

  const answeredCount = useMemo(
    () => Object.keys(selectedOptions).length,
    [selectedOptions]
  );

  const activeQuestion = questions[currentIndex] || null;

  const handleSelectOption = (questionId: number, option: OptionKey) => {
    if (isSubmitting || submissionResult) return;
    setSelectedOptions((prev) => ({
      ...prev,
      [questionId]: option,
    }));
    if (submitError) setSubmitError(null);
  };

  // Submit Quiz Attempt (Prevents duplicate submission)
  const handleSubmitQuiz = async () => {
    if (!user?.id || isSubmitting || submissionResult) return;

    if (questions.length === 0) {
      setSubmitError("This quiz has no questions to submit.");
      return;
    }

    if (answeredCount < questions.length) {
      const confirmPartial = window.confirm(
        `You have answered ${answeredCount} of ${questions.length} questions. Submit anyway?`
      );
      if (!confirmPartial) return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const answersPayload = Object.entries(selectedOptions).map(
        ([qid, opt]) => ({
          question_id: Number(qid),
          selected_option: opt,
        })
      );

      const res = await quizService.submitQuizAttempt({
        user_id: Number(user.id),
        quiz_id: numericQuizId,
        answers: answersPayload,
      });

      const resultData = res.result || res.data;
      if (resultData) {
        setSubmissionResult({
          ...resultData,
          quiz_id: numericQuizId,
        });
      } else {
        setSubmissionResult({
          quiz_id: numericQuizId,
          score: 0,
          passed: false,
        });
      }

      // Refresh attempt history
      if (user.id) {
        const refreshed = await quizService.getUserQuizAttempts(user.id);
        const list = Array.isArray(refreshed.data) ? refreshed.data : [];
        setAttemptsHistory(
          list.filter((a) => Number(a.quiz_id) === numericQuizId)
        );
      }
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Failed to submit quiz answers. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetakeQuiz = () => {
    setSelectedOptions({});
    setSubmissionResult(null);
    setSubmitError(null);
    setCurrentIndex(0);
  };

  const backCourseUrl = resolvedCourseId
    ? `/learning/${resolvedCourseId}`
    : quiz?.course_id
    ? `/learning/${quiz.course_id}`
    : "/learning";

  if (loading) {
    return (
      <div className="page-content">
        <div className="loading-state">
          <div className="spinner" aria-hidden="true" />
          <h3>Loading assessment questions...</h3>
          <p>Preparing your quiz environment.</p>
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="page-content">
        <div className="error-state">
          <div className="error-state-icon">
            <AlertCircle size={26} />
          </div>
          <h3>Quiz Unavailable</h3>
          <p>{error || "The requested quiz could not be found."}</p>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <Link to="/learning" className="btn btn-secondary">
              <ArrowLeft size={16} />
              <span>Back to Learning Hub</span>
            </Link>
            {!isInvalidId && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void loadQuizData()}
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

  return (
    <div className="page-content">
      {/* Back Link */}
      <div style={{ marginBottom: "1rem" }}>
        <Link
          to={backCourseUrl}
          className="btn btn-ghost btn-sm"
          style={{ paddingLeft: "0.5rem" }}
        >
          <ArrowLeft size={15} />
          <span>Back to Course</span>
        </Link>
      </div>

      {/* =================================================================== */}
      {/* QUIZ HEADER                                                         */}
      {/* =================================================================== */}
      <div className="card" style={{ marginBottom: "1.75rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.45rem",
                flexWrap: "wrap",
              }}
            >
              <span className="badge badge-primary">Quiz #{quiz.id}</span>
              {quiz.module_title && (
                <span className="badge badge-secondary">
                  {quiz.module_title}
                </span>
              )}
              <span className="badge badge-neutral">
                {questions.length}{" "}
                {questions.length === 1 ? "Question" : "Questions"}
              </span>
              {quiz.total_marks !== undefined && (
                <span className="badge badge-secondary">
                  Total Marks: {quiz.total_marks}
                </span>
              )}
              {quiz.time_limit_minutes !== undefined && (
                <span
                  className="badge badge-neutral"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.25rem",
                  }}
                >
                  <Clock size={12} />
                  {quiz.time_limit_minutes} mins
                </span>
              )}
            </div>

            <h1 style={{ fontSize: "1.6rem" }}>{quiz.title}</h1>
            {quiz.description && (
              <p
                style={{
                  marginTop: "0.35rem",
                  color: "var(--text-muted)",
                  fontSize: "0.9rem",
                }}
              >
                {quiz.description}
              </p>
            )}
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.825rem", color: "var(--text-muted)" }}>
              Passing Requirement
            </div>
            <div
              style={{
                fontSize: "1.2rem",
                fontWeight: 700,
                color: "var(--primary)",
              }}
            >
              {quiz.passing_marks ?? quiz.passing_score ?? 60} Marks
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* SUBMISSION RESULT VIEW                                              */}
      {/* =================================================================== */}
      {submissionResult ? (
        <div
          className="card"
          style={{
            marginBottom: "1.75rem",
            textAlign: "center",
            padding: "2.5rem 1.75rem",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              margin: "0 auto 1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: submissionResult.passed
                ? "var(--success-muted)"
                : "var(--danger-muted)",
              color: submissionResult.passed
                ? "var(--success)"
                : "var(--danger)",
            }}
          >
            {submissionResult.passed ? (
              <Award size={34} />
            ) : (
              <XCircle size={34} />
            )}
          </div>

          <span
            className={`badge ${
              submissionResult.passed ? "badge-success" : "badge-danger"
            }`}
            style={{ marginBottom: "0.75rem" }}
          >
            {submissionResult.passed
              ? "PASSED ASSESSMENT"
              : "BELOW PASSING THRESHOLD"}
          </span>

          <h2 style={{ fontSize: "1.65rem", marginBottom: "0.5rem" }}>
            Score: {submissionResult.score}
            {submissionResult.total_marks !== undefined
              ? ` / ${submissionResult.total_marks}`
              : ""}
          </h2>

          {submissionResult.percentage !== undefined && (
            <p
              style={{
                fontSize: "1.05rem",
                color: "var(--text-muted)",
                marginBottom: "1.5rem",
              }}
            >
              Accuracy: <strong>{submissionResult.percentage}%</strong>
            </p>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "0.85rem",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleRetakeQuiz}
            >
              <RotateCcw size={16} />
              <span>Retake Quiz</span>
            </button>

            <Link to={backCourseUrl} className="btn btn-primary">
              <span>Return to Course</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      ) : (
        /* ================================================================= */
        /* ACTIVE QUIZ QUESTION & PALETTE                                    */
        /* ================================================================= */
        <div
          className="grid-2"
          style={{ marginBottom: "1.75rem", alignItems: "start" }}
        >
          {/* Question Card */}
          <div className="card">
            {submitError && (
              <div
                role="alert"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
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
                <span>{submitError}</span>
              </div>
            )}

            {questions.length === 0 || !activeQuestion ? (
              <div className="empty-state" style={{ padding: "2rem 1rem" }}>
                <div className="empty-state-icon">
                  <HelpCircle size={24} />
                </div>
                <h3>No Questions Available</h3>
                <p>This quiz does not contain any questions yet.</p>
              </div>
            ) : (
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "0.85rem",
                  }}
                >
                  <span className="badge badge-secondary">
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                  {activeQuestion.marks !== undefined && (
                    <span
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {activeQuestion.marks}{" "}
                      {activeQuestion.marks === 1 ? "mark" : "marks"}
                    </span>
                  )}
                </div>

                <h3
                  style={{
                    fontSize: "1.15rem",
                    lineHeight: 1.55,
                    marginBottom: "1.35rem",
                  }}
                >
                  {activeQuestion.question_text || activeQuestion.question}
                </h3>

                {/* Multiple Choice Options */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  {(
                    [
                      { key: "A" as OptionKey, text: activeQuestion.option_a },
                      { key: "B" as OptionKey, text: activeQuestion.option_b },
                      { key: "C" as OptionKey, text: activeQuestion.option_c },
                      { key: "D" as OptionKey, text: activeQuestion.option_d },
                    ] as const
                  ).map((opt) => {
                    const isSelected =
                      selectedOptions[activeQuestion.id] === opt.key;

                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() =>
                          handleSelectOption(activeQuestion.id, opt.key)
                        }
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.85rem",
                          padding: "0.9rem 1rem",
                          borderRadius: "var(--radius-md)",
                          border: isSelected
                            ? "1.5px solid var(--primary)"
                            : "1px solid var(--border)",
                          backgroundColor: isSelected
                            ? "var(--primary-muted)"
                            : "var(--surface)",
                          color: "var(--text)",
                          textAlign: "left",
                          cursor: "pointer",
                          transition: "all var(--transition-fast)",
                        }}
                      >
                        <span
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            flexShrink: 0,
                            backgroundColor: isSelected
                              ? "var(--primary)"
                              : "var(--card)",
                            color: isSelected ? "#fff" : "var(--text-secondary)",
                            border: isSelected
                              ? "none"
                              : "1px solid var(--border)",
                          }}
                        >
                          {opt.key}
                        </span>
                        <span style={{ fontSize: "0.925rem", lineHeight: 1.4 }}>
                          {opt.text}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Prev / Next Controls */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: "1rem",
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={currentIndex === 0}
                    onClick={() =>
                      setCurrentIndex((prev) => Math.max(0, prev - 1))
                    }
                  >
                    <ArrowLeft size={15} />
                    <span>Previous</span>
                  </button>

                  {currentIndex < questions.length - 1 ? (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() =>
                        setCurrentIndex((prev) =>
                          Math.min(questions.length - 1, prev + 1)
                        )
                      }
                    >
                      <span>Next</span>
                      <ArrowRight size={15} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      disabled={isSubmitting}
                      onClick={() => void handleSubmitQuiz()}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={15} className="spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <Send size={15} />
                          <span>Submit Quiz</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Question Navigator & Submit Panel */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Assessment Navigator</h3>
                <p className="card-subtitle">
                  {answeredCount} of {questions.length} answered
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ marginBottom: "1.25rem" }}>
              <div
                style={{
                  width: "100%",
                  height: "8px",
                  borderRadius: "var(--radius-full)",
                  backgroundColor: "var(--surface)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${
                      questions.length > 0
                        ? Math.round((answeredCount / questions.length) * 100)
                        : 0
                    }%`,
                    height: "100%",
                    backgroundColor: "var(--primary)",
                    transition: "width var(--transition-normal)",
                  }}
                />
              </div>
            </div>

            {/* Question Number Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(42px, 1fr))",
                gap: "0.5rem",
                marginBottom: "1.5rem",
              }}
            >
              {questions.map((q, idx) => {
                const isAnswered = Boolean(selectedOptions[q.id]);
                const isCurrent = idx === currentIndex;

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    style={{
                      height: "38px",
                      borderRadius: "var(--radius-md)",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      border: isCurrent
                        ? "2px solid var(--primary)"
                        : "1px solid var(--border)",
                      backgroundColor: isAnswered
                        ? "var(--primary-muted)"
                        : "var(--surface)",
                      color: isAnswered
                        ? "var(--primary)"
                        : "var(--text-secondary)",
                    }}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              className="btn btn-primary"
              style={{ width: "100%" }}
              disabled={isSubmitting || questions.length === 0}
              onClick={() => void handleSubmitQuiz()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="spin" />
                  <span>Grading Assessment...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Submit Final Answers</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* PREVIOUS ATTEMPTS HISTORY                                           */}
      {/* =================================================================== */}
      {attemptsHistory.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Your Previous Attempts</h3>
              <p className="card-subtitle">
                Historical performance for this assessment
              </p>
            </div>
            <span className="badge badge-neutral">
              {attemptsHistory.length} Attempts
            </span>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Attempt</th>
                  <th>Score</th>
                  <th>Accuracy</th>
                  <th>Result</th>
                  <th>Completed Date</th>
                </tr>
              </thead>
              <tbody>
                {attemptsHistory.map((attempt, idx) => (
                  <tr
                    key={
                      attempt.attempt_id ||
                      attempt.id ||
                      `${attempt.quiz_id}-${idx}`
                    }
                  >
                    <td style={{ fontWeight: 600 }}>
                      #{attempt.attempt_id || attempt.id || idx + 1}
                    </td>
                    <td>
                      {attempt.score}
                      {attempt.total_marks !== undefined
                        ? ` / ${attempt.total_marks}`
                        : ""}
                    </td>
                    <td>
                      {attempt.percentage !== undefined
                        ? `${attempt.percentage}%`
                        : "—"}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          attempt.passed ? "badge-success" : "badge-danger"
                        }`}
                      >
                        {attempt.passed ? "PASSED" : "FAILED"}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          color: "var(--text-muted)",
                          fontSize: "0.825rem",
                        }}
                      >
                        <Clock size={12} />
                        {formatDate(
                          attempt.completed_at ||
                            attempt.attempted_at ||
                            attempt.created_at
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quiz;
