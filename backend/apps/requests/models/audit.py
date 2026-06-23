import uuid
from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.requests.models.request import LifecycleState

class EscalationReasonCode(models.TextChoices):
    THREE_DECLINES_THRESHOLD = "THREE_DECLINES_THRESHOLD", _("Three Declines Threshold")
    SLA_BREACH = "SLA_BREACH", _("SLA Breach")
    EMERGENCY_DEVICE_OUTAGE = "EMERGENCY_DEVICE_OUTAGE", _("Emergency Device Outage")
    MANUAL_MANAGER_REVIEW = "MANUAL_MANAGER_REVIEW", _("Manual Manager Review")
    REPEATED_VERIFICATION_FAILURE = "REPEATED_VERIFICATION_FAILURE", _("Repeated Verification Failure")

class EscalationStatus(models.TextChoices):
    PENDING = "pending", _("Pending")
    RESOLVED = "resolved", _("Resolved")

class Escalation(models.Model):
    """
    Tracks requests that have been escalated to management due to SLA breaches, 
    repeated failures, or manual triggers.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    request = models.ForeignKey(
        'requests.Request',
        on_delete=models.PROTECT,
        related_name="escalations"
    )
    
    reason = models.CharField(max_length=50, choices=EscalationReasonCode.choices)
    status = models.CharField(
        max_length=50, 
        choices=EscalationStatus.choices,
        default=EscalationStatus.PENDING
    )
    
    triggered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="triggered_escalations",
        help_text=_("User who triggered the escalation. Null if system triggered.")
    )
    
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="resolved_escalations"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = _("Escalation")
        verbose_name_plural = _("Escalations")
        indexes = [
            models.Index(fields=["status", "created_at"]),
        ]

    def __str__(self):
        return f"Escalation {self.id} for Request {self.request_id} ({self.status})"

class StateHistory(models.Model):
    """
    Immutable ledger recording every state transition for forensic tracing and auditing.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    request = models.ForeignKey(
        'requests.Request',
        on_delete=models.PROTECT,
        related_name="state_history"
    )
    
    from_state = models.CharField(
        max_length=50, 
        choices=LifecycleState.choices, 
        null=True, 
        blank=True,
        help_text=_("Previous state. Null if this is the initial creation.")
    )
    
    to_state = models.CharField(max_length=50, choices=LifecycleState.choices)
    
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        help_text=_("User who performed the transition. Null if performed by the system.")
    )
    
    reason = models.TextField(null=True, blank=True)
    correlation_id = models.UUIDField(db_index=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("State History")
        verbose_name_plural = _("State Histories")
        indexes = [
            models.Index(fields=["request", "timestamp"]),
        ]

    def __str__(self):
        return f"StateHistory: Request {self.request_id} moved to {self.to_state}"
