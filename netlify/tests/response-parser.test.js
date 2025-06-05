import { processResponse } from '../helpers/response_parser.js';

describe('processResponse', () => {
  test('parses JSON inside triple backticks', () => {
    const input = '```json\n{"title": "Tesla Model Y", "message": "This is a Tesla Model Y"}\n```';
    const expected = '{"title": "Tesla Model Y", "message": "This is a Tesla Model Y"}';
    expect(processResponse(input)).toBe(expected);
  });

  test('parses direct JSON string', () => {
    const input = '{"status": "success", "data": "test"}';
    const expected = '{"status":"success","data":"test"}';
    expect(processResponse(input)).toBe(expected);
  });

  test('wraps plain text in message key', () => {
    const input = 'Just plain text';
    const expected = '{"message":"Just plain text"}';
    expect(processResponse(input)).toBe(expected);
  });

  test('handles malformed JSON by wrapping', () => {
    const input = '{"title": "Test", "message":}';
    const result = processResponse(input);
    expect(() => JSON.parse(result)).not.toThrow();
    expect(result).toContain('message');
  });

  test('handles invalid JSON in code block by wrapping', () => {
    const input = '```json\n{"title": "Test", "message": invalid}\n```';
    const result = processResponse(input);
    expect(() => JSON.parse(result)).not.toThrow();
    expect(result).toContain('message');
  });

  test('handles empty input', () => {
    const input = '';
    const expected = '{"message":""}';
    expect(processResponse(input)).toBe(expected);
  });
});