import os

PRODUCT_TESTS = [
    ('TEST-PROD-001', 'MODEL', 'Category slug must be unique', 'product-model-design.md', 'N/A', 'Save duplicate slug', 'IntegrityError raised', 'Cannot save duplicate', 'HIGH'),
    ('TEST-PROD-002', 'MODEL', 'Product archive restrictions', 'product-model-design.md', 'Product has active orders', 'Archive product', 'Status updated to archived', 'Active orders not affected', 'HIGH'),
    ('TEST-PROD-003', 'MODEL', 'quantity_available >= 0', 'product-model-design.md', 'Product exists', 'Set quantity_available to -1', 'Constraint failure', 'Negative quantity rejected', 'HIGH'),
    ('TEST-PROD-004', 'MODEL', 'low_stock_threshold >= 0', 'product-model-design.md', 'Product exists', 'Set low_stock_threshold to -1', 'Constraint failure', 'Negative threshold rejected', 'HIGH'),
    ('TEST-PROD-005', 'MODEL', 'JSON attributes persistence', 'product-model-design.md', 'Product exists', 'Save valid JSON attributes', 'JSON saved and retrievable', 'Invalid JSON rejected', 'MEDIUM'),
    ('TEST-PROD-006', 'MODEL', 'Maximum 4 images per product', 'product-model-design.md', 'Product has 4 images', 'Add 5th image', 'ValidationError raised', '5th image rejected', 'MEDIUM'),
    ('TEST-PROD-007', 'SERVICE', 'Create product', 'product-service-design.md', 'Valid product data', 'Call ProductService.create_product', 'Product created', 'Invalid data raises error', 'HIGH'),
    ('TEST-PROD-008', 'SERVICE', 'Update product', 'product-service-design.md', 'Product exists', 'Call ProductService.update_product', 'Product updated', 'Invalid data raises error', 'HIGH'),
    ('TEST-PROD-009', 'SERVICE', 'Archive product', 'product-service-design.md', 'Product active', 'Call ProductService.archive_product', 'Product archived', 'Already archived raises error', 'HIGH'),
    ('TEST-PROD-010', 'SERVICE', 'Create category', 'product-service-design.md', 'Valid category data', 'Call CategoryService.create_category', 'Category created', 'Duplicate slug raises error', 'MEDIUM'),
    ('TEST-PROD-011', 'SERVICE', 'Update category', 'product-service-design.md', 'Category exists', 'Call CategoryService.update_category', 'Category updated', 'Invalid data raises error', 'MEDIUM'),
    ('TEST-PROD-012', 'SERVICE', 'Archive category', 'product-service-design.md', 'Category active', 'Call CategoryService.archive_category', 'Category archived', 'Already archived raises error', 'MEDIUM'),
    ('TEST-PROD-013', 'SERVICE', 'Inventory reduction', 'product-service-design.md', 'Stock = 10', 'Call InventoryService.reduce_inventory(5)', 'Stock becomes 5', 'Reduce by 15 raises error', 'CRITICAL'),
    ('TEST-PROD-014', 'SERVICE', 'Inventory adjustment', 'product-service-design.md', 'Stock = 10', 'Call InventoryService.adjust_inventory(20)', 'Stock becomes 20', 'Adjust to negative raises error', 'HIGH'),
    ('TEST-PROD-015', 'SERVICE', 'Low stock detection', 'product-service-design.md', 'Stock = 5, Threshold = 10', 'Call InventoryService._emit_low_stock', 'Event emitted', 'No event if stock > threshold', 'HIGH'),
    ('TEST-PROD-016', 'PERMISSION', 'product.view allowed for Customer', 'product-permission-mapping.md', 'Customer user', 'Access view action', 'Action allowed', 'N/A', 'MEDIUM'),
    ('TEST-PROD-017', 'PERMISSION', 'product.create allowed for Staff, denied for Customer', 'product-permission-mapping.md', 'Customer user', 'Access create action', 'PermissionDenied raised', 'Customer rejected', 'HIGH'),
    ('TEST-PROD-018', 'PERMISSION', 'product.update allowed for Staff, denied for Customer', 'product-permission-mapping.md', 'Customer user', 'Access update action', 'PermissionDenied raised', 'Customer rejected', 'HIGH'),
    ('TEST-PROD-019', 'PERMISSION', 'product.archive allowed for Manager, denied for Staff', 'product-permission-mapping.md', 'Staff user', 'Access archive action', 'PermissionDenied raised', 'Staff rejected', 'HIGH'),
    ('TEST-PROD-020', 'PERMISSION', 'category.create allowed for Staff, denied for Customer', 'product-permission-mapping.md', 'Customer user', 'Access category create', 'PermissionDenied raised', 'Customer rejected', 'HIGH'),
    ('TEST-PROD-021', 'PERMISSION', 'inventory.view allowed for Staff, denied for Customer', 'product-permission-mapping.md', 'Customer user', 'Access inventory view', 'PermissionDenied raised', 'Customer rejected', 'HIGH'),
    ('TEST-PROD-022', 'PERMISSION', 'inventory.adjust allowed for Staff, denied for Customer', 'product-permission-mapping.md', 'Customer user', 'Access inventory adjust', 'PermissionDenied raised', 'Customer rejected', 'HIGH'),
    ('TEST-PROD-023', 'API', 'GET /api/v1/products/', 'product-api-design.md', 'Products exist', 'Call endpoint', '200 OK with list', 'Invalid filters return 400', 'HIGH'),
    ('TEST-PROD-024', 'API', 'POST /api/v1/products/', 'product-api-design.md', 'Staff user logged in', 'Call endpoint with payload', '201 Created', 'Invalid payload returns 400', 'HIGH'),
    ('TEST-PROD-025', 'API', 'POST /api/v1/products/{id}/archive/', 'product-api-design.md', 'Manager user logged in', 'Call endpoint', '200 OK', 'Staff returns 403', 'HIGH'),
    ('TEST-PROD-026', 'EVENT', 'product.created event emission', 'product-event-contracts.md', 'Product creation successful', 'Check event bus', 'product.created emitted with payload', 'No event on failure', 'HIGH'),
    ('TEST-PROD-027', 'EVENT', 'inventory.adjusted event emission', 'product-event-contracts.md', 'Inventory adjustment successful', 'Check event bus', 'inventory.adjusted emitted', 'No event on failure', 'HIGH'),
    ('TEST-PROD-028', 'EVENT', 'inventory.low_stock event emission', 'product-event-contracts.md', 'Stock falls below threshold', 'Check event bus', 'inventory.low_stock emitted', 'No event on failure', 'HIGH'),
    ('TEST-PROD-029', 'AUDIT', 'product audit creation and metadata', 'product-audit-spec.md', 'Product created', 'Check audit logs', 'Log exists with correct actor/metadata', 'Log missing', 'HIGH'),
    ('TEST-PROD-030', 'AUDIT', 'product audit immutability', 'product-audit-spec.md', 'Audit log exists', 'Attempt to update log', 'Exception raised', 'Update succeeds (failure case)', 'CRITICAL'),
    ('TEST-PROD-031', 'BACKGROUND JOB', 'Inventory Low Stock Job execution', 'order-background-jobs.md', 'Multiple low stock products', 'Run inventory_low_stock_job', 'Multiple events emitted safely', 'Job crashes on partial failure', 'HIGH'),
    ('TEST-PROD-032', 'INTEGRATION', 'Order -> Inventory reduction trigger', 'product-test-strategy.md', 'Order paid', 'Process payment paid event', 'Inventory reduced', 'Inventory not reduced', 'CRITICAL')
]

ORDER_TESTS = [
    ('TEST-ORD-001', 'MODEL', 'One Request -> One Order', 'order-model-design.md', 'Order created with request_id', 'Create second order with same request_id', 'IntegrityError raised', 'Duplicate creation', 'CRITICAL'),
    ('TEST-ORD-002', 'MODEL', 'Order totals calculation', 'order-model-design.md', 'Order with items', 'Calculate total', 'Total equals sum of items', 'Incorrect total', 'CRITICAL'),
    ('TEST-ORD-003', 'MODEL', 'OrderItem snapshot price persistence', 'order-model-design.md', 'Item created with price 10', 'Change product price to 20', 'Item price remains 10', 'Item price changes to 20', 'CRITICAL'),
    ('TEST-ORD-004', 'MODEL', 'OrderItem positive quantity constraint', 'order-model-design.md', 'Create OrderItem', 'Set quantity to 0', 'Constraint failure', 'Quantity 0 accepted', 'HIGH'),
    ('TEST-ORD-005', 'SERVICE', 'Create order', 'order-service-design.md', 'Valid order data', 'Call OrderService.create_order', 'Order created in PENDING', 'Invalid data raises error', 'CRITICAL'),
    ('TEST-ORD-006', 'SERVICE', 'Cancel order', 'order-service-design.md', 'Order is PENDING', 'Call OrderService.cancel_order', 'Order is CANCELLED', 'Order is PAID raises error', 'HIGH'),
    ('TEST-ORD-007', 'SERVICE', 'Fulfill order', 'order-service-design.md', 'Order is PAID', 'Call OrderService.fulfill_order', 'Order is FULFILLED', 'Order is PENDING raises error', 'HIGH'),
    ('TEST-ORD-008', 'SERVICE', 'Payment-required transition', 'order-service-design.md', 'Order is PENDING', 'Call OrderService.require_payment', 'Order ready for payment', 'Invalid transition', 'HIGH'),
    ('TEST-ORD-009', 'SERVICE', 'Inventory reduction trigger', 'order-service-design.md', 'Payment is PAID', 'Order processes payment event', 'Order triggers inventory reduction', 'Inventory untouched', 'CRITICAL'),
    ('TEST-ORD-010', 'SERVICE', 'Archived product rejection', 'order-test-strategy.md', 'Product is archived', 'Call OrderService.create_order', 'ValidationError raised', 'Order created with archived product', 'CRITICAL'),
    ('TEST-ORD-011', 'PERMISSION', 'order.create allowed for Customer', 'order-permission-mapping.md', 'Customer user', 'Access create order', 'Allowed', 'N/A', 'HIGH'),
    ('TEST-ORD-012', 'PERMISSION', 'order.view_own IDOR protection', 'order-permission-mapping.md', 'Customer user A', 'Access Order belonging to B', 'PermissionDenied raised', 'Access granted (IDOR)', 'CRITICAL'),
    ('TEST-ORD-013', 'PERMISSION', 'order.view allowed for Staff, denied for Customer', 'order-permission-mapping.md', 'Customer user', 'List all orders', 'PermissionDenied raised', 'Customer sees all orders', 'HIGH'),
    ('TEST-ORD-014', 'PERMISSION', 'order.cancel allowed for pending, denied for paid', 'order-permission-mapping.md', 'Customer user', 'Cancel PAID order', 'PermissionDenied raised', 'Cancellation succeeds', 'HIGH'),
    ('TEST-ORD-015', 'PERMISSION', 'order.fulfill allowed for Staff, denied for Customer', 'order-permission-mapping.md', 'Customer user', 'Fulfill order', 'PermissionDenied raised', 'Fulfillment succeeds', 'HIGH'),
    ('TEST-ORD-016', 'PERMISSION', 'order.override_fulfillment Manager only', 'order-permission-mapping.md', 'Staff user', 'Override fulfillment', 'PermissionDenied raised', 'Override succeeds', 'HIGH'),
    ('TEST-ORD-017', 'API', 'POST /api/v1/orders/ validation', 'order-api-design.md', 'Customer logged in', 'Submit invalid payload', '400 Bad Request', '201 Created', 'HIGH'),
    ('TEST-ORD-018', 'API', 'GET /api/v1/orders/ listing', 'order-api-design.md', 'Orders exist', 'Call endpoint', '200 OK with orders', 'Fails', 'HIGH'),
    ('TEST-ORD-019', 'API', 'GET /api/v1/orders/{id}/ retrieve', 'order-api-design.md', 'Order exists', 'Call endpoint', '200 OK', '404 Not Found', 'HIGH'),
    ('TEST-ORD-020', 'API', 'POST /api/v1/orders/{id}/cancel/', 'order-api-design.md', 'Order PENDING', 'Call cancel', '200 OK', '400 on invalid state', 'HIGH'),
    ('TEST-ORD-021', 'API', 'POST /api/v1/orders/{id}/fulfill/', 'order-api-design.md', 'Order PAID', 'Call fulfill', '200 OK', '403 for Customer', 'HIGH'),
    ('TEST-ORD-022', 'EVENT', 'order.created event emission', 'order-event-contracts.md', 'Order created', 'Check bus', 'order.created emitted', 'No event', 'HIGH'),
    ('TEST-ORD-023', 'EVENT', 'order.cancelled event emission', 'order-event-contracts.md', 'Order cancelled', 'Check bus', 'order.cancelled emitted', 'No event', 'HIGH'),
    ('TEST-ORD-024', 'EVENT', 'order.fulfilled event emission', 'order-event-contracts.md', 'Order fulfilled', 'Check bus', 'order.fulfilled emitted', 'No event', 'HIGH'),
    ('TEST-ORD-025', 'AUDIT', 'order audit creation', 'order-audit-spec.md', 'Order created', 'Check audits', 'Audit log created', 'No audit log', 'HIGH'),
    ('TEST-ORD-026', 'AUDIT', 'order audit metadata', 'order-audit-spec.md', 'Audit log exists', 'Verify metadata', 'Metadata matches action', 'Metadata corrupted', 'HIGH'),
    ('TEST-ORD-027', 'AUDIT', 'order audit immutability', 'order-audit-spec.md', 'Audit log exists', 'Update audit', 'Exception raised', 'Update succeeds', 'CRITICAL'),
    ('TEST-ORD-028', 'BACKGROUND JOB', 'Inventory Low Stock integration', 'order-background-jobs.md', 'Job runs', 'Verify execution', 'External domain triggered safely', 'Job crashes', 'HIGH'),
    ('TEST-ORD-029', 'INTEGRATION', 'Order -> Payment hand-off', 'order-test-strategy.md', 'Order requires payment', 'Initialize payment', 'Payment linked to Order safely', 'Link fails', 'CRITICAL'),
    ('TEST-ORD-030', 'INTEGRATION', 'Order -> Inventory reduction', 'order-test-strategy.md', 'Payment confirmed', 'Order processes payment', 'Inventory reduced exactly once', 'Inventory reduced multiple times', 'CRITICAL'),
    ('TEST-ORD-031', 'INTEGRATION', 'Order -> Audit persistence', 'order-test-strategy.md', 'Order action', 'Check DB', 'Audit transactionally persisted', 'Audit lost', 'HIGH'),
    ('TEST-ORD-032', 'INTEGRATION', 'Order -> Events emission', 'order-test-strategy.md', 'Order action', 'Check bus', 'Event reliably emitted', 'Event lost', 'HIGH'),
    ('TEST-ORD-033', 'INTEGRATION', 'Correlation chain propagation', 'order-test-strategy.md', 'Order created', 'Track ID', 'Same ID in Order, Payment, Inventory', 'ID changes midway', 'CRITICAL'),
    ('TEST-ORD-034', 'INTEGRATION', 'order_create_rejects_archived_product', 'order-test-strategy.md', 'Product archived', 'Create order', 'ValidationError', 'Order created', 'CRITICAL'),
    ('TEST-ORD-035', 'INTEGRATION', 'order_api_rejects_archived_product', 'order-test-strategy.md', 'Product archived', 'API create order', '400 Bad Request', '201 Created', 'CRITICAL'),
    ('TEST-ORD-036', 'INTEGRATION', 'IDOR API validation on retrieve', 'order-test-strategy.md', 'Customer A', 'API GET Customer B order', '403/404 response', '200 response with data', 'CRITICAL')
]

PAYMENT_TESTS = [
    ('TEST-PAY-001', 'MODEL', 'Unique paystack_reference', 'payment-model-design.md', 'Payment with ref X', 'Create second payment with ref X', 'IntegrityError', 'Duplicate ref allowed', 'CRITICAL'),
    ('TEST-PAY-002', 'MODEL', 'One order one payment', 'payment-model-design.md', 'Order has Payment', 'Create second Payment for Order', 'IntegrityError', 'Multiple payments for order', 'CRITICAL'),
    ('TEST-PAY-003', 'MODEL', 'State validation constraints', 'payment-model-design.md', 'Payment PAID', 'Set status to PENDING', 'Invalid transition error', 'Transition allowed', 'HIGH'),
    ('TEST-PAY-004', 'SERVICE', 'Initialize payment', 'payment-service-design.md', 'Valid order', 'Call initialize', 'Payment created in PENDING', 'Failure', 'CRITICAL'),
    ('TEST-PAY-005', 'SERVICE', 'Cancel payment', 'payment-service-design.md', 'Payment PENDING', 'Call cancel', 'Payment CANCELLED', 'Payment PAID cancelled', 'HIGH'),
    ('TEST-PAY-006', 'SERVICE', 'Expire payment', 'payment-test-strategy.md', 'Payment PENDING old', 'Call expire_payments', 'Payment CANCELLED', 'Payment PAID expired', 'HIGH'),
    ('TEST-PAY-007', 'SERVICE', 'Payment state transitions', 'payment-service-design.md', 'Various states', 'Transition', 'Valid paths pass, invalid fail', 'Invalid paths pass', 'HIGH'),
    ('TEST-PAY-008', 'WEBHOOK', 'Webhook processing', 'payment-service-design.md', 'Valid payload', 'Process webhook', 'State updated', 'Error', 'CRITICAL'),
    ('TEST-PAY-009', 'WEBHOOK', 'Webhook rejection', 'payment-service-design.md', 'Invalid payload', 'Process webhook', 'Rejected safely', 'Crashes', 'HIGH'),
    ('TEST-PAY-010', 'WEBHOOK', 'Valid signature verification', 'payment-api-design.md', 'Valid HMAC', 'Hit webhook endpoint', '200 OK processed', '403 Forbidden', 'CRITICAL'),
    ('TEST-PAY-011', 'WEBHOOK', 'Invalid signature rejection', 'payment-api-design.md', 'Invalid HMAC', 'Hit webhook endpoint', '403 Forbidden', '200 OK', 'CRITICAL'),
    ('TEST-PAY-012', 'WEBHOOK', 'Duplicate webhook safe handling', 'payment-test-strategy.md', 'Duplicate payload', 'Hit webhook endpoint', '200 OK idempotently handled', '500 Error', 'CRITICAL'),
    ('TEST-PAY-013', 'WEBHOOK', 'webhook_duplicate_paid_event', 'payment-test-strategy.md', 'Duplicate PAID', 'Process', 'No second transition/event', 'Double credit', 'CRITICAL'),
    ('TEST-PAY-014', 'WEBHOOK', 'webhook_duplicate_failed_event', 'payment-test-strategy.md', 'Duplicate FAILED', 'Process', 'No second event', 'Double event', 'HIGH'),
    ('TEST-PAY-015', 'WEBHOOK', 'webhook_duplicate_rejected_event', 'payment-test-strategy.md', 'Duplicate rejection', 'Process', 'Safe', 'Crash', 'HIGH'),
    ('TEST-PAY-016', 'API', 'POST /api/v1/orders/{id}/initialize-payment/', 'payment-api-design.md', 'Customer', 'Call endpoint', '200 OK with link', '400 Bad Request', 'HIGH'),
    ('TEST-PAY-017', 'API', 'POST /api/v1/payments/{id}/cancel/', 'payment-api-design.md', 'Admin', 'Call endpoint', '200 OK', '403 Forbidden', 'HIGH'),
    ('TEST-PAY-018', 'API', 'POST /api/v1/payments/webhooks/paystack/', 'payment-api-design.md', 'Paystack', 'Call endpoint', '200 OK', '500 Error', 'CRITICAL'),
    ('TEST-PAY-019', 'API', 'GET /api/v1/payments/', 'payment-api-design.md', 'Staff', 'Call endpoint', '200 OK list', 'Customer sees all', 'HIGH'),
    ('TEST-PAY-020', 'EVENT', 'payment.initialized event emission', 'payment-event-contracts.md', 'Initialized', 'Check bus', 'Event emitted', 'No event', 'HIGH'),
    ('TEST-PAY-021', 'EVENT', 'payment.paid event emission', 'payment-event-contracts.md', 'Paid', 'Check bus', 'Event emitted', 'No event', 'CRITICAL'),
    ('TEST-PAY-022', 'EVENT', 'payment.failed event emission', 'payment-event-contracts.md', 'Failed', 'Check bus', 'Event emitted', 'No event', 'HIGH'),
    ('TEST-PAY-023', 'EVENT', 'payment.cancelled event emission', 'payment-event-contracts.md', 'Cancelled', 'Check bus', 'Event emitted', 'No event', 'HIGH'),
    ('TEST-PAY-024', 'EVENT', 'payment.expired event emission', 'payment-event-contracts.md', 'Expired', 'Check bus', 'Event emitted', 'No event', 'HIGH'),
    ('TEST-PAY-025', 'EVENT', 'webhook.received event emission', 'payment-event-contracts.md', 'Webhook hit', 'Check bus', 'Event emitted', 'No event', 'HIGH'),
    ('TEST-PAY-026', 'EVENT', 'webhook.rejected event emission', 'payment-event-contracts.md', 'Invalid webhook hit', 'Check bus', 'Event emitted', 'No event', 'HIGH'),
    ('TEST-PAY-027', 'AUDIT', 'payment audit actor', 'payment-audit-spec.md', 'Action taken', 'Check audit', 'Actor correct (SYSTEM/User)', 'Actor missing', 'HIGH'),
    ('TEST-PAY-028', 'AUDIT', 'payment audit metadata', 'payment-audit-spec.md', 'Action taken', 'Check audit', 'Metadata matches', 'Metadata empty', 'HIGH'),
    ('TEST-PAY-029', 'AUDIT', 'payment audit immutability', 'payment-audit-spec.md', 'Audit exists', 'Update', 'Exception', 'Update succeeds', 'CRITICAL'),
    ('TEST-PAY-030', 'BACKGROUND JOB', 'Payment Expiry job selection logic', 'payment-background-jobs.md', 'Run job', 'Verify selection', 'Selects only old pending', 'Selects paid', 'HIGH'),
    ('TEST-PAY-031', 'BACKGROUND JOB', 'Payment Expiry job state transition', 'payment-background-jobs.md', 'Job runs', 'Verify status', 'Pending -> Cancelled', 'Remains pending', 'HIGH'),
    ('TEST-PAY-032', 'BACKGROUND JOB', 'Payment Expiry job event and audit emission', 'payment-background-jobs.md', 'Job runs', 'Verify bus/db', 'Events and audits created', 'Missing', 'HIGH'),
    ('TEST-PAY-033', 'BACKGROUND JOB', 'Payment Expiry job retry handling', 'payment-background-jobs.md', 'Job fails mid-way', 'Retry', 'Celery retries safely', 'No retry', 'HIGH'),
    ('TEST-PAY-034', 'BACKGROUND JOB', 'Payment Expiry job idempotency', 'payment-background-jobs.md', 'Job runs twice', 'Verify', 'Second run no-op', 'Second run errors', 'HIGH'),
    ('TEST-PAY-035', 'INTEGRATION', 'Payment -> Order hand-off', 'payment-test-strategy.md', 'Payment paid', 'Order notified', 'Order fulfills', 'Order ignores', 'CRITICAL'),
    ('TEST-PAY-036', 'INTEGRATION', 'Payment -> Audit persistence', 'payment-test-strategy.md', 'Payment action', 'DB check', 'Audit saved', 'Not saved', 'HIGH'),
    ('TEST-PAY-037', 'INTEGRATION', 'Payment -> Event emission', 'payment-test-strategy.md', 'Payment action', 'Bus check', 'Event sent', 'Not sent', 'HIGH'),
    ('TEST-PAY-038', 'INTEGRATION', 'Payment -> Inventory isolation boundary', 'payment-test-strategy.md', 'Payment paid', 'Inventory notified via Order', 'Boundary holds', 'Direct coupling', 'HIGH'),
    ('TEST-PAY-039', 'INTEGRATION', 'Correlation chain strict propagation', 'payment-test-strategy.md', 'Order -> Payment', 'Track ID', 'Same ID maintained', 'ID lost', 'CRITICAL'),
    ('TEST-PAY-040', 'INTEGRATION', 'Payment Webhook Idempotency full chain', 'payment-test-strategy.md', 'Duplicate Webhook', 'Process', 'Idempotent across system', 'Side effects multiply', 'CRITICAL'),
    ('TEST-PAY-041', 'SERVICE', 'expire_payments_expires_pending_records', 'payment-test-strategy.md', 'Old pending', 'Service call', 'Expired', 'Not expired', 'HIGH'),
    ('TEST-PAY-042', 'SERVICE', 'expire_payments_skips_paid_records', 'payment-test-strategy.md', 'Old paid', 'Service call', 'Ignored', 'Expired', 'HIGH')
]

def write_inventory(filename, tests):
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    with open(filename, 'w', encoding='utf-8') as f:
        f.write("# Test Inventory\n\n")
        for t in tests:
            f.write(f"Test ID: {t[0]}\n\n")
            f.write(f"Category: {t[1]}\n\n")
            f.write(f"Business Rule: {t[2]}\n\n")
            f.write(f"Source Documents: {t[3]}\n\n")
            f.write(f"Preconditions: {t[4]}\n\n")
            f.write(f"Action: {t[5]}\n\n")
            f.write(f"Expected Result: {t[6]}\n\n")
            f.write(f"Negative Cases: {t[7]}\n\n")
            f.write(f"Priority: {t[8]}\n\n")
            f.write("---\n\n")

write_inventory('docs/testing/product-test-inventory.md', PRODUCT_TESTS)
write_inventory('docs/testing/order-test-inventory.md', ORDER_TESTS)
write_inventory('docs/testing/payment-test-inventory.md', PAYMENT_TESTS)

print(f"Generated: {len(PRODUCT_TESTS)} Product, {len(ORDER_TESTS)} Order, {len(PAYMENT_TESTS)} Payment tests. Total: {len(PRODUCT_TESTS) + len(ORDER_TESTS) + len(PAYMENT_TESTS)}")
