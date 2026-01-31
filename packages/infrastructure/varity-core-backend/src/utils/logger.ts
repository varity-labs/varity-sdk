/**
 * Varity Logger Utility
 * PROPRIETARY - DO NOT DISTRIBUTE
 */

import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';

export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'varity-core-backend' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          ({ level, message, timestamp, ...metadata }) => {
            let msg = `${timestamp} [${level}] : ${message}`;
            if (Object.keys(metadata).length > 0) {
              // Custom replacer to handle BigInt serialization
              const bigIntReplacer = (key: string, value: any) => {
                if (typeof value === 'bigint') {
                  return value.toString();
                }
                return value;
              };
              msg += ` ${JSON.stringify(metadata, bigIntReplacer)}`;
            }
            return msg;
          }
        )
      ),
    }),
  ],
});

// Security: Redact sensitive information from logs
export const sanitizeLogData = (data: any): any => {
  if (!data) return data;

  const sensitiveKeys = ['privateKey', 'mnemonic', 'apiKey', 'secretKey', 'authToken', 'password'];

  if (typeof data === 'object') {
    const sanitized = { ...data };
    for (const key of sensitiveKeys) {
      if (key in sanitized) {
        sanitized[key] = '[REDACTED]';
      }
    }
    return sanitized;
  }

  return data;
};

export default logger;
