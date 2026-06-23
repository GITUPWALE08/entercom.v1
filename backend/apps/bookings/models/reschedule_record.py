import uuid
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class RescheduleRecord(models.Model):
    """
    Immutable audit entity capturing schedule changes.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.ForeignKey(
        "bookings.Booking",
        on_delete=models.CASCADE,
        related_name="reschedule_history",
        verbose_name=_("Booking"),
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        verbose_name=_("Actor"),
        help_text=_("The user who initiated the reschedule."),
    )
    correlation_id = models.UUIDField(
        verbose_name=_("Correlation ID"),
        help_text=_("Links this record to the original transaction context."),
    )
    previous_start_time = models.DateTimeField(null=True, blank=True)
    previous_end_time = models.DateTimeField(null=True, blank=True)
    new_start_time = models.DateTimeField()
    new_end_time = models.DateTimeField()
    reason_code = models.CharField(
        max_length=50,
        verbose_name=_("Reason Code"),
    )
    created_at = models.DateTimeField(auto_now_add=True, editable=False)

    class Meta:
        verbose_name = _("Reschedule Record")
        verbose_name_plural = _("Reschedule Records")
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Reschedule for Booking {self.booking_id} by {self.actor}"
