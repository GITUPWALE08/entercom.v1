 Purpose:
  Single source of truth establishing the fundamental business domain concept of a "Request", setting the foundation for all Phase 3 features.

  Scope:
  Definition of request categories, priorities, ownership, parent-child relationships, SLA concepts, emergency queue concepts, relations to booking/payment, high-level lifecycle
  overview, and required/optional core attributes.

  Out of scope:
  Detailed state transition logic (belongs in request-lifecycle), detailed quoting interactions (belongs in quote-flow), specific escalation routing (belongs in escalation-flow),
  database schema, and API endpoint definitions.

  Required sections:
   - Executive Summary & Definition
   - Request Categories & Types (Installation, Inspection, Maintenance, Support, Information, Booking, Product Order, Device Outage/Emergency, Consultation, Warranty)
   - Priority Levels & SLA Concepts
   - The Emergency Queue (Separation rules vs. Queue Bypass rules)
   - Ownership & Access Control Principles
   - Parent-Child Request Relationships
   - Core Attributes (Required vs. Optional parameters)
   - Cross-Domain Relationships (1:1 Mapping to Bookings, Payment requirements)
   - High-Level Lifecycle Overview

  Open questions:
   - UNRESOLVED — requires business decision: What are the exact SLA timeframes associated with different priority levels and request categories?
   - UNRESOLVED — requires business decision: Can a single request spawn multiple bookings over a long timeframe, or is it strictly limited to a 1:1 relationship?
   - UNRESOLVED — requires business decision: What specifically dictates how the emergency queue is prioritized if it does not bypass the standard queue entirely?

  Dependencies:
  Provides foundational definitions required by request-lifecycle.md, quote-flow.md, escalation-flow.md, verification-flow.md, and technician-flow.md.

  Completion criteria:
  All request categories are defined, parent-child relationship structures are clear, attribute lists are finalized, and business stakeholders have approved the boundary definitions
  between requests, bookings, and payments.

  ---