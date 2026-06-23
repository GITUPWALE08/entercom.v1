# Payment API Design

## Purpose
To define the REST API contracts, endpoints, and validation boundaries for the Payment Domain in Phase 5.

## Scope
* Payment endpoints
* Webhook endpoints

## Out of Scope
* Django ORM code generation
* Serializer class implementation
* API view logic
* DRF routers

## Endpoint Inventory

| Endpoint | Method | Permission | Service |
| -------- | ------ | ---------- | ------- |
| `/api/v1/orders/{id}/initialize-payment/` | POST | `payment.initialize` | PaymentService |
| `/api/v1/payments/` | GET | `payment.view_own` / `payment.view` | PaymentService |
| `/api/v1/payments/{id}/` | GET | `payment.view_own` / `payment.view` | PaymentService |
| `/api/v1/payments/{id}/cancel/` | POST | `payment.cancel` | PaymentService |
| `/api/v1/payments/webhooks/paystack/` | POST | `webhook.process` | WebhookService |

## Serializer Inventory
* `PaymentInitializeSerializer`
* `PaymentListSerializer`
* `PaymentDetailSerializer`
* `PaystackWebhookSerializer`

## Filters
* `state`
* `order_id`

## Pagination
Use standard platform pagination conventions.
* `page`
* `page_size`

## Payload Contracts
UNRESOLVED — BUSINESS DECISION REQUIRED for precise required and optional fields.

*Example Payload Contract (Structure Only):*

| Field | Required | Type | Notes |
| ----- | -------- | ---- | ----- |
| UNRESOLVED | UNRESOLVED | UNRESOLVED | UNRESOLVED |

## Validation Ownership
* **Request Validation (Structure):** API Layer (Serializers)
* **Business Validation (Rules):** Service Layer (`PaymentService`, `WebhookService`)
Controllers remain thin.

## Paystack Webhook Rules
Explicitly document:
* Signature verification owned by `WebhookService`.
* Webhook endpoint is not user authenticated.
* Webhook endpoint uses Paystack signature validation.
* Webhook endpoint is idempotent.
* Frontend MUST NOT mark payments as paid.
* Only webhook processing may create `payment.paid` and `payment.failed`.

## Permission Matrix

| Endpoint | Required Permission |
| -------- | ------------------- |
| `POST /api/v1/orders/{id}/initialize-payment/` | `payment.initialize` |
| `GET /api/v1/payments/` | `payment.view_own` (Customer), `payment.view` (Staff+) |
| `GET /api/v1/payments/{id}/` | `payment.view_own` (Customer), `payment.view` (Staff+) |
| `POST /api/v1/payments/{id}/cancel/` | `payment.cancel` |
| `POST /api/v1/payments/webhooks/paystack/` | `webhook.process` (SYSTEM ONLY) |

## Forbidden Endpoints
Explicitly prohibit:
* `PATCH /payments/{id}/mark-paid/`
* Any endpoint bypassing Service Layer ownership.

## Dependencies
* docs/architecture/payment/payment-domain.md
* docs/architecture/payment/payment-services.md
* docs/architecture/payment/payment-permissions.md
* docs/implementation/payment/payment-service-design.md
* docs/implementation/payment/payment-permission-mapping.md

## Open Questions
UNRESOLVED — BUSINESS DECISION REQUIRED

## Completion Criteria
UNRESOLVED — BUSINESS DECISION REQUIRED
