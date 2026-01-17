
/**
 * Simple assertion function that throws an error if the condition is false.
 * @param condition 
 * @param message 
 */
export function assert<T>(condition: T | null | undefined, message?: string): asserts condition {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}