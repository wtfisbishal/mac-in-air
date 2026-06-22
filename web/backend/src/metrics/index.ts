import client from 'prom-client'; 
export const register = new client.Registry();
 
client.collectDefaultMetrics({ register });
 
// Total HTTP requests broken down by method, route, and status code.
export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests received',
  labelNames: ['method', 'route', 'status_code'] as const,
  registers: [register],
});

// HTTP request duration histogram (seconds).
export const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'] as const,
  buckets: [ 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});
 
// WebSocket / Socket.IO Metrics 

// Gauge: number of currently active WebSocket connections. 
export const wsConnectionsActive = new client.Gauge({
  name: 'ws_connections_active',
  help: 'Number of currently active WebSocket connections',
  labelNames: ['role'] as const, // 'desktop' | 'frontend'
  registers: [register],
});

  
// Counter: total WebSocket disconnections. 
export const wsDisconnectionsTotal = new client.Counter({ //not work yes 
  name: 'ws_disconnections_total',
  help: 'Total WebSocket disconnections since server start',
  labelNames: ['role', 'reason'] as const,
  registers: [register],
});

// Histogram: bytes transferred per screen-frame event. 
export const wsFrameBytesHistogram = new client.Histogram({
  name: 'ws_screen_frame_bytes',
  help: 'Size of screen-frame payloads in bytes',
  buckets: [1024, 8192, 32768, 131072, 524288, 1048576, 4194304],
  registers: [register],
}); 

// Counter: WebRTC signalling events relayed. 
export const wsWebRtcEventsTotal = new client.Counter({
  name: 'ws_webrtc_events_total',
  help: 'Total WebRTC signalling events relayed (offer / answer / ice)',
  labelNames: ['signal_type', 'direction'] as const, // direction: 'desktop→frontend' | 'frontend→desktop'
  registers: [register],
});

export const serverErrorsTotal = new client.Counter({
  name: 'server_errors_total',
  help: 'Total server errors',
  labelNames: ['type'] as const,
  registers: [register],
});
 