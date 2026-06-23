# Product Domain Event Architecture

## 1. Purpose
The purpose of this document is to define the Domain Events emitted by the Product, Category, and Inventory aggregates. It establishes the architectural expectations for asynchronous communication and system-wide synchronization following catalog or stock mutations.

## 2. Scope
This document covers:
* Event taxonomy for Product and Category metadata.
* Authoritative inventory signals.
* Required payload fields for event contracts.
* Producer-Consumer mapping for catalog events.

## 3. Out of Scope
* Notification delivery rules (Phase 6).
* WebSocket routing and real-time broadcasts (Phase 6).
* Technical implementation of the event bus or message broker.
* Request or Order domain events (Covered in separate documents).

## 4. Definitions
* **Domain Event:** A record of a discrete state change within the Product domain that has downstream significance.
* **Producer:** The specific service responsible for the mutation and the subsequent emission of the event.
* **Consumer:** A service or subsystem that listens for and reacts to the event (e.g., Auditing).

## 5. Event Taxonomy

### 5.1 Product Events
| Event Name | Purpose | Trigger | Producer |
| :--- | :--- | :--- | :--- |
| `product.created` | Notify of a new catalog entry. | Successful DB commit. | `ProductService` |
| `product.updated` | Notify of metadata or price change. | Metadata update. | `ProductService` |
| `product.archived`| Notify of product deactivation. | Transition to Archived. | `ProductService` |

### 5.2 Category Events
| Event Name | Purpose | Trigger | Producer |
| :--- | :--- | :--- | :--- |
| `category.created` | Notify of a new product category. | Category creation. | `CategoryService` |
| `category.updated` | Notify of category metadata change. | Update operation. | `CategoryService` |
| `category.archived`| Notify of category deactivation. | Transition to Inactive. | `CategoryService` |

### 5.3 Inventory Events
| Event Name | Purpose | Trigger | Producer |
| :--- | :--- | :--- | :--- |
| `inventory.reduced`| Authoritative stock depletion. | Payment success. | `InventoryService` |
| `inventory.adjusted`| Record manual stock correction. | Admin override. | `InventoryService` |
| `inventory.low_stock`| Signal stock level breach. | Quantity < Threshold.| `InventoryService` |

## 6. Detailed Event Specifications

### 6.1 `inventory.reduced`
* **Constraint:** This event is ONLY produced after successful payment processing.
* **Producer:** `InventoryService`.
* **Payload Requirements:** `product_id`, `order_id`, `quantity_reduced`, `correlation_id`, `timestamp`.
* **Audit Requirements:** Traceable to specific financial settlement.

### 6.2 `inventory.low_stock`
* **Purpose:** Proactive alerting for administrative replenishment.
* **Trigger:** Evaluated by `InventoryService` whenever quantity is updated.
* **Payload Requirements:** `product_id`, `current_quantity`, `threshold`.

## 7. Consumers
* **Audit Domain:** Mandatory consumer for all events to maintain immutable forensic history.
* **Order Domain:** Consumes inventory changes to validate future orders.
* **Notification Service (Future):** Sole consumer for inventory.low_stock events.

## 8. Payload Requirements
Every event must contain:
* `event_id` (UUID)
* `event_name` (String)
* `occurred_at` (Timestamp)
* `correlation_id` (UUID)
* `data` (JSON Object containing event-specific fields)

## 9. Audit Requirements
All emitted events must be captured by the platform's auditing subsystem. Mutations affecting financial aggregates or stock levels (`inventory.*`) must include the full `correlation_id` chain.

## 10. Dependencies
* **Product Services:** Authoritative producers of all events.
* **Payment Domain:** Provides the success signal for `inventory.reduced`.

## 11. Completion Criteria
* Event taxonomy is exhaustive for the Phase 5 catalog and inventory scope.
* The "Paid-to-Depletion" rule is codified as the only trigger for `inventory.reduced`.
* Payload fields support full forensic auditability.
