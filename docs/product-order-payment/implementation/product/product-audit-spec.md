# Product Audit Specification

## 1. Purpose
The purpose of this document is to define the strict implementation requirements for the Product Domain audit trail. It translates the high-level auditing architecture into specific forensic logging contracts, ensuring that all modifications to the product catalog, category hierarchy, and inventory levels are immutable, traceable, and fully accountable.

## 2. Scope
This document covers:
* The standard audit record structure.
* Detailed metadata requirements for Product, Category, and Inventory audit actions.
* Actor attribution and correlation ID propagation rules.
* The mandatory isolation and immutability of financial side effects (`inventory.reduced`).

## 3. Out of Scope
* Technical database schema design for the central audit log table.
* Python code generation for `log_action()` wrappers.
* Notification and WebSocket tracking (Phase 6).
* Analytics or BI reporting.

## 4. Dependencies
* **Product Auditing Architecture**
* **Product Service Implementation Design**
* **Product Event Contracts**

## 5. Audit Principles
* **Immutability:** Once an audit record is written, it MUST NEVER be modified or deleted.
* **Traceability:** Every mutation must capture the state delta (`before_state` vs. `after_state`).
* **Actor Attribution:** The system must definitively identify the human or system actor triggering the change.
* **Correlation Tracking:** Financial side effects (inventory reduction) must carry the exact `correlation_id` of the parent financial event.
* **Replay Protection:** Audit creation must be idempotent alongside the primary database transaction.

## 6. Standard Audit Record Structure
Every audit record emitted by the Product Domain MUST define the following base fields:

| Field Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `action` | String | Yes | The canonical audit action name (e.g., `product.updated`). |
| `actor_id` | String | Yes | ID of the user or `SYSTEM`. |
| `actor_type` | String | Yes | e.g., `Customer`, `Staff`, `Manager`, `System`. |
| `resource_type` | String | Yes | e.g., `Product`, `Category`. |
| `resource_id` | String | Yes | Primary key of the mutated entity. |
| `correlation_id`| String | Yes | Identifier linking cross-domain flows. |
| `occurred_at` | Datetime| Yes | ISO-8601 UTC timestamp of the mutation. |
| `metadata` | JSON | Yes | Action-specific payloads and state deltas. |

## 7. Action Inventory & Metadata Requirements

### 7.1 `product.created`
* **Purpose:** Audit the addition of a new product.
* **Producer:** `ProductService`
* **Actor Requirements:** Staff, Manager, Superadmin.
* **Required Metadata:**
    * `category_id` (String)
    * `after_state` (JSON snapshot of the new product)

### 7.2 `product.updated`
* **Purpose:** Audit metadata, attribute, or media changes.
* **Producer:** `ProductService`
* **Actor Requirements:** Staff, Manager, Superadmin.
* **Required Metadata:**
    * `before_state` (JSON snapshot)
    * `after_state` (JSON snapshot)
    * `delta_keys` (List of modified field names)

### 7.3 `product.archived`
* **Purpose:** Audit the deactivation of a product.
* **Producer:** `ProductService`
* **Actor Requirements:** Manager, Superadmin. (Or `SYSTEM` if triggered by category archival cascade).
* **Required Metadata:**
    * `reason` (String, optional)

### 7.4 `category.created`
* **Purpose:** Audit the creation of a category.
* **Producer:** `CategoryService`
* **Actor Requirements:** Staff, Manager, Superadmin.
* **Required Metadata:**
    * `slug` (String)

### 7.5 `category.updated`
* **Purpose:** Audit category modifications.
* **Producer:** `CategoryService`
* **Actor Requirements:** Staff, Manager, Superadmin.
* **Required Metadata:**
    * `before_state` (JSON snapshot)
    * `after_state` (JSON snapshot)

### 7.6 `category.archived`
* **Purpose:** Audit category deactivation and the resulting cascade.
* **Producer:** `CategoryService`
* **Actor Requirements:** Manager, Superadmin.
* **Required Metadata:**
    * `cascaded_product_count` (Integer)

### 7.7 `inventory.adjusted`
* **Purpose:** Audit manual stock corrections.
* **Producer:** `InventoryService`
* **Actor Requirements:** Manager, Superadmin.
* **Required Metadata:**
    * `quantity_before` (Integer)
    * `quantity_after` (Integer)
    * `justification` (String, optional)

### 7.8 `inventory.reduced`
* **Purpose:** Audit strict financial side effect of payment success.
* **Producer:** `InventoryService` (Orchestrated by `OrderService`).
* **Actor Requirements:** `SYSTEM`.
* **Required Metadata:**
    * `order_id` (String)
    * `quantity_before` (Integer)
    * `quantity_after` (Integer)
    * `quantity_reduced` (Integer)

### 7.9 `inventory.low_stock`
* **Purpose:** Audit threshold breach evaluation.
* **Producer:** `InventoryService`
* **Actor Requirements:** `SYSTEM`.
* **Required Metadata:**
    * `current_quantity` (Integer)
    * `threshold` (Integer)

## 8. Correlation ID Rules
* **Generation Rules:** A new `correlation_id` is generated when a catalog mutation is initiated by an API request.
* **Propagation Rules:** The `correlation_id` from a `payment.paid` event MUST be propagated to `InventoryService` when calling `reduce_inventory()`.
* **Reuse Rules:** The `inventory.reduced` audit MUST share the exact `correlation_id` of the parent `order.paid` and `payment.paid` transitions.

## 9. Inventory Audit Requirements
* `inventory.reduced` and `inventory.low_stock` are mandatory audits.
* **Quantity Tracking Rules:** Any audit modifying stock MUST explicitly record `quantity_before` and `quantity_after` to prove the mathematical integrity of the operation.

## 10. Immutable Audit Expectations
* **Fields never editable:** Every field defined in Section 6.
* **Fields never deletable:** The entire audit record.
* **Historical retention expectations:** Permanent retention is required for all `inventory.*` audits as they support financial reconciliation. Catalog metadata audits must be retained indefinitely to satisfy historical order referencing.

## 11. Audit Producer Matrix
| Service | Audit Actions |
| :--- | :--- |
| `ProductService` | `product.created`, `product.updated`, `product.archived` |
| `CategoryService`| `category.created`, `category.updated`, `category.archived` |
| `InventoryService`| `inventory.adjusted`, `inventory.reduced`, `inventory.low_stock` |

## 12. Forbidden Audit Behavior
* Explicitly prohibit: Missing `correlation_id` on any `inventory.reduced` action.
* Explicitly prohibit: Missing actor attribution (falling back to "unknown" instead of throwing an error).
* Explicitly prohibit: Deleting or editing any audit records.
* Explicitly prohibit: Inventory mutation occurring without a corresponding audit action within the same database transaction.

## 13. Open Questions
No unresolved audit specification questions remain.

## 14. Completion Criteria
* `inventory.reduced` is definitively mapped as a system-actor action requiring the parent correlation ID.
* The state delta (`before_state`, `after_state`) is strictly defined for update actions.
* The producer matrix correctly aligns with the service boundaries.
