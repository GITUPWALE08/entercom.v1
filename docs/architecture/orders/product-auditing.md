# Product Auditing Architecture

## 1. Purpose
The purpose of this document is to define the authoritative audit and compliance requirements for the Product Domain within the Entercom platform. It establishes the forensic standards for tracking all modifications to the product catalog, category hierarchy, and inventory levels, ensuring that all state mutations are immutable, traceable, and fully accountable.

## 2. Scope
This document covers:
* Audit requirements for Product creation, modification, and archival.
* Audit requirements for Category lifecycle events.
* Audit requirements for Inventory adjustments, reductions, and threshold breaches.
* The mandatory payload structure for Product Domain audit records.

## 3. Out of Scope
* Notification delivery logs.
* Analytics or business intelligence tracking.
* Web analytics (page views, clicks).
* Technical implementation details of the audit storage mechanism.

## 4. Definitions
* **Immutable Audit Event:** A forensic record that, once written, cannot be modified or deleted by any actor or system process.
* **State Delta:** The captured difference between the `before_state` and `after_state` of an entity at the time of mutation.
* **Financial Side Effect:** An action (e.g., `inventory.reduced`) that occurs as a direct consequence of a financial settlement.

## 5. Audit Principles
* **Absolute Accountability:** Every catalog and inventory mutation must be explicitly linked to an authenticated actor.
* **Append-Only Logging:** The audit log must operate as an append-only ledger.
* **Zero Modification:** Audit records must never be updated or pruned.
* **Cross-Domain Correlation:** Inventory mutations resulting from Order/Payment lifecycles must preserve the parent `correlation_id`.

## 6. Audit Inventory
The system MUST capture immutable audit records for the following actions:

### 6.1 Products
* `product.created`
* `product.updated`
* `product.archived`

### 6.2 Categories
* `category.created`
* `category.updated`
* `category.archived`

### 6.3 Inventory
* `inventory.adjusted` (Manual administrative override)
* `inventory.reduced` (Automated financial side effect)
* `inventory.low_stock` (Automated threshold breach)

## 7. Required Audit Fields
Every audit record within the Product Domain MUST capture the following fields to ensure forensic completeness:
* `audit_id` (Unique identifier for the audit record)
* `timestamp` (ISO-8601 UTC)
* `actor_id` (User ID or "SYSTEM")
* `actor_role` (e.g., Staff, Manager, System)
* `resource_type` (e.g., Product, Category)
* `resource_id` (Primary key of the mutated entity)
* `action` (The specific audit action from Section 6)
* `correlation_id` (Linking identifier for cross-domain flows)
* `before_state` (JSON snapshot of the entity prior to mutation)
* `after_state` (JSON snapshot of the entity post-mutation)

## 8. High-Risk Operations
Inventory modifications represent operational and financial risk.
* **Inventory Adjustment (`inventory.adjusted`):** Any manual override of `quantity_available` by a Manager or Superadmin must capture the explicit difference (`quantity_before`, `quantity_after`) within the state delta, along with the actor responsible.
* **Inventory Reduction (`inventory.reduced`):** This is a strict **financial side effect** orchestrated by OrderService after consuming payment.paid. It MUST always be auditable and MUST preserve the `correlation_id`.

## 9. Immutable Audit Requirements
* **Append-Only:** The database architecture supporting these logs must enforce append-only constraints.
* **Non-Destructive Archival:** Archiving a product or category (`product.archived`) must NOT destroy its historical audit trail. The audit records must persist indefinitely.

## 10. Dependencies
* **Product Service Architecture:** Dictates the actors authorized to perform these mutations.
* **Payment Domain Architecture:** Triggers the high-risk `inventory.reduced` action.

## 11. Open Questions
* None at this time.

## 12. Completion Criteria
* Every catalog mutation generates a well-formed audit record.
* Inventory reductions are traceably linked to the corresponding payment event.
* The state delta (`before_state` / `after_state`) is successfully captured for all updates.
