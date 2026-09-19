# JourneyAheadSG — Smart Commuter Companion for Singapore

> **LTA Hackathon Submission**
> Proactive, personalised journey recommendations for Singapore commuters when transport conditions change.

---

## 0. Quickstart for Judges

**The app is already deployed — no setup required to evaluate it.**

🔗 **Live app: [https://goable-sg-itds4upurq-as.a.run.app](https://goable-sg-itds4upurq-as.a.run.app)**

Open that link in a mobile browser, or in desktop Chrome/Firefox with responsive/device mode on (this is a mobile-first UI — DevTools → Toggle device toolbar, or `Cmd+Shift+M` / `Ctrl+Shift+M`). Everything below walks through exactly what to click, using the same **Mdm Lim** persona (see [§2](#persona)) the app was built around.

### Step 1 — Create an account and log in

1. On first load you land on **`/login`**. Tap **"Sign up"** at the bottom.
2. Fill in **full name, email, password, confirm password** (password ≥ 6 characters — any values work, this is a demo account, not a real one; no email verification is required).
3. Tap **Create account**. You're signed in immediately and taken into the onboarding wizard (below).
4. To log back in later (e.g. a new browser/device), go to **`/login`** and enter the same email + password. Forgot it? **`/forgot-password`** sends a Firebase password-reset email.

### Step 2 — Set your travel preferences (5-step onboarding)

New accounts must complete this once before reaching the app. To mirror **Mdm Lim** — our accessibility-constrained demo persona — choose:

1. **Journey Priorities** — prioritise accessibility/reliability over speed.
2. **Accessibility** — turn on **"Avoid stairs"** and **"Require working lifts"** (this is what makes the app reject any route with a broken lift).
3. **Walking** — set walking pace to **Slow (3 km/h)** and keep the max continuous walk short (e.g. 200–400 m).
4. **Display & Language** — pick **Large** or **Extra large** text; leave language as English (or pick another — 中文/Melayu/தமிழ் are all supported).
5. **Summary** — review and tap **Complete/Finish** to land on the Home screen, now signed in.

(Any commuter can skip the accessibility toggles and use the app as a general journey planner instead — preferences are fully reconfigurable anytime from **Profile**.)

### Step 3 — The Home page

Home shows your next upcoming saved journey (if any), its live readiness status, accessibility badges (step-free / working lifts / sheltered), and a secondary feed of general network alerts below it. This is intentional — see [§3 Key Design Decisions](#3-key-design-decisions).

### Step 4 — Add a saved journey (Mdm Lim's commute)

Saved journeys are how the app knows what to watch for you. Go to **Profile → Add journey** (or **Map & Directions → your regular routes → +**) and fill the 4-step wizard:

1. **Journey** — name it (e.g. "SGH Appointment"), then search:
   - **From:** `522 Hougang Ave 6` → pick the suggestion **"522 HOUGANG AVENUE 6 SINGAPORE 530522"**
   - **To:** `Singapore General Hospital` → pick **"SINGAPORE GENERAL HOSPITAL"**
   - Both fields must show a green **"Verified"** tag (picked from the live OneMap search dropdown) before continuing — a typed address that was never selected from the dropdown won't have coordinates for routing.
2. **Schedule** — one-time or repeating, date, and depart-at/arrive-by time.
3. **Usual route** — optional, skip it.
4. **Review** — confirm and tap **Save journey**.

### Step 5 — Plan the journey and see live, disruption-aware routing

Go to **Map & Directions**, tap the saved journey chip to auto-fill origin/destination, and tap **Plan journey**. This calls the live backend (LTA DataMall + OneMap) and returns several route options with a line drawn on the map:

- **Option 1** (fastest, direct NEL train) is flagged **"Lift down at Hougang" / "Lift down at Clarke Quay"** — real, live LTA facility-maintenance data.
- Because the account requires working lifts, the app auto-selects a **"Bus alternative"** option instead, with the reasoning shown explicitly: *"Every rail option currently has a lift under maintenance on it; showing a bus-based alternative that avoids it."*

This is the core product principle in action — see [§Architecture](#architecture) below.

### Step 6 — Live bus arrivals

Tap **Bus** in the bottom nav, search a bus stop by name/road/code (e.g. "Hougang"), and open one — you'll see live arrival countdowns and seat availability pulled straight from LTA DataMall.

---

### Running it locally instead (optional)

Only needed if you want to run your own copy rather than use the live link above.

This is a two-service app: a **Next.js frontend** (`frontend/`) and an **Express backend** (`backend/`) that proxies LTA DataMall, OneMap, and weather data.

**Prerequisites:** Node.js 20 LTS+ (`node -v`), npm 9+.

```bash
git clone <this-repo-url>
cd synergeee-ltahack

npm install                              # frontend deps (root package.json)
cd backend && npm install && cd ..       # backend deps (its own package.json)

cp .env.example frontend/.env.local      # frontend reads this
cp .env.example backend/.env             # backend reads this
```

Fill in real values in both copied files — see the Configuration table below for where to get each one. Then, in two terminals:

```bash
npm run backend:dev    # Terminal 1 — http://localhost:8081
npm run dev            # Terminal 2 — http://localhost:3000
```

Open **[http://localhost:3000](http://localhost:3000)** and follow Steps 1–6 above.

> The env files go in `frontend/.env.local` and `backend/.env`, **not** a `.env.local` at the repo root — `npm run dev` changes into `frontend/` before starting Next.js, and the backend's `dotenv` config reads `backend/.env` first.

#### Configuration

All variables are listed with placeholder values in [`.env.example`](./.env.example):

| Variable(s) | Used by | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID` | Frontend — account creation, login, profile storage | Free at [console.firebase.google.com](https://console.firebase.google.com/) → create a project → enable **Authentication → Email/Password** and **Firestore Database**. Full step-by-step is in [§6](#6-firebase-authentication--firestore-setup) below. |
| `LTA_ACCOUNT_KEY` | Backend — live bus arrivals, train alerts, facilities | Free at [datamall.lta.gov.sg](https://datamall.lta.gov.sg/content/datamall/en/request-for-api.html) — register with any email, the key arrives by email within minutes. |
| `ONEMAP_API_KEY` **or** `ONEMAP_API_EMAIL` + `ONEMAP_API_PASSWORD` | Frontend (place search) and backend (journey planning) | Free account at [onemap.gov.sg](https://www.onemap.gov.sg/) — either grab a static API key from your account, or just use your email/password (the app exchanges it for a token automatically). |
| `NEXT_PUBLIC_MAP_STYLE_URL`, `ONEMAP_BASE_URL`, `WEATHER_BASE_URL`, `BACKEND_BASE_URL`, `*_CACHE_TTL_MS` | Both | Optional — sensible defaults are already set; leave unset unless you need to override them. |

Without Firebase keys the app still loads (auth is skipped locally), but you won't be able to create an account or log in. Without `LTA_ACCOUNT_KEY`/OneMap keys, the backend still starts but live routing/bus/alerts/weather calls will fail.

---

## 1. Project Overview & Purpose

**JourneyAheadSG** is a **general commuter application** built for Singapore public transport users. While standard transit apps broadcast generic network alerts (e.g., *"East-West Line delays due to track maintenance"*), **JourneyAheadSG** transforms public transit data into **actionable, personal decision support**.

### The Core Principle
> *"Do not tell commuters only what happened. Tell them what they should do."*

When lifts break down, weather shifts, or crowds build, commuters should not have to manually re-route in panic or puzzle out alternative station exits. JourneyAheadSG proactively evaluates their saved routines against barrier-free, sheltered, and crowding constraints and delivers clear, actionable recommendations with precise trade-offs before they even step out the door.

---

## 2. Persona, Architecture, Assumptions & Known Limitations

### Persona

JourneyAhead is a **Smart Commuter Companion for Singapore** that provides personalised and actionable journey guidance during planned and unexpected transport events.

Our primary demonstration persona is **Mdm Lim**, an accessibility-constrained occasional traveller who travels from **522 Hougang Avenue 6** to **Singapore General Hospital** for a fortnightly appointment. She walks slowly, minimises walking, avoids stairs, requires functioning lifts, prefers sheltered routes and fewer transfers, and may not be comfortable improvising a new route while travelling.

Although Mdm Lim is our primary demo persona, JourneyAhead can also be customised for **general commuters** (daily office workers, parents with strollers, students, shoppers). Accessibility requirements and travel preferences are configurable through each commuter's profile rather than being rigid — see [Step 2](#step-2--set-your-travel-preferences-5-step-onboarding) in the Quickstart above.

**How the prototype addresses Mdm Lim's needs**, as demonstrated live in [Step 5](#step-5--plan-the-journey-and-see-live-disruption-aware-routing) of the Quickstart above:
1. **Advance disruption advisory** — when a lift on her usual route is under maintenance (live LTA facility-maintenance data), the fastest route option is flagged explicitly rather than silently offered.
2. **Automatic accessible rerouting** — because her profile requires working lifts, the app auto-selects a lift-free alternative and states its reasoning plainly (e.g. *"Every rail option currently has a lift under maintenance on it; showing a bus-based alternative that avoids it."*).
3. **One-handed step guidance** — the Guided Journey screen shows one instruction at a time with dominant "Next" buttons, reducing cognitive load while travelling.
4. **Fluid text scaling** — Standard, Large, and Extra Large typography options scale cleanly without overflowing or breaking mobile cards.

### Architecture

JourneyAhead uses a modular, mobile-first architecture.

**OpenStreetMap** (via MapLibre GL JS) supports map visualisation. External transport and geospatial services such as **LTA DataMall** and **OneMap** are accessed through server-side adapters (the standalone `backend/` Express service, plus a couple of Next.js Route Handlers in `frontend/`) so credentials are never exposed to the browser.

External data is normalised into common internal models before being processed through:

**Data → Routing → Accessibility Constraints → Preference Scoring → Decision Engine → User Explanation**

The core product principle is:

> **From disruption alerts to proactive journey guidance, JourneyAhead tells commuters early so they know what to do before the disruption affects them.**

For example, if a lift outage makes Mdm Lim's normal journey inaccessible, JourneyAhead identifies that the disruption affects her specific journey, rejects the inaccessible route, evaluates alternatives, and recommends a new course of action — with the reasoning shown, not just the result.

### Assumptions

* Users willingly provide accurate accessibility needs and travel preferences through their commuter profile.
* Live transport, disruption and accessibility information depends on the availability and accuracy of external data sources (LTA DataMall, OneMap, data.gov.sg weather).
* Journey times are estimates and should be represented as ranges where uncertainty exists.
* Accessibility constraints such as avoiding stairs or requiring functioning lifts take priority over convenience preferences such as shorter travel time.
* API credentials and secrets are stored only on the server through environment variables or cloud secret management — never in the browser bundle.
* Users are able to understand how to customise their preferences according to their personal needs and likings.

### Known Limitations

- **Saved journeys without coordinates stay text-only.** A journey whose origin/destination was typed but never selected from the OneMap search dropdown has no stored latitude/longitude, so it won't plot on the map or feed into routing until re-searched and picked from real results — this is why [Step 4](#step-4--add-a-saved-journey-mdm-lims-commute) above stresses picking the "Verified" suggestion.
- **Route ETAs are estimates**, not guarantees, and depend on live upstream data (LTA DataMall, OneMap) being available at request time; a service outage on their end will surface as a friendlier in-app error rather than a route.
- **Firebase Authentication is email/password only** (no Google/Apple/phone OAuth) by deliberate design choice, to keep the demo account-creation flow simple and self-contained for judges.
- **Demo/sample content remains visible alongside live data** in a couple of places (e.g. the Home screen's initial "SGH Appointment" card uses placeholder timings until a real saved journey is planned) — always clearly distinguishable from live-routed results, which are computed on demand via **Plan journey**.

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

## 4. Features

### ✅ Implemented Features
- [x] **Firebase Authentication (Email + Password Only)**: Secure authentication without third-party OAuth, session persistence on page refresh, and route guarding.
- [x] **Cloud Firestore User Profiles (`users/{uid}`)**: Stores commuter identity, travel priorities, and mobility constraints with user-level security rules.
- [x] **5-Step Commuter Onboarding Wizard (`/onboarding`)**: Configures journey priorities, accessibility requirements, walking pace, and display scale.
- [x] **Authentication Pages**: Mobile-first Sign in (`/login`), Sign up (`/signup`), and Password Reset (`/forgot-password`) with friendly error translation.
- [x] **Home Dashboard** with personalised greeting, hero journey card, secondary transport alerts, and floating voice assistant trigger.
- [x] **Directions & Planner Screen** (`/directions`) with a real interactive MapLibre GL JS map on an OpenStreetMap base, real Singapore place search (OneMap) with an origin/destination combobox that plots verified results on the map and auto-fits the camera, and a "Plan journey" flow that calls the live backend for real multimodal routing (see below).
- [x] **Live multimodal routing** — "Plan journey" returns several ranked route options (rail, bus, mixed) computed from live LTA DataMall + OneMap data, with a real route line drawn on the map, live ETAs, transfers, and fares.
- [x] **Live disruption-aware rerouting** — routes are checked against live LTA lift/escalator maintenance and train service alert feeds; a route through an affected lift is flagged, and an accessible alternative is auto-selected with its reasoning shown when the commuter's profile requires working lifts.
- [x] **Live bus arrivals** (`/bus`) — search any Singapore bus stop by name, road, or code and see live arrival countdowns and seat availability from LTA DataMall.
- [x] **Live weather integration** — forecasts from data.gov.sg factor into sheltered-route recommendations.
- [x] **Route Comparison Screen** (`/journey/compare`) answering *"What changed and what will it cost me?"* with side-by-side trade-offs.
- [x] **Guided Journey Screen** (`/journey/guide`) with one-handed sequential step guidance, lift warnings, and completion state.
- [x] **Profile & Preferences Screen** (`/profile`) supporting saved journeys/routines, walking pace, max continuous walk distance, accessibility filters, language selection, and notification controls.
- [x] **Live Text Size Scaling** (`Standard`, `Large`, `Extra Large`) responding dynamically via root font rem scaling without layout clipping.
- [x] **Voice Assistant Bottom Sheet UI** featuring sample commuter query chips and simulation feedback.
- [x] **Deployed on Google Cloud Run** — see [§6a](#6a-deploying-to-google-cloud-run) — as two services (frontend + backend), both connected to the live LTA DataMall and OneMap APIs.

See [§Known Limitations](#known-limitations) above for what's intentionally out of scope.

---

## 4a. Map & Directions: how it works

- **Map rendering**: [MapLibre GL JS](https://maplibre.org/) draws the map. It's loaded from its own CDN build (`https://cdn.jsdelivr.net/npm/maplibre-gl@.../dist/maplibre-gl.mjs`) rather than bundled by webpack — MapLibre v6 spins up its tile worker via a `new Worker(new URL(...))` pattern that Next's webpack build doesn't rewrite for a pre-built dependency, which silently breaks tile loading (only the flat background layer renders, no roads/labels). Loading the unbundled CDN build sidesteps this entirely; see the comment in `frontend/src/components/map/MapView.tsx`.
- **Map base / tiles**: [OpenStreetMap](https://www.openstreetmap.org/copyright) data, served as a free MapLibre style by [OpenFreeMap](https://openfreemap.org) (`https://tiles.openfreemap.org/styles/liberty`) — a CDN built specifically so apps don't hot-link OSM's own tile servers. **"© OpenStreetMap contributors" is always shown** on the map (a non-collapsing `AttributionControl`), alongside OpenFreeMap/OpenMapTiles credit. The style URL is configurable via `NEXT_PUBLIC_MAP_STYLE_URL` so the provider can change later without touching any Directions code.
- **Place search / geocoding**: [OneMap](https://www.onemap.gov.sg/apidocs/) — Singapore's official geospatial API. A debounced combobox (`frontend/src/components/map/LocationCombobox.tsx`) calls a Next.js Route Handler at `/api/places/search`, which authenticates to OneMap server-side (`frontend/src/lib/onemap.server.ts`) and returns normalised results (an internal `Place` type — label, address, latitude, longitude, source — never OneMap's raw response shape). OneMap credentials never reach the browser.
- **Saved/regular journeys**: a saved journey's origin/destination are stored with coordinates once picked from a search suggestion; selecting one via the "Your regular routes" quick-fill chips auto-fills and re-verifies both fields. A journey whose address was typed but never picked from a suggestion has no coordinates and stays text-only — see [Known Limitations](#known-limitations) above.
- **Live routing**: "Plan journey" calls the standalone `backend/` service (`backend/src/services/journeyPlanning/`), which combines LTA DataMall (train/bus timings, service alerts, lift/escalator status) with OneMap, scores multiple route options against the commuter's accessibility profile, and returns them with an actual route geometry drawn on the map — no fabricated timing or distance.

---

## 5. Local Setup & Execution

See [§0 Quickstart → Running it locally instead](#running-it-locally-instead-optional) for the exact install/run commands and Configuration table.

### Production Build & Linting

```bash
npm run lint    # ESLint (frontend)
npm run build   # Production bundle (frontend)
npm start       # Start production server (frontend)

npm run backend:lint       # ESLint (backend)
npm run backend:build      # Compile TypeScript (backend)
npm run backend:start      # Start production server (backend)
```

---

## 6. Firebase Authentication & Firestore Setup

JourneyAheadSG uses **Firebase Authentication** (strictly Email + Password) for commuter identity and **Cloud Firestore** for user profile and preference persistence. This section is only needed if you're running your own copy — the live deployment (§0) already has this configured.

### Manual Firebase Console Setup Instructions

Follow these exact steps to link your Firebase project:

1. **Open Firebase Console**: Navigate to [https://console.firebase.google.com/](https://console.firebase.google.com/).
2. **Select or Create Project**: Select or create the Firebase project associated with your Google Cloud project.
3. **Open Authentication**: In the left sidebar, navigate to **Build** → **Authentication**, then click **Get Started**.
4. **Select Sign-in Method**: Under the **Sign-in method** tab, select **Email/Password**.
5. **Enable Email/Password**: Toggle **Email/Password** to **Enabled**. (Leave Email link / passwordless disabled).
6. **Ensure OAuth is Disabled**: Do **NOT** enable Google Sign-In, Apple, Facebook, or phone auth. Keep authentication strictly Email + Password.
7. **Create Cloud Firestore Database**:
   - In the left sidebar, navigate to **Build** → **Firestore Database**, and click **Create database**.
   - Choose **Production mode**.
   - Select location: **`asia-southeast1` (Singapore)**.
8. **Register Web Application**:
   - Go to **Project Settings** (gear icon) → **General**.
   - Under **Your apps**, click the Web icon (`</>`) to add an app.
   - Register app with nickname: `JourneyAheadSG Web`.
   - Copy the `firebaseConfig` credentials.
9. **Configure Environment Variables**:
   - Copy `.env.example` to `frontend/.env.local` (see [§0 Quickstart](#0-quickstart-for-judges) for why it goes there and not a root `.env.local`):
     ```bash
     cp .env.example frontend/.env.local
     ```
   - Populate the environment variables with your keys:
     ```env
     NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
     NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abcdef
     ```
10. **Deploy Firestore Security Rules**:
    - Under Firestore Database → **Rules** tab, paste the contents of [`firestore.rules`](./firestore.rules) and click **Publish**:
      ```javascript
      rules_version = '2';
      service cloud.firestore {
        match /databases/{database}/documents {
          match /users/{userId} {
            allow read, write: if request.auth != null && request.auth.uid == userId;
          }
          match /{document=**} {
            allow read, write: if false;
          }
        }
      }
      ```

### Commuter Testing & The Mdm Lim Demo Persona

To evaluate the application using the Mdm Lim scenario without hard-coding passwords in Git, sign up with any email/password and set the **Accessibility** and **Walking** onboarding steps to match her (avoid stairs, require working lifts, slow walking pace) — see [Step 2 of the Quickstart](#step-2--set-your-travel-preferences-5-step-onboarding) above for the exact toggles. Preferences remain fully editable afterwards from **Profile**, so no credentials or profile data need to be committed to Git.

### OneMap Configuration (Map & Directions place search)

The map itself needs no API key — only the place-search combobox does. Add to `frontend/.env.local` **either**:
```env
ONEMAP_API_KEY=your_onemap_static_api_key_here
```
**or** an email/password pair registered at [onemap.gov.sg](https://www.onemap.gov.sg/), which the server exchanges for a short-lived token automatically:
```env
ONEMAP_API_EMAIL=your_onemap_api_email_here
ONEMAP_API_PASSWORD=your_onemap_api_password_here
```
`ONEMAP_BASE_URL` defaults to `https://www.onemap.gov.sg` and rarely needs changing. None of these are `NEXT_PUBLIC_*` — they're read only by the server (`frontend/src/lib/onemap.server.ts`, `backend/src/onemap/`) and never sent to the browser. The map's tile style can optionally be overridden with `NEXT_PUBLIC_MAP_STYLE_URL` (public, since it's just a style URL, not a secret).

### Deployment note

- **Requires a Node server, not static export.** The place-search API route (`/api/places/search`) and the live journey-planning routes need to run server-side per request. Next.js does not support that under `output: 'export'`. This is why the app deploys as containers on Cloud Run (see [§6a](#6a-deploying-to-google-cloud-run)) rather than as a static Firebase Hosting site.

See [§Known Limitations](#known-limitations) above for the current product-level limitations (saved journeys without coordinates, ETA estimates, etc.).

---

## 6a. Deploying to Google Cloud Run

Because the app needs a Node runtime (see the deployment note above), it deploys as
containers on **Cloud Run** rather than as a static Firebase Hosting site. This is
**two separate Cloud Run services**, each with its own Dockerfile/`cloudbuild.yaml`:

| Service | Source | What it serves |
|---|---|---|
| `goable-sg` | `Dockerfile` / `cloudbuild.yaml` (repo root) | The Next.js frontend (`frontend/`) — pages, and its own server-side routes (`/api/places/search`, `/api/transport/facilities`) |
| `journeyahead-backend` | `backend/Dockerfile` / `backend/cloudbuild.yaml` | The standalone Express backend (`backend/`) — LTA DataMall, OneMap journey planning, weather; see `backend/docs/` |

The frontend calls the backend server-side only (`frontend/src/lib/backend.server.ts`,
via `BACKEND_BASE_URL`) — the browser never talks to the backend directly. **Deploy
the backend first**, then pass its URL to the frontend deploy. **Firebase Auth and
Firestore are unaffected** by any of this: they're reached directly from the browser
via the Firebase Web SDK, so they keep working regardless of where either server is
hosted.

### Two classes of environment variables

This distinction matters for containerized builds:

| Variable | When it's needed | How it's provided |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_*`, `NEXT_PUBLIC_MAP_STYLE_URL` | **Build time** — inlined into the browser bundle | Docker `--build-arg` / Cloud Build substitutions (not secret) |
| `ONEMAP_API_KEY` *or* `ONEMAP_API_EMAIL` + `ONEMAP_API_PASSWORD` | **Runtime** — read per request by the server | Cloud Run env vars, ideally from Secret Manager (secret) |

The `NEXT_PUBLIC_*` Firebase values are safe to expose (they identify the project,
they don't authorize access — Firestore is protected by `firestore.rules`). The
OneMap credentials are genuinely secret and must **never** be baked into the image.

### Files that support this

- `Dockerfile` / `backend/Dockerfile` — multi-stage builds (`deps` → `builder` →
  `runner`) on `node:22-alpine`. The frontend's produces Next.js `standalone` output
  (`output: 'standalone'` in `frontend/next.config.mjs`); the backend's produces a
  plain compiled `dist/`. Both run as a non-root user, binding to Cloud Run's `$PORT`.
- `.dockerignore` / `backend/.dockerignore` — keep each build context lean and block
  `.env*` / credential files.
- `cloudbuild.yaml` / `backend/cloudbuild.yaml` — Cloud Build pipelines: build → push
  to Artifact Registry → deploy. Both push into the same `goable` repo, as
  differently-named images.

### One-time setup

```bash
# 0. Point gcloud at the project
gcloud config set project qwiklabs-gcp-01-b44b1b3e27c1

# 1. Enable the required APIs
gcloud services enable run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com

# 2. Create an Artifact Registry repo (matches both cloudbuild.yaml files' _REPOSITORY/_REGION)
gcloud artifacts repositories create goable \
  --repository-format=docker --location=asia-southeast1

# 3. Store credentials as secrets: LTA_ACCOUNT_KEY (backend) and OneMap
#    (shared by both — frontend place-search, backend journey planning).
#    OneMap: use whichever auth you have — a static key, or an email/password pair.
printf '%s' 'YOUR_LTA_ACCOUNT_KEY'  | gcloud secrets create LTA_ACCOUNT_KEY --data-file=-
printf '%s' 'YOUR_ONEMAP_API_KEY'   | gcloud secrets create ONEMAP_API_KEY --data-file=-
#    …or the email/password pair instead of ONEMAP_API_KEY:
printf '%s' 'you@example.com'      | gcloud secrets create ONEMAP_API_EMAIL --data-file=-
printf '%s' 'your-onemap-password' | gcloud secrets create ONEMAP_API_PASSWORD --data-file=-

# 4. Let Cloud Run's runtime service account read those secrets
PROJECT_NUMBER=$(gcloud projects describe qwiklabs-gcp-01-b44b1b3e27c1 --format='value(projectNumber)')
for S in LTA_ACCOUNT_KEY ONEMAP_API_KEY ONEMAP_API_EMAIL ONEMAP_API_PASSWORD; do
  gcloud secrets add-iam-policy-binding "$S" \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role=roles/secretmanager.secretAccessor 2>/dev/null || true
done
```

> Both `cloudbuild.yaml` files' `--set-secrets` lines currently reference only
> `ONEMAP_API_KEY` (the static-key auth method this project deploys with). If you
> instead use the email/password pair, add `ONEMAP_API_EMAIL` / `ONEMAP_API_PASSWORD`
> to those lines and create those secrets in step 3.

### Deploying the backend

Deploy this **first** — the frontend needs its URL:

```bash
cd backend
gcloud builds submit --config cloudbuild.yaml .
cd ..

BACKEND_URL=$(gcloud run services describe journeyahead-backend --region=asia-southeast1 \
  --format='value(status.url)')
echo "$BACKEND_URL"   # you'll need this for the frontend deploy below

curl -s -o /dev/null -w "backend health: %{http_code}\n" "$BACKEND_URL/health"
curl -s "$BACKEND_URL/api/transport/facilities" | head -c 300   # live LTA data
```

The current live deployment is **https://journeyahead-backend-itds4upurq-as.a.run.app**.

### Build and deploy the frontend

Pass your real Firebase web-config values, and the backend URL from above, as
substitutions:

```bash
gcloud builds submit --config cloudbuild.yaml --substitutions=\
_NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key,\
_NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com,\
_NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id,\
_NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com,\
_NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id,\
_NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id,\
_BACKEND_BASE_URL=$BACKEND_URL
```

Cloud Build then builds the image, pushes it to Artifact Registry, and deploys the
`goable-sg` Cloud Run service. When it finishes, grab the public URL with:

```bash
gcloud run services describe goable-sg --region=asia-southeast1 \
  --format='value(status.url)'
```

The current live deployment is **https://goable-sg-itds4upurq-as.a.run.app**.

Verify the frontend, its own routes, and its proxy through to the backend:

```bash
BASE=https://goable-sg-itds4upurq-as.a.run.app
curl -s -o /dev/null -w "home: %{http_code}\n" "$BASE/"
curl -s "$BASE/api/places/search?q=hougang" | head -c 200        # live OneMap results
curl -s "$BASE/api/transport/facilities" | head -c 300           # proxied through to the backend
```

> **Gotchas this project already worked around** (baked into the config, noted
> here so a fresh clone — or the next monorepo restructure — doesn't rediscover
> them):
> - `cloudbuild.yaml` tags the image with a `_TAG` substitution (default `latest`)
>   rather than `$SHORT_SHA`. `SHORT_SHA` is empty for a manual `gcloud builds submit`,
>   which produces an invalid `image:` reference and fails the build.
> - **The Dockerfile builds `frontend/`, which has no `frontend/package.json` of its
>   own.** Because of that, `next build` resolves `node_modules` from the repo root,
>   so Next.js infers the *repo root* as the workspace root and nests its standalone
>   output accordingly: `server.js` ends up at
>   `frontend/.next/standalone/frontend/server.js`, not
>   `frontend/.next/standalone/server.js`. Every `COPY` in the runtime stage — and
>   the `mkdir -p frontend/public` step that ensures a (currently nonexistent)
>   `public/` dir exists to copy — accounts for that extra nesting. Confirmed by
>   running an actual local build and inspecting where the file landed — don't
>   "simplify" these paths without re-checking that first.
> - **The repo-root `package.json` has `"type": "module"`** (needed by `backend/`'s
>   own tooling, irrelevant to the frontend). Next's standalone output emits only
>   one generated `package.json`, mirroring that root one — so without a
>   `frontend/package.json` of its own, Node resolves `frontend/server.js`'s module
>   type from the root one and fails at startup ("`require` is not defined in ES
>   module scope"), since `server.js` is actually CommonJS. The Dockerfile writes a
>   minimal `frontend/package.json` (`{"type":"commonjs"}`) into the image after
>   copying the standalone output, specifically to override that resolution before
>   Node walks further up the tree. Verified by actually running the built image
>   locally (`docker run`) — a build that succeeds is not enough to prove the
>   container starts; this bug only shows up at container *runtime*.

### Add the Cloud Run URL to Firebase Auth

Firebase Authentication only allows sign-in from domains on its allow-list, so the
deployed site needs its Cloud Run host added or email/password sign-in fails with
`auth/unauthorized-domain`. Add the host under **Firebase Console → Authentication →
Settings → Authorized domains → Add domain**:

```
goable-sg-itds4upurq-as.a.run.app
```

(There is no `firebase` CLI command for authorized domains — it's Console-only, or
via the Identity Toolkit Admin API. This is a manual one-time step per deploy host.)

### Building the images locally (optional)

Both Dockerfiles set `PORT=8080` internally (matching what Cloud Run injects), so
`docker run` needs no extra env var for that — just map the port.

```bash
# Frontend
docker build -t goable-sg \
  --build-arg NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key \
  --build-arg NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com \
  --build-arg NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id \
  --build-arg NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com \
  --build-arg NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id \
  --build-arg NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id \
  .

# Run it, injecting OneMap creds + the backend URL at runtime
# (mirrors Cloud Run's secret/env-var wiring — point BACKEND_BASE_URL at a
# locally-running backend, e.g. via `host.docker.internal`, or a deployed one)
docker run --rm -p 8080:8080 \
  -e ONEMAP_API_KEY=your_onemap_key \
  -e BACKEND_BASE_URL=http://host.docker.internal:8081 \
  goable-sg
# open http://localhost:8080

# Backend (separate image, self-contained build context = backend/)
cd backend
docker build -t journeyahead-backend .
docker run --rm -p 8081:8080 \
  -e LTA_ACCOUNT_KEY=your_lta_account_key \
  -e ONEMAP_API_KEY=your_onemap_key \
  journeyahead-backend
# open http://localhost:8081/health
```

> **Firestore stays on Firebase.** Only `firestore.rules` remains in `firebase.json`;
> deploy rule changes with `firebase deploy --only firestore:rules`. The old static
> `hosting` block was removed because the app is no longer statically exported. The
> previous Firebase Hosting site (`qwiklabs-gcp-01-b44b1b3e27c1-c0b09.web.app`) has
> been disabled (`firebase hosting:disable`) so it no longer serves a stale static
> build — Cloud Run is the single source of truth.

---

## 7. Project Structure

This is a monorepo with two independently deployed services:

```
synergeee-ltahack/
├── frontend/                         # Next.js app (Cloud Run service: goable-sg)
│   └── src/
│       ├── app/                      # Routes: /login, /signup, /forgot-password, /onboarding,
│       │                             #   / (home), /directions, /bus, /profile, /journey/compare,
│       │                             #   /journey/guide, and API route handlers under /app/api
│       ├── components/                # auth, layout, journey, journey-editor, accessibility,
│       │                             #   alerts, map (MapLibre), bus, profile, assistant,
│       │                             #   notifications, weather, ui
│       ├── features/                  # auth (AuthContext/AuthGuard), demo, journeys, preferences
│       ├── hooks/                     # useJourneyPlan, useSavedJourneyRoute, useNotificationCenter, …
│       ├── lib/                       # firebase.ts, backend.server.ts, onemap.server.ts,
│       │                             #   journeyMigration.ts, itineraryRanking.ts, utils.ts, …
│       ├── fixtures/                   # sample/demo data (e.g. mdm-lim.ts)
│       └── types/                      # shared TypeScript interfaces
├── backend/                          # Standalone Express API (Cloud Run service: journeyahead-backend)
│   ├── src/
│   │   ├── routes/                    # journey.route.ts and other Express routes
│   │   ├── services/journeyPlanning/  # adapter, enrich, normalise, recommend, uncertainty, service
│   │   ├── services/{busArrival,busReference,facilitiesMaintenance,pcdForecast,pcdRealTime,trainServiceAlerts,weather,geospatial}/
│   │   ├── lta/, onemap/, weather/, geo/, models/, config/, middleware/, utils/
│   │   └── index.ts                   # loads backend/.env then ../.env, starts the Express server
│   └── docs/                          # LTA_INTEGRATION.md, JOURNEY_PLANNING.md, etc.
├── firestore.rules                   # Production Firestore security rules
├── .env.example                      # Sample env vars for both services (see §0 Configuration)
├── Dockerfile / cloudbuild.yaml       # Frontend Cloud Run build (repo root, builds frontend/)
├── backend/Dockerfile / backend/cloudbuild.yaml  # Backend Cloud Run build
└── package.json                      # Root scripts: dev/build/start (frontend), backend:* (backend)
```

For the full file-by-file breakdown of either service, browse [`frontend/src`](./frontend/src) or [`backend/src`](./backend/src) directly — this monorepo evolves quickly enough that a hand-maintained exhaustive tree goes stale fast.

---

## 8. Design System & Accessibility Notes

- **Civic Transit Visual Language**: Follows the Singapore civic transit color palette with deep transit blue (`#004b87`), mobility teal (`#00847f`), pale blue-grey surfaces (`#f4f6f9`), high-contrast dark text (`#0f172a`), clean card borders (`#e2e8f0`), and standard masthead headers.
- **Dynamic Text Sizing**: Text size switches update `<html data-text-size="...">`, which adjusts base rem metrics (`16px`, `18.5px`, `21px`). All component paddings and font sizes are defined with rem units, guaranteeing no layout breaking, zero horizontal scroll, and clear visual hierarchy on small screens.
- **WCAG 2.1 AA Compliance**:
  - Touch targets $\ge 44 \times 44\text{ px}$ across all interactive switches, buttons, and segmented radios.
  - Visible keyboard focus rings (`focus-visible:ring-2 focus-visible:ring-[#004b87]`).
  - Screen reader semantic attributes (`role="switch"`, `aria-checked`, `role="radiogroup"`, `aria-label`).
  - Text and icon contrast ratios $\ge 4.5:1$ against backgrounds.
