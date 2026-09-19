# JourneyAheadSG — Project Structure

This is a monorepo that separates frontend and backend code.

## Directory Layout

```
.
├── frontend/                 # Next.js frontend application
│   ├── src/
│   │   ├── app/            # Next.js pages and API routes
│   │   ├── components/     # React components
│   │   ├── features/       # Feature modules
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities and library code
│   │   ├── types/          # TypeScript type definitions
│   │   └── fixtures/       # Test data
│   ├── next.config.mjs
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── README.md           # Frontend-specific documentation
│
├── backend/                  # Backend services (optional)
│   ├── src/
│   │   ├── routes/         # API handlers
│   │   ├── middleware/     # Middleware
│   │   ├── services/       # Business logic
│   │   ├── models/         # Data models
│   │   └── utils/          # Utilities
│   └── README.md           # Backend-specific documentation
│
├── package.json            # Root package.json with monorepo scripts
├── .env                    # Environment variables (shared)
└── MONOREPO.md            # This file
```

## Running Commands

All npm scripts should be run from the root directory:

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Run tests
npm run test
```

The scripts automatically navigate to the appropriate folder (frontend by default).

## Adding Backend Services

The `backend/` folder is set up and ready for you to add services. See [backend/README.md](backend/README.md) for more details.

## Environment Variables

Environment variables are defined in the root `.env` file and are available to both frontend and backend. Create a `.env.local` file for local overrides.
