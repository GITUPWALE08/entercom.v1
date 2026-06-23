class DomainException(Exception):
    """Base class for all domain exceptions."""
    pass

class InvalidTransitionError(DomainException):
    """Raised when an action is not permitted from the current state."""
    pass

class PermissionDeniedTransitionError(DomainException):
    """Raised when the user lacks the required permission for the transition."""
    pass

class GuardConditionFailedError(DomainException):
    """Base class for failed transition guards."""
    pass

class PaymentGateFailedError(GuardConditionFailedError):
    """Raised when payment is required but not confirmed."""
    pass

class QuoteGateFailedError(GuardConditionFailedError):
    """Raised when a valid quote is required but missing."""
    pass

class VerificationGateFailedError(GuardConditionFailedError):
    """Raised when verification evidence is required or verification fails."""
    pass

class RuleViolationError(DomainException):
    """Raised when a domain rule is violated (e.g., max revisions)."""
    pass
