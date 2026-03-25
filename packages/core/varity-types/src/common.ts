/**
 * Common TypeScript Types for Varity SDK
 *
 * Provides type-safe alternatives to `any` for common patterns.
 * Use these types to improve type safety across the codebase.
 */

/**
 * JSON-serializable value
 * Use this instead of `any` for data that will be JSON serialized/deserialized
 */
export type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue };

/**
 * JSON object (key-value pairs)
 * Use this for objects with unknown keys but JSON-serializable values
 */
export type JSONObject = { [key: string]: JSONValue };

/**
 * JSON array
 * Use this for arrays with unknown structure but JSON-serializable values
 */
export type JSONArray = JSONValue[];

/**
 * Record with string keys and unknown values
 * Use this for objects when you truly don't know the value types
 * but know keys are strings
 */
export type StringRecord = Record<string, unknown>;

/**
 * Metadata object (commonly used across Varity types)
 * String keys with any JSON-serializable value
 */
export type Metadata = Record<string, JSONValue>;

/**
 * Error with message property (for catch blocks)
 * Use this to safely type errors in catch blocks
 */
export interface ErrorWithMessage {
  message: string;
}

/**
 * Type guard to check if error has a message
 */
export function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

/**
 * Convert unknown error to Error instance
 * Use this in catch blocks to safely get an Error object
 */
export function toError(error: unknown): Error {
  if (error instanceof Error) return error;
  if (isErrorWithMessage(error)) return new Error(error.message);
  try {
    return new Error(JSON.stringify(error));
  } catch {
    return new Error(String(error));
  }
}

/**
 * Get error message from unknown error
 * Use this in catch blocks when you just need the message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (isErrorWithMessage(error)) return error.message;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

/**
 * Callback function type with unknown parameters
 * Use this instead of (...args: any[]) => any
 */
export type Callback<T = void> = (...args: unknown[]) => T;

/**
 * Async callback function type
 */
export type AsyncCallback<T = void> = (...args: unknown[]) => Promise<T>;

/**
 * Event handler type for React and DOM events
 * Use this for generic event handlers
 */
export type EventHandler<E = Event> = (event: E) => void;

/**
 * Async event handler type
 */
export type AsyncEventHandler<E = Event> = (event: E) => Promise<void>;

/**
 * Constructor type for classes
 * Use this when you need to pass a class constructor
 */
export type Constructor<T = unknown> = new (...args: unknown[]) => T;

/**
 * Abstract constructor type
 */
export type AbstractConstructor<T = unknown> = abstract new (...args: unknown[]) => T;

/**
 * Function type with unknown parameters and return type
 * Use this for truly generic functions
 */
export type AnyFunction = (...args: unknown[]) => unknown;

/**
 * Promise or value (for functions that can be sync or async)
 */
export type MaybePromise<T> = T | Promise<T>;

/**
 * Nullable type (value or null)
 */
export type Nullable<T> = T | null;

/**
 * Optional type (value or undefined)
 */
export type Optional<T> = T | undefined;

/**
 * Maybe type (value, null, or undefined)
 */
export type Maybe<T> = T | null | undefined;

/**
 * Deep partial - makes all properties optional recursively
 */
export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

/**
 * Deep readonly - makes all properties readonly recursively
 */
export type DeepReadonly<T> = T extends object
  ? {
      readonly [P in keyof T]: DeepReadonly<T[P]>;
    }
  : T;

/**
 * Require at least one property from a type
 */
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

/**
 * Require exactly one property from a type
 */
export type RequireExactlyOne<T, Keys extends keyof T = keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
> &
  {
    [K in Keys]-?: Required<Pick<T, K>> &
      Partial<Record<Exclude<Keys, K>, undefined>>;
  }[Keys];
