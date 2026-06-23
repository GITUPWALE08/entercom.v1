"""Audit logging domain exceptions."""


class AuditFailureError(Exception):
    """Raised when a critical audit record cannot be persisted."""

    def __init__(self, action: str, message: str = "Critical audit log write failed"):
        self.action = action
        super().__init__(f"{message}: action={action}")
