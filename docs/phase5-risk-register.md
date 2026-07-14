# Phase 5 Final Risk Register

## Overview
This risk register documents the critical system vulnerabilities identified during Phase 5 and details exactly how each was definitively resolved and verified through negative testing. As of the close of Phase 5, all listed risks are marked **[CLOSED]**.

---

## Identified Risks & Final Mitigations

### 1. Webhook Signature Tampering & Exceptions [CLOSED]
* **Risk:** Invalid webhook signatures from Paystack threw uncaught `ValidationError` exceptions, resulting in `500 Internal Server Error` responses.
* **Impact:** A malformed payload could trigger alert fatigue and fail to give the upstream provider the expected client-side rejection response.
* **Mitigation (Applied & Verified):** Caught `ValidationError` from `django.core.exceptions` in `PaystackWebhookView` and explicitly returned `400 Bad Request`. Negative test `test_test_pay_013_invalid_hmac_signature` confirmed identical graceful rejection.

### 2. Double-Spend via Duplicate Webhooks [CLOSED]
* **Risk:** Paystack firing multiple successful charge webhooks simultaneously could lead to duplicating payment confirmations and inadvertently triggering multiple fulfillment routines.
* **Impact:** Financial and inventory discrepancies.
* **Mitigation (Applied & Verified):** `WebhookService.process_webhook` enforces `@transaction.atomic` and locks the record with `select_for_update()`. Subsequent webhooks detect the `PAID` state and safely exit. Test `test_test_pay_012_duplicate_webhook_safe_handling` explicitly confirms this behavior.

### 3. Inventory Overselling via Concurrent Fulfillments [CLOSED]
* **Risk:** High-concurrency checkouts competing for the same limited stock item could bypass python-level quantity checks, resulting in negative inventory.
* **Impact:** Selling items that do not exist.
* **Mitigation (Applied & Verified):** `InventoryService.reduce_inventory` applies a robust row-level database lock using `select_for_update().filter(id__in=product_ids)`. Concurrent requests queue at the database level and natively fail with "Insufficient stock" once the lock releases.

### 4. Invalid Order State Transitions (Cancellations) [CLOSED]
* **Risk:** Orders marked as `PAID` or `FULFILLED` could theoretically be cancelled if strict gatekeeping wasn't applied dynamically.
* **Impact:** Data inconsistency, potential fulfillment of cancelled items.
* **Mitigation (Applied & Verified):** Formalized and explicitly tested strict state machine boundaries. `OrderService.cancel_order` aggressively rejects any order not strictly in `PENDING` or `CREATED`. Validated thoroughly in `test_order_service_edge_cases`.

### 5. Overly Permissive Role Type Casting [CLOSED]
* **Risk:** String casting for roles allows malformed role objects to implicitly downgrade to `Role.CUSTOMER` or bypass auth.
* **Impact:** Low severity. Unrecognized roles default to least privilege.
* **Mitigation (Applied & Verified):** Standardized using strictly defined `Role` enums and parsing `hasattr(user.role, 'value')` defensively. `PermissionChecker` explicitly throws `PermissionDenied` on unknown permissions or misaligned roles.
