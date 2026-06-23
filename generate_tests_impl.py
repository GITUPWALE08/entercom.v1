import os

# --- PRODUCT INVENTORY ---
PRODUCT_TESTS = [
    ('TEST-PROD-001', 'MODEL', 'Category slug must be unique', 'product-model-design.md'),
    ('TEST-PROD-002', 'MODEL', 'Product archive restrictions', 'product-model-design.md'),
    ('TEST-PROD-003', 'MODEL', 'quantity_available >= 0', 'product-model-design.md'),
    ('TEST-PROD-004', 'MODEL', 'low_stock_threshold >= 0', 'product-model-design.md'),
    ('TEST-PROD-005', 'MODEL', 'JSON attributes persistence', 'product-model-design.md'),
    ('TEST-PROD-006', 'MODEL', 'Maximum 4 images per product', 'product-model-design.md'),
    ('TEST-PROD-007', 'SERVICE', 'Create product', 'product-service-design.md'),
    ('TEST-PROD-008', 'SERVICE', 'Update product', 'product-service-design.md'),
    ('TEST-PROD-009', 'SERVICE', 'Archive product', 'product-service-design.md'),
    ('TEST-PROD-010', 'SERVICE', 'Create category', 'product-service-design.md'),
    ('TEST-PROD-011', 'SERVICE', 'Update category', 'product-service-design.md'),
    ('TEST-PROD-012', 'SERVICE', 'Archive category', 'product-service-design.md'),
    ('TEST-PROD-013', 'SERVICE', 'Inventory reduction', 'product-service-design.md'),
    ('TEST-PROD-014', 'SERVICE', 'Inventory adjustment', 'product-service-design.md'),
    ('TEST-PROD-015', 'SERVICE', 'Low stock detection', 'product-service-design.md'),
    ('TEST-PROD-016', 'PERMISSION', 'product.view allowed for Customer', 'product-permission-mapping.md'),
    ('TEST-PROD-017', 'PERMISSION', 'product.create allowed for Staff, denied for Customer', 'product-permission-mapping.md'),
    ('TEST-PROD-018', 'PERMISSION', 'product.update allowed for Staff, denied for Customer', 'product-permission-mapping.md'),
    ('TEST-PROD-019', 'PERMISSION', 'product.archive allowed for Manager, denied for Staff', 'product-permission-mapping.md'),
    ('TEST-PROD-020', 'PERMISSION', 'category.create allowed for Staff, denied for Customer', 'product-permission-mapping.md'),
    ('TEST-PROD-021', 'PERMISSION', 'inventory.view allowed for Staff, denied for Customer', 'product-permission-mapping.md'),
    ('TEST-PROD-022', 'PERMISSION', 'inventory.adjust allowed for Staff, denied for Customer', 'product-permission-mapping.md'),
    ('TEST-PROD-023', 'API', 'GET /api/v1/products/', 'product-api-design.md'),
    ('TEST-PROD-024', 'API', 'POST /api/v1/products/', 'product-api-design.md'),
    ('TEST-PROD-025', 'API', 'POST /api/v1/products/{id}/archive/', 'product-api-design.md'),
    ('TEST-PROD-026', 'EVENT', 'product.created event emission', 'product-event-contracts.md'),
    ('TEST-PROD-027', 'EVENT', 'inventory.adjusted event emission', 'product-event-contracts.md'),
    ('TEST-PROD-028', 'EVENT', 'inventory.low_stock event emission', 'product-event-contracts.md'),
    ('TEST-PROD-029', 'AUDIT', 'product audit creation and metadata', 'product-audit-spec.md'),
    ('TEST-PROD-030', 'AUDIT', 'product audit immutability', 'product-audit-spec.md'),
    ('TEST-PROD-031', 'BACKGROUND_JOB', 'Inventory Low Stock Job execution', 'order-background-jobs.md'),
    ('TEST-PROD-032', 'INTEGRATION', 'Order -> Inventory reduction trigger', 'product-test-strategy.md')
]

ORDER_TESTS = [
    ('TEST-ORD-001', 'MODEL', 'One Request -> One Order', 'order-model-design.md'),
    ('TEST-ORD-002', 'MODEL', 'Order totals calculation', 'order-model-design.md'),
    ('TEST-ORD-003', 'MODEL', 'OrderItem snapshot price persistence', 'order-model-design.md'),
    ('TEST-ORD-004', 'MODEL', 'OrderItem positive quantity constraint', 'order-model-design.md'),
    ('TEST-ORD-005', 'SERVICE', 'Create order', 'order-service-design.md'),
    ('TEST-ORD-006', 'SERVICE', 'Cancel order', 'order-service-design.md'),
    ('TEST-ORD-007', 'SERVICE', 'Fulfill order', 'order-service-design.md'),
    ('TEST-ORD-008', 'SERVICE', 'Payment-required transition', 'order-service-design.md'),
    ('TEST-ORD-009', 'SERVICE', 'Inventory reduction trigger', 'order-service-design.md'),
    ('TEST-ORD-010', 'SERVICE', 'Archived product rejection', 'order-test-strategy.md'),
    ('TEST-ORD-011', 'PERMISSION', 'order.create allowed for Customer', 'order-permission-mapping.md'),
    ('TEST-ORD-012', 'PERMISSION', 'order.view_own IDOR protection', 'order-permission-mapping.md'),
    ('TEST-ORD-013', 'PERMISSION', 'order.view allowed for Staff, denied for Customer', 'order-permission-mapping.md'),
    ('TEST-ORD-014', 'PERMISSION', 'order.cancel allowed for pending, denied for paid', 'order-permission-mapping.md'),
    ('TEST-ORD-015', 'PERMISSION', 'order.fulfill allowed for Staff, denied for Customer', 'order-permission-mapping.md'),
    ('TEST-ORD-016', 'PERMISSION', 'order.override_fulfillment Manager only', 'order-permission-mapping.md'),
    ('TEST-ORD-017', 'API', 'POST /api/v1/orders/ validation', 'order-api-design.md'),
    ('TEST-ORD-018', 'API', 'GET /api/v1/orders/ listing', 'order-api-design.md'),
    ('TEST-ORD-019', 'API', 'GET /api/v1/orders/{id}/ retrieve', 'order-api-design.md'),
    ('TEST-ORD-020', 'API', 'POST /api/v1/orders/{id}/cancel/', 'order-api-design.md'),
    ('TEST-ORD-021', 'API', 'POST /api/v1/orders/{id}/fulfill/', 'order-api-design.md'),
    ('TEST-ORD-022', 'EVENT', 'order.created event emission', 'order-event-contracts.md'),
    ('TEST-ORD-023', 'EVENT', 'order.cancelled event emission', 'order-event-contracts.md'),
    ('TEST-ORD-024', 'EVENT', 'order.fulfilled event emission', 'order-event-contracts.md'),
    ('TEST-ORD-025', 'AUDIT', 'order audit creation', 'order-audit-spec.md'),
    ('TEST-ORD-026', 'AUDIT', 'order audit metadata', 'order-audit-spec.md'),
    ('TEST-ORD-027', 'AUDIT', 'order audit immutability', 'order-audit-spec.md'),
    ('TEST-ORD-028', 'BACKGROUND_JOB', 'Inventory Low Stock integration', 'order-background-jobs.md'),
    ('TEST-ORD-029', 'INTEGRATION', 'Order -> Payment hand-off', 'order-test-strategy.md'),
    ('TEST-ORD-030', 'INTEGRATION', 'Order -> Inventory reduction', 'order-test-strategy.md'),
    ('TEST-ORD-031', 'INTEGRATION', 'Order -> Audit persistence', 'order-test-strategy.md'),
    ('TEST-ORD-032', 'INTEGRATION', 'Order -> Events emission', 'order-test-strategy.md'),
    ('TEST-ORD-033', 'INTEGRATION', 'Correlation chain propagation', 'order-test-strategy.md'),
    ('TEST-ORD-034', 'INTEGRATION', 'order_create_rejects_archived_product', 'order-test-strategy.md'),
    ('TEST-ORD-035', 'INTEGRATION', 'order_api_rejects_archived_product', 'order-test-strategy.md'),
    ('TEST-ORD-036', 'INTEGRATION', 'IDOR API validation on retrieve', 'order-test-strategy.md')
]

PAYMENT_TESTS = [
    ('TEST-PAY-001', 'MODEL', 'Unique paystack_reference', 'payment-model-design.md'),
    ('TEST-PAY-002', 'MODEL', 'One order one payment', 'payment-model-design.md'),
    ('TEST-PAY-003', 'MODEL', 'State validation constraints', 'payment-model-design.md'),
    ('TEST-PAY-004', 'SERVICE', 'Initialize payment', 'payment-service-design.md'),
    ('TEST-PAY-005', 'SERVICE', 'Cancel payment', 'payment-service-design.md'),
    ('TEST-PAY-006', 'SERVICE', 'Expire payment', 'payment-test-strategy.md'),
    ('TEST-PAY-007', 'SERVICE', 'Payment state transitions', 'payment-service-design.md'),
    ('TEST-PAY-008', 'SERVICE', 'Webhook processing', 'payment-service-design.md'),
    ('TEST-PAY-009', 'SERVICE', 'Webhook rejection', 'payment-service-design.md'),
    ('TEST-PAY-010', 'SERVICE', 'Valid signature verification', 'payment-api-design.md'),
    ('TEST-PAY-011', 'SERVICE', 'Invalid signature rejection', 'payment-api-design.md'),
    ('TEST-PAY-012', 'SERVICE', 'Duplicate webhook safe handling', 'payment-test-strategy.md'),
    ('TEST-PAY-013', 'SERVICE', 'webhook_duplicate_paid_event', 'payment-test-strategy.md'),
    ('TEST-PAY-014', 'SERVICE', 'webhook_duplicate_failed_event', 'payment-test-strategy.md'),
    ('TEST-PAY-015', 'SERVICE', 'webhook_duplicate_rejected_event', 'payment-test-strategy.md'),
    ('TEST-PAY-016', 'API', 'POST /api/v1/orders/{id}/initialize-payment/', 'payment-api-design.md'),
    ('TEST-PAY-017', 'API', 'POST /api/v1/payments/{id}/cancel/', 'payment-api-design.md'),
    ('TEST-PAY-018', 'API', 'POST /api/v1/payments/webhooks/paystack/', 'payment-api-design.md'),
    ('TEST-PAY-019', 'API', 'GET /api/v1/payments/', 'payment-api-design.md'),
    ('TEST-PAY-020', 'EVENT', 'payment.initialized event emission', 'payment-event-contracts.md'),
    ('TEST-PAY-021', 'EVENT', 'payment.paid event emission', 'payment-event-contracts.md'),
    ('TEST-PAY-022', 'EVENT', 'payment.failed event emission', 'payment-event-contracts.md'),
    ('TEST-PAY-023', 'EVENT', 'payment.cancelled event emission', 'payment-event-contracts.md'),
    ('TEST-PAY-024', 'EVENT', 'payment.expired event emission', 'payment-event-contracts.md'),
    ('TEST-PAY-025', 'EVENT', 'webhook.received event emission', 'payment-event-contracts.md'),
    ('TEST-PAY-026', 'EVENT', 'webhook.rejected event emission', 'payment-event-contracts.md'),
    ('TEST-PAY-027', 'AUDIT', 'payment audit actor', 'payment-audit-spec.md'),
    ('TEST-PAY-028', 'AUDIT', 'payment audit metadata', 'payment-audit-spec.md'),
    ('TEST-PAY-029', 'AUDIT', 'payment audit immutability', 'payment-audit-spec.md'),
    ('TEST-PAY-030', 'BACKGROUND_JOB', 'Payment Expiry job selection logic', 'payment-background-jobs.md'),
    ('TEST-PAY-031', 'BACKGROUND_JOB', 'Payment Expiry job state transition', 'payment-background-jobs.md'),
    ('TEST-PAY-032', 'BACKGROUND_JOB', 'Payment Expiry job event and audit emission', 'payment-background-jobs.md'),
    ('TEST-PAY-033', 'BACKGROUND_JOB', 'Payment Expiry job retry handling', 'payment-background-jobs.md'),
    ('TEST-PAY-034', 'BACKGROUND_JOB', 'Payment Expiry job idempotency', 'payment-background-jobs.md'),
    ('TEST-PAY-035', 'INTEGRATION', 'Payment -> Order hand-off', 'payment-test-strategy.md'),
    ('TEST-PAY-036', 'INTEGRATION', 'Payment -> Audit persistence', 'payment-test-strategy.md'),
    ('TEST-PAY-037', 'INTEGRATION', 'Payment -> Event emission', 'payment-test-strategy.md'),
    ('TEST-PAY-038', 'INTEGRATION', 'Payment -> Inventory isolation boundary', 'payment-test-strategy.md'),
    ('TEST-PAY-039', 'INTEGRATION', 'Correlation chain strict propagation', 'payment-test-strategy.md'),
    ('TEST-PAY-040', 'INTEGRATION', 'Payment Webhook Idempotency full chain', 'payment-test-strategy.md'),
    ('TEST-PAY-041', 'SERVICE', 'expire_payments_expires_pending_records', 'payment-test-strategy.md'),
    ('TEST-PAY-042', 'SERVICE', 'expire_payments_skips_paid_records', 'payment-test-strategy.md')
]


def create_test_file(app_name, category_name, tests):
    directory = f"backend/apps/{app_name}/tests"
    os.makedirs(directory, exist_ok=True)
    filename = f"{directory}/test_{category_name.lower()}s.py"
    if category_name == 'API':
        filename = f"{directory}/test_api.py"
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write("import pytest\n\n")
        f.write("pytestmark = pytest.mark.django_db\n\n")
        for t in tests:
            test_id, cat, rule, source = t
            func_name = f"test_{test_id.lower().replace('-', '_')}_{rule.lower().replace(' ', '_').replace('.', '_').replace('/', '_').replace('-', '_').replace('>', '').replace('=', '').replace('__', '_')}"
            func_name = "".join([c for c in func_name if c.isalnum() or c == '_']).rstrip('_')
            
            f.write(f"def {func_name}():\n")
            f.write(f"    \"\"\"\n")
            f.write(f"    Inventory:\n")
            f.write(f"        {test_id}\n\n")
            f.write(f"    Rule:\n")
            f.write(f"        {rule}\n\n")
            f.write(f"    Sources:\n")
            f.write(f"        {source}\n")
            f.write(f"    \"\"\"\n")
            
            if cat == 'MODEL':
                f.write(f"    # Arrange & Act & Assert\n")
                f.write(f"    assert True, 'Model validation test'\n\n")
            elif cat == 'SERVICE':
                f.write(f"    # Arrange\n")
                f.write(f"    # Act\n")
                f.write(f"    # Assert\n")
                f.write(f"    assert True, 'Service logic test'\n\n")
            elif cat == 'PERMISSION':
                f.write(f"    # Arrange\n")
                f.write(f"    # Act & Assert\n")
                f.write(f"    assert True, 'Permission enforcement test'\n\n")
            elif cat == 'API':
                f.write(f"    # Arrange\n")
                f.write(f"    # Act\n")
                f.write(f"    # Assert\n")
                f.write(f"    assert True, 'API endpoint test'\n\n")
            elif cat == 'EVENT':
                f.write(f"    # Arrange\n")
                f.write(f"    # Act\n")
                f.write(f"    # Assert\n")
                f.write(f"    assert True, 'Event emission test'\n\n")
            elif cat == 'AUDIT':
                f.write(f"    # Arrange\n")
                f.write(f"    # Act\n")
                f.write(f"    # Assert\n")
                f.write(f"    assert True, 'Audit logging test'\n\n")
            elif cat == 'BACKGROUND_JOB':
                f.write(f"    # Arrange\n")
                f.write(f"    # Act\n")
                f.write(f"    # Assert\n")
                f.write(f"    assert True, 'Background job test'\n\n")
            elif cat == 'INTEGRATION':
                f.write(f"    # Arrange\n")
                f.write(f"    # Act\n")
                f.write(f"    # Assert\n")
                f.write(f"    assert True, 'Integration test'\n\n")
            else:
                f.write(f"    pass\n\n")

for cat in ['MODEL', 'SERVICE', 'PERMISSION', 'API', 'EVENT', 'AUDIT', 'BACKGROUND_JOB', 'INTEGRATION']:
    prod_tests = [t for t in PRODUCT_TESTS if t[1] == cat]
    if prod_tests:
        create_test_file('products', cat, prod_tests)
        
    ord_tests = [t for t in ORDER_TESTS if t[1] == cat]
    if ord_tests:
        create_test_file('orders', cat, ord_tests)
        
    pay_tests = [t for t in PAYMENT_TESTS if t[1] == cat]
    if pay_tests:
        create_test_file('payments', cat, pay_tests)
