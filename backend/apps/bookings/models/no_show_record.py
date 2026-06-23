import uuid
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class NoShowRecord(models.Model):
    """
    Immutable audit entity capturing a terminal no-show event.
    """

    class AbsentParty(models.TextChoices):
        CUSTOMER = "customer", _("Customer")
        TECHNICIAN = "technician", _("Technician")

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.OneToOneField(
        "bookings.Booking",
        on_delete=models.CASCADE,
        related_name="no_show_record",
        verbose_name=_("Booking"),
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        verbose_name=_("Actor"),
        help_text=_("The user who reported the no-show."),
    )
    correlation_id = models.UUIDField(
        verbose_name=_("Correlation ID"),
        help_text=_("Links this record to the original transaction context."),
    )
    absent_party = models.CharField(
        max_length=20,
        choices=AbsentParty.choices,
        verbose_name=_("Absent Party"),
    )
    declared_at = models.DateTimeField(
        verbose_name=_("Declared At"),
        help_text=_("Timestamp of declaration used to verify 2-hour grace period."),
    )
    created_at = models.DateTimeField(auto_now_add=True, editable=False)

    class Meta:
        verbose_name = _("No-Show Record")
        verbose_name_plural = _("No-Show Records")

    def __str__(self) -> str:
        return f"No-Show for Booking {self.booking_id} ({self.absent_party})"
