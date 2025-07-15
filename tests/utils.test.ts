import {
  parseIsoDuration,
  millisecondsToIsoDuration,
  generateUUID,
  isValidUri,
  isValidUrl,
  isValidConfidence,
  isValidEncoding,
  deepClone,
  hasRequiredProperties,
  createValidationError,
  resolveJsonPath
} from '../src/utils';

describe('OFP Utility Functions', () => {
  it('parses and formats ISO 8601 durations (round-trip)', () => {
    const ms = parseIsoDuration('PT1H30M15S');
    expect(ms).toBe(5415000);
    expect(millisecondsToIsoDuration(ms)).toBe('PT1H30M15S');
  });

  it('throws on invalid ISO 8601 duration', () => {
    expect(() => parseIsoDuration('notaduration')).toThrow();
  });

  it('generates a valid UUID v4', () => {
    const uuid = generateUUID();
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    const uuid2 = generateUUID();
    expect(uuid).not.toBe(uuid2); // Should be unique
  });

  it('validates URIs', () => {
    expect(isValidUri('tag:example.com,2025:agent1')).toBe(true);
    expect(isValidUri('https://example.com/agent')).toBe(true);
    expect(isValidUri('not-a-uri')).toBe(false);
    expect(isValidUri(':missing')).toBe(false);
  });

  it('validates URLs', () => {
    expect(isValidUrl('https://example.com/api')).toBe(true);
    expect(isValidUrl('http://localhost:3000')).toBe(true);
    expect(isValidUrl('not-a-url')).toBe(false);
  });

  it('validates confidence values', () => {
    expect(isValidConfidence(0.95)).toBe(true);
    expect(isValidConfidence(1.0)).toBe(true);
    expect(isValidConfidence(0)).toBe(true);
    expect(isValidConfidence(-0.1)).toBe(false);
    expect(isValidConfidence(1.1)).toBe(false);
    expect(isValidConfidence(NaN)).toBe(false);
  });

  it('validates encoding strings', () => {
    expect(isValidEncoding('UTF-8')).toBe(true);
    expect(isValidEncoding('utf-8')).toBe(true);
    expect(isValidEncoding('ISO-8859-1')).toBe(true);
    expect(isValidEncoding('ascii')).toBe(false);
  });

  it('deep clones objects', () => {
    const obj = { a: 1, b: { c: 2 } };
    const clone = deepClone(obj);
    expect(clone).toEqual(obj);
    expect(clone).not.toBe(obj);
    expect(clone.b).not.toBe(obj.b);
  });

  it('checks for required properties', () => {
    const obj = { a: 1, b: 2 };
    expect(hasRequiredProperties(obj, ['a', 'b'])).toBe(true);
    expect(hasRequiredProperties(obj, ['a', 'c'])).toBe(false);
    expect(hasRequiredProperties(null, ['a'])).toBe(false);
  });

  it('creates validation error messages', () => {
    const msg = createValidationError('field', 123, 'a string');
    expect(msg).toMatch(/field: expected a string, got number/);
    const msg2 = createValidationError('field', 'abc', 'a string');
    expect(msg2).toMatch(/field: expected a string, got "abc"/);
  });

  it('resolves JSON Path expressions', () => {
    const data = { features: { text: { tokens: [{ value: 'hello world' }] } } };
    expect(resolveJsonPath('$.features.text.tokens[0].value', data)).toEqual(['hello world']);
    expect(resolveJsonPath('$.features.text.tokens[0].value.substring(0,5)', data)).toEqual(['hello']);
    expect(() => resolveJsonPath('features.text', data)).toThrow(); // must start with $
  });
}); 