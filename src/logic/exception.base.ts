import { toString } from 'ramda';

export interface BaseException {
  readonly code: string;
  readonly loc: string[];
  readonly instruction: string[];
  readonly messages: string[];
}

const panic = (baseException: BaseException) => {
  throw toPanicErr(baseException);
};

const toPanicErr = (baseException: BaseException, delimiter: string = '__') => {
  const error = new Error(
    `BaseException: ${
      Array.isArray(baseException.messages)
        ? baseException.messages.join(delimiter)
        : baseException.messages
    }`,
  );
  error.name = baseException.code;
  return error;
};

const factory = (
  message: string | string[],
  code: string,
  loc: string[] = [],
  instruction: string[] = [],
): BaseException => ({
  code,
  loc,
  instruction: instruction,
  messages: Array.isArray(message) ? message : [message],
});

const getCode = (exception: BaseException) => exception.code;

const getMessage = (exception: BaseException) => exception.messages;

const getLoc = (exception: BaseException) => exception.loc;

export const unknownErrToBaseException = (err: unknown) =>
  BaseExceptionBhv.construct(toString(err), '');

export const BaseExceptionBhv = {
  construct: factory,
  getCode,
  getMessage,
  getLoc,
  panic,
  toPanicErr,
};
