class AuditException(Exception):
    pass

class ImmutabilityViolationError(AuditException):
    def __init__(self, message="Audit records are immutable and cannot be modified or deleted."):
        super().__init__(message)
