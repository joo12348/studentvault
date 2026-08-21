# StudentVault — API Contract (MVP)

Base URL: `/api/v1`

## Authentication

All endpoints require JWT Bearer token unless marked as public.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Standard Error Response:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "UNAUTHORIZED"
}
```

## Auth Endpoints

### POST /auth/register

**Public.** Register a new student account.

**Request:**
```json
{
  "email": "student@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "clx1234...",
    "email": "student@example.com",
    "role": "STUDENT",
    "status": "PENDING_VERIFICATION"
  },
  "message": "Registration successful. Please verify your email."
}
```

**Errors:**
- 409: Email already exists
- 400: Validation error (missing fields, weak password)

### POST /auth/login

**Public.** Authenticate and receive tokens.

**Request:**
```json
{
  "email": "student@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "clx1234...",
    "email": "student@example.com",
    "role": "STUDENT",
    "status": "ACTIVE"
  }
}
```

Sets `HttpOnly` cookie with refresh token. Access token in response body.

**Errors:**
- 401: Invalid credentials
- 403: Account inactive/suspended

### POST /auth/logout

**Authenticated.** Invalidate refresh token.

**Response (200):**
```json
{ "message": "Logged out successfully" }
```

### POST /auth/refresh

**Public** (uses refresh token cookie). Get new access token.

**Response (200):**
```json
{
  "accessToken": "eyJhbG..."
}
```

**Errors:**
- 401: Refresh token invalid or expired

### POST /auth/forgot-password

**Public.** Send password reset email.

**Request:**
```json
{ "email": "student@example.com" }
```

**Response (200):**
```json
{ "message": "If the email exists, a reset link has been sent." }
```

### POST /auth/reset-password

**Public.** Reset password with token.

**Request:**
```json
{
  "token": "reset-token-here",
  "newPassword": "NewSecurePass123!"
}
```

**Response (200):**
```json
{ "message": "Password reset successful." }
```

---

## User/Profile Endpoints

### GET /me

**Authenticated.** Get current user profile.

**Response (200):**
```json
{
  "id": "clx1234...",
  "email": "student@example.com",
  "role": "STUDENT",
  "status": "ACTIVE",
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "avatarUrl": null,
    "department": { "id": "clx...", "name": "Computer Science" },
    "batch": { "id": "clx...", "name": "CSE-A 2022-2026" },
    "semester": 5,
    "enrollmentNumber": "CS2022001",
    "skills": ["JavaScript", "Python"],
    "interests": ["Web Development", "AI"],
    "bio": "Computer Science student"
  }
}
```

### PATCH /me

**Authenticated.** Update current user profile.

**Request (partial):**
```json
{
  "firstName": "John",
  "lastName": "Doe Updated",
  "phone": "+1234567890",
  "skills": ["JavaScript", "Python", "React"],
  "interests": ["Web Development"],
  "bio": "Updated bio"
}
```

**Response (200):** Updated profile object.

### GET /students/:id

**Faculty/Admin.** Get student profile by ID.

**Authorization:** Faculty must be assigned to student's batch.

**Response (200):** Student profile (limited fields for faculty).

### GET /faculty/me

**Faculty.** Get faculty profile.

**Response (200):**
```json
{
  "id": "clx...",
  "firstName": "Dr. Jane",
  "lastName": "Smith",
  "department": { "id": "clx...", "name": "Computer Science" },
  "employeeId": "FAC001",
  "designation": "Professor",
  "assignedBatches": [...],
  "assignedSubjects": [...]
}
```

---

## Academic Structure Endpoints

### GET /departments

**Authenticated.** List all departments.

**Response (200):**
```json
{
  "departments": [
    { "id": "clx...", "name": "Computer Science", "code": "CS" }
  ]
}
```

### GET /batches

**Authenticated.** List batches, optionally filtered by department.

**Query:** `?departmentId=clx...`

### GET /semesters

**Authenticated.** List semesters, optionally filtered by batch.

**Query:** `?batchId=clx...`

### GET /subjects

**Authenticated.** List subjects, optionally filtered by department/semester.

**Query:** `?departmentId=clx...&semesterId=clx...`

### POST /departments (Admin)

### POST /batches (Admin)

### POST /subjects (Admin)

**Admin CRUD for academic structure.** Same patterns as GET endpoints.

---

## Resource Endpoints

### GET /resources

**Authenticated.** List approved resources visible to user.

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20, max: 50)
- `search` - Full-text search on title, description
- `subjectId` - Filter by subject
- `semesterId` - Filter by semester
- `resourceType` - Filter by type (NOTES, PPT, etc.)
- `departmentId` - Filter by department
- `year` - Filter by academic year
- `topic` - Filter by topic
- `sortBy` - relevance | newest | rating | downloads
- `uploaderType` - student | faculty

**Response (200):**
```json
{
  "resources": [
    {
      "id": "clx...",
      "title": "DBMS Notes - Unit 1",
      "description": "Complete notes for DBMS Unit 1",
      "resourceType": "NOTES",
      "status": "APPROVED",
      "subject": { "id": "clx...", "name": "Database Management Systems" },
      "semester": { "id": "clx...", "number": 5 },
      "uploader": {
        "id": "clx...",
        "role": "FACULTY",
        "profile": { "firstName": "Dr. Jane", "lastName": "Smith" }
      },
      "department": { "id": "clx...", "name": "Computer Science" },
      "fileName": "dbms-unit1-notes.pdf",
      "fileSize": 2048576,
      "mimeType": "application/pdf",
      "topic": "ER Model",
      "unit": 1,
      "year": 3,
      "viewCount": 120,
      "downloadCount": 45,
      "ratingAverage": 4.2,
      "ratingCount": 15,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### GET /resources/:id

**Authenticated.** Get resource details. Records view event.

**Response (200):** Full resource object with subject, uploader, ratings.

### POST /resources

**Authenticated (Student/Faculty/Admin).** Create a new resource.

**Request:**
```json
{
  "title": "DBMS Notes - Unit 1",
  "description": "Complete notes for DBMS Unit 1",
  "resourceType": "NOTES",
  "subjectId": "clx...",
  "semesterId": "clx...",
  "departmentId": "clx...",
  "batchId": "clx...",
  "topic": "ER Model",
  "unit": 1,
  "year": 3,
  "storageKey": "uploads/clx.../dbms-unit1.pdf",
  "fileName": "dbms-unit1-notes.pdf",
  "fileSize": 2048576,
  "mimeType": "application/pdf",
  "checksum": "sha256:abc123..."
}
```

**Response (201):**
```json
{
  "resource": {
    "id": "clx...",
    "title": "DBMS Notes - Unit 1",
    "status": "PENDING_REVIEW", // or "APPROVED" for faculty/admin
    ...
  }
}
```

### PATCH /resources/:id

**Owner/Admin.** Update resource metadata.

### DELETE /resources/:id

**Owner/Admin.** Soft-delete (archive) resource.

### GET /resources/:id/download

**Authenticated.** Get signed download URL.

**Response (200):**
```json
{
  "downloadUrl": "https://minio.../signed-url",
  "expiresAt": "2024-01-15T10:45:00Z"
}
```

---

## Upload Endpoints

### POST /uploads/initiate

**Authenticated.** Begin upload process.

**Request:**
```json
{
  "fileName": "dbms-unit1-notes.pdf",
  "fileSize": 2048576,
  "mimeType": "application/pdf"
}
```

**Response (201):**
```json
{
  "uploadId": "clx...",
  "uploadUrl": "https://minio.../presigned-url",
  "storageKey": "uploads/clx.../abc123.pdf",
  "expiresAt": "2024-01-15T10:45:00Z"
}
```

### POST /uploads/complete

**Authenticated.** Confirm upload completed.

**Request:**
```json
{
  "uploadId": "clx...",
  "checksum": "sha256:abc123..."
}
```

**Response (200):**
```json
{
  "message": "Upload completed successfully"
}
```

---

## Bookmark Endpoints

### POST /resources/:id/bookmark

**Authenticated (Student).** Bookmark a resource.

**Response (201):**
```json
{ "message": "Resource bookmarked" }
```

### DELETE /resources/:id/bookmark

**Authenticated (Student).** Remove bookmark.

### GET /bookmarks

**Authenticated (Student).** List user's bookmarks.

**Query:** `?page=1&limit=20`

---

## Collection Endpoints

### GET /collections

**Authenticated (Student).** List user's collections.

### POST /collections

**Authenticated (Student).** Create collection.

**Request:**
```json
{
  "name": "DBMS Exam Prep",
  "description": "Resources for DBMS exam",
  "isPublic": false
}
```

### PATCH /collections/:id

**Owner.** Update collection.

### DELETE /collections/:id

**Owner.** Delete collection and all items.

### POST /collections/:id/items

**Owner.** Add resource to collection.

**Request:**
```json
{
  "resourceId": "clx...",
  "note": "Important for final exam"
}
```

### DELETE /collections/:id/items/:resourceId

**Owner.** Remove resource from collection.

---

## Rating Endpoints

### POST /resources/:id/rating

**Authenticated (Student).** Rate a resource (max one per user).

**Request:**
```json
{
  "score": 4,
  "comment": "Very helpful notes"
}
```

### PATCH /resources/:id/rating

**Owner.** Update rating.

### DELETE /resources/:id/rating

**Owner.** Delete rating.

---

## Report Endpoints

### POST /resources/:id/report

**Authenticated.** Report a resource.

**Request:**
```json
{
  "reason": "incorrect",
  "description": "Contains incorrect information about..."
}
```

---

## Share Endpoints

### POST /resources/:id/share

**Authenticated.** Create shareable link.

**Response (201):**
```json
{
  "shareCode": "abc123xyz",
  "shareUrl": "http://localhost:3000/shared/abc123xyz",
  "expiresAt": "2024-02-15T10:30:00Z"
}
```

### GET /shared/:code

**Authenticated.** Access shared resource.

---

## Faculty-Specific Endpoints

### GET /faculty/resources

**Faculty.** List resources uploaded by current faculty.

### GET /faculty/resources/:id/engagement

**Faculty.** Get engagement metrics for own resource.

**Response (200):**
```json
{
  "resourceId": "clx...",
  "totalViews": 120,
  "uniqueViewers": 85,
  "totalDownloads": 45,
  "uniqueDownloaders": 40,
  "bookmarks": 30,
  "ratingAverage": 4.2,
  "ratingCount": 15,
  "viewsByBatch": [
    { "batchId": "clx...", "batchName": "CSE-A", "views": 60 }
  ],
  "recentActivity": [
    { "type": "view", "count": 5, "date": "2024-01-15" }
  ]
}
```

### GET /faculty/batches/:id/engagement

**Faculty.** Get aggregate engagement for a batch.

### GET /faculty/students

**Faculty.** List students in assigned batches.

---

## Admin Endpoints

### GET /admin/users

**Admin.** List all users with filters.

**Query:** `?role=STUDENT&status=ACTIVE&departmentId=clx...&page=1&limit=20`

### POST /admin/users

**Admin.** Create user account.

### PATCH /admin/users/:id

**Admin.** Update user status, role.

### POST /admin/users/:id/activate

### POST /admin/users/:id/deactivate

### GET /admin/moderation

**Admin.** List resources pending review.

**Query:** `?page=1&limit=20`

### POST /admin/resources/:id/approve

**Admin.** Approve a resource.

**Response (200):**
```json
{
  "resource": { "id": "clx...", "status": "APPROVED" },
  "message": "Resource approved"
}
```

### POST /admin/resources/:id/reject

**Admin.** Reject a resource.

**Request:**
```json
{
  "reason": "Duplicate content"
}
```

### GET /admin/reports

**Admin.** List reported resources.

### PATCH /admin/reports/:id

**Admin.** Update report status.

**Request:**
```json
{
  "status": "RESOLVED",
  "resolution": "Resource removed"
}
```

### GET /admin/analytics

**Admin.** Platform-wide statistics.

**Response (200):**
```json
{
  "totalStudents": 500,
  "totalFaculty": 30,
  "totalResources": 1200,
  "pendingModeration": 15,
  "totalDownloads": 5000,
  "totalViews": 25000,
  "activeUsersToday": 120,
  "resourcesByType": [
    { "type": "NOTES", "count": 400 }
  ],
  "uploadsByMonth": [
    { "month": "2024-01", "count": 150 }
  ]
}
```

### CRUD /admin/departments
### CRUD /admin/batches
### CRUD /admin/subjects
### CRUD /admin/categories

**Admin.** Full CRUD for academic structure and categories.

---

## Response Format

**Success:**
```json
{
  "data": { ... }
}
```

or for single objects:
```json
{
  "resource": { ... }
}
```

**Error:**
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "VALIDATION_ERROR",
  "details": [
    { "field": "email", "message": "Invalid email format" }
  ]
}
```

**Pagination:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict (duplicate) |
| 413 | File Too Large |
| 415 | Unsupported Media Type |
| 429 | Rate Limited |
| 500 | Internal Server Error |
