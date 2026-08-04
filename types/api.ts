/**
 * Backend API Types for K+N Finance Automation Platform
 * 
 * These types define the contract between the frontend and Django backend.
 * The backend must implement these interfaces for seamless integration.
 */

// =============================================================================
// Common Types
// =============================================================================

export type TrendDirection = "up" | "down" | "neutral";
export type UserRole = "admin" | "user" | "viewer";
export type UserStatus = "active" | "inactive";
export type FileStatus = "ready" | "processing" | "error";
export type ReportStatus = "ready" | "generating" | "error";
export type ReportType = "reconciliation" | "billing" | "analytics" | "custom";
export type ReportFormat = "pdf" | "xlsx" | "csv";
export type MessageRole = "user" | "assistant";
export type ActivityType = "invoice" | "report" | "upload" | "ai";
export type ActivityStatus = "success" | "pending" | "error";
export type AIModelStatus = "active" | "training" | "inactive";

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// =============================================================================
// Authentication
// =============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status?: UserStatus;
  lastActive?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// =============================================================================
// Dashboard
// =============================================================================

export interface StatCard {
  value: number | string;
  change: number;
  trend: TrendDirection;
}

export interface DashboardStats {
  invoicesProcessed: StatCard;
  activeWorkflows: StatCard;
  accuracy: StatCard;
  timeSaved: StatCard;
}

export interface ActivityDataPoint {
  name: string;
  invoices: number;
  automated: number;
}

export interface DashboardActivityResponse {
  data: ActivityDataPoint[];
}

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
  status: ActivityStatus;
}

export interface RecentActivityResponse {
  activities: Activity[];
}

// =============================================================================
// AI Engine
// =============================================================================

export interface AIModel {
  id: string;
  name: string;
  description: string;
  status: AIModelStatus;
  accuracy: number;
  lastTrained: string;
}

export interface AIModelsResponse {
  models: AIModel[];
}

export interface AIAnalyzeRequest {
  modelId: string;
  data: Record<string, unknown>;
  options?: {
    includeConfidence?: boolean;
    threshold?: number;
  };
}

export interface AIAnalysisResult {
  id: string;
  prediction: string;
  confidence: number;
  metadata?: Record<string, unknown>;
}

export interface AIAnalyzeResponse {
  results: AIAnalysisResult[];
}

// =============================================================================
// Chat
// =============================================================================

export interface ChatAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  attachments?: ChatAttachment[];
}

export interface SendMessageRequest {
  message: string;
  conversationId?: string | null;
  attachments?: ChatAttachment[];
}

export interface ChatHistoryResponse {
  messages: ChatMessage[];
  conversationId?: string;
}

// Chat streaming event types
export interface ChatStreamTextEvent {
  type: "text";
  content: string;
}

export interface ChatStreamDoneEvent {
  type: "done";
  conversationId: string;
}

export type ChatStreamEvent = ChatStreamTextEvent | ChatStreamDoneEvent;

// =============================================================================
// File Management
// =============================================================================

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  uploadedBy?: string;
  status: FileStatus;
}

export interface FilesListResponse extends PaginatedResponse<UploadedFile> {
  files: UploadedFile[];
}

export interface FileUploadResponse {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
}

// =============================================================================
// Data Tools
// =============================================================================

export type ConvertTargetFormat = "xlsx" | "csv" | "json";

export interface ConvertResponse {
  downloadUrl: string;
  fileName: string;
  expiresAt: string;
}

export interface CleanDataStats {
  rowsProcessed: number;
  rowsCleaned: number;
  errorsFound: number;
}

export interface CleanResponse {
  downloadUrl: string;
  fileName: string;
  stats: CleanDataStats;
}

export interface ValidationError {
  row: number;
  column: string;
  message: string;
}

export interface ValidateRequest {
  fileId: string;
  schemaId: string;
}

export interface ValidateResponse {
  valid: boolean;
  errors: ValidationError[];
}

// =============================================================================
// Reports
// =============================================================================

export interface Report {
  id: string;
  name: string;
  type: ReportType;
  status: ReportStatus;
  generatedAt: string;
  fileSize: number;
}

export interface ReportsListResponse {
  reports: Report[];
  total: number;
}

export interface GenerateReportRequest {
  type: string;
  parameters: Record<string, unknown>;
  format: ReportFormat;
}

export interface GenerateReportResponse {
  reportId: string;
  status: "queued";
  estimatedTime: number;
}

// =============================================================================
// Analytics
// =============================================================================

export interface TrendDataPoint {
  date: string;
  value: number;
}

export interface ProcessingStats {
  total: number;
  automated: number;
  manual: number;
  trend: TrendDataPoint[];
}

export interface AccuracyStats {
  current: number;
  previous: number;
  trend: TrendDataPoint[];
}

export interface EfficiencyStats {
  timeSaved: number;
  costSaved: number;
}

export interface AnalyticsOverviewResponse {
  processing: ProcessingStats;
  accuracy: AccuracyStats;
  efficiency: EfficiencyStats;
}

export type ChartType = 
  | "processing-trend"
  | "accuracy-trend"
  | "category-breakdown"
  | "user-activity";

// =============================================================================
// User Management
// =============================================================================

export interface UsersListResponse {
  users: User[];
}

export interface CreateUserRequest {
  email: string;
  name: string;
  role: UserRole;
  password: string;
}

export interface UpdateUserRequest {
  email?: string;
  name?: string;
  role?: UserRole;
  status?: UserStatus;
}

// =============================================================================
// WebSocket Events
// =============================================================================

export interface NotificationEvent {
  type: "notification";
  data: {
    id: string;
    title: string;
    message: string;
    timestamp: string;
  };
}

// =============================================================================
// API Client Configuration
// =============================================================================

export interface ApiConfig {
  baseUrl: string;
  token?: string;
}

/**
 * Helper type for API endpoints
 */
export interface ApiEndpoints {
  // Auth
  login: "/api/auth/login";
  logout: "/api/auth/logout";
  me: "/api/auth/me";
  
  // Dashboard
  dashboardStats: "/api/dashboard/stats";
  dashboardActivity: "/api/dashboard/activity";
  recentActivity: "/api/dashboard/recent-activity";
  
  // AI Engine
  aiModels: "/api/ai/models";
  aiAnalyze: "/api/ai/analyze";
  
  // Chat
  chatMessage: "/api/chat/message";
  chatHistory: "/api/chat/history";
  
  // Files
  files: "/api/files";
  fileUpload: "/api/files/upload";
  fileDownload: "/api/files/:id/download";
  fileDelete: "/api/files/:id";
  
  // Tools
  toolsConvert: "/api/tools/convert";
  toolsClean: "/api/tools/clean";
  toolsValidate: "/api/tools/validate";
  
  // Reports
  reports: "/api/reports";
  reportsGenerate: "/api/reports/generate";
  reportDownload: "/api/reports/:id/download";
  
  // Analytics
  analyticsOverview: "/api/analytics/overview";
  analyticsChart: "/api/analytics/charts/:chartType";
  
  // Users
  users: "/api/users";
  userById: "/api/users/:id";
}
