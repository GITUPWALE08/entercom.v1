# Payment Permission Mapping Design

## Purpose
To map permissions to service actions, allowed roles, restrictions, and ownership rules within the Payment Domain for Phase 5.

## Scope
* PaymentService
* WebhookService

## Out of Scope
* Django permissions generation
* Permission classes or decorators
* DRF views or API definitions
* Code implementations

## Role Definitions
* **Customer:** End-user with access to public catalog resources.
* **Staff:** Internal users with standard operational access.
* **Manager:** Internal users with elevated administrative access.
* **Superadmin:** System administrators with full access.
* **SYSTEM:** Non-human actor for automated backend processes.

## Permission Inventory
* `payment.initialize`
* `payment.view_own`
* `payment.view`
* `payment.cancel`
* `payment.reconcile`
* `webhook.process`
* `webhook.view`

## Permission Mapping Matrix

| Permission | Service | Action | Roles | Restrictions |
| ---------- | ------- | ------ | ----- | ------------ |
| `payment.initialize` | PaymentService | initialize_payment | Customer, Superadmin | Customer initializes own payment |
| `payment.view_own` | PaymentService | get_payment | Customer | Customer views own payment |
| `payment.view` | PaymentService | list_payments / get_payment | Staff, Manager, Superadmin | None |
| `payment.cancel` | PaymentService | cancel_payment | Manager, Superadmin, SYSTEM | UNRESOLVED — BUSINESS DECISION REQUIRED for explicit role mapping |
| `payment.reconcile` | PaymentService | reconcile_payments | Manager, Superadmin | None |
| `webhook.process` | WebhookService | process_webhook | SYSTEM | SYSTEM ONLY. Never user-accessible |
| `webhook.view` | WebhookService | view_webhooks | Staff, Manager, Superadmin | None |

## Restrictions
* "No human role may execute webhook.process."
* Webhook processing is strictly limited to the internal SYSTEM responding to provider HTTP calls with valid HMAC signatures.

## Ownership Validation Rules
* **Customer Ownership:** Payments are owned by the Customer who owns the parent Order.

## IDOR Protection Rules
For every customer-owned resource, strict IDOR validation is applied:
* `payment.view_own`: Customer may only access: `payment.order.customer_id == actor.id`
* `payment.initialize`: Customer may only access: `payment.order.customer_id == actor.id`

## Forbidden Actions
* **Customers MUST NOT:**
  * reconcile payments
  * process webhooks
* **Staff MUST NOT:**
  * process webhooks
* **Managers MUST NOT:**
  * process webhooks
* **Only SYSTEM may:**
  * process webhooks

## Dependencies
* docs/architecture/payment/payment-permissions.md
* docs/architecture/payment/payment-services.md
* docs/implementation/payment/payment-service-design.md

## Completion Criteria
UNRESOLVED — BUSINESS DECISION REQUIRED
