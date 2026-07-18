# Frontend Runtime Audit Report

## Phase 1 Findings
An exhaustive audit of the `entercom` frontend was conducted to identify points of runtime instability caused by un-normalized backend payloads. 

### Core Issue
The frontend architecture historically assumed that any list endpoint would directly return a JavaScript Array. However, the backend is intentionally designed to return one of several payloads:
1.  **Application Envelope**: `{ success, message, data, pagination }`
2.  **DRF Pagination**: `{ count, next, previous, results }`
3.  **Plain Arrays/Objects**

When the frontend attempted to execute `Array.prototype` methods (such as `.map()`, `.filter()`, `.reduce()`, `.find()`, or `.length`) on what it assumed was an array, a `TypeError` would be thrown because the payload was actually an Object.

### Affected Areas
The audit identified dangerous method calls across numerous files, most notably:
*   `src/features/portal/admin/UserList.tsx` (using `.map` on raw user queries)
*   `src/features/portal/customer/requests/RequestList.tsx` (iterating over un-normalized pagination results)
*   `src/features/portal/staff/bookings/StaffBookings.tsx` (filtering potentially undefined DRF objects)
*   `src/hooks/useNotifications.ts` (attempting to extract `p.results` without safety checks)

### Resolution
This vulnerability has been entirely eliminated by the introduction of the centralized `normalizeData` utility, coupled with defensive `ensureArray` wrappers deployed globally across all `.tsx` and `.ts` components.
