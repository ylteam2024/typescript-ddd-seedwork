import { prop, toString } from 'ramda';

const TAG = 'BaseException';
export interface BaseException {
  readonly code: string;
  readonly loc: string[];
  readonly instruction: string[];
  readonly messages: string[];
  tag: typeof TAG;
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

const print = (baseException: BaseException) =>
  JSON.stringify({
    code: baseException.code,
    messages: baseException.tag,
    loc: baseException.loc,
  });

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
  tag: TAG,
});

const getCode = (exception: BaseException) => exception.code;

const getMessage = (exception: BaseException) => exception.messages;

const getLoc = (exception: BaseException) => exception.loc;

export const unknownErrToBaseException = (err: unknown) =>
  BaseExceptionTrait.construct(toString(err), '');

export const BaseExceptionTrait = {
  construct: factory,
  getCode,
  getMessage,
  getLoc,
  panic,
  toPanicErr,
  isInstance: (candidate: unknown): candidate is BaseException =>
    prop('tag', candidate) === TAG,
  print,
  fromErr: (code: string) => (err: Error) =>
    BaseExceptionTrait.construct(err.message, code),
};
