import { IO, Reader } from '@logic/fp';
import { Logger as BaseLogger } from './logger.base';

export const getConsoleDomainLogger: Reader.Reader<string, BaseLogger> = (
  context: string,
) => {
  const formatMessageWithContext = (message: string) =>
    `[${context}] ${message}`;

  return {
    info:
      (message: string, ...meta: unknown[]): IO.IO<void> =>
      () =>
        console.info(`${formatMessageWithContext(message)}`, ...meta),

    error:
      (message: string, trace?: unknown, ...meta: unknown[]): IO.IO<void> =>
      () =>
        console.error(
          `${formatMessageWithContext(message)} ${trace || '[No trace info]'}`,
          ...meta,
        ),

    warn:
      (message: string, ...meta: unknown[]): IO.IO<void> =>
      () =>
        console.warn(formatMessageWithContext(message), ...meta),

    debug:
      (message: string, ...meta: unknown[]): IO.IO<void> =>
      () =>
        console.debug(formatMessageWithContext(message), ...meta),

    context: () => context,
  };
};
