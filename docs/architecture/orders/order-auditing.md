# Order Auditing Architecture

## 1. Purpose
The purpose of this document is to define the mandatory audit and compliance requirements for the Order Domain within the Entercom platform. It establishes the forensic standards for tracking the complete lifecycle of financial commitments and the administrative actions surrounding order fulfillment.

## 2. Scope
This document covers:
* Audit requirements for Order state transitions.
* Auditing of administrative fulfillment operations.
* Auditing of manual and system-driven cancellations.
* The mandatory payload structure for Order Domain audit records.

## 3. Out of Scope
* Financial transaction auditing (Covered in Payment Auditing).
* Inventory reduction auditing (Covered in Product Auditing).
* Notification delivery logs.
* Analytics or reporting.

## 4. Definitions
* **Immutable Audit Event:** A forensic record that, once written, cannot be modified or deleted.
* **Administrative Action:** An operation performed by an elevated role (Manager, Superadmin) to override standard workflows or manage edge cases.
* **Correlation ID:** A unique system-wide identifier linking the Order audit trail back to the parent Request and forward to the Payment.

## 5. Audit Principles
* **Lifecycle Transparency:** Every state transition of an Order must be explicitly logged.
* **Absolute Accountability:** Administrative overrides must be inextricably linked to the actor performing the action and accompanied by a justification.
* **Immutability:** Audit records are immutable; they cannot be modified or deleted.
* **Append-Only Logging:** The audit log operates as an append-only ledger.

## 6. Audit Inventory
The system MUST capture immutable audit records for the following actions:

### 6.1 Order Lifecycle
* `order.created`
* `order.cancelled`
* `order.fulfilled`

## 7. Administrative Operations
Specific administrative actions carry higher operational risk and require explicit auditing:
* **Manager Cancellation:** When a Manager or Superadmin manually cancels a `pending_payment` order, the audit record must capture the actor and the provided reason.
* **Fulfillment Override:** When an elevated role forces fulfillment (e.g., resolving a stock depletion race condition), the audit record must capture the override action and justification.
* **Policy Violation Attempts:** **Paid orders are not cancellable.** Any attempt (API request or internal service call) to cancel an order in the `paid` or `fulfilled` state must be caught, rejected, and audited as a security/policy violation attempt.

## 8. Required Audit Fields
Every audit record within the Order Domain MUST capture the following fields to ensure forensic completeness:
* `audit_id` (Unique identifier for the audit record)
* `timestamp` (ISO-8601 UTC)
* `actor_id` (User ID or "SYSTEM")
* `actor_role` (e.g., Customer, Staff, Manager, System)
* `order_id` (Primary key of the Order)
* `request_id` (Primary key of the parent Request)
* `correlation_id` (Linking identifier for cross-domain flows)
* `action` (The specific audit action from Section 6)
* `reason` (Provided justification for manual cancellations or overrides)
* `before_state` (Order status prior to mutation)
* `after_state` (Order status post-mutation)

## 9. Immutable Audit Requirements
* **Append-Only:** The database architecture supporting these logs must enforce append-only constraints.
* **Zero Modification:** Under no circumstances may an audit record be altered or destroyed.

## 10. Dependencies
* **Order Service Architecture:** Dictates the actors authorized to perform these transitions.
* **Request Domain:** Provides the parent `request_id` context.

## 11. Open Questions
* None at this time.

## 12. Completion Criteria
* Every order transition generates a well-formed audit record.
* Administrative overrides and cancellations are traceably linked to the responsible manager.
* Attempts to cancel a paid order are explicitly audited.
