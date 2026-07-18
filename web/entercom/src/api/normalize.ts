export function normalizeData<T = any>(payload: any): T {
  if (payload === null || payload === undefined) {
    return payload;
  }

  // 1. Check for Application Envelope Pattern
  if (typeof payload === 'object' && !Array.isArray(payload) && 'data' in payload) {
    const data = payload.data as any;
    if (payload.pagination && Array.isArray(data)) {
        data.count = payload.pagination.count;
        data.next = payload.pagination.next;
        data.previous = payload.pagination.previous;
    }
    return data as T;
  }

  // 2. Check for DRF Pagination Pattern
  if (typeof payload === 'object' && !Array.isArray(payload) && 'results' in payload && Array.isArray(payload.results)) {
    const results = payload.results as any;
    // Attach pagination metadata directly to the array object to preserve pagination support
    results.count = payload.count;
    results.next = payload.next;
    results.previous = payload.previous;
    return results as unknown as T;
  }

  // 3. Plain Array or plain object
  return payload as T;
}
