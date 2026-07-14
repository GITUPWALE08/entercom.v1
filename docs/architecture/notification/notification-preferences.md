# Notification Preferences Architecture

## Purpose
The purpose of this document is to define how user-level notification preferences are modeled, resolved, and enforced during the notification lifecycle, ensuring that users maintain granular control over the alerts they receive.

## Scope
- Default notification preferences for new and existing users.
- Opt-in vs. Opt-out models for specific notification categories.
- Channel-specific toggles (e.g., Enable Email, Disable Push).
- Preference resolution logic during the delivery pipeline.

## Out of Scope
- UI/UX design for the preferences management page.
- Do Not Disturb (DND) schedules or timezone-based delivery suppression (to be handled in a future phase if required).

## Definitions
- **Notification Category**: A logical grouping of notification types (e.g., "Account Alerts", "Request Updates", "Marketing").
- **Preference Record**: A specific configuration indicating a user's choice to enable or disable a specific Category across a specific Channel.
- **System Critical**: A classification of notifications (e.g., Password Reset, Security Alert) that bypass user preferences entirely.

## Architecture

### Preference Hierarchy
To minimize database size and lookup overhead, preferences operate on an inherited default model:
1. **Global Defaults**: Defined at the system level. By default, all operational categories are opted-IN across all channels. Marketing categories may be opted-OUT by default.
2. **User Overrides**: When a user changes a setting, a specific override record is created in the database.
3. **Resolution**: If no override record exists for a given User + Category + Channel combination, the Global Default is applied.

### Resolution Pipeline
Before the Notification Orchestrator spawns delivery tasks, it interrogates the Preference Resolver:
1. Identify the Category of the incoming event.
2. Check if the Category is flagged as "System Critical". If yes, return all available channels immediately.
3. Fetch the target user's preference overrides for this Category.
4. Merge the overrides against the Global Defaults to produce the final authorized channels.
5. Filter out any channels the user does not physically possess (e.g., dropping the Push channel if the user has no registered mobile devices).

## Responsibilities
- **Preference Resolver**: Ensure sub-millisecond evaluation of preferences to prevent the notification dispatch pipeline from stalling during mass broadcasts.
- **Users Domain**: Expose the APIs necessary for the frontend to list, read, and mutate preference overrides.

## Dependencies
- **Caching Layer (Redis)**: Preference overrides must be heavily cached to support high-throughput notification processing. Cache invalidation occurs upon user mutation.
- **Notification Types Registry**: A centralized registry defining all valid Categories and their Global Defaults.

## Open Questions
All business and technical decisions have been resolved:

**Decision:** System Critical notifications bypass all preference settings.

Users cannot disable them.

**Decision:** Preferences shall be grouped by Categories.

Examples:

Requests

Quotes

Orders

Payments

Products

Support

Security

## Completion Criteria
- The hierarchy between global defaults and user overrides is strictly defined.
- The concept of System Critical bypass is established.
- The necessity for high-performance preference caching is mandated.
