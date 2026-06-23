import uuid
from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

class AssignmentResponseStatus(models.TextChoices):
    PENDING = "pending", _("Pending")
    ACCEPTED = "accepted", _("Accepted")
    DECLINED = "declined", _("Declined")
    TIMEOUT = "timeout", _("Timeout")

class DeclineReasonCode(models.TextChoices):
    TECHNICIAN_UNAVAILABLE = "TECHNICIAN_UNAVAILABLE", _("Technician Unavailable")
    TECHNICIAN_OUT_OF_REGION = "TECHNICIAN_OUT_OF_REGION", _("Technician Out Of Region")
    TECHNICIAN_SKILL_MISMATCH = "TECHNICIAN_SKILL_MISMATCH", _("Technician Skill Mismatch")
    TECHNICIAN_WORKLOAD_CAPACITY = "TECHNICIAN_WORKLOAD_CAPACITY", _("Technician Workload Capacity")
    TECHNICIAN_PERSONAL_EMERGENCY = "TECHNICIAN_PERSONAL_EMERGENCY", _("Technician Personal Emergency")
    OTHER = "OTHER", _("Other")

class Assignment(models.Model):
    """
    Historical record of technician dispatches, acceptances, declines, and timeouts.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    request = models.ForeignKey(
        'requests.Request',
        on_delete=models.PROTECT,
        related_name="assignments"
    )
    
    technician = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="request_assignments"
    )
    
    response_status = models.CharField(
        max_length=50, 
        choices=AssignmentResponseStatus.choices,
        default=AssignmentResponseStatus.PENDING
    )
    
    assigned_at = models.DateTimeField(auto_now_add=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    declined_at = models.DateTimeField(null=True, blank=True)
    
    decline_reason = models.CharField(
        max_length=50, 
        choices=DeclineReasonCode.choices, 
        null=True, 
        blank=True
    )

    class Meta:
        verbose_name = _("Assignment")
        verbose_name_plural = _("Assignments")

    def __str__(self):
        return f"Assignment for Request {self.request_id} to Technician {self.technician_id}"
