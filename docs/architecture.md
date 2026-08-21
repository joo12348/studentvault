# StudentVault — Architecture Document

## System Overview

StudentVault is a full-stack web application built as a modular monorepo. The frontend communicates with the backend API over HTTPS. The backend owns all business logic, authorization, and data access. Files are stored in S3-compatible object storage (MinIO for development, S3 for production).

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ Student  │ │ Faculty  │ │  Admin   │ │  Auth    │   │
│  │Dashboard │ │Dashboard │ │Dashboard │ │  Pages   │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTPS (REST API)
┌─────────────────────▼───────────────────────────────────┐
│                    API (NestJS)                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │   Auth   │ │Resources │ │  Admin   │ │  File    │   │
│  │  Module  │ │  Module  │ │  Module  │ │  Upload  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                │
│  │  Profile │ │Collection│ │  Search  │                │
│  │  Module  │ │  Module  │ │  Module  │                │
│  └──────────┘ └──────────┘ └──────────┘                │
└──────┬──────────────┬──────────────┬────────────────────┘
       │              │              │
┌──────▼──────┐ ┌─────▼──────┐ ┌────▼────────────┐
│ PostgreSQL  │ │   MinIO    │ │  Redis (future)  │
│  Database   │ │  (S3)      │ │  Cache/Jobs      │
└─────────────┘ └────────────┘ └─────────────────┘
```

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 14 (App Router) + TypeScript | SSR/CSR pages, forms, dashboards |
| UI | Tailwind CSS + shadcn/ui | Consistent, accessible components |
| API | NestJS + TypeScript | REST API, business logic, validation |
| Database | PostgreSQL 16 | Primary data store |
| ORM | Prisma | Type-safe database access, migrations |
| Object Storage | MinIO (dev) / AWS S3 (prod) | File storage |
| Cache | Redis (Phase 2) | Session cache, rate limiting |
| Auth | bcrypt + jose (JWT) | Password hashing, token-based auth |
| Validation | class-validator + Zod | Request validation |
| Testing | Jest + Supertest + Playwright | Unit, integration, E2E tests |
| Build | Turborepo | Monorepo build orchestration |
| Linting | ESLint + Prettier | Code quality, formatting |

## Monorepo Structure

```
studentvault/
├── apps/
│   ├── web/                     # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/             # App Router pages
│   │   │   ├── components/      # React components
│   │   │   ├── lib/             # Utilities, API client
│   │   │   ├── hooks/           # Custom React hooks
│   │   │   ├── types/           # TypeScript types
│   │   │   └── styles/          # Global styles
│   │   ├── public/              # Static assets
│   │   ├── next.config.js
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   └── api/                     # NestJS backend
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/        # Authentication
│       │   │   ├── users/       # User management
│       │   │   ├── resources/   # Resource CRUD
│       │   │   ├── files/       # File upload/download
│       │   │   ├── collections/ # Bookmarks & collections
│       │   │   ├── academics/   # Academic structure
│       │   │   ├── moderation/  # Resource moderation
│       │   │   └── analytics/   # Engagement analytics
│       │   ├── common/
│       │   │   ├── guards/      # Auth guards
│       │   │   ├── decorators/  # Custom decorators
│       │   │   ├── filters/     # Exception filters
│       │   │   ├── interceptors/# Logging, transformation
│       │   │   └── pipes/       # Validation pipes
│       │   ├── config/          # Configuration
│       │   ├── prisma/          # Prisma service
│       │   └── main.ts
│       ├── test/
│       ├── nest-cli.json
│       └── package.json
├── packages/
│   ├── shared-types/            # Shared DTOs, enums, schemas
│   │   ├── src/
│   │   │   ├── enums.ts
│   │   │   ├── resource.ts
│   │   │   ├── user.ts
│   │   │   └── validation.ts
│   │   └── package.json
│   ├── ui/                      # Shared UI components (Phase 2)
│   │   └── package.json
│   └── config/                  # Shared configs
│       ├── eslint/
│       ├── typescript/
│       └── prettier/
├── database/
│   ├── schema/
│   │   └── prisma/
│   │       ├── schema.prisma
│   │       └── migrations/
│   ├── seed/
│   │   ├── index.ts
│   │   ├── users.ts
│   │   ├── departments.ts
│   │   └── resources.ts
│   └── documentation/
│       └── er-diagram.md
├── infrastructure/
│   ├── local/
│   │   ├── docker-compose.yml   # PostgreSQL, MinIO, Redis
│   │   └── .env.example
│   └── deployment/
├── docs/
│   ├── product-requirements.md
│   ├── architecture.md
│   ├── permission-matrix.md
│   ├── api-contract.md
│   └── decisions/
├── .env.example
├── .gitignore
├── package.json                 # Root workspace config
├── turbo.json
├── tsconfig.base.json
└── README.md
```

## Data Flow: Resource Upload

```
1. Frontend: User selects file + fills metadata
2. Frontend → API: POST /api/v1/uploads/initiate
   { fileName, fileSize, mimeType, subjectId, semester, type }
3. API: Validates user role, file policy, metadata
4. API: Creates resource record (status: PENDING_REVIEW)
5. API → Frontend: { uploadUrl, resourceId, expiresAt }
6. Frontend → MinIO: PUT uploadUrl (direct upload)
7. Frontend → API: POST /api/v1/uploads/complete
   { resourceId, storageKey, checksum }
8. API: Verifies file exists, records metadata
9. API → Frontend: { resource: { id, status: "PENDING_REVIEW" } }
10. Admin reviews → Approves/Rejects
11. If approved: Resource becomes visible to authorized students
```

## Data Flow: Resource Download

```
1. Frontend: User clicks download
2. Frontend → API: GET /api/v1/resources/:id/download
3. API: Authenticates, authorizes, checks visibility
4. API: Creates download event
5. API → Frontend: { downloadUrl, expiresAt }
6. Frontend → MinIO: GET downloadUrl (signed URL)
7. File streams to user
```

## Security Boundaries

### Authentication

- Passwords hashed with bcrypt (cost factor 12)
- JWT access tokens (15-minute expiry)
- Refresh tokens stored in HttpOnly, Secure, SameSite=Lax cookies
- Session invalidation on password change

### Authorization

- Every API endpoint enforces role + ownership + relationship checks
- Frontend never trusts role from client-side storage for authorization
- Resource visibility determined server-side based on batch relationships

### File Security

- Signed URLs for downloads (15-minute expiry)
- File type validation (whitelist)
- File size limits enforced
- Private vault files never exposed via public URLs
- No direct storage URL exposure in API responses

### API Security

- Rate limiting on auth endpoints (5 attempts/15 min)
- CSRF protection via double-submit cookie pattern
- Input validation on all endpoints
- Parameterized queries (Prisma ORM)
- Request ID tracking for audit
- No sensitive data in error messages

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/studentvault

# Authentication
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your-refresh-secret
REFRESH_TOKEN_EXPIRES_IN=7d

# Object Storage
STORAGE_ENDPOINT=localhost:9000
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin
STORAGE_BUCKET=studentvault
STORAGE_USE_SSL=false

# Application
APP_URL=http://localhost:3000
API_URL=http://localhost:3001
NODE_ENV=development

# Redis (Phase 2)
# REDIS_URL=redis://localhost:6379
```

## Deployment Strategy

### Development

- Docker Compose for PostgreSQL, MinIO
- Local Next.js + NestJS dev servers
- Hot reload for both frontend and backend

### Production (Future)

- Frontend: Vercel or similar
- API: Railway, Render, or Docker on VPS
- Database: Managed PostgreSQL (Neon, Supabase, or AWS RDS)
- Object Storage: AWS S3 or Cloudflare R2
- CI/CD: GitHub Actions

## Monitoring (Phase 2)

- Structured logging (JSON)
- Request ID correlation
- Error tracking (Sentry)
- Health check endpoints
- Database connection monitoring
