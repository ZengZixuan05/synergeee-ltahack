# AGENTS.md — Project Memory & Agent Context

> **Project**: JourneyAheadSG — Smart Commuter Companion for Singapore  
> **Repository**: [ZengZixuan05/synergeee-ltahack](https://github.com/ZengZixuan05/synergeee-ltahack.git)  
> **Target Audience for this document**: AI Coding Agents (Antigravity, Cursor, Claude, ChatGPT, Copilot) and Human Developers.  
> **Last Updated**: September 2026 (Map & Directions: real MapLibre GL JS map on an OpenStreetMap base with live OneMap place search, replacing the static map preview; required removing `output: 'export'` since the OneMap proxy needs a Node server — see README "Known limitations")

---

## 1. Project Mission & Core Philosophy

**JourneyAheadSG** is a **general commuter application** for Singapore public transport users. While standard transit apps broadcast generic network alerts (e.g., *"East-West Line track fault"*), JourneyAheadSG delivers **personalised, proactive journey recommendations** when transport conditions change.

### The Golden Rule
> **"Do not tell commuters only what happened. Tell them what they should do."**

---

## 2. Demonstration Persona: Mdm Lim

The primary hackathon demonstration persona is **Mdm Lim**:
- **Residence**: Sky Eden @ Bedok
- **Destination**: Singapore General Hospital (SGH) Specialist Outpatient Clinic
- **Routine**: Every alternate Monday, must arrive before **10:00 AM**
- **Mobility Constraints**:
  - Walks at a leisurely pace (~3 km/h)
  - **Avoids stairs** (requires 100% step-free / barrier-free routes)
  - **Requires working lifts** (alerts if concourse or platform lift is out of order)
  - **Prefers sheltered walking** against rain and heat
  - Wants minimum walking distance and simple transfers
  - Uses **larger text** (Standard / Large / Extra Large)
  - **Will not improvise a reroute while traveling**—decisions must be presented in advance with clear trade-offs.

---

## 3. Prototype Scope & Roadmap

### ✅ Current Implementation
- **Authentication**: Firebase Authentication (strict Email + Password only). Protected route guarding (`AuthGuard`), session restoration, and password reset. Screens: `/login`, `/signup`, `/forgot-password`.
- **Persistence**: Cloud Firestore (`users/{uid}`) storing commuter profile, preferences, and saved regular routes. Never stores passwords.
- **Onboarding**: 6-step commuter onboarding wizard (`/onboarding`) — Journey Priorities, Accessibility, Walking, Display & Language, **Regular Routes**, Summary.
- **Saved Journeys (Regular Routes)**: Step 5 of onboarding and the Profile "My Journeys" section both use one shared **reusable 4-step journey editor** (`src/components/journey-editor/JourneyEditor.tsx`: Journey → Schedule → Usual route → Review) to add/edit named journeys (e.g. "SGH Appointment"). Skippable in onboarding; optional everywhere.
  - **Schedule**: a strongly-typed `JourneySchedule` discriminated union (`src/types/journey.ts`) supports one-time dates, daily, weekdays, weekly/every-N-weeks, monthly (day-of-month or Nth-weekday), and custom day/week/month intervals, each with a depart-at/arrive-by time and a recurrence end (never / on date / after N occurrences). `src/lib/schedule.ts` provides `describeSchedule()` (human-readable summaries) and `getNextOccurrences()` (pure occurrence-date calculator anchored on the journey's `createdAt`, ready for a future proactive-monitoring job). Covered by `src/lib/schedule.test.ts`.
  - **Usual route**: structured `RouteLeg` union (`WalkingLeg | RailLeg | BusLeg | TransferLeg`) built via a bottom sheet (`AddLegSheet.tsx`) with a searchable MRT/LRT station selector (`StationSelector.tsx` + `src/fixtures/stations.ts`, which also does simple "shared line" suggestion between a chosen board/alight station pair) and a searchable bus service selector (`BusServiceSelector.tsx` + `src/fixtures/bus-services.ts`). Both fixtures are clearly-labelled illustrative/reference data, not live LTA data. Rendered as an editable vertical timeline (`RouteTimeline.tsx`) with reorder/edit/remove and automatic "Transfer" connectors between consecutive rail legs at the same interchange. Leg validation and ordering helpers live in `src/lib/routeLegs.ts` (tested in `routeLegs.test.ts`).
  - Persisted to `users/{uid}.regularRoutes` as `SavedJourney[]` (see `src/types/journey.ts`). `src/lib/journeyMigration.ts` transparently upgrades pre-refinement flat routes (day booleans + free-text legs) read from Firestore into the new schema, so older prototype documents keep working without a manual migration step (tested in `journeyMigration.test.ts`).
- **Frontend Prototype**: Next.js 16 App Router mobile UI prototype.
- **Domain State**: Interactive client state for development toggles (`Normal` vs `Demo disruption`).
- **Accessibility**: Live dynamic root text scaling (`Standard`, `Large`, `Extra Large`), 100% step-free routing filters.
- **Voice Assistant**: Simulated Voice Assistant sheet with pre-canned queries and responses.
- **Map & Directions** (`/directions`): a real interactive **MapLibre GL JS** map on an **OpenStreetMap** base (OpenFreeMap "Liberty" style, configurable via `NEXT_PUBLIC_MAP_STYLE_URL`), with visible "© OpenStreetMap contributors" attribution. `src/components/map/MapView.tsx` loads MapLibre from its own CDN build rather than bundling it — v6's worker init pattern otherwise silently breaks under Next's webpack build (only the flat background layer renders, no tiles). `src/components/map/LocationCombobox.tsx` is a debounced, keyboard-navigable From/To combobox backed by real **OneMap** Singapore place search: it calls a server-side Route Handler (`src/app/api/places/search`, using `src/lib/onemap.server.ts`) that authenticates to OneMap and normalises results into an internal `Place` type (`src/types/place.ts`) — OneMap credentials never reach the browser. Selecting a result plots a marker and fits the map to both endpoints; "Plan journey" collapses the form into a compact summary with an "Edit" affordance. No route line/duration/distance is computed or faked — a status card says routing is "connected next" — and this requires the app to run on a Node server (see README "Known limitations": `output: 'export'` was removed for this reason).

### 🚀 Cloud & API Roadmap
- **Google Cloud Platform (GCP)**: Deployment and hosting (e.g., Cloud Run, containerized deployment) — now a hard requirement, not just a nice-to-have, since the OneMap search route needs a Node runtime (see above).
- **Transit & Map APIs**: OneMap place search/geocoding is integrated (see Map & Directions above). Still pending: LTA DataMall (live routing, station lift status, real-time alerts) and actual multimodal route calculation/drawing.

---

## 4. Tech Stack & Environment

| Layer | Technology | Details |
|---|---|---|
| **Framework** | Next.js 16.3.5 (App Router) | Client and static components |
| **Authentication** | Firebase Auth 12.x | Email + Password ONLY (no third-party OAuth) |
| **Database** | Cloud Firestore | User profile, commuter preferences & saved regular routes (`users/{uid}`) |
| **Language** | TypeScript 5.7.3 | Strict typechecking across domain models |
| **Styling** | Tailwind CSS 3.4.19 | Custom SGDS color tokens & safe area utilities |
| **Icons** | Lucide React 1.47.0 | Clean, accessible SVG iconography |
| **Linter** | ESLint 9 (Flat Config) + `@typescript-eslint/parser` | Strictly enforced code quality |
| **Build Bundler** | Webpack (`--webpack` flag) | Stable compilation in sandboxed CI environments |
| **Design System** | Singapore Civic Transit Design System | Deep transit blue (`#004b87`), teal mobility green (`#00847f`), $\ge 44\text{px}$ touch targets |
| **Map** | MapLibre GL JS 6.x (CDN-loaded) | OSM-based vector map, `/directions` |
| **Geocoding** | OneMap API (server-side only) | Singapore place search, proxied via `/api/places/search` |


---

## 5. Colour System

JourneyAheadSG uses a clean LTA-inspired civic transit palette.

- **Deep transit blue** (`#004b87`) is the primary interaction/CTA colour.
- **Teal/transport green** (`#00847f`) is the secondary brand and mobility colour.
- **White and very pale blue-grey** (`#f4f6f9`, `#f8fafc`) dominate application surfaces.
- **Green** (`#16a34a`) communicates positive/accessible/available states.
- **Amber** (`#d97706`) communicates caution/disruption.
- **Red** (`#dc2626`) is reserved for unavailable, affected, error, or critical states.
- **Blue** (`#2563eb`) communicates general information.
- **Actual MRT lines** retain their recognisable line colours (EWL Green `#009640`, NSL Red `#d42e12`, etc.).
- **Do not rely on colour alone to communicate state** (always pair with explicit icons and text).
- **Avoid gradients, neon colours, glassmorphism, excessive shadows, and large saturated surfaces.**
- **Disruption UI** should communicate the problem clearly while keeping the recommended action calm and reassuring.

---

## 6. Repository Architecture & File Map

```
synergeee-ltahack/
├── AGENTS.md                         # THIS FILE: Agent memory & project handbook
├── README.md                         # Public user-facing documentation
├── package.json                      # Scripts and dependencies
├── tsconfig.json                     # Path alias @/* mapped to ./src/*
├── tailwind.config.js                # SGDS color palette and spacing extensions
├── postcss.config.js                 # Autoprefixer & Tailwind configuration
├── eslint.config.mjs                 # Flat ESLint 9 configuration with TS parser
│
└── src/
    ├── app/
    │   ├── layout.tsx                # App root layout with AuthProvider, DemoProvider, AuthGuard, and AppShell
    │   ├── page.tsx                  # Home screen (Hero Journey Card + Network Updates)
    │   ├── login/page.tsx            # Email + password sign-in
    │   ├── signup/page.tsx           # Account creation -> hands off to /onboarding
    │   ├── forgot-password/page.tsx  # Password reset request
    │   ├── onboarding/page.tsx       # 6-step commuter onboarding wizard (incl. Regular Routes step)
    │   ├── directions/page.tsx       # Directions: MapLibre/OSM map + OneMap place search comboboxes + collapse-on-plan summary
    │   ├── profile/page.tsx          # Saved journeys, accessibility toggles, & text size switcher
    │   ├── api/places/search/route.ts# Server-side OneMap search proxy (Route Handler — keeps credentials out of the browser)
    │   ├── journey/
    │   │   ├── page.tsx              # Fallback redirect to /journey/compare
    │   │   ├── compare/page.tsx      # Route Comparison: "What changed and what will it cost me?"
    │   │   └── guide/page.tsx        # Guided Journey: 8-step sequential one-handed navigation
    │   └── globals.css               # Tailwind directives, rem font scaling, safe area insets
    │
    ├── components/
    │   ├── layout/
    │   │   ├── AppShell.tsx          # Mobile container (max-w-md, centered on desktop)
    │   │   ├── BottomNavigation.tsx  # Fixed 3-tab accessible navigation bar
    │   │   ├── GovMasthead.tsx       # Official Singapore Government agency masthead
    │   │   ├── PageHeader.tsx        # Standard screen header with back button support
    │   │   └── DemoScenarioToggle.tsx# Toggle: Normal vs Demo disruption
    │   ├── journey/
    │   │   ├── JourneyCard.tsx       # Hero journey card (responds to disruption state)
    │   │   ├── RouteCard.tsx         # Route option card used in /directions
    │   │   ├── RouteComparison.tsx   # Detailed trade-off comparison cards
    │   │   ├── GuidedStep.tsx        # Single-step one-handed instruction card
    │   │   ├── JourneyMetric.tsx     # Reusable metric chip (time, walk distance, shelter)
    │   │   └── JourneyStatus.tsx     # Status pill (Ready, Affected, Rerouted)
    │   ├── journey-editor/           # Reusable 4-step "add/edit journey" flow (used by onboarding Step 5 AND Profile)
    │   │   ├── JourneyEditor.tsx     # Orchestrator: Journey / Schedule / Usual route / Review + step nav
    │   │   ├── JourneyDetailsStep.tsx# Step 1: name, from, to
    │   │   ├── ScheduleStep.tsx      # Step 2: one-time vs repeating recurrence editor + live summary
    │   │   ├── RouteStep.tsx         # Step 3: usual-route timeline shell + "Add journey step"
    │   │   ├── AddLegSheet.tsx       # Bottom sheet: travel-mode picker + structured walk/rail/bus/transfer fields
    │   │   ├── RouteTimeline.tsx     # Read/edit vertical leg timeline; auto-detects interchange transfers
    │   │   ├── StationSelector.tsx   # Searchable MRT/LRT station combobox (fixtures/stations.ts)
    │   │   ├── LineSelector.tsx      # MRT/LRT line picker with colour + "Suggested" line hint
    │   │   ├── BusServiceSelector.tsx# Searchable bus service combobox (fixtures/bus-services.ts)
    │   │   ├── ReviewStep.tsx        # Step 4: review card + monitoring toggle + Save
    │   │   ├── JourneySummaryCard.tsx# Read-only journey card (onboarding list + Profile "My Journeys")
    │   │   ├── PlaceInput.tsx        # From/To-style place text input (dot + label)
    │   │   └── DaySelector.tsx       # Mon-Sun toggle grid with a "Weekdays" quick-select
    │   ├── accessibility/
    │   │   ├── AccessibilityBadge.tsx# Badges for Step-free, Working lifts, Sheltered
    │   │   └── CrowdingIndicator.tsx # 3-tier crowding indicator (Low, Moderate, High)
    │   ├── alerts/
    │   │   ├── AlertCard.tsx         # Secondary network updates card
    │   │   └── DemoBadge.tsx         # Visual "DEMO SCENARIO" warning badge
    │   ├── map/
    │   │   ├── MapPlaceholder.tsx    # Styled SVG schematic preview (Exit A vs Exit B) — still used by /journey/guide
    │   │   ├── MapView.tsx           # Real MapLibre GL JS map (OSM base), origin/destination markers, auto fit-to-bounds
    │   │   └── LocationCombobox.tsx  # Debounced, keyboard-navigable OneMap place search combobox
    │   ├── profile/
    │   │   ├── PreferenceControl.tsx # Accessible switch toggle row
    │   │   ├── PreferenceSection.tsx # Card section wrapper for settings
    │   │   └── TextSizeControl.tsx   # 3-way Standard / Large / Extra Large segmented button
    │   ├── assistant/
    │   │   ├── VoiceAssistantButton.tsx # Floating mic action button on Home screen
    │   │   └── VoiceAssistantSheet.tsx  # Bottom sheet with sample commuter queries
    │   └── ui/
    │       ├── Button.tsx            # Accessible SGDS button (min 44px height)
    │       ├── Card.tsx              # Bordered accessible container
    │       └── Badge.tsx             # Generic status badge
    │
    ├── features/
    │   ├── auth/
    │   │   ├── AuthContext.tsx       # Firebase Auth + Firestore profile provider (signIn/signUp/completeOnboarding/etc.)
    │   │   ├── AuthGuard.tsx         # Route gating: unauth -> /login, onboarding incomplete -> /onboarding
    │   │   └── useAuth.ts            # Hook for accessing AuthContext
    │   ├── demo/
    │   │   ├── DemoContext.tsx       # Global state for disruption mode & text sizing
    │   │   └── useDemoMode.ts        # Hook for accessing DemoContext
    │   ├── journeys/
    │   │   ├── types.ts              # Domain types for routes and journeys
    │   │   └── helpers.ts            # calculateRouteDiff helper (+7 min, +80m)
    │   └── preferences/
    │       ├── types.ts              # Commuter preference types
    │       └── helpers.ts            # Preference summary helpers
    │
    ├── fixtures/
    │   ├── mdm-lim.ts                # Mdm Lim commuter profile data
    │   ├── journeys.ts               # SGH routine normal & affected journey data
    │   ├── routes.ts                 # Usual, Affected, and Recommended route options
    │   ├── alerts.ts                 # 3 sample network transport updates
    │   ├── guided-journey.ts         # 8-step Bedok -> SGH sequential navigation
    │   ├── stations.ts               # Illustrative MRT/LRT station & line reference data (NOT live LTA data)
    │   └── bus-services.ts           # Illustrative bus service reference data (NOT live LTA data)
    │
    ├── hooks/
    │   ├── useTextSize.ts            # Hook for text size manipulation
    │   └── usePlaceSearch.ts         # Debounced OneMap search hook (stale-response-safe, loading/empty/error states)
    │
    ├── lib/
    │   ├── constants.ts              # App titles, routes, text size options
    │   ├── utils.ts                  # cn, formatDistance, formatDuration, formatTimeForDisplay
    │   ├── accessibility.ts          # Crowding definitions and typography scale factors
    │   ├── firebase.ts               # Firebase app/auth/firestore init + isFirebaseConfigured guard
    │   ├── auth-errors.ts            # Firebase Auth error code -> friendly message mapping
    │   ├── schedule.ts                # describeSchedule() + getNextOccurrences() recurrence engine (tested)
    │   ├── routeLegs.ts               # Route-leg validation, reorder, edit helpers (tested)
    │   ├── journeyMigration.ts        # Upgrades pre-refinement flat routes to the SavedJourney schema (tested)
    │   ├── onemap.server.ts           # SERVER-ONLY: OneMap auth (static key or email/password->token) + search + normalisation
    │   └── map/config.ts              # Map style URL, OSM attribution text, default Singapore view, reserved route-layer ids
    │
    └── types/
        ├── index.ts                  # Shared domain TypeScript interfaces (Journey, RouteOption, DayOfWeek, etc.)
        ├── auth.ts                   # UserProfile & OnboardingFormState types
        ├── journey.ts                # SavedJourney, JourneySchedule, RouteLeg (Walking/Rail/Bus/Transfer) types
        └── place.ts                  # Place — normalised geocoded location (label, address, lat/lng, source), provider-agnostic
```

---

## 7. Critical Implementation Details

### Dynamic Text Sizing Mechanism
Instead of `transform: scale()` which clips views and causes horizontal overflow, we set `<html data-text-size="...">`:
- `standard`: `16px` root font
- `large`: `18.5px` root font
- `xlarge`: `21px` root font  
Because Tailwind uses `rem` units for fonts, margins, and paddings, all components scale proportionally and fluidly across viewports (320px–430px) without breaking.

### Safe Area Handling
Mobile devices with gesture bars and camera cutouts are handled using:
- `padding-bottom: env(safe-area-inset-bottom, 16px)`
- `bottom: calc(env(safe-area-inset-bottom, 16px) + 4.5rem)` for floating controls.

### Build and Dev Commands
```bash
# Run local development server
npm run dev

# Run ESLint (ESLint 9 flat config)
npm run lint

# Run unit tests (Vitest — schedule recurrence math, route-leg validation, legacy-data migration)
npm run test

# Compile production build (uses --webpack flag for sandbox stability)
npm run build
```

---

## 8. Guidelines for Incoming Agents

1. **Keep it Mobile-First**: Always verify designs look natural inside `max-w-md` (375px–430px) and never introduce horizontal scrolling.
2. **Preserve Demo State Integrity**: Any new disruptions or route changes must flow through `DemoContext` and display the **DEMO SCENARIO** badge. Never show sample data as live real-time feeds without the badge.
3. **Cloud & API Readiness**: As we transition to Google Cloud deployment and live API integration (LTA DataMall, OneMap), keep services modular with clean separation between UI components and API clients.
4. **Maintain Accessibility**: Minimum touch target $\ge 44 \times 44\text{ px}$, contrast $\ge 4.5:1$, and keyboard focus outlines.
