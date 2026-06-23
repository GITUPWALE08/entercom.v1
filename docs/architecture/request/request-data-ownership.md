# Request Data Ownership

## 1. Purpose
This document establishes the ownership, editing rights, and final authority boundaries for all data objects within the Request Lifecycle domain. It ensures data integrity and prevents unauthorized modifications by clearly defining which actor "owns" each attribute and record at any given stage.

## 2. Scope
- Ownership mapping for Request, Quote, Assignment, Verification, Escalation, and SLA records.
- Definitions of Creator, Editor, Approver, and Final Authority roles.
- Lifecycle-based ownership transitions.

## 3. Out of Scope
- Technical data access patterns (SQL View permissions, Row-Level Security implementation).
- User Profile or Authentication data ownership.
- Data retention or archival periods (see `docs/workflows/archive-retention-policy.md`).

## 4. Definitions
- **Creator**: The actor who initializes the record.
- **Editor**: Actors permitted to modify non-terminal attributes of the record.
- **Approver**: The actor responsible for validating and "gating" the record.
- **Final Authority**: The role with the power to override or finalize the record status permanently.

## 5. Detailed Ownership Sections

### 5.1 Request Object
| Stage | Creator | Editor | Approver | Final Authority |
| :--- | :--- | :--- | :--- | :--- |
| `draft` | Customer | Customer | N/A | Customer |
| `submitted` | Customer | Staff | Staff | Staff |
| `in_progress` | Customer | Technician | N/A | Manager |
| `completed` | Customer | N/A (Locked) | Staff / Manager | System |

### 5.2 Quote Object
| Attribute | Creator | Editor | Approver | Final Authority |
| :--- | :--- | :--- | :--- | :--- |
| Initial Quote | Staff / Tech | Staff | Customer | Customer |
| Revised Quote | Staff / Tech | Staff | Customer | Manager* |
| Approval Record| System | N/A | Customer | Customer |

*\*Quote expires once revisions exceed the limit of 3.*

### 5.3 Assignment Object
| Attribute | Creator | Editor | Approver | Final Authority |
| :--- | :--- | :--- | :--- | :--- |
| Tech Binding | Staff / System| Staff | Technician | Manager |
| Decline Reason | Technician | N/A | N/A | Staff |

### 5.4 Verification Record
| Attribute | Creator | Editor | Approver | Final Authority |
| :--- | :--- | :--- | :--- | :--- |
| Work Evidence | Technician | Technician | Staff | Manager |
| QA Result | Staff | Staff | Manager | Manager |
| Override Reason| Manager | N/A | N/A | Superadmin |

### 5.5 Escalation Record
| Attribute | Creator | Editor | Approver | Final Authority |
| :--- | :--- | :--- | :--- | :--- |
| Trigger Event | System | N/A | Manager | Manager |
| Resolution Path| Manager | Manager | N/A | Manager |

### 5.6 SLA Record
| Attribute | Creator | Editor | Approver | Final Authority |
| :--- | :--- | :--- | :--- | :--- |
| Timer Init | System | N/A | N/A | System |
| Breach Status | System | N/A | Manager | Manager |

## 6. Global Ownership Principles
- **Technician-Owned Data**: Technicians own the *evidence* of their work and the accuracy of *onsite* quotes, but do not own the *request status* itself.
- **Customer-Owned Data**: Customers own the *intent* (description) and the *approval* of costs, but lose editing rights once work is `in_progress`.
- **System-Owned Data**: The system exclusively owns the `created_at`, `occurred_at`, and `status` history to ensure audit integrity.

## 7. Dependencies
- **docs/architecture/request/domain-glossary.md**: For entity definitions.
- **docs/workflows/request-ownership.md**: High-level ownership mapping.

## 8. Open Questions
- **Location Editing**: UNRESOLVED — BUSINESS DECISION REQUIRED (Can a Customer edit the `location/address` of an `assigned` request, or must they cancel and recreate?)

## 9. Completion Criteria
- Ownership is defined for all 6 core Request sub-domains.
- Clear distinction between "Editor" and "Approver" for high-impact fields.
- System-locked attributes are explicitly identified.
