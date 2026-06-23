# Booking flow

## Scope

Bookings coordinate **time**, **resource** (technician or slot), and **service request** or **product** context. This document defines **workflow expectations**; implementation details live in domain services.

## Phases (conceptual)

1. **Availability discovery** — Client reads slots or technician capacity via REST; authoritative rules on server.
2. **Hold / reservation (optional)** — Short-lived hold with TTL to reduce double-booking; released on expiry or checkout.
3. **Confirmation** — Persisted booking linked to user/org; triggers notifications.
4. **Fulfillment linkage** — Booking connects to **request lifecycle** states when the booking is service-oriented ([`request-lifecycle.md`](request-lifecycle.md)).

## Cancellation and changes

- **Customer-initiated:** Allowed within policy windows; refunds (if any) follow [payments](../architecture/payments.md) server truth.
- **Staff-initiated:** May require manager permission for same-day changes or fee-impacting edits.
- **No-show handling:** Terminal outcome recorded with reason; may feed analytics.

## Conflict handling

- **Optimistic UI** may show tentative selection; **commit** response is authoritative.
- Server uses **transactions** and, where needed, **exclusion constraints** or row locks for slot writes.

## Notifications

- Confirmations, reminders, and changes fan out per [notifications](../architecture/notifications.md) and WebSocket where realtime UI is required.

## Related documentation

- [`docs/architecture/booking/booking-domain.md`](../architecture/booking/booking-domain.md)
- [`technician-flow.md`](technician-flow.md) — execution side.
- [`../architecture/payments.md`](../architecture/payments.md) — when booking requires payment.
