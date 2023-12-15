import { toString } from 'ramda';

export class BaseException extends Error {
  readonly code: string;
  readonly loc: string[];
  readonly instruction: string[];
  readonly messages: string[];

  constructor(
    message: string | string[],
    code: string,
    loc: string[] = [],
    instruction: string[] = [],
    delimiter = '__',
  ) {
    super(Array.isArray(message) ? message.join(delimiter) : message);
    this.code = code;
    this.loc = loc;
    this.instruction = instruction;
    this.messages = Array.isArray(message) ? message : [message];
  }
}

const construct = (
  message: string | string[],
  code: string,
  loc: string[] = [],
  instruction: string[] = [],
) => new BaseException(message, code, loc, instruction);

const getCode = (exception: BaseException) => exception.code;

const getMessage = (exception: BaseException) => exception.messages;

const getLoc = (exception: BaseException) => exception.loc;

export const panic = (exception: BaseException) => {
  throw exception;
};

export const unknownErrToBaseException = (err: unknown) =>
  BaseExceptionBhv.construct(toString(err), '');

export const BaseExceptionBhv = {
  construct,
  getCode,
  getMessage,
  getLoc,
  panic,
};
