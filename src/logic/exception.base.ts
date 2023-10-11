export class BaseException extends Error {
  readonly code: string;
  readonly loc: string[];

  constructor(message: string, code: string, loc = []) {
    super(message);
    this.code = code;
    this.loc = loc;
  }
}

const construct = (message: string, code: string, loc: string[] = []) =>
  new BaseException(message, code, loc);

const getCode = (exception: BaseException) => exception.code;

const getMessage = (exception: BaseException) => exception.message;

const getLoc = (exception: BaseException) => exception.loc;

export const panic = (exception: BaseException) => {
  throw exception;
};

export const BaseExceptionBhv = {
  construct,
  getCode,
  getMessage,
  getLoc,
  panic,
};
