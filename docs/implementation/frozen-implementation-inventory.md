# Phase 5 Implementation Inventory (Frozen)

This document is the absolute, frozen source of truth for all components allowed in Phase 5.

## Coding Rule
**No model, service, permission, endpoint, event, audit action, job, or websocket hook may be added unless it exists in this inventory.**

---

## Apps
* `apps/products`
* `apps/orders`
* `apps/payments`

## Models
### Products
* `ProductCategory`
* `Product`
* `ProductImage`

### Orders
* `Order`
* `OrderItem`

### Payments
* `Payment`

## Services
### Product Domain
* `ProductService`
* `CategoryService`
* `InventoryService`

### Order Domain
* `OrderService`

### Payment Domain
* `PaymentService`
* `WebhookService`

## Permission Checkers
* `ProductPermissionChecker`
* `OrderPermissionChecker`
* `PaymentPermissionChecker`

## Background Jobs
* `PaymentExpiryJob`
* `InventoryLowStockJob`
* `WebhookReconciliationJob (Placeholder)`

## Event Producers
* `ProductService`
* `CategoryService`
* `InventoryService`
* `OrderService`
* `PaymentService`
* `WebhookService`
* `Background Jobs`

## Audit Producers
* `ProductService`
* `CategoryService`
* `InventoryService`
* `OrderService`
* `PaymentService`
* `WebhookService`
* `Background Jobs`

## Future WebSocket Hooks
* `order.created`
* `order.fulfilled`
* `payment.paid`
* `payment.failed`
