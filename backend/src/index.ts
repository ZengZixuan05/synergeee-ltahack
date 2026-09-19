import path from 'node:path';
import dotenv from 'dotenv';

// This backend is a standalone service, but the monorepo's environment
// variables live in the repo-root `.env` (see MONOREPO.md). Load an
// optional backend-local `.env` first (for a backend-only override, if one
// is ever needed), then the shared root `.env` as a fallback — dotenv never
// overwrites a variable that's already set, and in Cloud Run these are real
// injected env vars/secrets, so neither file needs to exist there.
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { createApp } from './app';
import { getPort, isLtaConfigured } from './config/env';
import { logSafe } from './utils/logger';

const app = createApp();
const port = getPort();

app.listen(port, () => {
  logSafe('backend.started', { port, ltaConfigured: isLtaConfigured() });
});
