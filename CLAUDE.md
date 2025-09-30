# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `bun dev` — Start Next.js development server
- `bun build` — Production build
- `bun start` — Start production server
- `bun preview` — Build and start production server

### Code Quality
- `bun lint` — Run ESLint
- `bun lint:fix` — Run ESLint with auto-fix
- `bun typecheck` — Run TypeScript type checking (no emit)
- `bun format:write` — Format code with Prettier
- `bun format:check` — Check code formatting with Prettier

### Database and Data
- `bun convex:export` — Export Convex database to temp/convex_export.zip

### Python Scripts (use `uv`)
- `uv run python -m scripts.module_name` — Run Python scripts in the scripts directory
- Example: `uv run python -m scripts.myplan_db_upload` — Upload MyPlan data to PostgreSQL
- See [scripts/README-course-updater.md](scripts/README-course-updater.md) for detailed script documentation

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 15 App Router with React 19, TypeScript, Tailwind CSS
- **Backend**: Dual database architecture:
  - **PostgreSQL** (via Drizzle ORM): Primary relational data store for courses, programs, and evaluations
  - **Convex**: Real-time data, background jobs, cron tasks, and embeddings
- **Authentication**: Clerk (only `/profile` is protected; most pages are public)
- **Styling**: Tailwind CSS with Radix UI primitives, next-themes for dark mode
- **Analytics**: Vercel Analytics

### Dual Database Architecture

This project uses **two separate databases** that serve different purposes:

1. **PostgreSQL (Drizzle ORM)** — Schema: [lib/db/schema.ts](lib/db/schema.ts)
   - Primary data store for the application's UI
   - Tables: `uw_courses`, `uw_programs`, `myplan_subject_areas`, `myplan_quarter_courses`, `course_cec_data`, etc.
   - Used by services in [services/](services/) directory
   - Configured via `DATABASE_URL` environment variable

2. **Convex** — Schema: [convex/schema.ts](convex/schema.ts)
   - Real-time features, background scraping, and data processing
   - Tables: `myplanCourses`, `myplanSubjects`, `cecCourses`, `dawgpathCourses`, `canvasCourses`, `kvStore`, etc.
   - Handles cron jobs, vector embeddings, and API integrations
   - Used by cron jobs and scrapers in [convex/](convex/) directory

**Important**: These databases are independent. Data syncing between them is handled by:
- Python scripts in [scripts/](scripts/) directory for batch uploads to Postgres
- Convex functions in [convex/](convex/) for background data collection

### Data Flow

1. **Background Data Collection** (Convex):
   - Cron jobs ([convex/crons.ts](convex/crons.ts)) trigger scrapers at various intervals
   - Scrapers fetch data from MyPlan, DawgPath, CEC, and Canvas
   - Data stored in Convex tables with indices for efficient querying

2. **Data Synchronization** (Python scripts):
   - Scripts in [scripts/](scripts/) read from Convex or external sources
   - Transform and upload data to PostgreSQL
   - Examples: `myplan_db_upload.py`, `update-course-title.py`, `compute_subject_ranks.py`
   - See [scripts/README-course-updater.md](scripts/README-course-updater.md) for detailed documentation

3. **Application Queries** (Services):
   - [services/course-service.ts](services/course-service.ts): Course search, detail, and filtering
   - [services/program-service.ts](services/program-service.ts): Program/major queries
   - Services query PostgreSQL using Drizzle ORM
   - Results cached with Next.js `unstable_cache` for performance

### Key Directories

- **[app/](app/)** — Next.js App Router pages and API routes
  - Route handlers use Server Components by default
  - `/api/search` provides course search API

- **[components/](components/)** — React components
  - `ui/` — Radix UI primitives and design system components
  - Course cards, search interfaces, charts, and layout components

- **[services/](services/)** — Server-side data access layer
  - Abstract database queries from routes
  - Handle data transformation and aggregation
  - All queries use PostgreSQL via Drizzle ORM

- **[lib/](lib/)** — Utilities and shared code
  - `db/` — Drizzle schema and database connection
  - Various utility functions for courses, GPA, sessions, etc.

- **[convex/](convex/)** — Convex backend functions
  - Scrapers: `myplanScrapers.ts`, `cecIndexScrapers.ts`, `dawgpathScrapers.ts`
  - Cron jobs: `crons.ts`
  - Data schemas and queries for Convex database

- **[scripts/](scripts/)** — Python data processing scripts
  - Course updaters, data synchronization, rank computation
  - See [scripts/README-course-updater.md](scripts/README-course-updater.md) for usage

### Search Implementation

Course search uses a fuzzy matching algorithm ([services/course-service.ts](services/course-service.ts)):
- Parses query into subject letters and optional course number
- Matches against subject codes (fuzzy letter matching)
- Filters by course number if provided (1-3 digits)
- Returns paginated results

Example queries:
- "CSE 142" → matches CSE 142
- "CS 14" → matches CSE/CSS courses starting with 14
- "MATH" → matches all MATH courses

### Caching Strategy

- Server routes use `unstable_cache` from Next.js
- Cache keys based on query parameters
- Revalidation periods vary by data volatility:
  - Course lists: 3600s (1 hour)
  - Program details: 7200s (2 hours)
  - Top/popular data: 1800s (30 minutes)

### Authentication & Authorization

- Clerk handles authentication
- Only `/profile` is protected by middleware ([middleware.ts](middleware.ts))
- All course browsing, search, and program pages are public
- `convex/auth.ts` provides `isStudent` helper to check UW email domains

## Important Notes

- **Do not commit secrets**: Check for `.env`, credentials files before committing
- **Type safety**: TypeScript strict mode is enabled but build errors are ignored (`ignoreBuildErrors: true`)
- **Data sources**: UW Course Catalog, MyPlan, DawgPath, Course Evaluation Catalog (cited in about page)
- **Mobile-first design**: Course detail pages optimized for mobile with responsive layouts
