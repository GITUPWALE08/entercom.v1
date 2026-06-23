# Order API Design

## 1. Purpose
The purpose of this document is to define the RESTful external interfaces for the Order Domain. It translates the approved product-order workflow into actionable HTTP endpoints, ensuring strict validation against inventory constraints and enforcing immutable pricing logic.

## 2. Scope
This document covers:
* Order creation endpoints (`POST`).
* Order viewing endpoints (`GET`).
* Order cancellation endpoints (`POST`).
* Administrative fulfillment endpoints (`POST`).
* Request/Response schemas, filtering, and validation ownership.

## 3. Out of Scope
* Payment initialization endpoints (Covered in Payment API).
* Catalog management (Covered in Product API).
* DRF code generation.

## 4. Dependencies
* **Order Service Architecture:** Provides the backend logic for these endpoints.
* **Order Permission Mapping:** Defines IDOR and state-based access controls.
* **Order Model Design:** Informs the structure of the JSON payloads.

## 5. Base URL
`/api/v1/`

## 6. Endpoint Inventory

| HTTP | Path | Purpose | Required Permission | Service Called |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/orders/` | List orders | `order.view_own` / `order.view` | ORM Queryset |
| `GET` | `/orders/{id}/` | Retrieve order | `order.view_own` / `order.view` | `OrderService.get_order` |
| `POST` | `/orders/` | Create order | `order.create` | `OrderService.create_order` |
| `POST` | `/orders/{id}/cancel/`| Cancel order | `order.cancel` | `OrderService.cancel_order` |
| `POST` | `/orders/{id}/fulfill/`| Fulfill order | `order.fulfill` / `override_fulfillment` | `FulfillmentService.fulfill` / `override` |

## 7. Payloads

### 7.1 Create Order
#### Request
* **Required Fields:** `request_id` (UUID), `items` (List of Objects).
    * `items` object: `product_id` (UUID), `quantity` (Integer).
#### Response
* **Structure:** `id`, `request_id`, `status` (`pending_payment`), `total_amount`, `created_at`, `items` (List).
    * `items` object: `id`, `product_id`, `quantity`, `product_name_snapshot`, `unit_price_snapshot`, `line_total_snapshot`.

### 7.2 Cancel Order
#### Request
* **Optional Fields:** `reason` (String - Admin only).
#### Response
* **Structure:** Updated Order object reflecting `cancelled` status.

### 7.3 Fulfill Order
#### Request
* **Optional Fields:** `override_reason` (String - Required if utilizing `override_fulfillment` permission).
#### Response
* **Structure:** Updated Order object reflecting `fulfilled` status.

## 8. Filter Design
* **Orders:** `status` (String), `request_id` (UUID).
* **Ordering:** `created_at` (Descending default).

## 9. Pagination Design
* **Type:** Limit/Offset or Page Number.
* **Default Page Size:** 20.
* **Maximum Page Size:** 100.

## 10. Validation Ownership
* **Serializer Validation:** Payload shape, valid UUIDs, quantity > 0.
* **Service Validation:** Inventory availability checks (`InventoryService`), 1:1 Request mapping (`OrderService`), state transition rules (`OrderService`, `FulfillmentService`).
* **Permission Validation:** Controller checks IDOR (`order.view_own`, `order.cancel`), ensures Paid orders are NOT cancelled, and enforces Staff/Manager boundaries for fulfillment.

## 11. Error Responses
* `400 Bad Request`: Malformed payload, invalid transitions (e.g., trying to cancel a `paid` order).
* `401 Unauthorized`: Missing or invalid authentication token.
* `403 Forbidden`: Permission denied (e.g., Customer attempting `POST /orders/{id}/fulfill/`).
* `404 Not Found`: Order ID does not exist, or IDOR filtering masks it from the user.
* `409 Conflict`: Inventory unavailable (rejecting order creation) or Request already has an Order.
* `422 Unprocessable Entity`: Attempting to purchase an archived product.

## 12. Service Routing Matrix
* `GET /orders/` → ORM Queryset (Filtered by Role IDOR)
* `POST /orders/` → `OrderService.create_order()`
* `POST /orders/{id}/cancel/` → `OrderService.cancel_order()`
* `POST /orders/{id}/fulfill/` → `FulfillmentService.fulfill_order()`

## 13. Forbidden API Behavior
* Explicitly prohibit: Direct order state mutation outside services (e.g., no `PATCH /orders/{id}/` to force status changes).
* Explicitly prohibit: Order creation bypassing the `pending_payment` state requirement.

## 14. Open Questions
No unresolved API design questions remain.

## 15. Completion Criteria
* Strict IDOR isolation is documented for Customer access.
* The API cleanly handles the complex validation required for inventory checks and price snapshots via Service delegation.
* The absolute ban on cancelling `paid` orders is integrated into the expected error responses.
