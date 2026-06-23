# Request API Design

## 1. File Purpose
Defines the RESTful API contract for the Phase 3 Request system.

## 2. Scope
*   Endpoint definitions.
*   Actor, request/response structures, and permissions for each endpoint.
*   Documented side effects (e.g., event production).

## 3. Out of Scope
- Serializer code or View implementation.
- API documentation tools (Swagger/OpenAPI).

## 4. Full Content

### 4.1 Collection Endpoints

#### `GET /api/v1/requests/`
*   **Purpose**: List requests with category/priority/status filters.
*   **Actor**: Customer (owned), Technician (assigned), Staff/Manager (global).
*   **Permissions**: `request.view`.
*   **Response**: Paginated list of Request summaries.

#### `POST /api/v1/requests/`
*   **Purpose**: Create a new draft request.
*   **Actor**: Customer.
*   **Request Payload**: `{category, description, location}`.
*   **Response**: New Request object.
*   **Side Effects**: `request.created` event.

### 4.2 Member Endpoints

#### `POST /api/v1/requests/{id}/submit/`
*   **Purpose**: Transition draft to submitted.
*   **Actor**: Customer.
*   **Permissions**: `request.submit` (Owned).
*   **Side Effects**: Triggers SLA timer init; `request.submitted` event.

#### `POST /api/v1/requests/{id}/assign/`
*   **Purpose**: Bind technician to request.
*   **Actor**: Staff / Manager.
*   **Request Payload**: `{technician_id}`.
*   **Permissions**: `request.assign`.
*   **Side Effects**: `request.assigned` event.

#### `POST /api/v1/requests/{id}/accept/`
*   **Purpose**: Technician commits to assignment.
*   **Actor**: Technician.
*   **Permissions**: `assignment.accept` (Assigned).
*   **Side Effects**: Transitions to `in_progress`.

#### `POST /api/v1/requests/{id}/decline/`
*   **Purpose**: Technician refuses assignment.
*   **Actor**: Technician.
*   **Request Payload**: `{reason_code}`.
*   **Permissions**: `assignment.decline` (Assigned).
*   **Side Effects**: Increments decline count; potential escalation.

#### `POST /api/v1/requests/{id}/verify/`
*   **Purpose**: Submit work for QA or perform final review.
*   **Actor**: Technician (submit), Staff/Manager (approve/reject).
*   **Request Payload**: `{evidence_links}` OR `{action: "approve"|"reject", notes: "..."}`.
*   **Permissions**: `request.fulfill` / `request.verify`.

#### `POST /api/v1/requests/{id}/cancel/`
*   **Purpose**: Terminal abort of request.
*   **Actor**: Customer (pre-assignment), Staff, Manager.
*   **Request Payload**: `{reason_code}`.
*   **Side Effects**: `request.cancelled` event.

### 4.3 Sub-resource Endpoints

#### `GET /api/v1/requests/{id}/quotes/`
*   **Purpose**: List quote versions for a request.

#### `POST /api/v1/requests/{id}/quotes/`
*   **Purpose**: Create new quote version.
*   **Actor**: Staff / Technician.
*   **Request Payload**: `{amount, line_items}`.
*   **Permissions**: `quote.create`.
*   **Side Effects**: `quote.created` event.

#### `POST /requests/{id}/quote/approve/`
*   **Actor**: Customer
*   **Permission**: `quote.approve`


## 5. API to Service Mapping

The following mapping defines which service method is responsible for handling each API endpoint:

GET /api/v1/requests/
→ RequestService.list_requests()

POST /api/v1/requests/
→ RequestService.create_request()

POST /api/v1/requests/{id}/submit/
→ RequestService.submit()

POST /api/v1/requests/{id}/assign/
→ AssignmentService.assign()

POST /api/v1/requests/{id}/accept/
→ AssignmentService.accept()

POST /api/v1/requests/{id}/decline/
→ AssignmentService.decline()

POST /api/v1/requests/{id}/verify/
→ VerificationService.submit()

POST /api/v1/requests/{id}/review/
→ VerificationService.verify()

POST /api/v1/requests/{id}/cancel/
→ RequestService.cancel()

GET /api/v1/requests/{id}/quotes/
→ QuoteService.list_quotes()

POST /api/v1/requests/{id}/quotes/
→ QuoteService.create_quote()

POST /api/v1/requests/{id}/quote/approve/
→ QuoteService.approve_quote()

POST /api/v1/requests/{id}/quote/customer-action/
→ QuoteService.handle_customer_action()
