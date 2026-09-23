import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import {
  Activity,
  ApiResponse,
  Application,
  AuthResponse,
  Certificate,
  ChatMessage,
  Course,
  CourseModule,
  DashboardData,
  FileItem,
  LearningCategory,
  LearningTrack,
  Lesson,
  NotificationItem,
  Project,
  Quiz,
  QuizAttempt,
  Task,
  TaskPriority,
  TaskStatus,
  Team,
  User,
} from "../types";

// ============================================================================
// CONFIGURATION & STORAGE KEYS
// ============================================================================

export const API_BASE_URL: string =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export const AUTH_TOKEN_KEY = "token";

export const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setAuthToken = (token: string | null): void => {
  try {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  } catch {
    // Ignore storage quota/security errors
  }
};

// ============================================================================
// CENTRALIZED CONFIRMED BACKEND ENDPOINTS
// ============================================================================

export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: "/api/auth/register",
    LOGIN: "/api/auth/login",
    PROFILE: "/api/auth/profile",
  },
  DASHBOARD: {
    USER: (userId: number | string) => `/api/dashboard/user/${userId}`,
  },
  PROJECTS: {
    BASE: "/api/projects",
    BY_ID: (id: number | string) => `/api/projects/${id}`,
  },
  TEAMS: {
    BASE: "/api/teams",
    BY_ID: (teamId: number | string) => `/api/teams/${teamId}`,
    MEMBERS: "/api/teams/members",
    REMOVE_MEMBER: (teamId: number | string, userId: number | string) =>
      `/api/teams/${teamId}/members/${userId}`,
    ASSIGN_LEAD: (teamId: number | string, userId: number | string) =>
      `/api/teams/${teamId}/lead/${userId}`,
  },
  TASKS: {
    BASE: "/api/tasks",
    BY_ID: (taskId: number | string) => `/api/tasks/${taskId}`,
    BY_TEAM: (teamId: number | string) => `/api/tasks/team/${teamId}`,
    UPDATE_STATUS: (taskId: number | string) => `/api/tasks/${taskId}/status`,
    ASSIGN: (taskId: number | string) => `/api/tasks/${taskId}/assign`,
  },
  APPLICATIONS: {
    BASE: "/api/applications",
    ACCEPT: (applicationId: number | string) =>
      `/api/applications/accept/${applicationId}`,
    REJECT: (applicationId: number | string) =>
      `/api/applications/reject/${applicationId}`,
  },
  LEARNING: {
    CATEGORIES: "/api/learning-categories",
    TRACKS: "/api/learning-tracks",
    COURSES: "/api/courses",
    COURSE_BY_ID: (id: number | string) => `/api/courses/${id}`,
    MODULES: "/api/modules",
    LESSONS: "/api/lessons",
    LESSON_RESOURCES: "/api/lesson-resources",
    ENROLLMENTS: "/api/enrollments",
    USER_ENROLLMENTS: (userId: number | string) =>
      `/api/enrollments/user/${userId}`,
  },
  QUIZZES: {
    BASE: "/api/quizzes",
    BY_ID: (id: number | string) => `/api/quizzes/${id}`,
    QUESTIONS: "/api/quiz-questions",
    ATTEMPTS: "/api/quiz-attempts",
  },
  PROGRESS: {
    BASE: "/api/progress",
    USER: (userId: number | string) => `/api/progress/user/${userId}`,
    BY_ID: (id: number | string) => `/api/progress/${id}`,
    COURSE_PROGRESS: "/api/course-progress",
  },
  CERTIFICATES: {
    BASE: "/api/certificates",
    BY_ID: (id: number | string) => `/api/certificates/${id}`,
    USER: (userId: number | string) => `/api/certificates/user/${userId}`,
    VERIFY: (certificateNumber: string) =>
      `/api/certificates/verify/${certificateNumber}`,
  },
  NOTIFICATIONS: {
    BASE: "/api/notifications",
    USER: (userId: number | string) => `/api/notifications/user/${userId}`,
    MARK_READ: (notificationId: number | string) =>
      `/api/notifications/${notificationId}/read`,
    MARK_ALL_READ: (userId: number | string) =>
      `/api/notifications/user/${userId}/read-all`,
    BY_ID: (notificationId: number | string) =>
      `/api/notifications/${notificationId}`,
    TEST_EMAIL: "/api/notifications/test-email",
  },
  FILES: {
    UPLOAD: "/api/files/upload",
    BY_TEAM: (teamId: number | string) => `/api/files/team/${teamId}`,
    DOWNLOAD: (fileId: number | string) => `/api/files/${fileId}/download`,
    DELETE: (fileId: number | string) => `/api/files/${fileId}`,
  },
  ACTIVITIES: {
    USER: (userId: number | string) => `/api/activities/user/${userId}`,
    TEAM: (teamId: number | string) => `/api/activities/team/${teamId}`,
    PROJECT: (projectId: number | string) =>
      `/api/activities/project/${projectId}`,
  },
  AI: {
    CHAT: "/api/ai/chat",
  },
  MESSAGES: {
    HISTORY: (senderId: number | string, receiverId: number | string) =>
      `/api/messages/${senderId}/${receiverId}`,
  },
} as const;

// ============================================================================
// STANDARDIZED API ERROR FORMAT
// ============================================================================

export class ApiClientError extends Error {
  public status: number;
  public data?: unknown;

  constructor(message: string, status = 500, data?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.data = data;
  }
}

// ============================================================================
// REUSABLE AXIOS INSTANCE & INTERCEPTORS
// ============================================================================

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request Interceptor: Attach JWT Token Automatically
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Let browser/Axios set multipart boundary automatically for FormData
    if (config.data instanceof FormData && config.headers) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response Interceptor: Consistent Error Handling
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<{ message?: string; error?: string }>) => {
    const status = error.response?.status || 500;
    const serverMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "An unexpected network error occurred";

    if (status === 401) {
      // Clear expired or invalid token
      setAuthToken(null);
    }

    return Promise.reject(
      new ApiClientError(serverMessage, status, error.response?.data)
    );
  }
);

// ============================================================================
// GENERIC HTTP METHOD HELPERS (GET, POST, PUT, PATCH, DELETE)
// ============================================================================

export const http = {
  get: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await api.get<T>(url, config);
    return response.data;
  },

  post: async <T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    const response = await api.post<T>(url, data, config);
    return response.data;
  },

  put: async <T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    const response = await api.put<T>(url, data, config);
    return response.data;
  },

  patch: async <T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    const response = await api.patch<T>(url, data, config);
    return response.data;
  },

  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await api.delete<T>(url, config);
    return response.data;
  },
};

// ============================================================================
// 1. AUTHENTICATION SERVICE
// ============================================================================

export const authService = {
  register: (payload: {
    full_name: string;
    email: string;
    password: string;
    role: string;
  }) => http.post<AuthResponse>(API_ENDPOINTS.AUTH.REGISTER, payload),

  login: async (payload: { email: string; password: string }) => {
    const res = await http.post<AuthResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      payload
    );
    if (res.token) {
      setAuthToken(res.token);
    }
    return res;
  },

  getProfile: () => http.get<AuthResponse>(API_ENDPOINTS.AUTH.PROFILE),

  updateProfile: (payload: { full_name: string }) =>
    http.put<AuthResponse>(API_ENDPOINTS.AUTH.PROFILE, payload),

  logout: () => {
    setAuthToken(null);
  },
};

// ============================================================================
// 2. USERS & DASHBOARD SERVICE
// ============================================================================

export const userService = {
  getProfile: () => authService.getProfile(),

  updateProfile: (payload: { full_name: string }) =>
    authService.updateProfile(payload),

  getDashboard: (userId: number | string) =>
    http.get<ApiResponse<DashboardData> & DashboardData>(
      API_ENDPOINTS.DASHBOARD.USER(userId)
    ),
};

// ============================================================================
// 3. PROJECTS SERVICE
// ============================================================================

export const projectService = {
  getAllProjects: () =>
    http.get<{
      success: boolean;
      totalProjects?: number;
      projects: Project[];
      data?: Project[];
    }>(API_ENDPOINTS.PROJECTS.BASE),

  getMyProjects: () =>
    http.get<{
      success: boolean;
      totalProjects?: number;
      projects: Project[];
      data?: Project[];
    }>(`${API_ENDPOINTS.PROJECTS.BASE}/my-projects`),

  getProjectById: async (
    id: number | string
  ): Promise<{ success: boolean; project: Project; isOwner?: boolean }> => {
    const numericId = Number(id);
    const [allRes, myRes] = await Promise.allSettled([
      http.get<{ success: boolean; projects: Project[]; data?: Project[] }>(
        API_ENDPOINTS.PROJECTS.BASE
      ),
      http.get<{ success: boolean; projects: Project[]; data?: Project[] }>(
        `${API_ENDPOINTS.PROJECTS.BASE}/my-projects`
      ),
    ]);

    const allProjects =
      allRes.status === "fulfilled"
        ? allRes.value.projects || allRes.value.data || []
        : [];
    const myProjects =
      myRes.status === "fulfilled"
        ? myRes.value.projects || myRes.value.data || []
        : [];

    const myProjectIds = new Set(myProjects.map((p) => Number(p.id)));
    const found =
      allProjects.find((p) => Number(p.id) === numericId) ||
      myProjects.find((p) => Number(p.id) === numericId);

    if (!found) {
      throw new ApiClientError("Project not found", 404);
    }

    return {
      success: true,
      project: found,
      isOwner: myProjectIds.has(numericId),
    };
  },

  createProject: (payload: {
    title: string;
    description: string;
    tech_stack: string;
  }) =>
    http.post<{
      success: boolean;
      message: string;
      project: Project;
      data?: Project;
    }>(API_ENDPOINTS.PROJECTS.BASE, payload),

  updateProject: (
    id: number | string,
    payload: Partial<{ title: string; description: string; tech_stack: string }>
  ) =>
    http.put<{
      success: boolean;
      message: string;
      project: Project;
      data?: Project;
    }>(API_ENDPOINTS.PROJECTS.BY_ID(id), payload),

  deleteProject: (id: number | string) =>
    http.delete<ApiResponse>(API_ENDPOINTS.PROJECTS.BY_ID(id)),
};

// ============================================================================
// 4. TEAMS SERVICE
// ============================================================================

export const teamService = {
  getAllTeams: () =>
    http.get<ApiResponse<Team[]>>(API_ENDPOINTS.TEAMS.BASE),

  getTeamById: (teamId: number | string) =>
    http.get<{
      success: boolean;
      message?: string;
      data?: {
        team: Team;
        members: TeamMember[];
      };
      team?: Team;
      members?: TeamMember[];
    }>(API_ENDPOINTS.TEAMS.BY_ID(teamId)),

  createTeam: (payload: { project_id: number; team_name: string }) =>
    http.post<ApiResponse<Team>>(API_ENDPOINTS.TEAMS.BASE, payload),

  addTeamMember: (payload: {
    team_id: number;
    user_id: number;
    role?: string;
  }) => http.post<ApiResponse>(API_ENDPOINTS.TEAMS.MEMBERS, payload),

  removeTeamMember: (teamId: number | string, userId: number | string) =>
    http.delete<ApiResponse>(
      API_ENDPOINTS.TEAMS.REMOVE_MEMBER(teamId, userId),
      {
        data: { team_id: Number(teamId), user_id: Number(userId) },
      }
    ),

  assignTeamLead: (teamId: number | string, userId: number | string) =>
    http.put<ApiResponse>(API_ENDPOINTS.TEAMS.ASSIGN_LEAD(teamId, userId), {
      team_id: Number(teamId),
      new_lead_user_id: Number(userId),
    }),
};

// ============================================================================
// 5. TASKS SERVICE
// ============================================================================

export const taskService = {
  getTeamTasks: (teamId: number | string) =>
    http.get<ApiResponse<Task[]>>(API_ENDPOINTS.TASKS.BY_TEAM(teamId)),

  getTaskById: (taskId: number | string) =>
    http.get<ApiResponse<Task>>(API_ENDPOINTS.TASKS.BY_ID(taskId)),

  createTask: (payload: {
    team_id: number;
    title: string;
    description?: string;
    assigned_to?: number | null;
    priority?: TaskPriority;
    due_date?: string | null;
  }) => http.post<ApiResponse<Task>>(API_ENDPOINTS.TASKS.BASE, payload),

  updateTaskStatus: (taskId: number | string, status: TaskStatus) =>
    http.put<ApiResponse<Task>>(API_ENDPOINTS.TASKS.UPDATE_STATUS(taskId), {
      status,
    }),

  assignTask: (taskId: number | string, user_id: number | null) =>
    http.put<ApiResponse<Task>>(API_ENDPOINTS.TASKS.ASSIGN(taskId), {
      assigned_to: user_id,
      user_id,
    }),

  deleteTask: (taskId: number | string) =>
    http.delete<ApiResponse>(API_ENDPOINTS.TASKS.BY_ID(taskId)),
};

// ============================================================================
// 6. APPLICATIONS SERVICE
// ============================================================================

export const applicationService = {
  getApplications: () =>
    http.get<ApiResponse<Application[]> & { applications?: Application[] }>(
      API_ENDPOINTS.APPLICATIONS.BASE
    ),

  applyToProject: (payload: { project_id: number; message?: string }) =>
    http.post<ApiResponse<Application>>(
      API_ENDPOINTS.APPLICATIONS.BASE,
      payload
    ),

  acceptApplication: (applicationId: number | string) =>
    http.put<ApiResponse>(API_ENDPOINTS.APPLICATIONS.ACCEPT(applicationId)),

  rejectApplication: (applicationId: number | string) =>
    http.put<ApiResponse>(API_ENDPOINTS.APPLICATIONS.REJECT(applicationId)),
};

// ============================================================================
// 7. LEARNING SERVICE
// ============================================================================

export const learningService = {
  getCategories: () =>
    http.get<ApiResponse<LearningCategory[]>>(
      API_ENDPOINTS.LEARNING.CATEGORIES
    ),

  getTracks: () =>
    http.get<ApiResponse<LearningTrack[]>>(API_ENDPOINTS.LEARNING.TRACKS),

  getCourses: () =>
    http.get<ApiResponse<Course[]> & { courses?: Course[] }>(
      API_ENDPOINTS.LEARNING.COURSES
    ),

  getCourseById: (id: number | string) =>
    http.get<ApiResponse<Course> & { course?: Course }>(
      API_ENDPOINTS.LEARNING.COURSE_BY_ID(id)
    ),

  createCourse: (payload: Partial<Course>) =>
    http.post<ApiResponse<Course>>(API_ENDPOINTS.LEARNING.COURSES, payload),

  updateCourse: (id: number | string, payload: Partial<Course>) =>
    http.put<ApiResponse<Course>>(
      API_ENDPOINTS.LEARNING.COURSE_BY_ID(id),
      payload
    ),

  deleteCourse: (id: number | string) =>
    http.delete<ApiResponse>(API_ENDPOINTS.LEARNING.COURSE_BY_ID(id)),

  getModules: () =>
    http.get<ApiResponse<CourseModule[]>>(API_ENDPOINTS.LEARNING.MODULES),

  getModulesByCourse: (courseId: number | string) =>
    http.get<ApiResponse<CourseModule[]>>(
      `${API_ENDPOINTS.LEARNING.MODULES}/course/${courseId}`
    ),

  getLessons: () =>
    http.get<ApiResponse<Lesson[]>>(API_ENDPOINTS.LEARNING.LESSONS),

  getLessonsByModule: (moduleId: number | string) =>
    http.get<ApiResponse<Lesson[]>>(
      `${API_ENDPOINTS.LEARNING.LESSONS}/module/${moduleId}`
    ),

  getLessonResources: () =>
    http.get<ApiResponse>(API_ENDPOINTS.LEARNING.LESSON_RESOURCES),

  getResourcesByLesson: (lessonId: number | string) =>
    http.get<ApiResponse>(
      `${API_ENDPOINTS.LEARNING.LESSON_RESOURCES}/lesson/${lessonId}`
    ),

  enrollInCourse: (payload: { user_id: number; course_id: number }) =>
    http.post<ApiResponse>(API_ENDPOINTS.LEARNING.ENROLLMENTS, payload),

  getUserEnrollments: (userId: number | string) =>
    http.get<ApiResponse>(API_ENDPOINTS.LEARNING.USER_ENROLLMENTS(userId)),
};

// ============================================================================
// 8. QUIZZES SERVICE
// ============================================================================

export const quizService = {
  getAllQuizzes: () =>
    http.get<ApiResponse<Quiz[]>>(API_ENDPOINTS.QUIZZES.BASE),

  getQuizById: (id: number | string) =>
    http.get<ApiResponse<Quiz>>(API_ENDPOINTS.QUIZZES.BY_ID(id)),

  createQuiz: (payload: Partial<Quiz>) =>
    http.post<ApiResponse<Quiz>>(API_ENDPOINTS.QUIZZES.BASE, payload),

  getQuizQuestions: () =>
    http.get<ApiResponse>(API_ENDPOINTS.QUIZZES.QUESTIONS),

  getQuestionsByQuiz: (quizId: number | string) =>
    http.get<ApiResponse>(`${API_ENDPOINTS.QUIZZES.QUESTIONS}/quiz/${quizId}`),

  getQuizAttempts: () =>
    http.get<ApiResponse<QuizAttempt[]>>(API_ENDPOINTS.QUIZZES.ATTEMPTS),

  getUserQuizAttempts: (userId: number | string) =>
    http.get<ApiResponse<QuizAttempt[]>>(
      `${API_ENDPOINTS.QUIZZES.ATTEMPTS}/user/${userId}`
    ),

  submitQuizAttempt: (payload: {
    quiz_id: number;
    user_id: number;
    answers: { question_id: number; selected_option: string }[];
  }) =>
    http.post<{
      success: boolean;
      message?: string;
      result?: QuizAttempt;
      data?: QuizAttempt;
    }>(`${API_ENDPOINTS.QUIZZES.ATTEMPTS}/submit`, payload),
};

// ============================================================================
// 9. PROGRESS SERVICE
// ============================================================================

export const progressService = {
  getAllProgress: () => http.get<ApiResponse>(API_ENDPOINTS.PROGRESS.BASE),

  getUserProgress: (userId: number | string) =>
    http.get<ApiResponse>(API_ENDPOINTS.PROGRESS.USER(userId)),

  updateProgress: (payload: {
    user_id: number;
    lesson_id: number;
    status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
    progress_percent: number;
  }) => http.post<ApiResponse>(API_ENDPOINTS.PROGRESS.BASE, payload),

  deleteProgress: (id: number | string) =>
    http.delete<ApiResponse>(API_ENDPOINTS.PROGRESS.BY_ID(id)),

  getCourseProgress: () =>
    http.get<ApiResponse>(API_ENDPOINTS.PROGRESS.COURSE_PROGRESS),
};

// ============================================================================
// 10. CERTIFICATES SERVICE
// ============================================================================

export const certificateService = {
  getAllCertificates: () =>
    http.get<ApiResponse<Certificate[]>>(API_ENDPOINTS.CERTIFICATES.BASE),

  getUserCertificates: (userId: number | string) =>
    http.get<ApiResponse<Certificate[]>>(
      API_ENDPOINTS.CERTIFICATES.USER(userId)
    ),

  getCertificateById: (id: number | string) =>
    http.get<ApiResponse<Certificate>>(API_ENDPOINTS.CERTIFICATES.BY_ID(id)),

  generateCertificate: (payload: { user_id: number; course_id: number }) =>
    http.post<ApiResponse<Certificate>>(
      API_ENDPOINTS.CERTIFICATES.BASE,
      payload
    ),

  verifyCertificate: (certificateNumber: string) =>
    http.get<ApiResponse<Certificate>>(
      API_ENDPOINTS.CERTIFICATES.VERIFY(certificateNumber)
    ),
};

// ============================================================================
// 11. NOTIFICATIONS SERVICE
// ============================================================================

export const notificationService = {
  getUserNotifications: (userId: number | string) =>
    http.get<ApiResponse<NotificationItem[]>>(
      API_ENDPOINTS.NOTIFICATIONS.USER(userId)
    ),

  createNotification: (payload: {
    user_id: number;
    title: string;
    message: string;
    type?: string;
  }) =>
    http.post<ApiResponse<NotificationItem>>(
      API_ENDPOINTS.NOTIFICATIONS.BASE,
      payload
    ),

  markAsRead: (notificationId: number | string) =>
    http.put<ApiResponse<NotificationItem>>(
      API_ENDPOINTS.NOTIFICATIONS.MARK_READ(notificationId)
    ),

  markAllAsRead: (userId: number | string) =>
    http.put<ApiResponse>(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ(userId)),

  deleteNotification: (notificationId: number | string) =>
    http.delete<ApiResponse>(API_ENDPOINTS.NOTIFICATIONS.BY_ID(notificationId)),

  sendTestEmail: (payload: {
    to?: string;
    subject?: string;
    message?: string;
  }) =>
    http.post<ApiResponse>(API_ENDPOINTS.NOTIFICATIONS.TEST_EMAIL, payload),
};

// ============================================================================
// 12. FILES SERVICE (MULTIPART UPLOAD & BLOB DOWNLOAD SUPPORT)
// ============================================================================

export const fileService = {
  uploadFile: (teamId: number | string, file: File) => {
    const formData = new FormData();
    formData.append("team_id", String(teamId));
    formData.append("file", file);

    return http.post<ApiResponse<FileItem>>(
      API_ENDPOINTS.FILES.UPLOAD,
      formData
    );
  },

  getTeamFiles: (teamId: number | string) =>
    http.get<ApiResponse<FileItem[]>>(API_ENDPOINTS.FILES.BY_TEAM(teamId)),

  downloadFile: async (
    fileId: number | string,
    fallbackFileName = "download"
  ): Promise<void> => {
    const response = await api.get<Blob>(
      API_ENDPOINTS.FILES.DOWNLOAD(fileId),
      {
        responseType: "blob",
      }
    );

    const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = blobUrl;
    link.setAttribute("download", fallbackFileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  },

  deleteFile: (fileId: number | string) =>
    http.delete<ApiResponse>(API_ENDPOINTS.FILES.DELETE(fileId)),
};

// ============================================================================
// 13. ACTIVITIES SERVICE
// ============================================================================

export const activityService = {
  getUserActivities: (userId: number | string) =>
    http.get<ApiResponse<Activity[]>>(API_ENDPOINTS.ACTIVITIES.USER(userId)),

  getTeamActivities: (teamId: number | string) =>
    http.get<ApiResponse<Activity[]>>(API_ENDPOINTS.ACTIVITIES.TEAM(teamId)),

  getProjectActivities: (projectId: number | string) =>
    http.get<ApiResponse<Activity[]>>(
      API_ENDPOINTS.ACTIVITIES.PROJECT(projectId)
    ),
};

// ============================================================================
// 14. AI ASSISTANT & MESSAGES SERVICE
// ============================================================================

export const aiService = {
  chat: (message: string) =>
    http.post<{ success: boolean; message: string }>(API_ENDPOINTS.AI.CHAT, {
      message,
    }),
};

export const messageService = {
  getHistory: (senderId: number | string, receiverId: number | string) =>
    http.get<ApiResponse<ChatMessage[]>>(
      API_ENDPOINTS.MESSAGES.HISTORY(senderId, receiverId)
    ),
};

export type { User };
export default api;
