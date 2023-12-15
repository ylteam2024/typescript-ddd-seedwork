import { IO } from '@logic/fp';

export interface Logger {
  info(message: string, ...meta: unknown[]): IO.IO<void>;
  error(message: string, trace?: unknown, ...meta: unknown[]): IO.IO<void>;
  warn(message: string, ...meta: unknown[]): IO.IO<void>;
  debug(message: string, ...meta: unknown[]): IO.IO<void>;
  setContext(context: string): void;
}
