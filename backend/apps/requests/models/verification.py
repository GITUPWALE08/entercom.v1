import uuid
from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

class VerificationStatus(models.TextChoices):
    PENDING = "pending", _("Pending")
    APPROVED = "approved", _("Approved")
    REJECTED = "rejected", _("Rejected")
    OVERRIDDEN = "overridden", _("Overridden")

class EvidenceType(models.TextChoices):
    PHOTO = "photo", _("Photo")
    SIGNED_CHECKLIST = "signed_checklist", _("Signed Checklist")
    CUSTOMER_ACKNOWLEDGEMENT = "customer_acknowledgement", _("Customer Acknowledgement")

class Verification(models.Model):
    """
    Quality gate record ensuring required work standards are met before request completion.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    request = models.ForeignKey(
        'requests.Request',
        on_delete=models.PROTECT,
        related_name="verifications"
    )
    
    status = models.CharField(
        max_length=50, 
        choices=VerificationStatus.choices,
        default=VerificationStatus.PENDING
    )
    
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="reviewed_verifications"
    )
    
    override_reason = models.TextField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Verification")
        verbose_name_plural = _("Verifications")
        # Only one active verification flow per request at a time
        constraints = [
            models.UniqueConstraint(
                fields=["request"], 
                condition=models.Q(status="pending"), 
                name="unique_pending_verification"
            )
        ]

    def __str__(self):
        return f"Verification {self.id} for Request {self.request_id} ({self.status})"

class Evidence(models.Model):
    """
    Proof of work persistence linked to a specific verification review.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    verification = models.ForeignKey(
        Verification,
        on_delete=models.CASCADE,
        related_name="evidence"
    )
    
    type = models.CharField(max_length=50, choices=EvidenceType.choices)
    file_url = models.URLField(max_length=1024)
    
    geo_lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    geo_long = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    device_timestamp = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("Evidence")
        verbose_name_plural = _("Evidence")

    def __str__(self):
        return f"Evidence ({self.type}) for Verification {self.verification_id}"
