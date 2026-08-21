// Shared types for StudentVault
// Minimal set of types needed across the application

export enum UserRole {
  STUDENT = "STUDENT",
  FACULTY = "FACULTY",
  ADMIN = "ADMIN",
}

export enum ResourceStatus {
  DRAFT = "DRAFT",
  PENDING_REVIEW = "PENDING_REVIEW",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  ARCHIVED = "ARCHIVED",
}

export interface User {
  id: string;
  email: string;
  role: string;
  status: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudentProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  departmentId?: string;
  batchId?: string;
  semester?: number;
  enrollmentNumber?: string;
  skills: string[];
  interests: string[];
  bio?: string;
}

export interface FacultyProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  departmentId?: string;
  employeeId?: string;
  designation?: string;
  bio?: string;
}

// Academic types
export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface Batch {
  id: string;
  name: string;
  departmentId: string;
  startYear: number;
  endYear: number;
}

export interface Semester {
  id: string;
  batchId: string;
  number: number;
  isActive: boolean;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  departmentId: string;
  description?: string;
}

// Resource types - using strings instead of enums to avoid module resolution issues
export interface Resource {
  id: string;
  title: string;
  description?: string;
  status: string; // PENDING_REVIEW | APPROVED | REJECTED | ARCHIVED
  resourceType: string; // NOTES | PPT | ASSIGNMENT | etc.
  uploaderId: string;
  departmentId?: string;
  batchId?: string;
  semesterId?: string;
  subjectId?: string;
  topic?: string;
  year?: number;
  unit?: number;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  visibility: string; // batch | selected_batches | all
  viewCount: number;
  downloadCount: number;
  bookmarkCount: number;
  ratingAverage?: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
}

// Report types
export interface Report {
  id: string;
  reporterId: string;
  resourceId: string;
  reason: string;
  description?: string;
  status: string; // PENDING | REVIEWED | RESOLVED | DISMISSED
  reviewedBy?: string;
  reviewedAt?: string;
  resolution?: string;
  createdAt: string;
}

// Collection types
export interface Collection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionItem {
  id: string;
  collectionId: string;
  resourceId: string;
  note?: string;
  sortOrder: number;
  createdAt: string;
}

// Rating types
export interface Rating {
  id: string;
  userId: string;
  resourceId: string;
  score: number; // 1-5
  comment?: string;
  createdAt: string;
  updatedAt: string;
}