# Payment API Design

## 1. Purpose
The purpose of this document is to define the RESTful external interfaces for the Payment Domain. It establishes the endpoints for initializing payments, checking payment statuses, retrying failed attempts, and the highly-secured, authoritative webhook entry point for Payment Provider notifications.

## 2. Scope
This document covers:
* Payment initialization and retry endpoints (`POST`).
* Payment status viewing endpoints (`GET`).
* The Payment Provider Webhook processing endpoint (`POST`).
* Request/Response schemas, filtering, and validation ownership.

## 3. Out of Scope
* Order creation APIs (Covered in Order API).
* Refunds, chargebacks, or split payments.
* DRF code generation.

## 4. Dependencies
* **Payment Service Architecture:** Provides the backend logic for these endpoints.
* **Payment Permission Mapping:** Defines the security rules enforced at the controller.
* **Payment Model Design:** Informs the structure of the JSON payloads.

## 5. Base URL
`/api/v1/`

## 6. Endpoint Inventory

| HTTP | Path | Purpose | Required Permission | Service Called |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/payments/` | List payments | `payment.view` | ORM Queryset |
| `GET` | `/payments/{id}/` | Retrieve payment | `payment.view_own` / `payment.view` | `PaymentService.get_payment` |
| `POST` | `/payments/{order_id}/initialize/` | Start payment | `payment.initialize`| `PaymentService.initialize_payment` |
| `POST` | `/payments/{id}/retry/` | Retry failed payment | `payment.initialize`| `PaymentService.retry_payment` |
| `POST` | `/payments/webhooks/provider/` | Receive provider signals | `webhook.process` | `WebhookService.process_webhook` |

## 7. Payloads

### 7.1 Initialize / Retry Payment
#### Request
* **Required Fields:** `return_url` (String - for frontend redirect).
#### Response
* **Structure:** `id`, `order_id`, `provider_reference`, `amount`, `status`, `authorization_url` (Provided by ProviderService).

### 7.2 Retrieve Payment
#### Response
* **Structure:** `id`, `order_id`, `provider_reference`, `amount`, `currency`, `status` (`pending`, `paid`, `failed`, `cancelled`), `created_at`, `updated_at`.

### 7.3 Payment Provider Webhook
#### Request
* **Headers:** `x-provider-signature` (Required).
* **Body:** Raw JSON payload defined by Payment Provider documentation.
#### Response
* **Structure:** Empty body.
* **Status:** `200 OK` (Acknowledged/Processed/Idempotent hit), `401 Unauthorized` (Invalid signature).

## 8. Filter Design
* **Payments:** `state` (String), `order_id` (UUID).
* **Ordering:** `created_at` (Descending default).

## 9. Pagination Design
* **Type:** Limit/Offset or Page Number.
* **Default Page Size:** 20.
* **Maximum Page Size:** 100.

## 10. Validation Ownership
* **Serializer Validation:** Input shape (e.g., `return_url`).
* **Service Validation:** Payment Provider API communication errors (`ProviderService`), Webhook signature HMAC verification (`WebhookService`), 24-hour expiration checks (`PaymentService`).
* **Permission Validation:** Controller checks IDOR (`payment.view_own`), ensures Order is `pending_payment` before initialization, and enforces the "System-only" unauthenticated access rule for the webhook endpoint.

## 11. Error Responses
* `400 Bad Request`: Malformed payload, invalid state transitions (e.g., attempting to initialize an already paid order).
* `401 Unauthorized`: Missing user token (for REST endpoints) or Invalid HMAC Signature (for Webhook endpoint).
* `403 Forbidden`: Permission denied (e.g., IDOR violation).
* `404 Not Found`: Payment or Order ID does not exist.
* `409 Conflict`: Attempting to retry a non-failed payment.

## 12. Service Routing Matrix
* `GET /payments/` → ORM Queryset (Filtered by Role IDOR)
* `POST /payments/{order_id}/initialize/` → `PaymentService.initialize_payment()`
* `POST /payments/{id}/retry/` → `PaymentService.retry_payment()`
* `POST /payments/webhooks/provider/` → `WebhookService.process_webhook()`

## 13. Forbidden API Behavior
* Explicitly prohibit: Direct payment state mutation (No `PATCH /payments/{id}/`).
* Explicitly prohibit: Webhook bypasses. The `payment.paid` state cannot be achieved via any endpoint other than `/payments/webhooks/provider/`.

## 14. Open Questions
No unresolved API design questions remain.

## 15. Completion Criteria
* The API clearly separates customer-facing initialization from the system-facing webhook entry point.
* The webhook endpoint is rigorously documented to require HMAC signature validation.
* IDOR protections prevent cross-customer financial visibility.
