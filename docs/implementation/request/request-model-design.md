# Request Model Design Specification

## 1. File Purpose
This document defines the data structures and entity relationships for the Phase 3 Request Lifecycle System. It provides the technical blueprint for persistence, ensuring data integrity, parent-child lineage, and strict state management.

## 2. Scope
*   Aggregate boundaries and entity definitions.
*   Schema requirements for Request, Quote, Assignment, and Verification sub-domains.
*   Data inheritance and ownership models.
*   Concurrency and indexing strategies.

## 3. Out of Scope
*   Framework-specific code (e.g., Django Model classes).
*   API or UI implementation.
*   Storage engine optimization.

## 4. Full Content

### 4.1 Aggregate Boundaries
The **Request Aggregate** is the primary consistency boundary. All secondary entities (Quotes, Assignments, Verifications) are tied to the lifecycle of a root Request.

### 4.2 Entity Definitions

#### 4.2.1 Request Entity (Aggregate Root)
*   **Purpose**: Central record for a service need.
*   **Key Fields**:
    *   `id` (UUID): Primary key.
    *   `public_id` (String): Human-readable reference (Unique).
    *   `customer` (User Ref): The originating user.
    *   `category` (Enum): installation, inspection, maintenance, support, information, booking, product_order, device_outage, consultation, warranty.
    *   `priority` (Enum): emergency, urgent, normal, low.
    *   `status` (Enum): draft, submitted, staff_review, awaiting_quote, awaiting_customer_approval, awaiting_payment, awaiting_assignment, assigned, in_progress, pending_verification, escalated, completed, cancelled.
    *   `description` (Text): Customer-provided details.
    *   `location` (Object): Address and coordinates.
    *   `assigned_technician` (User Ref, Nullable): Exactly one assigned tech (MVP rule).
    *   `decline_count` (Integer): Incremented on tech decline.
    *   `parent_request` (Request Ref, Nullable): Link to parent lineage.
    *   `created_at` (Timestamp).
    *   `updated_at` (Timestamp).

#### 4.2.2 Quote Entity
*   **Purpose**: Financial estimates.
*   **Key Fields**:
    *   `request` (Request Ref): Back-link to root.
    *   `version` (Integer): 1 to 3 (Max revision count rule).
    *   `amount` (Decimal): Financial value.
    *   `status` (Enum): draft, issued, approved, rejected, expired, superseded.
    *   `expires_at` (Timestamp): Set to 30 days from issuance.
    *   `created_by` (User Ref): Staff or Technician.

#### 4.2.3 Assignment Entity
*   **Purpose**: Historical record of technician matches.
*   **Key Fields**:
    *   `request` (Request Ref).
    *   `technician` (User Ref).
    *   `assigned_at` (Timestamp).
    *   `accepted_at` (Timestamp, Nullable).
    *   `declined_at` (Timestamp, Nullable).
    *   `decline_reason` (Enum): out_of_area, overloaded, lack_of_skill, unavailable, safety_concern, other.

#### 4.2.4 Verification Entity
*   **Purpose**: Quality gate record.
*   **Key Fields**:
    *   `request` (Request Ref).
    *   `status` (Enum): pending, approved, rejected, overridden.
    *   `reviewed_by` (User Ref, Nullable): Staff/Manager identity.
    *   `override_reason` (Text, Nullable): Mandatory if status is `overridden`.

#### 4.2.5 Evidence Entity
*   **Purpose**: Proof of work persistence.
*   **Key Fields**:
    *   `verification` (Verification Ref).
    *   `type` (Enum): photo, checklist, acknowledgement.
    *   `file_url` (String).
    *   `geo_lat`, `geo_long` (Metadata).
    *   `device_timestamp` (Metadata).

#### 4.2.6 State History Entity
*   **Purpose**: Immutable timeline of every status change.
*   **Key Fields**:
    *   `request` (Request Ref).
    *   `from_state`, `to_state` (Enum).
    *   `actor` (User Ref).
    *   `reason` (Text).
    *   `timestamp` (Timestamp).

### 4.3 Relationship Model

#### Parent-Child Inheritance
*   When a child request is initialized, the system must copy `customer`, `location`, and all existing `evidence` records from the parent.
*   Lineage must be traversable in both directions (Parent -> Children, Child -> Parent).

#### Ownership Model
*   **Creator**: The actor initiating the record (Customer for Requests, Staff/Tech for Quotes).
*   **Owner**: The current responsible actor based on Lifecycle State (e.g., Assigned Technician owns an `assigned` request).

### 4.4 Constraints and Performance
*   **Uniqueness**: `public_id` must be unique across all Requests.
*   **Index Suggestions**:
    *   `request(status, category)`: For queue filtering.
    *   `request(customer_id)`: For user portal listing.
    *   `request(assigned_technician_id)`: For technician app listing.
    *   `quote(request_id, version)`: Unique constraint.
*   **Concurrency**: 
    *   Use optimistic concurrency or row-level locking (`SELECT FOR UPDATE`) during status transitions.
    *   Atomic increments for `decline_count`.

## 5. Audit Requirements
*   Every entity in this model must participate in the `RequestAuditLog` via a shared `correlation_id`.
*   Records are immutable once marked `completed` or `superseded`.
