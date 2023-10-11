import { BaseExceptionBhv } from '@logic/exception.base';
import { Either } from '@logic/fp';
import { Brand } from '@type_util/index';
import validator from 'validator';
import { Parser } from '..';

export type Username = Brand<string, 'Username'>;

export const parseUsernameFromStr =
  ({
    excMessage,
    instructions,
    code,
    minLength = 1,
    maxLength = 20,
  }: {
    excMessage?: string;
    code?: string;
    instructions?: string[];
    minLength?: number;
    maxLength?: number;
  }): Parser<Username> =>
  (v: unknown) =>
    Either.fromPredicate(
      (v): v is Username => {
        const regex = new RegExp(
          `^(?=.{${minLength},${maxLength}}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$`,
        );
        return typeof v === 'string' && regex.test(v);
      },
      () =>
        BaseExceptionBhv.construct(
          excMessage || 'Username is not valid',
          code || 'USERNAME_INVALID',
          [],
          instructions || [
            'no _ or . at the end',
            'allowed characters alphabet, uppercase alphabet, number from 0-9',
            'no __ or _. or ._ or .. inside',
            'no _ or . at the beginning',
            'username is 8-20 characters long',
          ],
        ),
    )(v);

export type FirstLastName = Brand<string, 'FirstLastName'>;

export const parseFirstLastName =
  ({
    excMessage,
    code,
  }: {
    excMessage?: string;
    code?: string;
  }): Parser<FirstLastName> =>
  (v: unknown) =>
    Either.fromPredicate(
      (v): v is FirstLastName =>
        typeof v === 'string' &&
        new RegExp("^[w'-,.][^0-9_!¡?÷?¿/\\+=@#$%ˆ&*(){}|~<>;:[]]{2,}$").test(
          v,
        ),
      () =>
        BaseExceptionBhv.construct(
          excMessage || 'Name component is not correct',
          code || 'INVALID_FIRST_LAST_NAME',
        ),
    )(v);

export type Email = Brand<string, 'Email'>;

export const parseEmailFromStr =
  ({
    excMessage,
    code,
  }: {
    excMessage?: string;
    code?: string;
  }): Parser<Email> =>
  (v: unknown) =>
    Either.fromPredicate(
      (v): v is Email => typeof v === 'string' && validator.isEmail(v),
      () =>
        BaseExceptionBhv.construct(
          excMessage || 'Email is not correct',
          code || 'INVALID_EMAIL',
        ),
    )(v);

export type VNPhoneNumber = Brand<string, 'VNPhoneNumber'>;
export type PhoneNumber = Brand<string, 'PhoneNumber'>;

export type PhoneLocales = validator.MobilePhoneLocale;

export const parseLocalePhoneNumber =
  <T>({
    excMessage,
    code,
    locale,
  }: {
    excMessage?: string;
    code?: string;
    locale: validator.MobilePhoneLocale;
  }): Parser<T> =>
  (v: unknown) =>
    Either.fromPredicate(
      (v): v is T =>
        typeof v === 'string' && validator.isMobilePhone(v, [locale]),
      () =>
        BaseExceptionBhv.construct(
          excMessage || 'VN phone number is not correct',
          code || 'INVALID_VN_PHONE_NUMBER',
        ),
    )(v);

export const parsePhoneNumber =
  ({
    excMessage,
    code,
  }: {
    excMessage?: string;
    code?: string;
  }): Parser<PhoneNumber> =>
  (v: unknown) =>
    Either.fromPredicate(
      (v): v is PhoneNumber =>
        typeof v === 'string' && validator.isMobilePhone(v),
      () =>
        BaseExceptionBhv.construct(
          excMessage || 'Phone number is not correct',
          code || 'INVALID_PHONE_NUMBER',
        ),
    )(v);
