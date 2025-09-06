## Husky Search

Discover and explore UW courses with detailed information about credits, prerequisites, enrollment, and course content. Built with Next.js App Router, Tailwind CSS, Drizzle ORM, and Convex for background data tasks.

### Overview
- **Name**: Husky Search
- **Purpose**: Faster, human-centered way to search UW courses and explore majors
- **Description**: "Discover and explore UW courses with detailed information about credits, prerequisites, and course content."

### Key Features
- **Fast course search**: Type subject code and number (e.g., "CSE 142") to quickly find courses; fuzzy matching on subject letters and numeric code.
- **Homepage highlights**: Recent majors, top majors (by seat capacity), and top courses.
- **Majors index**: Browse and search academic programs; see count of available programs.
- **Program detail**: View a major’s popular courses and all courses grouped by level.
- **Course detail**: Mobile-first page with course header, prerequisites, enrollment stats, sessions, and CEC evaluations tab; quick links to MyPlan and DawgPath.
- **Global search bar**: Accessible from the header on all pages, with mobile and desktop variants.
- **Dark mode**: Theme toggle via next-themes.
- **Authentication**: Clerk sign-in; only `/profile` is protected by middleware, core browsing is public.
- **Analytics**: Vercel Analytics integrated.

### App Pages and Routes
- **`/` — Home**
  - Shows Recent Majors, Top Majors, and Top Courses.
  - Data fetched via server components and cached with `unstable_cache`.
- **`/majors` — Majors Index**
  - List of all programs with a search box (client-side filter by title/code).
  - Displays total number of available programs.
- **`/majors/[code]` — Program Detail**
  - Title, program metadata, and counts.
  - Sections: Popular Courses (horizontal list) and course grids grouped by level.
  - Back navigation to Majors.
- **`/courses/[id]` — Course Detail**
  - Header with subject code, number, credits, title, gen-ed badges, and external links.
  - Stats, sessions list, and a tab for CEC evaluations.
  - Skeleton states while loading data.
- **`/about` — About**
  - Project background, goals, and data sources.
- **`/sign-in` — Sign In**
  - Clerk-hosted sign-in component.

### API Routes
- **`GET /api/search?q=...&page=...`**
  - Returns `courses` matching the query.
  - Fuzzy logic: matches subject letters and optional 1–3 digit course numbers.
  - Default page size: 20.

### Data and Services
- **Database & ORM**: Postgres via Drizzle ORM (`lib/db/schema.ts`).
- **Course service** (`services/course-service.ts`):
  - `getCourses({ programCode?, limit, sortBy, withEnrollData })`
  - `getCourseDetailByCode(code)` — includes MyPlan detail, enrollment, and CEC data aggregation.
  - `search(keywords, { page, pageSize })` — fuzzy search over course codes/titles.
- **Program service** (`services/program-service.ts`):
  - `getAllPrograms()` — program list with course counts.
  - `getProgramByCode(code)` — detail for a specific subject/program.
- **Caching**: Server routes use `unstable_cache` to cache expensive queries (e.g., top majors, program details) with revalidation.
- **Data sources** (as used and cited in About): UW Course Catalog, MyPlan, DawgPath, UW Course Evaluation Catalog.

### Background Jobs (Convex)
- **Cron schedules** (`convex/crons.ts`): multiple frequencies trigger `internal.myplanScrapers.runCourseDetailCronJob` to keep course data fresh (1–24 hour intervals plus shorter for testing).
- **Auth helper** (`convex/auth.ts`): `isStudent` checks allowed UW email domains for student-only features (currently used for gating logic server-side if needed).

### Authentication and Middleware
- **Clerk** (`middleware.ts`):
  - Protects private routes via `clerkMiddleware` (currently only `/profile`).
  - Public routes include the home, majors, course pages, about, and search API.
- **UI**: `components/header-user.tsx` shows sign-in button when signed out and a user menu when signed in.

### UI and Navigation
- **Header** (`components/site-header.tsx`): main nav, theme toggle, global search input, feedback link, user menu.
- **Navigation items** from `config/site.ts`: Courses (`/`), Majors (`/majors`), About (`/about`).
- **Design system**: Tailwind CSS + Radix UI primitives; custom components under `components/ui/*`.

### Tech Stack
- Next.js App Router (React Server Components)
- React 19, TypeScript
- Tailwind CSS, next-themes
- Drizzle ORM (Postgres)
- Convex (cron/background tasks)
- Clerk (authentication)
- Vercel Analytics

### Development
- **Requirements**: Node.js, Postgres, environment variables.
- **Env vars**:
  - `DATABASE_URL` — required by Drizzle (`drizzle.config.ts`).
  - Clerk keys if enabling auth locally (see Clerk docs).
- **Commands** (uses pnpm denoted by lockfile; npm/yarn also work):
  - `pnpm dev` — start dev server
  - `pnpm build` — production build
  - `pnpm start` — start production server
  - `pnpm lint` / `pnpm lint:fix` — lint
  - `pnpm format:write` — Prettier write
  - `pnpm typecheck` — TypeScript check

### Project Structure (high level)
- `app/` — Next.js routes and pages (`/`, `/majors`, `/majors/[code]`, `/courses/[id]`, `/about`, `/sign-in`)
- `components/` — UI, layouts, page sections (course cards, program grids, charts)
- `services/` — server-side data services for courses and programs
- `config/` — site configuration (nav, external links)
- `lib/` — utilities, db schema, fonts
- `convex/` — cron and auth helpers for background scraping
- `scripts/` — Python tooling for data ingestion/sync (MyPlan, subjects, etc.)

### Notes and Limitations
- Program-level filtering UI exists in code but is currently disabled in the rendered page; grouping by level and popular courses are active.
- A "Courses by Credit" idea appears in services; no dedicated page is currently exposed in `app/`.
- Most pages are public; only `/profile` is protected by middleware.

### Credits
Built for the UW community. Data sources include UW Course Catalog, MyPlan, DawgPath, and CEC. Feedback link is available in the site header.
