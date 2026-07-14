# Notification Channel Policy Architecture

## Purpose
The purpose of this document is to define the specific behavioral rules, capabilities, and constraints applied to each distinct delivery channel (In-App, WebSocket, Email, Push) within the Notification Domain.

## Scope
- Base capabilities expected from any channel implementation.
- Specific policies for In-App (persistent) delivery.
- Specific policies for WebSocket (real-time transient) delivery.
- Specific policies for Email and Push (external) delivery.
- Channel priority and fallback mechanics.

## Out of Scope
- Vendor selection for Email or Push delivery.
- The underlying TCP/IP or protocol specifics of the channels.

## Definitions
- **Channel Priority**: The hierarchical order in which channels are processed. Some channels might be considered "primary" while others are "fallback".
- **Batching**: Grouping multiple notifications into a single delivery payload (e.g., a daily digest email) rather than sending them individually.

## Architecture

### 1. In-App Channel Policy
The In-App channel is the absolute source of truth for the user's notification history.
- **Persistence**: Required. All notifications MUST be routed through the In-App channel to ensure a permanent record exists in the database.
- **Read State**: This channel exclusively owns the canonical "Read/Unread" state.
- **Bypass**: Users cannot opt-out of In-App notifications. It ignores user preference overrides (though the user can ignore the UI).

### 2. WebSocket Channel Policy
The WebSocket channel provides real-time UI updates without requiring page reloads.
- **Persistence**: None. This is a transient, fire-and-forget channel.
- **Delivery Guarantee**: At-most-once. If the user is not currently connected to the WebSocket, the message is dropped. The system relies on the In-App persistence to provide the data when the user eventually connects.
- **Payload**: Minimal. Typically only contains the Unread Count or a lightweight trigger for the frontend to refetch the notification list via REST.

### 3. Email Channel Policy
The Email channel is for asynchronous, off-platform engagement.
- **Format**: Requires both HTML and Plain-Text rendering.
- **Batching**: Eligible for batching. High-frequency events (e.g., multiple comments on a Request) may be aggregated into a single digest email based on system rules to prevent inbox fatigue.
- **Unsubscribe**: Must strictly adhere to anti-spam laws (CAN-SPAM/GDPR). Every email must include an unsubscribe link that interacts directly with the Preference Resolver.

### 4. Push (Mobile/PWA) Channel Policy
The Push channel is for high-priority, immediate off-platform engagement.
- **Format**: Highly constrained payload size (e.g., Apple APNS payload limits).
- **Interruption Level**: Can trigger device vibrations or sounds. Must be used judiciously to prevent users from globally disabling the app's push permissions at the OS level.
- **Token Management**: The Dispatcher must gracefully handle token expiration (e.g., uninstalling the app) by marking the failure as permanent and instructing the Users Domain to invalidate the token.

## Responsibilities
- **Orchestrator**: Enforce channel priorities. Ensure In-App is always processed first to establish the database record before attempting external channels.
- **Channel Dispatchers**: Adhere strictly to the payload constraints and batching rules defined for their specific medium.

## Dependencies
- **WebSocket Domain**: For the physical transmission of real-time payloads.
- **Template Engine**: For rendering HTML emails securely.

## Open Questions
All business and technical decisions have been resolved:

**Question:** Should failed Push notifications automatically fall back to Email even if Email is disabled?
**Decision:** No.

User notification preferences shall always be respected.

Automatic fallback may only occur across channels that remain enabled for the notification category.

System Critical notifications are governed separately.

Rationale:
Respecting user consent is mandatory.

Impact:
Preference Resolver
Dispatcher

## Completion Criteria
- The distinct behavioral rules for In-App, WebSocket, Email, and Push are established.
- The concept of In-App as the un-bypassable source of truth is codified.
