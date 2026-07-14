# Notification Delivery Architecture

## Purpose
The purpose of this document is to define the exact mechanics, guarantees, and recovery policies governing the physical delivery of notifications across all supported channels within the Phase 6 architecture.

## Scope
- Delivery guarantees (at-least-once vs exactly-once).
- Dead-letter handling and max retry constraints.
- Multi-channel delivery coordination.
- Provider-specific constraints for Email and Push channels.

## Out of Scope
- Internal Celery worker configurations (e.g., concurrency limits).
- External provider account setup (e.g., SendGrid API keys).
- User preference resolution (handled in `notification-preferences.md`).

## Definitions
- **Guaranteed Delivery**: A commitment that the system will repeatedly attempt to dispatch a notification until it receives a success response from the target channel (or hits a permanent failure ceiling).
- **Idempotency Key**: A unique token generated per delivery attempt to prevent external providers from sending duplicate messages in the event of a network timeout.
- **Dead-Letter Handling**: The systematic quarantine of deliveries that have proven impossible to process, removing them from active queues while preserving them for manual inspection.

## Architecture

### Dispatch Pipeline
Once the orchestrator determines which channels a notification requires, it spawns isolated delivery tasks for each channel.
1. **Isolation**: The failure of an Email delivery does NOT affect the successful delivery of an In-App or Push notification. Each channel operates completely independently.
2. **Payload Formatting**: Each channel dispatcher is responsible for translating the standardized internal notification payload into the format required by its specific channel.

### Retry & Backoff Strategy
The platform mandates a guaranteed delivery policy.
- **Transient Failures**: (e.g., Network timeout, HTTP 503 from provider). The delivery state is marked as `Failed`. A background recovery service uses Exponential Backoff with Jitter to attempt redelivery.
- **Permanent Failures**: (e.g., Invalid email format, HTTP 400 from provider). The delivery is immediately transitioned to `Dead-Lettered` bypassing further retries.
- **Thresholds**: A maximum retry count must be established. Once breached, transient failures are converted to permanent failures and placed in the Dead-Letter Queue (DLQ).

### Idempotency
To support safe retries without spamming users, dispatchers communicating with external APIs (Email, Push) must attach an idempotency key (derived from the Delivery ID and Notification ID) to all outbound requests.

## Responsibilities
- **Delivery Workers**: Execute the physical network request to the provider. Handle timeouts and parse provider responses to determine transient vs permanent failures.
- **Recovery Service**: Periodically poll for `Failed` deliveries eligible for retry based on the backoff schedule.

## Dependencies
- **Task Queue**: Requires a reliable queue (e.g., Celery/Redis) to handle asynchronous dispatch.
- **External Providers**: Reliance on third-party uptime for Email and Push.

## Open Questions
All business and technical decisions have been resolved:

**Question:** What is the retry formula?
**Decision:** Exponential Backoff

1 minute
2 minutes
5 minutes
10 minutes
20 minutes
40 minutes
80 minutes
160 minutes

Maximum retries:
8

Maximum retry window:
24 hours

After retry exhaustion:
Dead Letter Queue

**Question:** How should dispatchers handle provider rate limits?
**Decision:** Dispatchers shall enqueue messages internally and throttle outbound requests using provider-specific rate limit policies.

Workers must never fail notifications solely because of provider throttling.

Messages remain queued until capacity becomes available.

## Completion Criteria
- The mechanisms for guaranteeing delivery are fully documented.
- The distinction between transient and permanent failures is clear.
- Cross-channel isolation is explicitly mandated.
