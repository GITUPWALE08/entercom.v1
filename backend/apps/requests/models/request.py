import uuid
from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

class RequestCategory(models.TextChoices):
    INSTALLATION = "installation", _("Installation")
    INSPECTION = "inspection", _("Inspection")
    MAINTENANCE = "maintenance", _("Maintenance")
    SUPPORT = "support", _("Support")
    INFORMATION = "information", _("Information")
    BOOKING = "booking", _("Booking")
    PRODUCT_ORDER = "product_order", _("Product Order")
    DEVICE_OUTAGE = "device_outage", _("Device Outage")
    CONSULTATION = "consultation", _("Consultation")
    WARRANTY = "warranty", _("Warranty")

class PriorityLevel(models.TextChoices):
    EMERGENCY = "emergency", _("Emergency")
    URGENT = "urgent", _("Urgent")
    HIGH = "high", _("High")
    NORMAL = "normal", _("Normal")
    LOW = "low", _("Low")

class LifecycleState(models.TextChoices):
    DRAFT = "draft", _("Draft")
    SUBMITTED = "submitted", _("Submitted")
    STAFF_REVIEW = "staff_review", _("Staff Review")
    AWAITING_QUOTE = "awaiting_quote", _("Awaiting Quote")
    AWAITING_CUSTOMER_APPROVAL = "awaiting_customer_approval", _("Awaiting Customer Approval")
    AWAITING_PAYMENT = "awaiting_payment", _("Awaiting Payment")
    AWAITING_ASSIGNMENT = "awaiting_assignment", _("Awaiting Assignment")
    ASSIGNED = "assigned", _("Assigned")
    IN_PROGRESS = "in_progress", _("In Progress")
    PENDING_VERIFICATION = "pending_verification", _("Pending Verification")
    COMPLETED = "completed", _("Completed")
    ESCALATED = "escalated", _("Escalated")
    CANCELLED = "cancelled", _("Cancelled")

class SLAStatus(models.TextChoices):
    COMPLIANT = "compliant", _("Compliant")
    WARNING = "warning", _("Warning")
    BREACHED = "breached", _("Breached")

class Request(models.Model):
    """
    The canonical business object representing a customer, staff, or system initiated need 
    requiring tracking, ownership, lifecycle transitions, and optional fulfillment.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    public_id = models.CharField(max_length=255, unique=True, db_index=True)
    
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="requests"
    )
    
    category = models.CharField(max_length=50, choices=RequestCategory.choices)
    priority = models.CharField(max_length=20, choices=PriorityLevel.choices)
    status = models.CharField(max_length=50, choices=LifecycleState.choices)
    
    description = models.TextField()
    location = models.JSONField(null=True, blank=True)
    
    assigned_technician = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="assigned_requests"
    )
    
    decline_count = models.IntegerField(default=0)
    
    parent_request = models.ForeignKey(
        'self',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="child_requests"
    )
    
    sla_target_time = models.DateTimeField(null=True, blank=True)
    sla_status = models.CharField(max_length=20, choices=SLAStatus.choices, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Request")
        verbose_name_plural = _("Requests")
        indexes = [
            models.Index(fields=["status", "category"]),
            models.Index(fields=["customer", "status"]),
            models.Index(fields=["assigned_technician", "status"]),
            models.Index(fields=["sla_status", "sla_target_time"]),
        ]

    def __str__(self):
        return f"Request {self.public_id} ({self.status})"
