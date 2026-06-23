# Payment Permission Mapping Design

## 1. Purpose
The purpose of this document is to translate the architectural permissions defined in the Payment Domain into strict, executable implementation rules. It maps domain-level RBAC to specific Service actions, establishing exact authorization boundaries for financial tracking, reconciliation, and the highly-secured webhook processor.

## 2. Scope
This document covers:
* `PaymentService` permission mappings.
* `WebhookService` permission mappings.
* Role-specific execution limits for Customers, Staff, Managers, Superadmins, and the System actor.

## 3. Out of Scope
* Order creation or fulfillment permissions.
* Product catalog or inventory permissions.
* Python/Django code generation.

## 4. Dependencies
* **Payment Permissions Architecture**
* **Payment Service Implementation Design**

## 5. Role Matrix
* **Customer:** Initialize payment, view own payment, retry failed payment.
* **Staff:** View all payments.
* **Manager:** View all payments, cancel payment, reconcile.
* **Superadmin:** Full platform access.
* **System:** Sole processor of webhooks.

## 6. Permission Inventory
* `payment.initialize`: Purpose: Start/Retry transaction. Owning Service: PaymentService. Domain: Payment.
* `payment.view_own`: Purpose: View personal status. Owning Service: PaymentService. Domain: Payment.
* `payment.view`: Purpose: Administrative tracking. Owning Service: PaymentService. Domain: Payment.
* `payment.cancel`: Purpose: Administrative termination. Owning Service: PaymentService. Domain: Payment.
* `payment.reconcile`: Purpose: Financial review. Owning Service: PaymentService. Domain: Payment.
* `webhook.process`: Purpose: Authoritative settlement. Owning Service: WebhookService. Domain: Payment.
* `webhook.view`: Purpose: Forensic review. Owning Service: WebhookService. Domain: Payment.

## 7. Permission Mapping Matrix

| Permission | Service Action | Allowed Roles | Restrictions |
| :--- | :--- | :--- | :--- |
| `payment.initialize` | `PaymentService.initialize()` | Customer, Superadmin | Customer must own Order. Order must be `pending_payment`. |
| `payment.view_own` | `PaymentService.get_payment()` | Customer | Customer must own Payment. |
| `payment.view` | `PaymentService.list_payments()` | Staff, Manager, Superadmin | Global visibility. |
| `payment.cancel` | `PaymentService.cancel_payment()`| Manager, Superadmin, System | Applies only to non-terminal payments. |
| `payment.reconcile` | `PaymentService.reconcile()` | Manager, Superadmin | N/A |
| `webhook.view` | `WebhookService.get_logs()` | Manager, Superadmin | Read-only. |
| `webhook.process` | `WebhookService.process()` | System | **Human roles strictly denied.** Must verify signature. |

## 8. Ownership Rules
* **Who grants access:** Superadmins via Role assignments.
* **Who enforces access:** API Permission Classes (HTTP layer) and Service-level checks. `WebhookService` enforces System-only context.
* **Who audits access:** Audit subsystem captures all financial state transitions and verification failures.

## 9. IDOR Protection Requirements
* **Ownership Validation Required:** Yes (For `payment.view_own` and Customer `payment.initialize`).
* **Validation Location:** `PaymentService` and API Querysets.
* **Failure Result:** `404 Not Found` or `403 Forbidden`. Customer may only initialize payment on own order. Customer may only view own payment.

## 10. Service Enforcement Matrix

| Service | Action | Required Permission |
| :--- | :--- | :--- |
| `PaymentService` | `initialize` | `payment.initialize` |
| `PaymentService` | `get_payment` | `payment.view_own` or `payment.view` |
| `PaymentService` | `cancel_payment` | `payment.cancel` |
| `PaymentService` | `reconcile` | `payment.reconcile` |
| `WebhookService` | `process` | `webhook.process` |
| `WebhookService` | `get_logs` | `webhook.view` |

## 11. Restriction Matrix
* **Paid Payment Restrictions:** A `paid` state cannot be manually triggered by Customer, Staff, Manager, or Superadmin.
* **Webhook Processing Restrictions:** Only verified webhook processing may create `payment.paid`. Users never execute webhook processing manually.
* **Manager Overrides:** Manager-only actions include `payment.cancel` and `payment.reconcile`.

## 12. Permission Audit Requirements
* `payment.initialize`: Audit Required (Yes), Action (`payment.initialized`), Metadata (Actor ID, Order ID).
* `webhook.process`: Audit Required (Yes), Action (`payment.paid` or `payment.failed`), Metadata (Actor ID = SYSTEM, Payload Signature Verifications).
* `payment.cancel`: Audit Required (Yes), Action (`payment.cancelled`), Metadata (Actor ID).

## 13. Cross-Domain Permission Rules
* **Request domain permissions never authorize:** Payment mutation.
* **Order domain permissions never authorize:** Payment state transitions to `paid`.
* **Product domain permissions never authorize:** Payment mutation.

## 14. Open Questions
No unresolved permission-mapping questions remain.

## 15. Completion Criteria
* Webhook processing is explicitly restricted to the System actor.
* IDOR boundaries are clearly established for Customer visibility and initialization.
* The absolute restriction preventing manual human transition to `payment.paid` is codified.
