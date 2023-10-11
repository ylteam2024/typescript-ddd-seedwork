export interface ExceptionProps {
  message?: string;
  code?: string;
  loc?: string[];
}

export class BaseException extends Error {
  private code?: string;
  private loc?: string[];

  constructor({ message, code, loc }: ExceptionProps) {
    super(message);
    this.code = code;
    this.loc = loc;
  }

  public getCode(): string | null {
    return this.code;
  }

  public getMessage(): string | null {
    return this.message;
  }

  public location(): string[] | null {
    return this.loc;
  }

  public static factory({ message, code, loc }: ExceptionProps): BaseException {
    return new BaseException({ message, code, loc });
  }
}

export class IllegalArgumentException extends BaseException {
  constructor({ message, code, loc }: ExceptionProps) {
    super({ message, code, loc });
  }
  public static factory({
    message,
    code,
    loc,
  }: {
    message?: string;
    code?: string;
    loc?: string[];
  }): BaseException {
    return new IllegalArgumentException({ message, code, loc });
  }
}

export class IllegalStateException extends BaseException {
  constructor({ message, code, loc }: ExceptionProps) {
    super({ message, code, loc });
  }
  public static factory({
    message,
    code,
    loc,
  }: {
    message?: string;
    code?: string;
    loc?: string[];
  }): BaseException {
    return new IllegalArgumentException({ message, code, loc });
  }
}

export class NotFoundException extends BaseException {}

type ErrorHandler = (error: Error) => void;

export const catchException = (errorHandler?: ErrorHandler) => {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: any[]) {
      try {
        const result = originalMethod.apply(this, args);
        return result;
      } catch (error) {
        console.info(`Error occur on method ${propertyKey}`, error);
        errorHandler?.(error);
        const isAsync = descriptor.value.constructor.name === 'AsyncFunction';
        return isAsync ? Promise.resolve(null) : null;
      }
    };
    return descriptor;
  };
};
