import { NotificationMessageReader } from '@ports/pubsub/notification-reader';

describe('Test NotificationReader ', () => {
  it('Test reading', () => {
    const plain = {
      event: { a: 'a', b: 'b', c: { a: true, d: '2007-03-01T13:00:00Z' } },
    };
    const reader = NotificationMessageReader.read(JSON.stringify(plain));
    expect(reader.eventStringValue('/a')).toBe('a');
    expect(reader.eventStringValue('/b')).toBe('b');
    expect(reader.eventBooleanValue('/c/a')).toBe(true);
    expect(reader.eventDateValue('/c/d')).toBe(
      Date.parse(plain['event']['c']['d']),
    );
  });
  it('Test abnormal input', () => {
    const plain = { a: 'a' };
    expect(() =>
      NotificationMessageReader.read(JSON.stringify(plain)),
    ).toThrowError(/^BaseException:.*$/);
  });
});
