// Set env vars before importing anything that depends on config
process.env.DB_PASSWORD = 'test_password';
process.env.JWT_SECRET = 'test_jwt_secret_for_unit_tests';

import { validateCollection, validateId, parseOrderBy } from '../routes/db';

describe('validateCollection', () => {
  it('accepts valid collection names', () => {
    expect(validateCollection('users')).toBeNull();
    expect(validateCollection('products')).toBeNull();
    expect(validateCollection('my_table')).toBeNull();
    expect(validateCollection('Users123')).toBeNull();
    expect(validateCollection('a')).toBeNull();
  });

  it('rejects names starting with a number', () => {
    expect(validateCollection('123users')).not.toBeNull();
  });

  it('rejects names starting with underscore', () => {
    expect(validateCollection('_users')).not.toBeNull();
  });

  it('rejects empty string', () => {
    expect(validateCollection('')).not.toBeNull();
  });

  it('rejects names with special characters', () => {
    expect(validateCollection('users;DROP TABLE')).not.toBeNull();
    expect(validateCollection('my-table')).not.toBeNull();
    expect(validateCollection('my.table')).not.toBeNull();
    expect(validateCollection('my table')).not.toBeNull();
  });

  it('rejects names longer than 63 chars', () => {
    const longName = 'a' + 'b'.repeat(63);
    expect(validateCollection(longName)).not.toBeNull();
  });

  it('accepts names exactly 63 chars', () => {
    const name63 = 'a' + 'b'.repeat(62);
    expect(validateCollection(name63)).toBeNull();
  });
});

describe('validateId', () => {
  it('accepts valid UUIDs', () => {
    expect(validateId('550e8400-e29b-41d4-a716-446655440000')).toBeNull();
    expect(validateId('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBeNull();
  });

  it('accepts UUIDs with uppercase letters', () => {
    expect(validateId('550E8400-E29B-41D4-A716-446655440000')).toBeNull();
  });

  it('rejects non-UUID strings', () => {
    expect(validateId('not-a-uuid')).not.toBeNull();
    expect(validateId('123')).not.toBeNull();
    expect(validateId('')).not.toBeNull();
  });

  it('rejects SQL injection attempts in IDs', () => {
    expect(validateId("'; DROP TABLE users;--")).not.toBeNull();
    expect(validateId('1 OR 1=1')).not.toBeNull();
  });

  it('rejects UUIDs with wrong format', () => {
    // Missing hyphens
    expect(validateId('550e8400e29b41d4a716446655440000')).not.toBeNull();
    // Extra characters
    expect(validateId('550e8400-e29b-41d4-a716-446655440000x')).not.toBeNull();
  });
});

describe('parseOrderBy', () => {
  it('accepts allowed columns', () => {
    expect(parseOrderBy('created_at')).toEqual({ column: 'created_at', direction: 'ASC' });
    expect(parseOrderBy('updated_at')).toEqual({ column: 'updated_at', direction: 'ASC' });
    expect(parseOrderBy('id')).toEqual({ column: 'id', direction: 'ASC' });
  });

  it('handles DESC prefix', () => {
    expect(parseOrderBy('-created_at')).toEqual({ column: 'created_at', direction: 'DESC' });
    expect(parseOrderBy('-updated_at')).toEqual({ column: 'updated_at', direction: 'DESC' });
    expect(parseOrderBy('-id')).toEqual({ column: 'id', direction: 'DESC' });
  });

  it('rejects disallowed columns (SQL injection prevention)', () => {
    expect(parseOrderBy('name')).toBeNull();
    expect(parseOrderBy('data')).toBeNull();
    expect(parseOrderBy("created_at; DROP TABLE users")).toBeNull();
    expect(parseOrderBy('1=1')).toBeNull();
  });

  it('rejects empty string', () => {
    expect(parseOrderBy('')).toBeNull();
  });

  it('rejects just a hyphen', () => {
    expect(parseOrderBy('-')).toBeNull();
  });
});
