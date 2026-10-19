# Invita — Community Celebrations & Family Registry Platform

Invita is a modern, full-stack community management, family registry, and digital gathering platform. It empowers heritage communities, societies, and extended families to organize milestones, manage multi-generational family trees, issue bespoke digital invitations, coordinate guest RSVPs with catering breakdowns, broadcast live streams, and curate collaborative event media galleries.

---

## Table of Contents
- [Core Features](#core-features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [Switching Between Mock and Real API](#switching-between-mock-and-real-api)
- [Role-Based Access Control (RBAC) & Test Accounts](#role-based-access-control-rbac--test-accounts)
- [Project Architecture & Directory Structure](#project-architecture--directory-structure)
- [Testing Suite](#testing-suite)
  - [Unit Tests (Vitest)](#unit-tests-vitest)
  - [End-to-End Tests (Playwright)](#end-to-end-tests-playwright)
  - [Linting and Type Checking](#linting-and-type-checking)
- [Accessibility (a11y) & Responsive Design](#accessibility-a11y--responsive-design)

---

## Core Features

1. **Multi-Role Access Control (RBAC)**:
   - Granular permissions matrix supporting **Super Admin**, **Community Admin**, **Event Organizer**, **Family Head**, **Family Member**, and **Guest**.
   - UI elements and actions automatically show, hide, or disable based on role permissions (`<Can action="...">` and `can(role, action)`).
2. **Event & Gathering Lifecycle**:
   - Create and schedule physical or virtual events with location details, video conference links, capacity caps, and cover presets.
   - Live stream integration with YouTube embed validation, real-time status badges, and restricted broadcast access.
3. **Invitation & Bespoke Guest RSVP Flow**:
   - Issue multichannel invitations (Email and WhatsApp previews) with unique encrypted passcodes and personal tokens.
   - Public RSVP portal at `/rsvp/[token]` with zero login friction.
   - Interactive accept/decline response, headcount increments, culinary meal selections, and dietary accommodation notes.
   - Dynamic 1-click Google Calendar integration (`.ics` template link) and response modification support.
   - Robust invalid token and expired deadline states.
4. **Attendee Logistics & Analytics**:
   - Live metrics: Total invited, confirmed headcount, declined, and pending follow-ups.
   - Catering portion analytics per dish for banquet chefs and event planners.
   - Dual-layout attendee table: Full desktop table with search/filters, and clean responsive card layout for mobile screens (375px+).
   - Client-side data exports to **Excel (.xlsx)** and branded **PDF reports**.
5. **Interactive Family Tree Visualizer**:
   - Multi-generational genealogical canvas with generational tiering (Parents, Spouses/Core, Children, Extended Relatives).
   - Smooth pan, zoom, touch gesture support, and detail slide-out drawer.
6. **Collaborative Post-Event Media Gallery**:
   - Drag-and-drop media upload with real-time file validation (images/videos up to 50MB).
   - Fullscreen lightbox modal with left/right keyboard navigation, download triggers, and mobile swipe controls.

---

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **UI & React**: React 19, TypeScript 5
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Components**: Radix UI Primitives (`@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, etc.)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Forms & Validation**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **State Management & Server Cache**: [Zustand](https://zustand-demo.pmnd.rs/) + [TanStack Query v5](https://tanstack.com/query)
- **Charts & Visualization**: [Recharts](https://recharts.org/)
- **Exports**: `xlsx`, `jspdf`, `jspdf-autotable`
- **Testing**: [Vitest](https://vitest.dev/) (Unit tests) & [Playwright](https://playwright.dev/) (E2E browser tests)

---

## Getting Started

### 1. Prerequisites
- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **Package Manager**: `npm`

### 2. Installation
Clone the repository and install dependencies:

```bash
git clone https://github.com/your-username/invita.git
cd Invita
npm install --legacy-peer-deps
```

### 3. Running the Development Server
Start the local Next.js server with Turbopack:

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your web browser.

---

## Environment Configuration

Copy `.env.example` to create your local environment file:

```bash
cp .env.example .env.local
```

### Available Environment Variables:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_BASE_URL` | Base URL for remote REST API endpoints | `https://api.invita.app/v1` |
| `NEXT_PUBLIC_USE_MOCKS` | Master toggle: `true` for local in-memory mock engine, `false` for live backend API | `true` |

---

## Switching Between Mock and Real API

Invita features a decoupled service architecture located in [`/lib/api`](./lib/api):

- **Mock Layer (`lib/mock/store.ts`)**: An in-memory, stateful store pre-seeded with rich communities, families, members, events, invitations, and attendee RSVPs. Changes made during a session (creating events, submitting RSVPs, uploading media) persist in local memory and React Query cache.
- **Real Backend (`lib/api/client.ts`)**: A centralized HTTP client using `fetch` with automatic JWT header attachment, standard error transformation (`{ message, status, fieldErrors }`), 401 unauthenticated redirect, and 403 forbidden handling. Public RSVP routes automatically omit auth headers.

### To switch between modes:
1. Open `.env.local`.
2. Set `NEXT_PUBLIC_USE_MOCKS=true` to run fully self-contained offline.
3. Set `NEXT_PUBLIC_USE_MOCKS=false` and configure `NEXT_PUBLIC_API_BASE_URL` to route all queries and mutations to your real backend server.
4. Restart your Next.js dev server.

---

## Role-Based Access Control (RBAC) & Test Accounts

On the `/login` page, Invita provides 1-click test login buttons for every primary role:

| Role | Test Account Name | Email | Permissions & Capabilities |
| :--- | :--- | :--- | :--- |
| **Super Admin** | Elena Rostova | `elena.rostova@invita.org` | Full platform administration, system settings, global directory, audit logs. |
| **Community Admin** | Marcus Vance | `marcus.v@heritagehills.org` | Full community management, create events, manage family registry, send invitations. |
| **Event Organizer** | Sophia Chen | `sophia.chen@eventspark.com` | Create and edit celebrations, manage attendee rosters, configure live streams, upload media. |
| **Family Head** | David K. Thornton | `david.thornton@gmail.com` | View celebrations, manage immediate family registry and genealogical tree, submit collective RSVPs. |
| **Family Member** | Amara Patel | `amara.patel@gmail.com` | Personal calendar, view community events, RSVP to personal invitations, browse media gallery. |
| **Outside Guest** | Token Based | `N/A` | Public `/rsvp/[token]` portal access to confirm attendance, select meals, and export calendar events. |

---

## Project Architecture & Directory Structure

```text
├── app/                        # Next.js App Router pages and layouts
│   ├── (auth)/login/           # Sign-in portal with 1-click test role switcher
│   ├── admin/                  # Super Admin system settings and platform audit
│   ├── communities/            # Community directory and profiles
│   ├── dashboard/              # Role-tailored metrics and action items
│   ├── events/                 # Events list, category tabs, and filters
│   │   ├── [id]/               # Event detail, live stream card, reminder settings
│   │   │   ├── attendees/      # Attendee tracker, catering breakdown, PDF/Excel export
│   │   │   └── media/          # Post-event photo/video gallery with lightbox modal
│   │   └── page.tsx
│   ├── families/               # Household registries
│   │   └── [id]/tree/          # Interactive genealogical canvas & drawer
│   ├── members/                # Community member roster & directory
│   ├── rsvp/[token]/           # Public guest RSVP page (no login required)
│   ├── globals.css             # Tailwind v4 theme, animations, glassmorphism tokens
│   └── layout.tsx              # Root HTML layout with TanStack Query & Toast provider
├── components/
│   ├── community/              # Dialogs for creating communities, families, members
│   ├── events/                 # EventFormDialog, SendInvitationsDialog, InviteeModal, LiveStream
│   ├── family/                 # FamilyTreeCanvas, FamilyTreeDrawer
│   ├── shared/                 # PageHeader, DataTable, StatusBadge, ConfirmDialog, Can
│   ├── shell/                  # AppLayout, Sidebar (role navigation), Topbar, UserMenu
│   └── ui/                     # Accessible UI primitives (Button, Input, Dialog, Toast, Card)
├── hooks/                      # Custom hooks (useAuth, usePermission, useToast)
├── lib/
│   ├── api/                    # Modular API services (events, families, rsvps, invitations)
│   │   ├── client.ts           # Central HTTP client with JWT interceptor & error mapping
│   │   └── index.ts            # Dynamic router choosing between mock and real API
│   ├── export/                 # PDF generator (jspdf-autotable) & Excel generator (xlsx)
│   ├── mock/                   # In-memory store and rich seed fixtures
│   ├── permissions.ts          # Central permission matrix, can() helper, and role definitions
│   └── validations/            # Zod validation schemas & custom Zod v4 resolver
├── tests/
│   ├── unit/                   # Vitest unit test suites
│   │   ├── permissions.test.ts # Exhaustive role × action permission matrix tests (46 tests)
│   │   └── validations.test.ts # Zod schema validation tests (17 tests)
│   └── e2e/                    # Playwright end-to-end tests
│       ├── login.spec.ts       # Authentication, invalid email validation, quick role switch
│       ├── role-navigation.spec.ts # Restricted route visibility & button guards
│       ├── event-creation.spec.ts  # End-to-end event authoring & publication
│       └── rsvp-flow.spec.ts   # Guest RSVP accept, edit, Google Calendar, expired/invalid tokens
├── playwright.config.ts        # Playwright test runner configuration
├── vitest.config.mts           # Vitest configuration for unit test isolation
└── eslint.config.mjs           # ESLint flat config with Next.js Core Web Vitals
```

---

## Testing Suite

Invita features a comprehensive 2-tier testing pipeline covering both business logic validation and real browser end-to-end workflows.

### Unit Tests (Vitest)
Runs 63 unit tests across all roles, permission actions, and Zod validation schemas:

```bash
# Run unit tests once
npx vitest run

# Run unit tests in watch mode
npm run test:unit
```

### End-to-End Tests (Playwright)
Validates core browser user journeys on Chromium:
- **Login Flow**: Standard credentials validation, error alerts on malformed email, and 1-click test role switching.
- **Role-Based Navigation**: Verifies that restricted sidebar links (`/admin`, `/families`, `/rsvps`) and action triggers ("Create Event") are correctly blocked or hidden for lower-privilege roles.
- **Event Creation**: Community Admin signs in, launches the event dialog, fills in venue details and capacity, and verifies instant publication.
- **Guest RSVP Portal**:
  1. Opens personal invitation token `/rsvp/tok_pending_vance_01`.
  2. Submits attendance with guest count, meal choice, and dietary restrictions.
  3. Verifies Google Calendar `.ics` deep-link generation.
  4. Modifies response to "Regretfully Decline" and verifies updated state.
  5. Tests expired deadline notice on `/rsvp/tok_expired_blackwood_99`.
  6. Tests 404 security fallback on invalid token `/rsvp/invalid-token-xyz`.

```bash
# Install Playwright browser binaries (first time only)
npx playwright install chromium

# Run all Playwright tests
npx playwright test

# Run Playwright tests with UI debugger
npx playwright test --ui
```

### Linting and Type Checking
Verifies static type safety and code quality:

```bash
# TypeScript compiler check (zero errors)
npx tsc --noEmit

# ESLint check
npm run lint
```

---

## Accessibility (a11y) & Responsive Design

- **WCAG 2.1 AA Compliance**:
  - All form controls are explicitly associated with descriptive labels via matching `id` and `htmlFor` attributes.
  - Interactive elements have distinct visible focus indicators (`focus-visible:ring-2 focus-visible:ring-indigo-500`).
  - Accessible color contrast ratios maintained in both light and dark modes.
  - Dialogs built on Radix UI guarantee keyboard navigation (`Tab` cycling, `Escape` key close) and screen reader focus trapping.
  - Descriptive `alt` attributes on all avatar and celebration imagery.
- **Device Responsiveness**:
  - **Mobile (375px)**: Collapsible sidebar navigation, single-column summary cards, touch pan/pinch on family tree, and dedicated card view replacing dense tables.
  - **Tablet (768px)**: 2-column grid adaptation, collapsible navigation drawer, responsive modal dialogs.
  - **Desktop (1280px+)**: Multi-column dashboards, horizontal genealogical canvas, full tabular attendee rosters, and high-resolution media lightboxes.

---

## License

MIT © Invita Engineering.
