declare module "winston" {
  export interface Logger {
    info(message: string, meta?: Record<string, unknown>): void;
    error(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    debug(message: string, meta?: Record<string, unknown>): void;
  }

  export interface Format {
    combine(...formats: Array<unknown>): unknown;
    timestamp(): unknown;
    errors(options?: { stack?: boolean }): unknown;
    json(): unknown;
    colorize(): unknown;
    printf(template: (info: Record<string, unknown>) => string): unknown;
  }

  export const format: Format;

  export class transports {
    static Console(options?: Record<string, unknown>): unknown;
  }

  export function createLogger(options: {
    level?: string;
    format?: unknown;
    defaultMeta?: Record<string, unknown>;
    transports?: unknown[];
  }): Logger;
}
