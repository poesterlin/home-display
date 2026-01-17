
/**
 * Simple assertion function that throws an error if the condition is false.
 * @param condition 
 * @param message 
 */
export function assert(condition: boolean, message?: string): asserts condition {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}