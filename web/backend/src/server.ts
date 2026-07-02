import express from 'express';
import http from 'http';
import cors from 'cors';
import { initSocket } from './socket';
import healthRouter from './routes/health';
import authRouter from './routes/auth';
import devicesRouter from './routes/devices';
import pairRouter from './routes/pair';
import metricsRouter from './routes/metrics';
import { httpMetricsMiddleware } from './middleware/metrics';
import { globalRateLimiter } from './middleware/rateLimiter';
import { configDotenv } from 'dotenv';

configDotenv();

const PORT = process.env.PORT;
const app = express();
const httpServer = http.createServer(app);

// Trust the first proxy so req.ip reflects the real client IP (X-Forwarded-For)
app.set('trust proxy', 1);

app.use(cors({
  origin: '*', // Tighten in production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

//   Prometheus HTTP instrumentation (must come before routes)  
app.use(httpMetricsMiddleware);

// Global rate limiter — 100 req / 1 min per IP (fail-open on Redis errors)
app.use(globalRateLimiter);

// Application routes 
app.use('/health', healthRouter);
app.use('/auth', authRouter);
app.use('/devices', devicesRouter);
app.use('/pair', pairRouter);

// Prometheus scrape endpoint 
app.use('/metrics', metricsRouter);

 app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Server] Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`[Server] Running on port ${PORT}`);
});