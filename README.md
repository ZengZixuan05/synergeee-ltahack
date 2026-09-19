# JourneyAheadSG — Smart Commuter Companion for Singapore

> **LTA Hackathon Frontend UI Prototype**  
> Proactive, personalised journey recommendations for Singapore commuters when transport conditions change.

---

## 0. Quickstart for Judges

This is a two-service app: a **Next.js frontend** (`frontend/`) and an **Express backend** (`backend/`) that proxies LTA DataMall, OneMap, and weather data. Both must be running for the full experience (Firebase auth alone will work even without the backend).

### Prerequisites

- **Node.js 20 LTS or newer** — check with `node -v`
- **npm 9+** (bundled with Node)
- A free **Firebase** project (for account creation / login) — instructions below
- A free **LTA DataMall** account key and a free **OneMap** account (for live bus/rail/weather data) — instructions below

### Install & run

```bash
git clone <this-repo-url>
cd synergeee-ltahack

# Install frontend deps (declared in the root package.json)
npm install

# Install backend deps (its own package.json)
cd backend && npm install && cd ..

# Create your local env files (see Configuration below for what to fill in)
cp .env.example frontend/.env.local
cp .env.example backend/.env
```

Then, in two separate terminals:

```bash
# Terminal 1 — backend, http://localhost:8081
npm run backend:dev
```

```bash
# Terminal 2 — frontend, http://localhost:3000
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in a browser (use responsive/device mode — this is a mobile-first UI).

> Note the env files go in `frontend/.env.local` and `backend/.env`, **not** a `.env.local` at the repo root — `npm run dev` changes into `frontend/` before starting Next.js, and the backend's `dotenv` config reads `backend/.env` first. Copying `.env.example` to both locations, as above, is the reliable path.

### Configuration

All variables are listed with placeholder values in [`.env.example`](./.env.example). Copy it to `frontend/.env.local` and `backend/.env` and fill in real values:

| Variable(s) | Used by | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID` | Frontend — account creation, login, profile storage | Free at [console.firebase.google.com](https://console.firebase.google.com/) → create a project → enable **Authentication → Email/Password** and **Firestore Database**. Full step-by-step is in [§6](#6-firebase-authentication--firestore-setup) below. |
| `LTA_ACCOUNT_KEY` | Backend — live bus arrivals, train alerts, facilities | Free at [datamall.lta.gov.sg](https://datamall.lta.gov.sg/content/datamall/en/request-for-api.html) — register with any email, the key arrives by email within minutes. |
| `ONEMAP_API_KEY` **or** `ONEMAP_API_EMAIL` + `ONEMAP_API_PASSWORD` | Frontend (place search) and backend (journey planning) | Free account at [onemap.gov.sg](https://www.onemap.gov.sg/) — either grab a static API key from your account, or just use your email/password (the app exchanges it for a token automatically). |
| `NEXT_PUBLIC_MAP_STYLE_URL`, `ONEMAP_BASE_URL`, `WEATHER_BASE_URL`, `BACKEND_BASE_URL`, `*_CACHE_TTL_MS` | Both | Optional — sensible defaults are already set; leave unset unless you need to override them. |

Without Firebase keys the app still loads (auth is skipped locally), but you won't be able to create an account or log in. Without `LTA_ACCOUNT_KEY`/OneMap keys, the backend still starts but live routing/bus/alerts/weather calls will fail.

### What to click — account creation & login (first journey to try)

1. Open **http://localhost:3000** — you're redirected to `/login` since you're not signed in.
2. Click **"Sign up"** (or go straight to `/login → Create account`).
3. Fill in **full name, email, password, confirm password** (password must be ≥ 6 characters — any values work, this is a demo, not a real account).
4. Submit. You're taken through the **5-step onboarding wizard** (travel priorities, accessibility needs, walking pace, text size) — this is required once per account before you reach the app.
5. After onboarding you land on the **Home** screen, now signed in.
6. To log in again later (e.g. a fresh browser session): go to `/login` and enter the same email/password you signed up with.
7. To reset a forgotten demo password: `/forgot-password` sends a Firebase password-reset email.
8. To try the core feature: go to **Directions** (bottom nav), search an origin and destination (e.g. "Bedok", "Singapore General Hospital"), and tap **"Plan journey"** to see live LTA routing, bus arrivals, alerts, and weather.

> Optional shortcut for evaluating accessibility features: after signing up and completing onboarding, go to **Profile → Account & Session → "Load Mdm Lim Demo Profile"** to instantly apply the hackathon's accessibility demo persona (see [§2](#2-hackathon-persona-mdm-lim)) to your own account.

---

## 1. Project Overview & Purpose

**JourneyAheadSG** is a **general commuter application** built for Singapore public transport users. While standard transit apps broadcast generic network alerts (e.g., *"East-West Line delays due to track maintenance"*), **JourneyAheadSG** transforms public transit data into **actionable, personal decision support**. 

### The Core Principle
> *"Do not tell commuters only what happened. Tell them what they should do."*

When lifts break down, weather shifts, or crowds build, commuters should not have to manually re-route in panic or puzzle out alternative station exits. JourneyAheadSG proactively evaluates their saved routines against barrier-free, sheltered, and crowding constraints and delivers clear, actionable recommendations with precise trade-offs before they even step out the door.

---

## 2. Hackathon Persona: Mdm Lim

While JourneyAheadSG is designed for all commuters (daily office workers, parents with strollers, students, shoppers), our primary demonstration persona is **Mdm Lim**:

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

## 4. Features & Roadmap

### ✅ Implemented Features
- [x] **Firebase Authentication (Email + Password Only)**: Secure authentication without third-party OAuth, session persistence on page refresh, and route guarding.
- [x] **Cloud Firestore User Profiles (`users/{uid}`)**: Stores commuter identity, travel priorities, and mobility constraints with user-level security rules.
- [x] **5-Step Commuter Onboarding Wizard (`/onboarding`)**: Configures journey priorities, accessibility requirements, walking pace, and display scale.
- [x] **Authentication Pages**: Mobile-first Sign in (`/login`), Sign up (`/signup`), and Password Reset (`/forgot-password`) with friendly error translation.
- [x] **Interactive Demo Mode Toggle** (`Normal` vs. `Demo disruption`) allowing live testing of proactive rerouting.
- [x] **Home Dashboard** with personalised greeting, hero journey card, secondary transport alerts, and floating voice assistant trigger.
- [x] **Directions & Planner Screen** (`/directions`) with a real interactive MapLibre GL JS map on an OpenStreetMap base, real Singapore place search (OneMap) with an origin/destination combobox that plots verified results on the map and auto-fits the camera, and a "Plan journey" flow that collapses the form into a compact editable summary. Route calculation itself is not implemented yet — see "Known limitations".
- [x] **Route Comparison Screen** (`/journey/compare`) answering *"What changed and what will it cost me?"* with side-by-side trade-offs.
- [x] **Guided Journey Screen** (`/journey/guide`) with 8-step one-handed sequential guidance, lift warnings, and completion state.
- [x] **Profile & Preferences Screen** (`/profile`) supporting saved routines, walking pace, max continuous walk distance, accessibility filters, language selection, and notification controls.
- [x] **Live Text Size Scaling** (`Standard`, `Large`, `Extra Large`) responding dynamically via root font rem scaling without layout clipping.
- [x] **Voice Assistant Bottom Sheet UI** featuring sample commuter query chips and simulation feedback.

### 🚀 Roadmap: Cloud Deployment & Live APIs
- [ ] **Google Cloud Platform (GCP)**: Deployment and hosting (Cloud Run / containerized services).
- [ ] **LTA DataMall Integration**: Live bus arrival timings, train service status, station facilities, and lift availability feeds.
- [ ] **Multimodal routing**: computing an actual walking/MRT/bus route between the selected origin and destination, and drawing it on the map. OneMap is already integrated for place search/geocoding (see below); only the routing calculation itself remains.

---

## 4a. Map & Directions: how it works

- **Map rendering**: [MapLibre GL JS](https://maplibre.org/) draws the map. It's loaded from its own CDN build (`https://cdn.jsdelivr.net/npm/maplibre-gl@.../dist/maplibre-gl.mjs`) rather than bundled by webpack — MapLibre v6 spins up its tile worker via a `new Worker(new URL(...))` pattern that Next's webpack build doesn't rewrite for a pre-built dependency, which silently breaks tile loading (only the flat background layer renders, no roads/labels). Loading the unbundled CDN build sidesteps this entirely; see the comment in `src/components/map/MapView.tsx`.
- **Map base / tiles**: [OpenStreetMap](https://www.openstreetmap.org/copyright) data, served as a free MapLibre style by [OpenFreeMap](https://openfreemap.org) (`https://tiles.openfreemap.org/styles/liberty`) — a CDN built specifically so apps don't hot-link OSM's own tile servers. **"© OpenStreetMap contributors" is always shown** on the map (a non-collapsing `AttributionControl`), alongside OpenFreeMap/OpenMapTiles credit. The style URL is configurable via `NEXT_PUBLIC_MAP_STYLE_URL` so the provider can change later without touching any Directions code.
- **Place search / geocoding**: [OneMap](https://www.onemap.gov.sg/apidocs/) — Singapore's official geospatial API. A debounced combobox (`src/components/map/LocationCombobox.tsx`) calls a Next.js Route Handler at `/api/places/search`, which authenticates to OneMap server-side (`src/lib/onemap.server.ts`) and returns normalised results (an internal `Place` type — label, address, latitude, longitude, source — never OneMap's raw response shape). OneMap credentials never reach the browser.
- **Saved/regular journeys**: unaffected. A saved journey's origin/destination are still plain text; selecting one via the "Your regular routes" quick-fill chips populates the text fields but does **not** invent coordinates for them — the map only plots a location once it's been searched and picked from real results.
- **No fake routing**: after "Plan journey", the map frames both points but the status card explicitly reads "Ready to plan route — Route calculation will be connected next." No distance/time/route-line is fabricated.

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

## 6. Firebase Authentication & Firestore Setup

JourneyAheadSG uses **Firebase Authentication** (strictly Email + Password) for commuter identity and **Cloud Firestore** for user profile and preference persistence.

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

To evaluate the application using the Mdm Lim scenario without hard-coding passwords in Git:
1. Navigate to `/signup` and create an account with any email/password of your choice.
2. Complete the initial 5-step onboarding wizard.
3. Navigate to **Profile** (`/profile`).
4. Under **Account & Session**, click **"Load Mdm Lim Demo Profile"**.
5. This automatically populates your authenticated Firestore user profile with Mdm Lim's mobility settings (slow walking pace, 100% step-free routing, verified operational lifts required) without committing any credentials to Git.

### OneMap Configuration (Map & Directions place search)

The map itself needs no API key — only the place-search combobox does. Add to `.env.local` **either**:
```env
ONEMAP_API_KEY=your_onemap_static_api_key_here
```
**or** an email/password pair registered at [onemap.gov.sg](https://www.onemap.gov.sg/), which the server exchanges for a short-lived token automatically:
```env
ONEMAP_API_EMAIL=your_onemap_api_email_here
ONEMAP_API_PASSWORD=your_onemap_api_password_here
```
`ONEMAP_BASE_URL` defaults to `https://www.onemap.gov.sg` and rarely needs changing. None of these are `NEXT_PUBLIC_*` — they're read only by the server (`src/lib/onemap.server.ts`) and never sent to the browser. The map's tile style can optionally be overridden with `NEXT_PUBLIC_MAP_STYLE_URL` (public, since it's just a style URL, not a secret).

### Known limitations

- **Requires a Node server, not static export.** The place-search API route (`/api/places/search`) needs to run OneMap authentication server-side per request. Next.js does not support that under `output: 'export'` — not even in `next dev` (it 500s). This build therefore no longer produces a static `out/` folder for `firebase.json`'s Hosting-only deploy; it needs a Node runtime such as Cloud Run, or Firebase Hosting's web-frameworks/Cloud Functions integration — which is what this project's own roadmap already called for next.
- **No route calculation yet.** Selecting an origin and destination plots them on the map and fits the camera to both, but no walking/MRT/bus route is computed or drawn. The status card says so explicitly rather than showing fabricated timing or distance.
- **Saved journeys without coordinates stay text-only.** Regular routes created before this milestone (or any journey whose origin/destination was never searched) have no stored latitude/longitude, so quick-filling one from the Directions screen won't place a marker until the location is searched and selected again.

---

## 6a. Deploying to Google Cloud Run

Because the app now needs a Node runtime (see "Known limitations"), it deploys as
containers on **Cloud Run** rather than as a static Firebase Hosting site. This is
now **two separate Cloud Run services**, each with its own Dockerfile/`cloudbuild.yaml`:

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
curl -s "$BASE/api/places/search?q=bedok" | head -c 200          # live OneMap results
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

```
synergeee-ltahack/
├── src/
│   ├── app/
│   │   ├── layout.tsx                # Root layout with AuthProvider, DemoProvider, AppShell
│   │   ├── page.tsx                  # Home screen (Hero Journey & Alerts)
│   │   ├── login/page.tsx            # Email/password authentication login screen
│   │   ├── signup/page.tsx           # Account registration screen
│   │   ├── forgot-password/page.tsx  # Password recovery screen
│   │   ├── onboarding/page.tsx       # 5-step commuter onboarding wizard
│   │   ├── directions/page.tsx       # Directions, search inputs, & route options
│   │   ├── profile/page.tsx          # Saved journeys, accessibility, & demo session
│   │   ├── journey/
│   │   │   ├── page.tsx              # Index redirect
│   │   │   ├── compare/page.tsx      # Route trade-off comparison screen
│   │   │   └── guide/page.tsx        # 8-step guided navigation screen
│   │   └── globals.css               # Civic transit theme, font scaling, & safe area insets
│   ├── components/
│   │   ├── auth/
│   │   │   ├── AuthCard.tsx          # Branded civic card container for auth screens
│   │   │   └── PasswordInput.tsx     # Accessible password field with visibility toggle
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
│   │       ├── Button.tsx            # Civic accessible button (>=44px touch)
│   │       ├── Card.tsx              # Bordered accessible container
│   │       └── Badge.tsx             # Generic status badge
│   ├── features/
│   │   ├── auth/
│   │   │   ├── AuthContext.tsx       # Firebase Auth & Firestore profile state
│   │   │   ├── AuthGuard.tsx         # Route protector & session loader
│   │   │   └── useAuth.ts            # Convenience hook for authentication
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
│   │   ├── firebase.ts               # Firebase App, Auth, & Firestore initialization
│   │   ├── auth-errors.ts            # Human-friendly auth error message translations
│   │   ├── constants.ts              # App titles, routes, and text size options
│   │   ├── utils.ts                  # Class merge & unit formatting helpers
│   │   └── accessibility.ts          # Crowding & typography definitions
│   └── types/
│       ├── auth.ts                   # UserProfile & OnboardingFormState interfaces
│       └── index.ts                  # Shared TypeScript interfaces
├── firestore.rules                   # Production Firestore security rules
├── .env.example                      # Sample Firebase configuration environment variables
├── package.json                      # Dependencies and npm scripts
├── tsconfig.json                     # TypeScript configuration with path aliases
├── tailwind.config.js                # Tailwind configuration with civic transit design tokens
├── postcss.config.js                 # PostCSS setup
└── eslint.config.mjs                 # Flat ESLint 9 configuration with TS parser
```

---

## 8. Design System & Accessibility Notes

- **Civic Transit Visual Language**: Follows the Singapore civic transit color palette with deep transit blue (`#004b87`), mobility teal (`#00847f`), pale blue-grey surfaces (`#f4f6f9`), high-contrast dark text (`#0f172a`), clean card borders (`#e2e8f0`), and standard masthead headers.
- **Dynamic Text Sizing**: Text size switches update `<html data-text-size="...">`, which adjusts base rem metrics (`16px`, `18.5px`, `21px`). All component paddings and font sizes are defined with rem units, guaranteeing no layout breaking, zero horizontal scroll, and clear visual hierarchy on small screens.
- **WCAG 2.1 AA Compliance**:
  - Touch targets $\ge 44 \times 44\text{ px}$ across all interactive switches, buttons, and segmented radios.
  - Visible keyboard focus rings (`focus-visible:ring-2 focus-visible:ring-[#004b87]`).
  - Screen reader semantic attributes (`role="switch"`, `aria-checked`, `role="radiogroup"`, `aria-label`).
  - Text and icon contrast ratios $\ge 4.5:1$ against backgrounds.