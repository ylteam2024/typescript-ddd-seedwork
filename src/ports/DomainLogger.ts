import { Logger as BaseLogger } from './Logger';

export class ConsoleDomainLogger implements BaseLogger {
  private _context: string;

  formatMessageWithContext(message: string): string {
    return `[${this._context}] ${message}`;
  }

  info(message: string, ...meta: unknown[]): void {
    console.info(`${this.formatMessageWithContext(message)}`, ...meta);
  }

  error(message: string, trace?: unknown, ...meta: unknown[]): void {
    console.error(
      `${this.formatMessageWithContext(message)} ${trace || '[No trace info]'}`,
    );
  }

  warn(message: string, ...meta: unknown[]): void {
    console.warn(this.formatMessageWithContext(message));
  }

  debug(message: string, ...meta: unknown[]): void {
    console.debug(this.formatMessageWithContext(message));
  }

  setContext(context: string): void {
    this._context = context;
  }

  context() {
    return this._context;
  }
}
