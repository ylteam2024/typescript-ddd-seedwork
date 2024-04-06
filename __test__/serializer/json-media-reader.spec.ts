import { JsonMediaReader } from 'src/serializer/JsonReader';

describe('Test JsonMediaReader', () => {
  it('Test reading', () => {
    const plain = { a: 'a', b: 'b', c: { a: true, d: '2007-03-01T13:00:00Z' } };
    const reader = JsonMediaReader.read(JSON.stringify(plain));
    expect(reader.stringValue('/a')).toBe('a');
    expect(reader.stringValue('/b')).toBe('b');
    expect(reader.booleanValue('/c/a')).toBe(true);
    expect(reader.dateValue('/c/d')).toBe(Date.parse(plain['c']['d']));
  });
  it('Test abnormal json', () => {
    expect(() => JsonMediaReader.read('{a}')).toThrowError(
      /^BaseException:.*$/,
    );
  });
});
