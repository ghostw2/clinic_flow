# Graph Report - clinicflow  (2026-06-18)

## Corpus Check
- 136 files · ~51,138 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 845 nodes · 1696 edges · 62 communities (54 shown, 8 thin omitted)
- Extraction: 86% EXTRACTED · 14% INFERRED · 0% AMBIGUOUS · INFERRED: 239 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a22c5592`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Backend Request Handlers|Backend Request Handlers]]
- [[_COMMUNITY_Appointment & Notification Models|Appointment & Notification Models]]
- [[_COMMUNITY_Frontend Package Dependencies|Frontend Package Dependencies]]
- [[_COMMUNITY_Auth & Session Repository|Auth & Session Repository]]
- [[_COMMUNITY_Billing & Auth Middleware|Billing & Auth Middleware]]
- [[_COMMUNITY_App Layout & Context Providers|App Layout & Context Providers]]
- [[_COMMUNITY_Appointment Detail Sheet UI|Appointment Detail Sheet UI]]
- [[_COMMUNITY_Patient UI Components|Patient UI Components]]
- [[_COMMUNITY_Calendar & Appointments Page|Calendar & Appointments Page]]
- [[_COMMUNITY_Navigation & Dashboard Cards|Navigation & Dashboard Cards]]
- [[_COMMUNITY_Patient Data Layer|Patient Data Layer]]
- [[_COMMUNITY_API Client & Login|API Client & Login]]
- [[_COMMUNITY_Appointment Forms & Tabs|Appointment Forms & Tabs]]
- [[_COMMUNITY_Graphify Knowledge Graph Skill|Graphify Knowledge Graph Skill]]
- [[_COMMUNITY_Medical Records Data Layer|Medical Records Data Layer]]
- [[_COMMUNITY_TypeScript Configuration|TypeScript Configuration]]
- [[_COMMUNITY_Medical Record Model|Medical Record Model]]
- [[_COMMUNITY_Project Docs & Brand|Project Docs & Brand]]
- [[_COMMUNITY_Appointment Model|Appointment Model]]
- [[_COMMUNITY_Dashboard & Status|Dashboard & Status]]
- [[_COMMUNITY_Patient Model|Patient Model]]
- [[_COMMUNITY_Patient Detail Page|Patient Detail Page]]
- [[_COMMUNITY_Sidebar Navigation|Sidebar Navigation]]
- [[_COMMUNITY_Component Aliases Config|Component Aliases Config]]
- [[_COMMUNITY_Backend Bootstrap & Config|Backend Bootstrap & Config]]
- [[_COMMUNITY_User Model|User Model]]
- [[_COMMUNITY_Clinic Model|Clinic Model]]
- [[_COMMUNITY_Document Model|Document Model]]
- [[_COMMUNITY_Audit Log Model|Audit Log Model]]
- [[_COMMUNITY_Audit Log Repository|Audit Log Repository]]
- [[_COMMUNITY_Internationalization API|Internationalization API]]
- [[_COMMUNITY_2FA Pre-Auth Session|2FA Pre-Auth Session]]
- [[_COMMUNITY_Frontend Route Middleware|Frontend Route Middleware]]
- [[_COMMUNITY_Session Model|Session Model]]
- [[_COMMUNITY_Next.js Config|Next.js Config]]
- [[_COMMUNITY_Tailwind Config|Tailwind Config]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]

## God Nodes (most connected - your core abstractions)
1. `BadRequest()` - 34 edges
2. `InternalError()` - 32 edges
3. `OK()` - 26 edges
4. `cn()` - 25 edges
5. `useI18n()` - 23 edges
6. `NotFound()` - 17 edges
7. `useAuth()` - 17 edges
8. `useToast()` - 16 edges
9. `compilerOptions` - 15 edges
10. `Appointment` - 12 edges

## Surprising Connections (you probably didn't know these)
- `ClinicFlow App Icon (Blue Cross)` --conceptually_related_to--> `ClinicFlow`  [INFERRED]
  frontend/app/icon.svg → README.md
- `AppLayout()` --calls--> `useAuth()`  [INFERRED]
  frontend/app/(app)/layout.tsx → frontend/contexts/AuthContext.tsx
- `Frontend Docker Service` --conceptually_related_to--> `Next.js 14 Frontend`  [INFERRED]
  docker-compose.yml → README.md
- `Backend Docker Service` --conceptually_related_to--> `Go Gin Backend`  [INFERRED]
  docker-compose.yml → README.md
- `PostgreSQL Docker Service` --conceptually_related_to--> `PostgreSQL 16 Database`  [INFERRED]
  docker-compose.yml → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **ClinicFlow Three-Tier Service Architecture** — docker_compose_frontend_service, docker_compose_backend_service, docker_compose_postgres_service [EXTRACTED 1.00]
- **Graphify Parallel Extraction Pipeline (AST + Semantic)** — graphify_skill_ast_extraction, graphify_skill_semantic_extraction, graphify_skill_knowledge_graph_pipeline [EXTRACTED 1.00]
- **ClinicFlow Role-Based Access Control** — clinicflow_readme_role_admin, clinicflow_readme_role_doctor, clinicflow_readme_role_staff [EXTRACTED 1.00]

## Communities (62 total, 8 thin omitted)

### Community 0 - "Backend Request Handlers"
Cohesion: 0.25
Nodes (16): Context, Context, GetPatientAuditLog(), CreatePatientRequest, GetPatientsQuery, CreatePatient(), DeletePatient(), ExportPatient() (+8 more)

### Community 1 - "Appointment & Notification Models"
Cohesion: 0.07
Nodes (44): AppointmentFilters, Appointment, Time, UUID, Appointment, Notification, UUID, Appointment (+36 more)

### Community 2 - "Frontend Package Dependencies"
Cohesion: 0.04
Nodes (47): dependencies, axios, class-variance-authority, clsx, date-fns, @fullcalendar/core, @fullcalendar/daygrid, @fullcalendar/interaction (+39 more)

### Community 3 - "Auth & Session Repository"
Cohesion: 0.08
Nodes (41): Session, Time, User, UUID, Session, User, UUID, User (+33 more)

### Community 4 - "Billing & Auth Middleware"
Cohesion: 0.09
Nodes (29): HandlerFunc, Clinic, UUID, Clinic, UUID, UUID, UUID, Engine (+21 more)

### Community 5 - "App Layout & Context Providers"
Cohesion: 0.07
Nodes (32): inter, metadata, AuthProvider(), I18nContext, I18nContextValue, I18nProvider(), Language, Translations (+24 more)

### Community 6 - "Appointment Detail Sheet UI"
Cohesion: 0.09
Nodes (29): FormData, schema, MedicalRecordForm(), MedicalRecordFormData, schema, toFormDefaults(), patientsApi, Cell (+21 more)

### Community 7 - "Patient UI Components"
Cohesion: 0.08
Nodes (32): AppointmentFormProps, CalendarView(), CalendarViewProps, STATUS_COLORS, Props, AuthContext, AuthContextValue, documentsApi (+24 more)

### Community 8 - "Calendar & Appointments Page"
Cohesion: 0.20
Nodes (15): AppointmentDetailSheet(), AppointmentForm(), statusColor(), DialogDescription, Table, TableBody, TableCaption, TableCell (+7 more)

### Community 9 - "Navigation & Dashboard Cards"
Cohesion: 0.15
Nodes (19): NavbarProps, PatientCard(), PatientCardProps, formatDate(), formatDateTime(), formatTime(), getInitials(), Patient (+11 more)

### Community 10 - "Patient Data Layer"
Cohesion: 0.13
Nodes (27): Patient, UUID, MedicalRecord, MedicalRecordResponse, Patient, UUID, PatientResponse, CountPatients() (+19 more)

### Community 11 - "API Client & Login"
Cohesion: 0.13
Nodes (27): authApi, billingApi, FormData, schema, FormData, PLAN_STYLE, PlanInfo, schema (+19 more)

### Community 12 - "Appointment Forms & Tabs"
Cohesion: 0.29
Nodes (13): AppointmentsPage(), Navbar(), useAuth(), useI18n(), DashboardPage(), usePermissions(), PatientDetailPage(), LoginPage() (+5 more)

### Community 13 - "Graphify Knowledge Graph Skill"
Cohesion: 0.08
Nodes (23): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+15 more)

### Community 14 - "Medical Records Data Layer"
Cohesion: 0.22
Nodes (17): MedicalRecord, UUID, MedicalRecord, UUID, CreateMedicalRecord(), DeleteMedicalRecord(), GetMedicalRecordByID(), GetMedicalRecords() (+9 more)

### Community 15 - "TypeScript Configuration"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 16 - "Medical Record Model"
Cohesion: 0.21
Nodes (12): Appointment, AppointmentResponse, DB, DeletedAt, Time, User, UserResponse, UUID (+4 more)

### Community 17 - "Project Docs & Brand"
Cohesion: 0.22
Nodes (14): ClinicFlow App Icon (Blue Cross), ClinicFlow, Go Gin Backend, JWT HS256 Authentication, Next.js 14 Frontend, PostgreSQL 16 Database, Resend Email Service, Admin Role (+6 more)

### Community 18 - "Appointment Model"
Cohesion: 0.22
Nodes (12): DB, DeletedAt, Patient, PatientResponse, Time, User, UserResponse, UUID (+4 more)

### Community 19 - "Dashboard & Status"
Cohesion: 0.24
Nodes (11): AppointmentStatus, Appointment, Time, UUID, Appointment, UUID, CountAppointments(), GetUpcomingAppointments() (+3 more)

### Community 20 - "Patient Model"
Cohesion: 0.23
Nodes (11): Appointment, AppointmentResponse, DB, MedicalRecord, MedicalRecordResponse, Time, UUID, DeletedAt (+3 more)

### Community 21 - "Patient Detail Page"
Cohesion: 0.23
Nodes (16): Context, Context, Login(), Logout(), Me(), Refresh(), Register(), setSessionCookie() (+8 more)

### Community 22 - "Sidebar Navigation"
Cohesion: 0.14
Nodes (13): AppLayout(), NAV_ITEMS, NavContent(), Sidebar(), SidebarProps, SheetContent, SheetContentProps, SheetDescription (+5 more)

### Community 23 - "Component Aliases Config"
Cohesion: 0.15
Nodes (12): aliases, components, utils, rsc, $schema, style, tailwind, baseColor (+4 more)

### Community 24 - "Backend Bootstrap & Config"
Cohesion: 0.21
Nodes (9): main(), HandlerFunc, Config, getEnv(), Load(), autoMigrate(), Connect(), CORS() (+1 more)

### Community 25 - "User Model"
Cohesion: 0.27
Nodes (10): Clinic, DB, DeletedAt, Time, UUID, ClinicResponse, User, UsersToResponse() (+2 more)

### Community 26 - "Clinic Model"
Cohesion: 0.39
Nodes (6): DB, DeletedAt, Time, UUID, Clinic, ClinicResponse

### Community 27 - "Document Model"
Cohesion: 0.29
Nodes (5): DB, Time, User, UUID, AppointmentDocument

### Community 28 - "Audit Log Model"
Cohesion: 0.33
Nodes (4): DB, Time, UUID, AuditLog

### Community 29 - "Audit Log Repository"
Cohesion: 0.50
Nodes (4): AuditLog, UUID, CreateAuditLog(), GetAuditLogsForResource()

### Community 30 - "Internationalization API"
Cohesion: 0.50
Nodes (4): Context, GetLanguages(), GetTranslations(), languageInfo

### Community 31 - "2FA Pre-Auth Session"
Cohesion: 0.50
Nodes (3): Time, UUID, PreAuthSession

### Community 33 - "Session Model"
Cohesion: 1.00
Nodes (3): Time, UUID, Session

### Community 42 - "Community 42"
Cohesion: 0.21
Nodes (12): Context, Context, Context, BillingWebhook(), CreateCheckout(), CreatePortal(), GetPlans(), GetDashboardStats() (+4 more)

### Community 43 - "Community 43"
Cohesion: 0.21
Nodes (13): Context, Context, CreateUserRequest, CreateUser(), GetUsers(), APIErrorCode, ErrorResponse, Conflict() (+5 more)

### Community 44 - "Community 44"
Cohesion: 0.27
Nodes (12): AppointmentDocument, Context, UUID, DeleteDocument(), DownloadDocument(), ListDocuments(), UploadDocument(), CreateDocument() (+4 more)

### Community 45 - "Community 45"
Cohesion: 0.21
Nodes (10): colorMap, StatsCard(), StatsCardProps, dashboardApi, cn(), DashboardStats, Badge(), BadgeProps (+2 more)

### Community 46 - "Community 46"
Cohesion: 0.26
Nodes (9): Appointment, AppointmentResponse, DB, Time, UUID, Notification, NotificationResponse, NotificationStatus (+1 more)

### Community 47 - "Community 47"
Cohesion: 0.17
Nodes (9): AppointmentDetailSheetProps, DetailsForm, detailsSchema, DetailsTab(), DOC_TYPES, DocumentsTab(), STATUS_LABELS, STATUS_OPTIONS (+1 more)

### Community 48 - "Community 48"
Cohesion: 0.35
Nodes (10): Context, UUID, CreateMedicalRecordRequest, auditRecord(), CreateMedicalRecord(), DeleteMedicalRecord(), GetMedicalRecords(), UpdateMedicalRecord() (+2 more)

### Community 49 - "Community 49"
Cohesion: 0.31
Nodes (8): Context, CreateAppointment(), DeleteAppointment(), GetAppointments(), UpdateAppointment(), CreateAppointmentRequest, GetAppointmentsQuery, UpdateAppointmentRequest

### Community 50 - "Community 50"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 51 - "Community 51"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 52 - "Community 52"
Cohesion: 0.50
Nodes (3): Context, SendNotification(), SendNotificationRequest

### Community 53 - "Community 53"
Cohesion: 0.67
Nodes (3): UUID, LogAudit(), AuditInput

### Community 54 - "Community 54"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 55 - "Community 55"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 56 - "Community 56"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

## Knowledge Gaps
- **277 isolated node(s):** `graphify`, `Usage`, `What graphify is for`, `Step 0 - GitHub repos and multi-path merge (only if a URL or several paths)`, `Step 1 - Ensure graphify is installed` (+272 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `InternalError()` connect `Backend Request Handlers` to `Community 42`, `Community 43`, `Community 44`, `Community 48`, `Community 49`, `Community 52`, `Patient Detail Page`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Why does `BadRequest()` connect `Backend Request Handlers` to `Community 42`, `Community 43`, `Community 44`, `Community 48`, `Community 49`, `Community 52`, `Patient Detail Page`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `UploadDocument()` connect `Community 44` to `Backend Request Handlers`, `Appointment & Notification Models`, `Community 43`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Are the 31 inferred relationships involving `BadRequest()` (e.g. with `CreateAppointment()` and `DeleteAppointment()`) actually correct?**
  _`BadRequest()` has 31 INFERRED edges - model-reasoned connections that need verification._
- **Are the 29 inferred relationships involving `InternalError()` (e.g. with `DeleteAppointment()` and `GetAppointments()`) actually correct?**
  _`InternalError()` has 29 INFERRED edges - model-reasoned connections that need verification._
- **Are the 24 inferred relationships involving `OK()` (e.g. with `GetAppointments()` and `UpdateAppointment()`) actually correct?**
  _`OK()` has 24 INFERRED edges - model-reasoned connections that need verification._
- **What connects `graphify`, `Usage`, `What graphify is for` to the rest of the system?**
  _277 weakly-connected nodes found - possible documentation gaps or missing edges._