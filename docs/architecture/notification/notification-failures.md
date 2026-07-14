# Notification Failures Architecture

## Purpose
The purpose of this document is to categorize the specific types of failures that can occur during the notification dispatch lifecycle and establish the architectural patterns for classifying, recording, and reacting to these failures systematically.

## Scope
- Classification of transient vs. permanent delivery failures.
- Provider-agnostic error mapping.
- Failure metadata capture (error tracing).
- Circuit breaking mechanisms for catastrophic provider outages.

## Out of Scope
- Code-level error handling implementations (e.g., `try/catch` blocks).
- Specific HTTP error code mappings for a single vendor (e.g., SendGrid's exact 4xx codes).

## Definitions
- **Transient Failure**: A temporary issue preventing delivery (e.g., DNS resolution failure, network timeout, rate limiting). Expected to resolve upon subsequent retries.
- **Permanent Failure**: An unresolvable issue preventing delivery (e.g., Invalid email address, unsubscribed user, missing push token). Retrying will never succeed.
- **Circuit Breaker**: A pattern that temporarily halts all outbound dispatch to a specific channel if the failure rate crosses a critical threshold, preventing system overload and IP blacklisting.

## Architecture

### Failure Classification
When a Dispatcher attempts to deliver a notification, it must parse the resulting exception or API response into a standardized internal failure type.
1. The Dispatcher catches the raw provider error.
2. It evaluates the error against known patterns (e.g., mapping an HTTP 429 to a Transient Rate Limit error, or an HTTP 400 to a Permanent Payload error).
3. The Delivery record's state is updated accordingly (`Failed` for transient, `Dead-Lettered` for permanent).

### Metadata Capture
To facilitate administrative debugging and support, the system must retain the context of the failure.
- When transitioning to a failed state, the Dispatcher must attach a truncated payload of the raw provider response or exception trace to the Delivery record's metadata.
- This metadata must be sanitized to ensure no sensitive PII is inadvertently logged in plain text.

### Circuit Breaking
To protect the platform's reputation (e.g., email sender score) and prevent wasted compute cycles during a sustained external outage:
- The domain must monitor the ratio of successful to failed deliveries per channel over a rolling time window.
- If the transient failure rate exceeds the configured threshold (e.g., >50% failure over 5 minutes), the Circuit Breaker trips to "Open".
- While "Open", all new dispatch tasks for that channel are immediately queued as `Pending` but are not executed.
- After a cooldown period, the breaker enters a "Half-Open" state, allowing a trickle of messages through to test if the provider has recovered.

## Responsibilities
- **Channel Dispatchers**: Accurately classify failures and capture actionable metadata.
- **Health Monitor**: Track failure rates and manage the Circuit Breaker state.

## Dependencies
- **Redis / Cache**: Required for high-speed tracking of rolling failure rates across distributed worker nodes to support the Circuit Breaker pattern.

## Open Questions
All business and technical decisions have been resolved:

**Question:** Thresholds?
**Decision:** Failure threshold:
25 consecutive failures

Cooldown:
15 minutes

Recovery:
Half-open test mode

Administrator approval required for manual resume.

**Question:** Disable email automatically?
**Decision:** Yes.

After confirmed Hard Bounce:

Disable Email channel

Notify Administrator

Fallback to In-App

## Completion Criteria
- The methodology for classifying failures is standardized across all channels.
- The requirement for capturing diagnostic metadata is enforced.
- The architectural mechanism for protecting the system via Circuit Breaking is defined.
