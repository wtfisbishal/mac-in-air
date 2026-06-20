 
// records HTTP request count, duration , requests for every route the server handles.
 

import { Request, Response, NextFunction } from 'express';
import {
  httpRequestsTotal,
  httpRequestDurationSeconds,
} from '../metrics';
 
function normaliseRoute(req: Request): string {
  // Prefer the matched route pattern when Express has resolved it
  if (req.route?.path) {
    const base = req.baseUrl ?? '';
    return base + req.route.path;
  }
  // Fall back to the raw path, but strip UUIDs and numeric IDs
  return req.path
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id')
    .replace(/\/\d+/g, '/:id');
}

export function httpMetricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const startTime = process.hrtime.bigint();

  // httpRequestsInFlight.inc({ method: req.method });

  res.on('finish', () => {
    const durationNs = process.hrtime.bigint() - startTime;
    const durationSec = Number(durationNs) / 1e9;

    const route = normaliseRoute(req);
    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode),
    };

    httpRequestsTotal.inc(labels);
    httpRequestDurationSeconds.observe(labels, durationSec);
    // httpRequestsInFlight.dec({ method: req.method });
  });

  next();
}
