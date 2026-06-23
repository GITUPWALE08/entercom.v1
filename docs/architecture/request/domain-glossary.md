# Domain Glossary

## 1. Purpose
This document serves as the canonical terminology reference for the Phase 3 Request Lifecycle System. It establishes a shared vocabulary across engineering, product, and operations to prevent ambiguity in system design and business logic.

## 2. Scope
Definitions of the primary business entities, actors, queues, and lifecycle concepts within the Entercom Security platform.

## 3. Out of Scope
- Database schema and column definitions.
- Implementation-level technical terminology (e.g., API structures, class names).
- General software engineering terminology.

## 4. Definitions
*   **request**: The canonical business object representing a customer, staff, or system-initiated need requiring tracking, ownership, lifecycle transitions, and optional fulfillment.
*   **booking**: A scheduled appointment mapping a request to a specific time and location.
*   **assignment**: The process of allocating a request to a specific technician for fulfillment.
*   **quote**: A formal financial estimate for services or products provided to the customer for approval.
*   **verification**: A mandatory or optional quality assurance step requiring evidence review before a request can be marked completed.
*   **escalation**: The routing of a request to managerial or higher-tier oversight due to bottlenecks, SLA breaches, or critical failures.
*   **SLA (Service Level Agreement)**: The target timeframe within which the system or staff must respond to a request, based on its priority.
*   **emergency queue**: A dedicated, independent processing queue for high-priority or critical requests (e.g., `device_outage`), designed to ensure rapid triage without completely bypassing the standard lifecycle.
*   **parent request**: A predecessor request that originates a subsequent follow-up action (e.g., an inspection that mandates an installation).
*   **child request**: A successor request linked to a parent request to preserve historical lineage, inheriting customer and location data.
*   **fulfillment**: The active execution phase where the requested service or delivery is performed.
*   **technician acceptance**: The explicit action by a technician agreeing to take on an assigned request, triggering scheduling.
*   **cancellation**: The terminal termination of a request before or during its lifecycle, effectively halting all further action.
*   **outage**: A critical malfunction or failure of deployed hardware (e.g., security cameras, solar inverters) requiring emergency response.
*   **verification evidence**: Required documentation (photos, signed checklists, geo/timestamp metadata) submitted by a technician to prove work completion.

## 5. Rules
*   Terminology used in code (variable names, service methods) MUST align with these glossary definitions.
*   Do not overload terms (e.g., do not use "Order" when referring to a "Request").

## 6. Required Matrices/Tables
*(N/A for glossary)*

## 7. Edge Cases
*   **Domain Overlap**: A `booking` is distinct from an `assignment`. Assignment dictates *who* does the work; booking dictates *when* the work occurs. MVP strictly enforces 1 request to 1 booking.

## 8. Audit Expectations
Any changes to the definitions of these core entities that affect system boundaries must be reviewed and audited by the architecture team.

## 9. Dependencies
This document acts as the foundational dependency for all other Phase 3 workflow and architecture documents.

## 10. Completion Criteria
All mandated terms are explicitly defined and conceptually separated.

## 11. Open Questions
*   UNRESOLVED — BUSINESS DECISION REQUIRED (Are there distinct definitions required for different types of maintenance plans in the future?)-> 