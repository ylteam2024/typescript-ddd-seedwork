import { parseURL } from '@model/value-objects/URL';
import { Either, pipe } from 'src';

describe('test url vo', () => {
  it('should match valid URL patterns', () => {
    const validUrls = [
      'https://example.com',
      'http://example.com',
      'https://www.example.com',
      'http://www.example.com',
      'https://example.co.uk',
      'https://sub.example.com',
      'http://sub.example.com',
    ];

    validUrls.forEach((url) => {
      const result = parseURL(url);
      expect(Either.isRight(result)).toEqual(true);
      expect(Either.getOrElse(() => 'false')(result)).toEqual(url);
    });
  });

  it('should match invalid URL patterns', () => {
    const invalidUrls = [
      'http://example',
      'htp://example.com',
      'https://example,com',
      'https://example..com',
      'https:// example.com',
      'https://example .com',
    ];

    invalidUrls.forEach((url) => {
      const result = parseURL(url);
      console.log('invalid url ', url);
      expect(Either.isRight(result)).toEqual(false);
      pipe(
        result,
        Either.match(
          (error) => {
            expect(error.code).toEqual('URL_INCORRECT');
          },
          () => {},
        ),
      );
    });
  });
});
