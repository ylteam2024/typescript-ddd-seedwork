import { IO } from '@logic/fp';
import { Logger as BaseLogger } from './Logger';

export class ConsoleDomainLogger implements BaseLogger {
  private _context: string;

  formatMessageWithContext(message: string): string {
    return `[${this._context}] ${message}`;
  }

  info(message: string, ...meta: unknown[]): IO.IO<void> {
    return () =>
      console.info(`${this.formatMessageWithContext(message)}`, ...meta);
  }

  error(message: string, trace?: unknown, ...meta: unknown[]): IO.IO<void> {
    return () =>
      console.error(
        `${this.formatMessageWithContext(message)} ${
          trace || '[No trace info]'
        }`,
        ...meta,
      );
  }
  warn(message: string, ...meta: unknown[]): IO.IO<void> {
    return () => console.warn(this.formatMessageWithContext(message), ...meta);
  }

  debug(message: string, ...meta: unknown[]): IO.IO<void> {
    return () => console.debug(this.formatMessageWithContext(message), ...meta);
  }

  setContext(context: string): void {
    this._context = context;
  }

  context() {
    return this._context;
  }
}
