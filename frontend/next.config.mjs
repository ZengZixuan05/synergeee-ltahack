/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Emit a minimal, self-contained server bundle (.next/standalone) so the
  // Cloud Run container can run without the full node_modules tree. See the
  // Dockerfile — it copies .next/standalone + .next/static + public and runs
  // `node server.js` bound to Cloud Run's injected $PORT.
  output: 'standalone',
  // NOTE: `output: 'export'` was removed here — see README "Known
  // limitations" for why. In short: the Directions screen's OneMap place
  // search needs a real server-side route (src/app/api/places/search) to
  // keep OneMap credentials out of the browser, and Next.js refuses to
  // serve a dynamic Route Handler under static export — not just on
  // `next build`, but even in `next dev` (it 500s with "export const
  // dynamic ... not configured ... with output: export"). Deploying this
  // app now requires a Node runtime (e.g. Cloud Run, or Firebase Hosting's
  // web-frameworks/Cloud Functions integration) instead of the previous
  // "next build && firebase deploy" static-hosting pipeline in
  // firebase.json — which already matches this project's own GCP roadmap.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

