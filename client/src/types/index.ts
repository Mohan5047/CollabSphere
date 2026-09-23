// ==========================================
// USER & AUTHENTICATION TYPES
// ==========================================

export type UserRole = "ADMIN" | "TEAM_LEAD" | "MEMBER" | "STUDENT" | "student" | "admin" | "team_lead" | "member";

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
  profile_picture?: string | null;
  created_at?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
  profile?: User;
}

// ==========================================
// PROJECT & TEAM TYPES
// ==========================================

export interface Project {
  id: number;
  title: string;
  description: string;
  tech_stack: string;
  owner_id?: number;
  owner_name?: string;
  owner_email?: string;
  status?: string;
  created_at?: string;
}

export interface Team {
  id: number;
  project_id: number;
  team_name: string;
  description?: string;
  project_title?: string;
  owner_id?: number;
  member_count?: number;
  members?: TeamMember[];
  created_at?: string;
}

export interface TeamMember {
  id?: number;
  member_id?: number;
  team_id?: number;
  user_id: number;
  role: string;
  joined_at?: string;
  full_name?: string;
  email?: string;
}

export interface Application {
  id: number;
  project_id: number;
  user_id: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | string;
  message?: string;
  full_name?: string;
  email?: string;
  title?: string;
  project_title?: string;
  applied_at?: string;
  created_at?: string;
}

// ==========================================
// TASK MANAGEMENT TYPES
// ==========================================

export type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export interface Task {
  id: number;
  team_id: number;
  assigned_to: number | null;
  assigned_user_name?: string;
  assigned_to_name?: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  created_at?: string;
}

// ==========================================
// FILE SHARING TYPES
// ==========================================

export interface FileItem {
  id: number;
  team_id: number;
  uploaded_by: number;
  uploaded_by_name?: string;
  original_name: string;
  stored_name?: string;
  file_path?: string;
  mime_type: string;
  file_size: string | number;
  created_at: string;
}

// ==========================================
// ACTIVITY TIMELINE TYPES
// ==========================================

export interface Activity {
  id: number;
  user_id: number;
  team_id: number | null;
  project_id: number | null;
  activity_type: string;
  description: string;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

// ==========================================
// NOTIFICATION & CHAT TYPES
// ==========================================

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface ChatMessage {
  id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  is_read: boolean;
  created_at: string;
}

// ==========================================
// LEARNING, QUIZZES & CERTIFICATES TYPES
// ==========================================

export interface LearningCategory {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
}

export interface LearningTrack {
  id: number;
  category_id: number;
  title: string;
  description?: string;
  level?: string;
  created_at?: string;
}

export interface Course {
  id: number;
  track_id?: number;
  category_id?: number;
  title: string;
  description?: string;
  instructor?: string;
  duration?: string;
  level?: string;
  progress_percentage?: number;
  created_at?: string;
}

export interface CourseModule {
  id: number;
  course_id: number;
  title: string;
  description?: string;
  module_order?: number;
  order_index?: number;
}

export interface Lesson {
  id: number;
  module_id: number;
  title: string;
  content?: string;
  video_url?: string;
  lesson_order?: number;
  order_index?: number;
  duration_minutes?: number;
  is_completed?: boolean;
}

export interface LessonResource {
  id: number;
  lesson_id: number;
  resource_type: "VIDEO" | "PDF" | "NOTES" | "CODE" | "LINK" | "YOUTUBE" | string;
  title?: string;
  resource_url: string;
  description?: string;
  created_at?: string;
}

export interface Quiz {
  id: number;
  course_id: number;
  title: string;
  description?: string;
  total_marks?: number;
  passing_marks?: number;
  passing_score?: number;
  created_at?: string;
}

export interface QuizQuestion {
  id: number;
  quiz_id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  marks?: number;
}

export interface QuizAttempt {
  id?: number;
  attempt_id?: number;
  quiz_id: number;
  quiz_title?: string;
  user_id?: number;
  score: number;
  total_marks?: number;
  percentage?: number;
  passed: boolean;
  completed_at?: string;
  attempted_at?: string;
  created_at?: string;
}

export interface Certificate {
  id: number;
  user_id: number;
  course_id: number;
  course_title?: string;
  certificate_number?: string;
  certificate_code?: string;
  full_name?: string;
  email?: string;
  issued_at?: string;
  created_at?: string;
}

// ==========================================
// DASHBOARD TYPES
// ==========================================

export interface DashboardStats {
  enrolled_courses?: number;
  completed_courses?: number;
  quizzes_attempted?: number;
  certificates_earned?: number;
  projects_count?: number;
  tasks_count?: number;
  [key: string]: number | undefined;
}

export interface DashboardData {
  user: User;
  stats: DashboardStats;
  courses: Course[];
  recent_quizzes: QuizAttempt[];
  certificates: Certificate[];
}

// ==========================================
// GENERIC API RESPONSE
// ==========================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  count?: number;
  data?: T;
}
