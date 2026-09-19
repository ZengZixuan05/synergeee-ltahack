import { Router } from 'express';

// Plain liveness endpoint — intentionally has no dependency on LTA or any
// other external service, and no auth requirement, so load balancers/Cloud
// Run health checks never fail because a third-party API is down.
export const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});
