import { IllegalArgumentException } from '@logic/exceptions';
import { ValueObject } from '../ValueObject';

export class DateVO extends ValueObject {
  value: Date;
  constructor(value?: Date | string | number) {
    super();
    const date = new Date(value || null);
    this.value = date;
  }

  public getValue(): Date {
    return this.value;
  }

  public setDate(aDate: Date) {
    this.validate(aDate);
    this.value = aDate;
  }

  public static now(): DateVO {
    return new DateVO(Date.now());
  }

  private validate(value: Date): void {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      throw IllegalArgumentException.factory({
        message: 'Invalid Date',
        code: 'INVALID_DATE',
      });
    }
  }

  public static fromDateValue(aDate?: Date): DateVO {
    const newDate = new DateVO(aDate);
    newDate.setDate(aDate || new Date());
    return newDate;
  }
}
