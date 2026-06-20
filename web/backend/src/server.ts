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

const PORT = process.env.PORT || 4000;
const app = express();
const httpServer = http.createServer(app);

app.use(cors({
  origin: '*', // Tighten in production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

//   Prometheus HTTP instrumentation (must come before routes)  
app.use(httpMetricsMiddleware);

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