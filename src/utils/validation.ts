/**
 * Utility functions for validating API responses
 * Prevents crashes from null/undefined responses
 */

/**
 * Ensures a value is an array, returns empty array if null/undefined
 */
export function ensureArray<T>(value: T[] | null | undefined): T[] {
  if (Array.isArray(value)) return value;
  return [];
}

/**
 * Ensures a value is an object, returns default if null/undefined
 */
export function ensureObject<T extends object>(
  value: T | null | undefined,
  defaultValue: T
): T {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }
  return defaultValue;
}

/**
 * Type guard to check if a response is valid (not null/undefined)
 */
export function isValidResponse<T>(response: T | null | undefined): response is T {
  return response !== null && response !== undefined;
}

/**
 * Safely access nested object properties
 */
export function safeGet<T>(
  obj: Record<string, any> | null | undefined,
  path: string,
  defaultValue: T
): T {
  if (!obj) return defaultValue;

  const keys = path.split('.');
  let result: any = obj;

  for (const key of keys) {
    if (result === null || result === undefined) {
      return defaultValue;
    }
    result = result[key];
  }

  return result ?? defaultValue;
}
