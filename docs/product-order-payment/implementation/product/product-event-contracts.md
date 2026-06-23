# Product Event Contracts

## 1. Purpose
The purpose of this document is to define the strict payload schemas, producer/consumer ownership, and transaction requirements for all events emitted by the Product Domain. It ensures that downstream consumers (Order Domain, Audit, Notifications) can rely on a stable, versioned contract for catalog and inventory mutations.

## 2. Scope
This document covers:
* Product lifecycle events.
* Category lifecycle events.
* Inventory tracking events.
* The standard event envelope.
* Idempotency and transaction requirements.

## 3. Out of Scope
* Technical implementation of the event broker (Kafka, RabbitMQ, Redis Pub/Sub).
* Celery task definitions.
* Python code generation for publishers or consumers.
* WebSockets and Notification delivery (Phase 6).

## 4. Dependencies
* **Product Domain Architecture**
* **Product Events Architecture**
* **Product Model Design**
* **Product Auditing Architecture**

## 5. Event Versioning Policy
* **Current Version:** `v1`
* **Versioning Rules:** The version must be incremented (`v2`, `v3`) if backward-incompatible changes are introduced.
* **Backward Compatibility Rules:** Adding new optional fields does not require a version bump. Removing fields, changing data types, or changing required fields requires a new version.
* **Deprecation Rules:** Old versions must be supported for 90 days after deprecation notice.

## 6. Standard Event Envelope
All events MUST define the following base fields.

| Field Name | Type | Required | Description | Example Value |
| :--- | :--- | :--- | :--- | :--- |
| `event_id` | UUID | Yes | Unique identifier for the event instance. | `a1b2c3d4-...` |
| `event_name` | String | Yes | The canonical name of the event. | `product.created` |
| `event_version`| String | Yes | The schema version. | `v1` |
| `occurred_at` | Datetime| Yes | ISO-8601 UTC timestamp of the mutation. | `2026-06-18T10:00:00Z`|
| `correlation_id`| UUID | Yes | Traceability identifier linking cross-domain flows.| `x9y8z7...` |
| `actor_id` | String | Yes | ID of the user or `SYSTEM` responsible for the change.| `user_123` |
| `producer` | String | Yes | The originating service. | `ProductService` |
| `data` | Object | Yes | The event-specific payload. | `{...}` |

## 7. Event Inventory & Payload Contracts

### 7.1 `product.created`
* **Purpose:** Signals the addition of a new product to the catalog.
* **Producer:** `ProductService` (Trigger: Successful DB commit during product creation).
* **Consumers:** Audit System (Current).
* **Transaction Requirements:** Emit After Commit (Ensures DB state exists before downstream consumption).
* **Idempotency Key:** `data.product_id`
* **Data Payload:**
    * `product_id` (UUID, Required): ID of the created product.
    * `category_id` (UUID, Required): ID of the parent category.
    * `status` (String, Required): e.g., `active`.

### 7.2 `product.updated`
* **Purpose:** Signals a metadata or price modification.
* **Producer:** `ProductService` (Trigger: Metadata update).
* **Consumers:** Audit System (Current).
* **Transaction Requirements:** Emit After Commit.
* **Idempotency Key:** `event_id`
* **Data Payload:**
    * `product_id` (UUID, Required)
    * `delta` (Object, Optional): Snapshot of changed fields.

### 7.3 `product.archived`
* **Purpose:** Signals deactivation of a product.
* **Producer:** `ProductService` (Trigger: Status transition to archived).
* **Consumers:** Audit System (Current).
* **Transaction Requirements:** Emit After Commit.
* **Idempotency Key:** `data.product_id`
* **Data Payload:**
    * `product_id` (UUID, Required)

### 7.4 `category.created`
* **Purpose:** Signals a new category.
* **Producer:** `CategoryService`
* **Consumers:** Audit System.
* **Transaction Requirements:** Emit After Commit.
* **Idempotency Key:** `data.category_id`
* **Data Payload:**
    * `category_id` (UUID, Required)
    * `slug` (String, Required)

### 7.5 `category.updated`
* **Purpose:** Signals category modification.
* **Producer:** `CategoryService`
* **Consumers:** Audit System.
* **Transaction Requirements:** Emit After Commit.
* **Idempotency Key:** `event_id`
* **Data Payload:**
    * `category_id` (UUID, Required)

### 7.6 `category.archived`
* **Purpose:** Signals category deactivation (cascades to products).
* **Producer:** `CategoryService`
* **Consumers:** Audit System, ProductService (Internal listener for cascading).
* **Transaction Requirements:** Emit After Commit.
* **Idempotency Key:** `data.category_id`
* **Data Payload:**
    * `category_id` (UUID, Required)

### 7.7 `inventory.reduced`
* **Purpose:** Authoritative notification of stock depletion resulting from financial settlement.
* **Producer:** `InventoryService` (Trigger: Called by `OrderService` post-payment).
* **Consumers:** Audit System (Current).
* **Transaction Requirements:** Emit After Commit.
* **Idempotency Key:** `data.order_id` (Ensures inventory is only reduced once per order).
* **Data Payload:**
    * `product_id` (UUID, Required)
    * `order_id` (UUID, Required)
    * `quantity_reduced` (Integer, Required)
    * `quantity_after` (Integer, Required)

### 7.8 `inventory.adjusted`
* **Purpose:** Record manual stock correction.
* **Producer:** `InventoryService` (Trigger: Admin override).
* **Consumers:** Audit System.
* **Transaction Requirements:** Emit After Commit.
* **Idempotency Key:** `event_id`
* **Data Payload:**
    * `product_id` (UUID, Required)
    * `quantity_before` (Integer, Required)
    * `quantity_after` (Integer, Required)

### 7.9 `inventory.low_stock`
* **Purpose:** Signal stock level breach.
* **Producer:** `InventoryService` (Trigger: Evaluated after quantity change).
* **Consumers:** Audit System (Current), Notification Service (Future).
* **Transaction Requirements:** Emit After Commit.
* **Idempotency Key:** `product_id` + `quantity_after` (To prevent duplicate alerts for the same level).
* **Data Payload:**
    * `product_id` (UUID, Required)
    * `current_quantity` (Integer, Required)
    * `threshold` (Integer, Required)

## 8. Audit Requirements
* **Audit Required:** Yes, for all listed events.
* **Required Audit Action:** The `event_name` maps 1:1 to the `action` field in the Audit log.
* **Metadata Requirements:** All payloads must be fully logged.

## 9. Contract Validation Rules
* **Required Fields:** Strict enforcement. Missing fields MUST fail validation and prevent event emission.
* **Nullable Fields:** Only `delta` objects are conditionally nullable.
* **Type Validation:** UUID strings must conform to RFC 4122. Timestamps must be ISO-8601 UTC.
* **Schema Stability:** Breaking changes require `event_version` bumps.

## 10. Future Integration Notes
* **Notification consumers:** Will consume `inventory.low_stock`.
* **WebSocket consumers:** Not applicable for Phase 5 MVP catalog events.
* **Analytics consumers:** May ingest `inventory.reduced` for sales velocity metrics.

## 11. Forbidden Event Behavior
* **Explicitly Prohibit:** `ProductService` emitting `inventory.reduced`.
* **Explicitly Prohibit:** `InventoryService` emitting `order` or `payment` events.
* **Explicitly Prohibit:** Event emission inside an uncommitted transaction (to prevent ghost events if the DB rolls back).

## 12. Open Questions
No unresolved event-contract questions remain.

## 13. Completion Criteria
* All product and inventory events have strictly typed payload contracts.
* `inventory.reduced` is definitively mapped to its required correlation identifiers (`order_id`).
* Standard envelopes guarantee downstream traceability.
