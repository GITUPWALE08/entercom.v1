export function ensureArray<T = any>(val: any): T[] {
  return Array.isArray(val) ? val : [];
}
