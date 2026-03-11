import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug"),
  formatters: {
    level: (label) => ({ level: label }),
  },
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "*.password",
    "*.email",
    "*.apiKey",
    "*.api_key",
    "*.token",
  ],
  timestamp: pino.stdTimeFunctions.isoTime,
});
