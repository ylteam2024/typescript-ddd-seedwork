import {
  assertArgumentNotNull,
  assertLargerThanOrEqual,
  assertStateFalse,
  assertStateTrue,
  BasicAssertParam,
  simpleHandleABoolean,
} from './FunctionAssertionConcern';

export class AssertionConcern {
  public assertArgumentNotEmpty({
    aString,
    aMessage,
    exception,
    loc,
    code,
  }: { aString: string } & BasicAssertParam) {
    const isEmpty = aString == undefined || aString.length === 0;
    simpleHandleABoolean(isEmpty, aMessage, exception, loc, code);
  }

  public assertArgumentNotNull({
    aValue,
    aMessage,
    exception,
    loc,
    code,
  }: { aValue: any } & BasicAssertParam) {
    return assertArgumentNotNull({ aValue, aMessage, exception, loc, code });
  }

  public assertStateTrue({
    aBoolean,
    aMessage,
    exception,
    loc,
    code,
  }: { aBoolean: boolean } & BasicAssertParam) {
    return assertStateTrue({ aBoolean, aMessage, exception, loc, code });
  }

  public assertStateFalse({
    aBoolean,
    aMessage,
    exception,
    loc,
    code,
  }: { aBoolean: boolean } & BasicAssertParam) {
    assertStateFalse({ aBoolean, aMessage, exception, loc, code });
  }

  public assertLargerThanOrEqual({
    aNumber,
    threshold,
    allowEqual = true,
    aMessage,
    exception,
    loc,
    code,
  }: {
    aNumber: number;
    threshold: number;
    allowEqual?: boolean;
  } & BasicAssertParam) {
    return assertLargerThanOrEqual({
      aNumber,
      threshold,
      allowEqual,
      aMessage,
      exception,
      loc,
      code,
    });
  }
}
