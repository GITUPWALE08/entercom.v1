# Payment Model Design

## 1. Purpose
The purpose of this document is to define the physical data model for the Payment domain. It enforces the strict 1:1 mapping with Orders, establishes the fields required for provider synchronization, and dictates the constraints required for idempotency and the 24-hour expiration policy.

## 2. Scope
This document covers:
* `Payment` aggregate entity.
* Provider references and correlation linking.
* Data constraints and indexing.

## 3. Out of Scope
* Refund or Chargeback models.
* Subscription or installment models.
* Multi-currency representations.
* Django ORM definitions or code.

## 4. Dependencies
* **Order Domain:** Parent aggregate that dictates the 1:1 `order_id` mapping.
* **Payment Provider Webhook Workflow:** Drives the `status` transitions and relies on `provider_reference` uniqueness.

## 5. Entity Inventory

### 5.1 Payment
* **Purpose:** The internal representation of a financial transaction, acting as the authoritative record of settlement status.
* **Ownership:** PaymentService.
* **Lifecycle Participation:** Progresses through `pending`, `paid`, `failed`, and `cancelled`.

## 6. Field Definitions

### 6.1 Payment
* `id`: UUID (Required, Non-nullable, Read-only, Source of Truth: DB, Validation: DB)
* `order_id`: UUID/FK (Required, Non-nullable, Read-only, Source of Truth: DB, Validation: DB)
* `request_id`: UUID/FK (Required, Non-nullable, Read-only, Source of Truth: DB, Validation: DB)
* `customer_id`: UUID/FK (Required, Non-nullable, Read-only, Source of Truth: DB, Validation: DB)
* `provider_reference`: String (Required, Non-nullable, Editable [on retry], Source of Truth: DB/Provider, Validation: ProviderService)
* `amount`: Decimal (Required, Non-nullable, Read-only, Source of Truth: DB, Validation: PaymentService)
* `currency`: String (Required, Non-nullable, Read-only, Default: local currency, Source of Truth: DB)
* `status`: String [pending, paid, failed, cancelled] (Required, Non-nullable, Editable, Source of Truth: DB, Validation: PaymentService/WebhookService)
* `correlation_id`: UUID (Required, Non-nullable, Read-only, Source of Truth: DB)
* `created_at`: Datetime (Required, Non-nullable, Read-only)
* `updated_at`: Datetime (Required, Non-nullable, Read-only)

## 7. Relationships
* **Order to Payment:** One-to-One. An Order has exactly one Payment. A Payment belongs to exactly one Order.

## 8. Indexes
* `Payment.order_id`: Unique index to guarantee the 1:1 relationship.
* `Payment.provider_reference`: Unique index to support idempotent webhook lookups.
* `Payment.status`: B-Tree index to support background expiration jobs.
* `Payment.created_at`: B-Tree index to support the 24-hour expiration queries.

## 9. Constraints
* **Unique Constraints:** 
    * `Payment.order_id` MUST be unique.
    * `Payment.provider_reference` MUST be unique (to prevent duplicate transaction generation).
* **Referential Constraints:** `Payment.order_id` references `Order.id`.
* **Business Constraints:** 
    * `status` MUST be restricted to `[pending, paid, failed, cancelled]`.

## 10. Snapshot Fields
* None. (Pricing is snapshotted in the Order Domain; the Payment Domain just reflects the immutable total).

## 11. Soft Delete Policy
* **Hard Delete:** Strictly forbidden for financial records.
* **Soft Delete:** Not applicable. Payments are transitioned to `cancelled` instead of being deleted.

## 12. Validation Ownership
* **State Transitions:** `PaymentService` owns transitions to `cancelled`. `WebhookService` exclusively owns transitions to `paid` and `failed`.
* **Reference Updates:** `PaymentService` is responsible for generating a new `provider_reference` upon customer retry, maintaining the same underlying `Payment` record.

## 13. Audit Considerations
The following operations require high-risk audit logging:
* Any change to `Payment.status` (pending → paid, pending → failed, pending → cancelled).
* The modification of `provider_reference` during a retry attempt.

## 14. Open Questions
No unresolved model-design questions remain.

## 15. Completion Criteria
* Document solidifies the strict 1:1 mapping between Order and Payment.
* Models support updating the `provider_reference` on the same record for retry logic.
* Financial record immutability (no deletions) is mandated.
* Proper indexing is specified to support rapid webhook idempotency checks.
