import { BaseExceptionBhv, panic } from '@logic/exception.base';
import R from 'ramda';

export class JsonMediaReader {
  private representation: Record<string, any>;

  constructor(aJson: string) {
    try {
      this.representation = JSON.parse(aJson);
    } catch (error) {
      panic(
        BaseExceptionBhv.construct(
          'This media instance is not in json format',
          'MEDIA_NOT_IN_JSON_FORMAT',
        ),
      );
    }
  }

  getRepresentation() {
    return this.representation;
  }

  static read(aJson: string) {
    return new JsonMediaReader(aJson);
  }
  getValue(path: string) {
    if (!/(^(?:\/[a-zA-Z0-9_]+)+$)/g.test(path)) {
      panic(
        BaseExceptionBhv.construct(
          `Json Path Reader is in illegal ${path}`,
          'JSON_PATH_ILLGEGAL',
        ),
      );
    }
    return R.path(path.split('/').slice(1), this.representation);
  }

  stringValue(path: string) {
    return this.getValue(path) ? String(this.getValue(path)) : null;
  }

  booleanValue(path: string) {
    const value = this.getValue(path);
    return value === 'true' || value === true;
  }

  dateValue(path: string) {
    return this.getValue(path) ? Date.parse(String(this.getValue(path))) : null;
  }

  numberValue(path: string) {
    return this.getValue(path) ? Number(this.getValue(path)) : null;
  }
}
