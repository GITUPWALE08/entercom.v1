# Notification Retry Policy Design

## Purpose
The purpose of this document is to define the exact mathematical backoff schedules and technical thresholds used by the Notification Domain to guarantee delivery during transient network outages, while aggressively preventing systemic overload (thundering herd scenarios).

## Scope
- Configuration of Exponential Backoff with Jitter.
- Definition of maximum retry thresholds per channel.
- Handling of specific provider error codes (Transient vs. Permanent).
- The transition mechanism into the Dead-Letter Queue (DLQ).

## Out of Scope
- Global system circuit breaking (defined at the architecture level, outside individual task retries).
- Configuration of the underlying Celery worker prefetch multipliers.

## Definitions
- **Exponential Backoff**: Increasing the wait time between retry attempts exponentially (e.g., 2s, 4s, 8s, 16s).
- **Jitter**: A randomized percentage added to or subtracted from the exact backoff calculation to spread out the execution of tasks that failed simultaneously.
- **Dead-Letter Queue (DLQ)**: A logical state representing the terminal failure of a delivery attempt after all retries have been exhausted.

## Architecture

### 1. Backoff Schedule Mathematics
The system utilizes Celery's native retry mechanisms configured with a specific exponential algorithm.

**Formula**: `retry_delay = min(max_delay, base_delay * (2 ^ attempt)) + jitter()`

**Configuration Constraints**:
- `base_delay`: 15 seconds.
- `max_delay`: 3600 seconds (1 hour).
- `jitter`: +/- 10% of the calculated delay.
- `max_retries`: 10 attempts total.

**Theoretical Schedule (assuming no jitter)**:
- Attempt 1: Fail. Wait 15s.
- Attempt 2: Fail. Wait 30s.
- Attempt 3: Fail. Wait 60s.
- Attempt 4: Fail. Wait 120s (2m).
- Attempt 5: Fail. Wait 240s (4m).
- Attempt 6: Fail. Wait 480s (8m).
- Attempt 7: Fail. Wait 960s (16m).
- Attempt 8: Fail. Wait 1920s (32m).
- Attempt 9: Fail. Wait 3600s (Max delay reached - 1hr).
- Attempt 10: Fail. Max retries exceeded.

*If Attempt 10 fails, the `DeliveryAttempt` record status is transitioned to `DEAD_LETTERED`, and an audit event is emitted.*

### 2. Failure Classification Matrix
The Delivery Service must accurately inspect the exception raised during physical dispatch to determine if a retry is mathematically warranted.

**Transient Exceptions (Eligible for Retry)**:
- `requests.exceptions.Timeout` / `requests.exceptions.ConnectionError`.
- HTTP 429 Too Many Requests (Rate Limiting).
- HTTP 500/502/503/504 Server Errors (Provider outage).

**Permanent Exceptions (Bypass retries, go straight to DLQ)**:
- HTTP 400 Bad Request (Malformed payload, fixing it requires code changes).
- HTTP 401 Unauthorized / 403 Forbidden (Invalid API keys).
- HTTP 404 Not Found (Invalid endpoint).
- Provider-specific Hard Bounces (e.g., SendGrid "Invalid Email Address").

### 3. Rate Limit Preservation
If an external provider returns an HTTP 429 response that includes a `Retry-After` header, the Delivery Service must override the standard exponential backoff calculation and explicitly set the next retry delay to the value provided by the vendor, preventing the system from actively violating the vendor's required cooldown period.

## Responsibilities
- **Delivery Tasks (Celery)**: Must correctly `try/except` the network calls and raise the appropriate Celery `Retry` exception or allow it to fail permanently based on the classification matrix.
- **Provider API Clients**: Must safely parse provider responses to extract and respect `Retry-After` headers if present.

## Dependencies
- **Celery Task Engine**: The `autoretry_for` and `retry_backoff` configurations inherent to Celery will be leveraged heavily to implement this design.

## Open Questions
- None. The specific thresholds and mathematical formulas are clearly defined based on the architectural directives.

## Completion Criteria
- The exact exponential backoff formula and max retry limits are documented.
- The criteria for classifying an error as transient vs. permanent are established.
- The mechanism for handling provider-supplied `Retry-After` headers is defined.
