/**
 * Shared utilities for the Varity DB Proxy
 */

/**
 * Quote a PostgreSQL identifier (schema, table, column name) to prevent SQL injection.
 * Double-quotes the name and escapes any embedded double-quotes.
 */
export function quoteIdent(name: string): string {
  return '"' + name.replace(/"/g, '""') + '"';
}

/**
 * Parse a JSONB field from a PostgreSQL row.
 * The pg driver may return JSONB as either a parsed object or a raw JSON string,
 * depending on the driver version and connection settings.
 */
export function parseJsonbData(data: any): any {
  return typeof data === 'string' ? JSON.parse(data) : data;
}
