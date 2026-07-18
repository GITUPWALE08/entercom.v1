# API Consistency Report

This report outlines the structural differences observed across the Entercom backend API, all of which are now transparently handled by the frontend's normalization layer. 

**Note: No backend code was modified to achieve this stability.**

## 1. DRF Pagination Pattern
**Affected Endpoints**:
*   `GET /api/v1/requests/`
*   `GET /api/v1/notifications/`
*   `GET /api/v1/users/`

**Actual Backend Shape**:
```json
{
  "count": 50,
  "next": "http://api...",
  "previous": null,
  "results": [{...}]
}
```
**Normalized Output for Frontend**:
The `normalizeData` utility intercepts this payload, returns the `results` array directly to the React component, but transparently attaches `.count`, `.next`, and `.previous` directly to the Array object proto. This allows tools like `useInfiniteQuery` to still read `lastPage.next` seamlessly.

## 2. Application Envelope Pattern
**Affected Endpoints**:
*   `GET /api/v1/requests/{id}/quotes/`
*   `GET /api/v1/products/`
*   `POST /api/v1/checkout/`

**Actual Backend Shape**:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": [{...}]
}
```
**Normalized Output for Frontend**:
The `normalizeData` utility intercepts this, unwraps the envelope, and returns the contents of `data`. If `pagination` metadata exists alongside `data`, it is attached to the array just like the DRF pattern.

## 3. Plain Output
**Affected Endpoints**:
*   `GET /api/v1/users/me/`
*   Standard atomic `PATCH` or `POST` responses

**Actual Backend Shape**:
```json
{
  "id": 1,
  "status": "active"
}
```
**Normalized Output for Frontend**:
Passed through exactly as-is.

### Conclusion
By unifying these disparate shapes at the API boundary, the frontend completely shields components from `TypeError` exceptions while preserving crucial metadata needed for pagination.
