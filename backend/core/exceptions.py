class ServiceError(Exception):
    """Base class for domain/service-layer errors (subclass per bounded context)."""
    audited: bool = False


class PermissionDeniedError(ServiceError):
    """Raised when an operation is not allowed for the current principal."""


class AuthorizationError(PermissionDeniedError):
    """Alias for authorization failures surfaced to API clients."""
