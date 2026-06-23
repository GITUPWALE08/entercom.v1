# Payments architecture (Payment Provider)

## Truth on the server

**Never** trust frontend “payment successful” alone. The canonical flow:

1. Client initiates Payment Provider transaction (reference generated **server-side** when possible).
2. User completes payment with Payment Provider.
3. **Webhook** hits Django (for example `POST /api/v1/payments/webhooks/provider/`).
4. Backend **verifies HMAC signature** using the Payment Provider secret.
5. **Idempotent** handler updates database (order/payment state) inside a transaction.
6. **Notifications / WebSocket** propagate status to clients ([notifications.md](notifications.md), [websocket.md](websocket.md)).

## Frontend reflection

- UI may **poll** or **subscribe** to status after initiation; **final** state mirrors **server truth** after webhook processing.

## Failure modes

| Failure | Mitigation |
|---------|------------|
| Duplicate webhooks | Idempotency on `reference` / Payment Provider event id |
| Late or missing webhooks | Reconciliation job (Celery) in a later phase |
| Forged webhook | Signature verification; reject if invalid |

## Related documentation

- [auth.md](auth.md) — webhook authentication model vs user JWT.
- [../workflows/request-lifecycle.md](../workflows/request-lifecycle.md) — if payments gate workflow states.
