# Request Model Design

## 1. File Purpose
This document translates the Phase 3 business rules into a high-level model design, defining the data structures, entity relationships, and state management strategy for the Request domain.

## 2. Scope
*   Request aggregate and core entity definitions.
*   Related entities (Quotes, Assignments, Verification Evidence).
*   Ownership and Parent-Child mapping.
*   State storage and audit relationship strategy.

## 3. Out of Scope
*   Actual Django model code or Python syntax.
*   Database normalization levels or index performance tuning.
*   API or Service implementation details.

## 4. Full Content

### 4.1 Request Aggregate
The **Request** entity serves as the root aggregate. It must encapsulate all core attributes and act as the gateway for related domain objects.

#### Core Attributes
*   **Identification**: Internal UUID (PK), Public Human-Readable ID (Unique Slug).
*   **Classification**: Category (Enum), Priority (Enum).
*   **Ownership**: Customer (FK to User), Assigned Technician (FK to User, Nullable), Current Owner Role (Staff/Tech/Manager).
*   **Content**: Description (Text), Location (JSON or Link to Address object).
*   **Lifecycle**: Status (Enum), Created Timestamp, Updated Timestamp.
*   **Counters**: Technician Decline Count (Integer, default 0).
*   **SLA**: SLA Target Timestamp, SLA Status (Compliant/Warning/Breached).

### 4.2 Related Entities

#### 4.2.1 Quote Entity
*   **Responsibility**: Track financial versions.
*   **Attributes**: Version Number, Amount, Validity (30 days), Status (Draft/Issued/Approved/Rejected/Expired/Superseded).
*   **Constraint**: Linked to Request (Many-to-One). Only one "Active" quote allowed at a time.

#### 4.2.2 Assignment Record
*   **Responsibility**: Track technician dispatch history.
*   **Attributes**: Technician ID, Assigned Timestamp, Response Timestamp, Response Status (Accepted/Declined/Timeout), Decline Reason Code.

#### 4.2.3 Verification Evidence
*   **Responsibility**: Persist proof of work.
*   **Attributes**: Evidence Type (photo/checklist/signature), File Link/Payload, Geo-Metadata, Timestamp-Metadata, Verification Status (Submitted/Approved/Rejected).

### 4.3 Parent-Child Relationships
*   **Recursive Relationship**: `parent_request_id` (Self-referential FK).
*   **Inheritance Rule**: Logic must exist to copy `customer`, `location`, and `evidence` from Parent to Child upon creation.

### 4.4 State Storage Strategy
*   **Status Field**: String-based Enum field on the Request model.
*   **State History**: Linked `RequestStatusLog` table (Audit Trail) to record every transition. This avoids "hidden" transitions and ensures immutability of the timeline.

### 4.5 Audit Relationships
*   Every model in the Request domain must have an `audit_correlation_id` to link back to the originating Request Lifecycle event.
*   Deleted records are strictly prohibited; use `is_deleted` or soft-delete patterns if mandatory, though terminal `cancelled` state is preferred.
