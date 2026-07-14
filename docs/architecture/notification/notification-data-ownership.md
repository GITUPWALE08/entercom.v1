# Notification Data Ownership Architecture

## Purpose
The purpose of this document is to define the exact boundaries of data ownership for the Notification Domain. It establishes which data the domain inherently owns, which data it merely references, and how it handles data lifecycle changes triggered by other domains.

## Scope
- Definition of Notification-owned entities (Preferences, Notifications, Delivery States).
- Definition of referenced entities (Users, Requests, Quotes).
- Data synchronization and deletion cascading (e.g., handling user deletion).

## Out of Scope
- Specific database schema design or table layouts.
- Backup and disaster recovery procedures.

## Definitions
- **Hard Ownership**: The domain is the exclusive authority and source of truth for the data. No other domain may mutate it directly.
- **Reference Ownership**: The domain holds a pointer (ID) to data owned by another domain, relying on inter-domain APIs or events to fetch the latest state.

## Architecture

### Hard Ownership
The Notification Domain holds exclusive **Hard Ownership** over:
1. **Notification Records**: The core entity representing an intent to alert a user, including its content payload and Read/Unread state.
2. **Delivery Attempts**: The historical record of physical dispatch attempts across various channels (e.g., tracking that an email was sent at 10:00 AM).
3. **Dead-Letter Queues (DLQ)**: The repository of permanently failed deliveries.
4. **User Preferences**: The override configurations dictating how and if a user receives specific categories of alerts.

No other domain is permitted to write directly to these tables. They must interact strictly via the Notification Domain's provided APIs or event subscriptions.

### Reference Ownership
The Notification Domain holds **Reference Ownership** over:
1. **Target Recipients (Users)**: It stores `recipient_id` but relies on the Users Domain to fetch the current email address, push tokens, or profile information during the dispatch phase.
2. **Business Resources (e.g., Requests, Quotes)**: It stores a generic `resource_type` and `resource_id` (e.g., `Type: Request, ID: 123`) to build deep links for the frontend UI. It does not own the state of the Request itself.

### Data Lifecycle and Cascading
Because the domain holds references to external data, it must react gracefully to external lifecycle events:
- **User Deletion (`UserDeleted` event)**: When a user is purged from the platform, the Notification Domain must execute a cascading purge or anonymization of all personal notifications and preference records tied to that `user_id`.
- **Resource Deletion (`RequestDeleted` event)**: If a business resource is deleted, the domain should ideally tombstone or gracefully degrade the deep links in existing notifications rather than aggressively deleting the historical notification.

## Responsibilities
- **Notification Domain**: Maintain strict relational integrity internally, while gracefully handling the absence of referenced external data (e.g., rendering "Resource no longer available" if a linked Request is missing).

## Dependencies
- **Users Domain**: Source of truth for identity and contact details required during dispatch.
- **Core Domains**: Sources of truth for the business resources referenced in the notification payloads.

## Open Questions
All business and technical decisions have been resolved:

**Question:** Should failed delivery logs be physically deleted during GDPR deletion?
**Decision:** No.

Personally identifiable information shall be anonymized.

Operational metrics and delivery statistics shall be retained.

Rationale:
Supports compliance while preserving operational analytics.

Impact:
Retention Service
Audit
Analytics

## Completion Criteria
- Hard vs Reference data ownership is distinctly categorized.
- The domain's response to the deletion of external referenced data (User or Resource) is codified.
