# StudentVault — MVP Product Requirements

## Vision

StudentVault is a centralized student digital ecosystem where students discover, organize, upload, share, and manage academic resources, personal documents, achievements, academic information, performance data, and library status in one secure platform.

## MVP Scope

The MVP delivers the core resource discovery and contribution loop with foundational authentication, academic structure, and basic dashboards. It does NOT include personal vault, achievements, assignments, performance analytics, recommendations, or library operations.

### Actors

| Role | MVP Access |
|------|------------|
| Student | Register, login, manage profile, browse/search/download resources, upload resources, bookmark, create collections, rate resources, report resources, view basic dashboard |
| Faculty | Login, manage profile, upload official resources, publish to batches, view engagement metrics, view authorized student activity |
| Admin | Login, manage users, manage academic structure, moderate resources, manage categories, view platform analytics |

### MVP Features

| Priority | Feature | Use Cases |
|----------|---------|-----------|
| P0 | Authentication & roles | 1, 21, 34 |
| P0 | Academic structure | 37, 38, 39 |
| P0 | Resource upload & moderation | 6, 40, 23, 26 |
| P0 | Resource discovery & download | 5, 7, 8 |
| P0 | Bookmarks & collections | 9, 10, 11 |
| P0 | Resource reporting | 12, 43 |
| P0 | Admin user management | 35, 36, 42 |
| P1 | Student profile management | 2 |
| P1 | Faculty resource publishing | 24, 25 |
| P1 | Faculty engagement dashboard | 27, 28, 29, 30, 32, 33 |
| P1 | Admin dashboard & analytics | 44, 45, 46, 47 |
| P1 | Basic student dashboard | 3 (without GPA/performance) |
| P2 | Resource sharing | 11 |
| P2 | Category management | 41 |

### MVP Out of Scope

- Personal vault (UC 13)
- Certificate & achievement management (UC 14)
- Assignment & deadline management (UC 15)
- Performance dashboard and analytics (UC 16, 17)
- Library status and operations (UC 18, 48-54)
- Resource recommendations (UC 19)
- Report downloads (UC 20)
- Email/push notifications

## Product Decisions (MVP)

### Institution Model

Single institution per deployment. No multi-tenancy in MVP. Each StudentVault instance serves one college.

### Identity

Students self-register with email + password. Admin can also create accounts. Email verification is required before full access. No college-email restriction in MVP.

### Academic Data

Admin enters GPA, attendance, and arrears data. Students view read-only. Data is not imported from external systems.

### Resource Ownership

- Students own their uploaded resources. They can edit metadata or delete their own resources.
- Faculty own their uploaded resources. They can edit or delete.
- Admin can edit, approve, reject, archive, or restore any resource.
- Approved student resources are visible to the student's batch. Approved faculty resources are visible to the faculty's assigned batches.

### Moderation

Student uploads begin in PENDING_REVIEW status. They become visible only to the uploader until an admin approves them. Faculty uploads are auto-approved (faculty are trusted). Admin uploads are auto-approved.

### Visibility

- Resources have batch-level visibility by default (visible to students in the same batch as the uploader's assigned batch).
- Faculty can publish to specific batches.
- Admin can make resources visible to all students.

### Sharing

Internal sharing only. Sharing creates a shareable link within the platform. No external links or email sharing in MVP.

### Ratings

Users can rate once per resource after viewing the resource detail. Ratings can be changed. Only approved users can rate.

### File Policy

- Allowed types: PDF, PPT, PPTX, DOC, DOCX, TXT, ZIP, RAR, JPG, PNG
- Max size: 50 MB per file
- Files stored in S3-compatible storage (MinIO for development)
- Signed URLs for downloads (expire in 15 minutes)
- No virus scanning in MVP (future consideration)
- No preview generation in MVP (future consideration)

## Main User Journeys

### Student: Resource Discovery

```
Login → Dashboard → Search/Filter Resources → View Resource Details → Download / Bookmark / Add to Collection / Rate
```

### Student: Resource Contribution

```
Login → Upload Resource → Fill Metadata → Submit → (PENDING_REVIEW) → Admin Approves → Visible to Batch
```

### Faculty: Resource Publishing

```
Login → Upload Official Resource → Fill Metadata → Select Batches → Publish → (Auto-approved) → Visible to Selected Batches
```

### Admin: Moderation

```
Login → View Pending Resources → Review → Approve/Reject → (Audit Log Entry)
```

## Definition of Done

A feature is complete when:

- Database model and migration exist
- API endpoints with validation, auth, and authorization
- Frontend screens with loading, empty, error, and success states
- Unit tests for business logic
- Integration tests for API endpoints
- Manual testing of the user journey
- No authorization bypasses
- Responsive design
- No hardcoded secrets
