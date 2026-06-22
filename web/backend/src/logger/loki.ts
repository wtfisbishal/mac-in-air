import winston from "winston";
import LokiTransport from "winston-loki";
 
export const logger = winston.createLogger({

  level: process.env.NODE_ENV === "production"? "info": "debug",

  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),

  transports: [
    new winston.transports.Console(),
    new LokiTransport({
    //   host: process.env.LOKI_HOST!,
      host: "http://localhost:3100",
      labels: {
        app: "backend-mac",
        service: "socket-server",
        // env: process.env.NODE_ENV
      },

      json: true,

      batching: true,

      interval: 5,

      replaceTimestamp: true,

      onConnectionError: (err) => {
        console.error("Loki error:", err);
        return false; // Prevents the error from being thrown and crashing the application
      }
    })
  ]
});