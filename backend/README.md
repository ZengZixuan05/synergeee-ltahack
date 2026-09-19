# Backend

Backend services for JourneyAheadSG - Smart Commuter Companion for Singapore.

## Structure

- `src/routes/` - API route handlers
- `src/middleware/` - Express/server middleware
- `src/utils/` - Utility functions and helpers
- `src/models/` - Data models and database schemas
- `src/services/` - Business logic and external service integrations

## Setup

This folder is prepared for backend services. You can:

1. **Add a Node.js/Express API server** - Create your backend API here
2. **Add Firebase Functions** - Use Cloud Functions for serverless backend
3. **Add other services** - Integrate with third-party backends

## Getting Started

When you're ready to add backend services, you can:

```bash
# Create a package.json in this folder
npm init -y

# Install dependencies
npm install express

# Create src/index.ts or src/server.ts to start building
```

## Notes

- The frontend Next.js app handles API routes and authentication via Firebase
- Consider what API/business logic should live here vs. in the frontend's Next.js API routes
- Environment variables are shared at the root `.env` file
