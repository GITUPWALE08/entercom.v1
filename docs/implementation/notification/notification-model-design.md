# Notification Model Design

## Purpose
The purpose of this document is to define the logical database schema and relational data model for the Notification Domain. It translates the architectural requirements (such as preference inheritance, delivery tracking, and data ownership) into concrete entity structures without writing the actual Django ORM code.

## Scope
- Definition of the core `Notification` entity.
- Definition of the `NotificationPreference` entity.
- Definition of the `DeliveryAttempt` entity for tracking channel-specific states.
- Relationships between these entities and external domains (Users, Resources).
- Indexing strategies for high-performance querying.

## Out of Scope
- Django ORM syntax (e.g., `models.CharField`).
- Physical database migrations (SQL).
- Schema definitions for other domains (e.g., `User` or `Request` models).

## Definitions
- **Entity**: A logical representation of a database table.
- **Foreign Key (FK)**: A hard relational link to another table within the same domain.
- **Generic Foreign Key (GFK)**: A soft relational link to a resource in an external domain (storing `resource_type` and `resource_id`).
- **JSONB**: A structured JSON field used to store variable metadata or payload context without requiring strict schema migrations.

## Architecture

### 1. The Notification Entity
This is the core table representing a single alert sent to a single user.
- **Fields**:
  - `id`: Primary Key (UUID).
  - `recipient_id`: FK to the Users domain.
  - `category`: String representing the notification category (e.g., "request_update").
  - `event_type`: String representing the specific trigger (e.g., "quote_approved").
  - `title`: String (The short summary).
  - `message`: Text (The detailed message).
  - `context`: JSONB (Stores template variables and deep link parameters).
  - `resource_type`: String (e.g., "request", "quote").
  - `resource_id`: String/UUID (Soft link to the core business entity).
  - `status`: Enum (`UNREAD`, `READ`, `ARCHIVED`).
  - `created_at`: Timestamp.
  - `read_at`: Nullable Timestamp.
- **Indexes**: 
  - Composite index on `(recipient_id, status, created_at)` for fast inbox rendering.
  - Index on `(resource_type, resource_id)` to handle cascading soft-deletes if the resource is removed.

### 2. The Delivery Attempt Entity
Tracks the physical transmission of a Notification across a specific channel. A single Notification may have multiple Delivery Attempts (e.g., one for Email, one for In-App).
- **Fields**:
  - `id`: Primary Key (UUID).
  - `notification_id`: FK to the Notification Entity.
  - `channel`: Enum (`IN_APP`, `EMAIL`, `PUSH`, `WEBSOCKET`).
  - `status`: Enum (`PENDING`, `PROCESSING`, `SENT`, `FAILED`, `DEAD_LETTERED`).
  - `retry_count`: Integer (Defaults to 0).
  - `provider_response`: JSONB (Stores the sanitized error trace or provider success receipt).
  - `idempotency_key`: String (Unique constraint to prevent duplicate vendor dispatches).
  - `updated_at`: Timestamp.
- **Indexes**:
  - Index on `status` to allow background workers to rapidly sweep for `FAILED` deliveries eligible for retry.
  - Foreign Key index on `notification_id` to allow cascading deletes when a Notification is purged.

### 3. The Notification Preference Entity
Stores user-specific overrides to the global notification defaults.
- **Fields**:
  - `id`: Primary Key (UUID).
  - `user_id`: FK to the Users domain.
  - `category`: String (e.g., "marketing", "request_updates").
  - `channel`: Enum (`EMAIL`, `PUSH`). *Note: In-App cannot be opted out of.*
  - `is_enabled`: Boolean.
  - `updated_at`: Timestamp.
- **Constraints**:
  - Unique constraint on `(user_id, category, channel)` to prevent conflicting overrides.
- **Indexes**:
  - Index on `user_id` for rapid retrieval during the Preference Resolution phase.

## Responsibilities
- **Data Integrity**: The model design must enforce required fields (e.g., a Notification cannot exist without a `recipient_id`).
- **Performance**: The models must be designed with appropriate indexes to support the high read-to-write ratio of a notification inbox.

## Dependencies
- **PostgreSQL**: Assumes the availability of `JSONB` for flexible context and metadata storage.
- **Users Domain**: Assumes the existence of a stable `User` UUID to map `recipient_id` and `user_id`.

## Open Questions
- None. All major design decisions have been resolved by the preceding architecture documents.

## Completion Criteria
- The logical schema for Notifications, Delivery Attempts, and Preferences is documented.
- Indexing strategies for inbox querying and delivery retries are established.
- Cross-domain relationship handling (Soft vs Hard links) is defined.
