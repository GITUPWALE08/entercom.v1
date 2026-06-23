from enum import Enum

class RequestState(str, Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    STAFF_REVIEW = "staff_review"
    AWAITING_QUOTE = "awaiting_quote"
    AWAITING_CUSTOMER_APPROVAL = "awaiting_customer_approval"
    AWAITING_PAYMENT = "awaiting_payment"
    AWAITING_ASSIGNMENT = "awaiting_assignment"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    PENDING_VERIFICATION = "pending_verification"
    ESCALATED = "escalated"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
