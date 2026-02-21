import { quoteIdent } from '../utils';

describe('quoteIdent', () => {
  it('wraps a simple name in double quotes', () => {
    expect(quoteIdent('users')).toBe('"users"');
  });

  it('escapes embedded double quotes', () => {
    expect(quoteIdent('my"table')).toBe('"my""table"');
  });

  it('handles empty string', () => {
    expect(quoteIdent('')).toBe('""');
  });

  it('handles names with special characters', () => {
    expect(quoteIdent("Robert'; DROP TABLE users;--")).toBe(
      '"Robert\'; DROP TABLE users;--"'
    );
  });

  it('handles schema-style names', () => {
    expect(quoteIdent('app_test123')).toBe('"app_test123"');
  });

  it('handles names with multiple double quotes', () => {
    expect(quoteIdent('a""b')).toBe('"a""""b"');
  });
});
