# AGENTS.md — Project Memory & Agent Context

> **Project**: GoAble SG — Smart Commuter Companion for Singapore  
> **Repository**: [ZengZixuan05/synergeee-ltahack](https://github.com/ZengZixuan05/synergeee-ltahack.git)  
> **Target Audience for this document**: AI Coding Agents (Antigravity, Cursor, Claude, ChatGPT, Copilot) and Human Developers.  
> **Last Updated**: September 2026

---

## 1. Project Mission & Core Philosophy

**GoAble SG** is a **general commuter application** for Singapore public transport users. While standard transit apps broadcast generic network alerts (e.g., *"East-West Line track fault"*), GoAble SG delivers **personalised, proactive journey recommendations** when transport conditions change.

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

### ✅ Current Frontend Implementation
- Next.js 16 App Router mobile UI prototype
- Pure TypeScript domain models and sample fixtures
- Interactive client state for development toggles (`Normal` vs `Demo disruption`)
- Live dynamic root text scaling (`Standard`, `Large`, `Extra Large`)
- Simulated Voice Assistant sheet with pre-canned queries and responses

### 🚀 Cloud & API Roadmap
- **Google Cloud Platform (GCP)**: Deployment and hosting (e.g., Cloud Run, containerized deployment).
- **Transit & Map APIs**: Integration with Singapore public transit APIs (LTA DataMall, OneMap) for live routing, station lift status, and real-time alerts.

---

## 4. Tech Stack & Environment

| Layer | Technology | Details |
|---|---|---|
| **Framework** | Next.js 16.3.5 (App Router) | Client and static components |
| **Language** | TypeScript 5.7.3 | Strict typechecking across domain models |
| **Styling** | Tailwind CSS 3.4.19 | Custom SGDS color tokens & safe area utilities |
| **Icons** | Lucide React 1.47.0 | Clean, accessible SVG iconography |
| **Linter** | ESLint 9 (Flat Config) + `@typescript-eslint/parser` | Strictly enforced code quality |
| **Build Bundler** | Webpack (`--webpack` flag) | Stable compilation in sandboxed CI environments |
| **Design System** | Singapore Government Design System (SGDS) | Primary red (`#d42426`), navy slate (`#1e293b`), $\ge 44\text{px}$ touch targets |

---

## 5. Repository Architecture & File Map

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
    │   ├── layout.tsx                # App root layout with DemoProvider and AppShell
    │   ├── page.tsx                  # Home screen (Hero Journey Card + Network Updates)
    │   ├── directions/page.tsx       # Directions search form + MapLibre/OSM placeholder + Route cards
    │   ├── profile/page.tsx          # Saved journeys, accessibility toggles, & text size switcher
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
    │   ├── accessibility/
    │   │   ├── AccessibilityBadge.tsx# Badges for Step-free, Working lifts, Sheltered
    │   │   └── CrowdingIndicator.tsx # 3-tier crowding indicator (Low, Moderate, High)
    │   ├── alerts/
    │   │   ├── AlertCard.tsx         # Secondary network updates card
    │   │   └── DemoBadge.tsx         # Visual "DEMO SCENARIO" warning badge
    │   ├── map/
    │   │   └── MapPlaceholder.tsx    # Styled SVG schematic preview (Exit A vs Exit B)
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
    │   └── guided-journey.ts         # 8-step Bedok -> SGH sequential navigation
    │
    ├── hooks/
    │   └── useTextSize.ts            # Hook for text size manipulation
    │
    ├── lib/
    │   ├── constants.ts              # App titles, routes, text size options
    │   ├── utils.ts                  # cn, formatDistance, formatDuration
    │   └── accessibility.ts          # Crowding definitions and typography scale factors
    │
    └── types/
        └── index.ts                  # Shared TypeScript interfaces
```

---

## 6. Critical Implementation Details

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

# Compile production build (uses --webpack flag for sandbox stability)
npm run build
```

---

## 7. Guidelines for Incoming Agents

1. **Keep it Mobile-First**: Always verify designs look natural inside `max-w-md` (375px–430px) and never introduce horizontal scrolling.
2. **Preserve Demo State Integrity**: Any new disruptions or route changes must flow through `DemoContext` and display the **DEMO SCENARIO** badge. Never show sample data as live real-time feeds without the badge.
3. **Cloud & API Readiness**: As we transition to Google Cloud deployment and live API integration (LTA DataMall, OneMap), keep services modular with clean separation between UI components and API clients.
4. **Maintain Accessibility**: Minimum touch target $\ge 44 \times 44\text{ px}$, contrast $\ge 4.5:1$, and keyboard focus outlines.
