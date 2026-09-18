# GoAble SG — Smart Commuter Companion for Singapore

> **LTA Hackathon Frontend UI Prototype**  
> Proactive, personalised journey recommendations for Singapore commuters when transport conditions change.

---

## 1. Project Overview & Purpose

**GoAble SG** is a **general commuter application** built for Singapore public transport users. While standard transit apps broadcast generic network alerts (e.g., *"East-West Line delays due to track maintenance"*), **GoAble SG** transforms public transit data into **actionable, personal decision support**. 

### The Core Principle
> *"Do not tell commuters only what happened. Tell them what they should do."*

When lifts break down, weather shifts, or crowds build, commuters should not have to manually re-route in panic or puzzle out alternative station exits. GoAble SG proactively evaluates their saved routines against barrier-free, sheltered, and crowding constraints and delivers clear, actionable recommendations with precise trade-offs before they even step out the door.

---

## 2. Hackathon Persona: Mdm Lim

While GoAble SG is designed for all commuters (daily office workers, parents with strollers, students, shoppers), our primary demonstration persona is **Mdm Lim**:

- **Origin**: Sky Eden @ Bedok
- **Destination**: Singapore General Hospital (SGH) Specialist Outpatient Clinic
- **Schedule**: Every alternate Monday, arriving before 10:00 AM
- **Mobility Characteristics**:
  - Walks at a leisurely pace (~3 km/h)
  - Must avoid stairs (barrier-free, step-free travel only)
  - Requires certified operational lifts at concourse and platform levels
  - Strongly prefers sheltered walkways against Singapore's tropical sun and sudden rain
  - Needs larger typography for high readability without visual strain
  - Will **not** improvise a reroute while travelling—decisions must be made and verified ahead of time

### How the Prototype Addresses Mdm Lim's Needs:
1. **Advance Disruption Advisory**: When Outram Park Exit A's lift is unavailable, she receives an advance card: *"The lift used by your usual route is unavailable. Recommended: Use the accessible alternative route."*
2. **Clear Trade-Off Summary**: Instantly highlights the exact cost: **`+7 min`**, **`+80 m walking`**, and provides immediate reassurance: **`Your journey remains 100% step-free`**.
3. **One-Handed Step Guidance**: Reduces cognitive load during travel by showing one instruction at a time (e.g., *"Use Lift B. Do not use Lift A due to maintenance. Working lift confirmed"*), with dominant "Next" buttons and optional situational map previews.
4. **Fluid Text Scaling**: Offers Standard, Large, and Extra Large typography options that scale rem units cleanly without overflowing or breaking mobile cards.

---

## 3. Key Design Decisions

1. **Mobile-First App Shell**:
   - Commuters interact with transit tools on mobile devices on the move.
   - The UI is designed for mobile viewports (320px–430px) with touch targets $\ge 44 \times 44\text{ px}$, safe area insets for iOS/Android home bars, and fixed bottom navigation. On desktop displays, it gracefully centers as an authentic mobile frame.
2. **Personalised Advice Over Raw Alerts**:
   - Generic transport alerts are demoted to a secondary section on the Home screen.
   - The top hero space is reserved exclusively for the commuter's upcoming personal journey and proactive recommendations.
3. **Step-by-Step Guidance Over Map Overload**:
   - Commuters facing disruptions should not have to interpret complex full-screen multi-layered transit maps on the go.
   - Guided Journey mode focuses commuter attention on the immediate next action (which lift to take, which platform, which exit) with clear step-free confirmations.
4. **Singapore Government Design System (SGDS) Alignment**:
   - Uses SGDS primary red (`#d42426`), navy slate (`#1e293b`), and government masthead cues.
   - Distinctive accessibility badges, 3-tier crowding indicators (Low, Moderate, High), and prominent "DEMO SCENARIO" badges to ensure sample data is never mistaken for real-time operations.

---

## 4. What Is Implemented vs. What Is NOT Implemented

This repository is **strictly a frontend mobile UI prototype** built for interactive evaluation:

### ✅ Implemented
- [x] **Interactive Demo Mode Toggle** (`Normal` vs. `Demo disruption`) allowing live testing of proactive rerouting.
- [x] **Home Dashboard** with personalised greeting, hero journey card, secondary transport alerts, and floating voice assistant trigger.
- [x] **Directions & Planner Screen** (`/directions`) with origin/destination inputs, arrival/departure time toggles, route cards (Recommended vs. Affected), and a MapLibre/OSM schematic placeholder.
- [x] **Route Comparison Screen** (`/journey/compare`) answering *"What changed and what will it cost me?"* with side-by-side trade-offs.
- [x] **Guided Journey Screen** (`/journey/guide`) with 8-step one-handed sequential guidance, lift warnings, and completion state.
- [x] **Profile & Preferences Screen** (`/profile`) supporting saved routines, walking pace, max continuous walk distance, accessibility filters, language selection, and notification controls.
- [x] **Live Text Size Scaling** (`Standard`, `Large`, `Extra Large`) responding dynamically via root font rem scaling without layout clipping.
- [x] **Voice Assistant Bottom Sheet UI** featuring sample commuter query chips and simulation feedback.

### ❌ NOT Implemented (Out of Scope for UI Prototype)
- No authentication or user account management
- No Firebase, Firestore, or database persistence
- No Google Cloud Platform services
- No live LTA DataMall or OneMap API integrations
- No real-time GPS routing or native push notifications
- No AI/LLM conversational APIs or speech recognition
- No backend servers (100% client-rendered prototype using TypeScript fixtures)

---

## 5. Local Setup & Execution

### Prerequisites
- **Node.js**: $\ge 18.17.0$ (v20+ recommended)
- **npm**: $\ge 9.0.0$

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your mobile browser or browser developer tools in responsive device mode (iPhone 14 / Pixel 7).

### 3. Production Build & Linting
```bash
# Verify code quality with ESLint
npm run lint

# Compile production bundle
npm run build

# Start production server
npm start
```

---

## 6. Project Structure

```
synergeee-ltahack/
├── src/
│   ├── app/
│   │   ├── layout.tsx                # Root layout with DemoProvider and AppShell
│   │   ├── page.tsx                  # Home screen (Hero Journey & Alerts)
│   │   ├── directions/page.tsx       # Directions, search inputs, & route options
│   │   ├── profile/page.tsx          # Saved journeys, accessibility, & display settings
│   │   ├── journey/
│   │   │   ├── page.tsx              # Index redirect
│   │   │   ├── compare/page.tsx      # Route trade-off comparison screen
│   │   │   └── guide/page.tsx        # 8-step guided navigation screen
│   │   └── globals.css               # SGDS theme, font scaling, & safe area insets
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx          # Mobile container & viewport frame
│   │   │   ├── BottomNavigation.tsx  # 3-tab accessible navigation bar
│   │   │   ├── GovMasthead.tsx       # Singapore Government agency masthead
│   │   │   ├── PageHeader.tsx        # Standard accessible screen header
│   │   │   └── DemoScenarioToggle.tsx# Instant Normal / Demo disruption switcher
│   │   ├── journey/
│   │   │   ├── JourneyCard.tsx       # Primary home journey card
│   │   │   ├── RouteCard.tsx         # Directions route preview card
│   │   │   ├── RouteComparison.tsx   # Side-by-side trade-off comparison
│   │   │   ├── GuidedStep.tsx        # One-handed sequential step component
│   │   │   ├── JourneyMetric.tsx     # Metric chip (time, distance, shelter)
│   │   │   └── JourneyStatus.tsx     # Status pills (ready, affected, rerouted)
│   │   ├── accessibility/
│   │   │   ├── AccessibilityBadge.tsx# Badges for step-free, lifts, shelter
│   │   │   └── CrowdingIndicator.tsx # 3-tier crowding indicator (Low/Mod/High)
│   │   ├── alerts/
│   │   │   ├── AlertCard.tsx         # Secondary network updates card
│   │   │   └── DemoBadge.tsx         # Distinctive "DEMO SCENARIO" warning badge
│   │   ├── map/
│   │   │   └── MapPlaceholder.tsx    # MapLibre/OSM preview placeholder graphic
│   │   ├── profile/
│   │   │   ├── PreferenceControl.tsx # Accessible switch toggle row
│   │   │   ├── PreferenceSection.tsx # Grouped settings card container
│   │   │   └── TextSizeControl.tsx   # 3-way Standard / Large / X-Large selector
│   │   ├── assistant/
│   │   │   ├── VoiceAssistantButton.tsx # Floating mic action button
│   │   │   └── VoiceAssistantSheet.tsx  # Bottom sheet with sample query chips
│   │   └── ui/
│   │       ├── Button.tsx            # SGDS accessible button (>=44px touch)
│   │       ├── Card.tsx              # Bordered accessible container
│   │       └── Badge.tsx             # Generic status badge
│   ├── features/
│   │   ├── demo/
│   │   │   ├── DemoContext.tsx       # Disruption toggle & text size state provider
│   │   │   └── useDemoMode.ts        # React hook for demo state
│   │   ├── journeys/
│   │   │   ├── types.ts              # Route & journey data models
│   │   │   └── helpers.ts            # Metric diff calculations (+7 min, +80 m)
│   │   └── preferences/
│   │       ├── types.ts              # Accessibility preference models
│   │       └── helpers.ts            # Summary text & scale factor helpers
│   ├── fixtures/
│   │   ├── mdm-lim.ts                # Mdm Lim commuter profile fixture
│   │   ├── journeys.ts               # SGH routine normal & affected journey fixtures
│   │   ├── routes.ts                 # Usual vs Affected vs Recommended route fixtures
│   │   ├── alerts.ts                 # Sample network transport alerts
│   │   └── guided-journey.ts         # 8-step Bedok -> SGH navigation fixture
│   ├── lib/
│   │   ├── constants.ts              # App titles, routes, and text size options
│   │   ├── utils.ts                  # Class merge & unit formatting helpers
│   │   └── accessibility.ts          # Crowding & typography definitions
│   └── types/
│       └── index.ts                  # Shared TypeScript interfaces
├── package.json                      # Dependencies and npm scripts
├── tsconfig.json                     # TypeScript configuration with path aliases
├── tailwind.config.js                # Tailwind configuration with SGDS design tokens
├── postcss.config.js                 # PostCSS setup
└── eslint.config.mjs                 # Flat ESLint 9 configuration with TS parser
```

---

## 7. Design System & Accessibility Notes

- **SGDS Visual Language**: Follows the Singapore Government Design System color palette with primary red (`#d42426`), high-contrast dark text (`#0f172a`), clean card borders (`#e2e8f0`), and standard masthead headers.
- **Dynamic Text Sizing**: Text size switches update `<html data-text-size="...">`, which adjusts base rem metrics (`16px`, `18.5px`, `21px`). All component paddings and font sizes are defined with rem units, guaranteeing no layout breaking, zero horizontal scroll, and clear visual hierarchy on small screens.
- **WCAG 2.1 AA Compliance**:
  - Touch targets $\ge 44 \times 44\text{ px}$ across all interactive switches, buttons, and segmented radios.
  - Visible keyboard focus rings (`focus-visible:ring-2 focus-visible:ring-[#d42426]`).
  - Screen reader semantic attributes (`role="switch"`, `aria-checked`, `role="radiogroup"`, `aria-label`).
  - Text and icon contrast ratios $\ge 4.5:1$ against backgrounds.