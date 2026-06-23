import uuid
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class BlackoutDate(models.Model):
    """
    Exception entity defining technician-specific unavailability.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    technician = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="blackout_dates",
        verbose_name=_("Technician"),
    )
    start_time = models.DateTimeField(
        verbose_name=_("Start Time"),
        help_text=_("UTC start of blackout."),
    )
    end_time = models.DateTimeField(
        verbose_name=_("End Time"),
        help_text=_("UTC end of blackout."),
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("Blackout Date")
        verbose_name_plural = _("Blackout Dates")
        constraints = [
            models.CheckConstraint(
                check=models.Q(end_time__gt=models.F("start_time")),
                name="blackout_end_after_start",
            ),
            # Note: Cross-table overlap constraint between BlackoutDate and Booking 
            # is explicitly delegated to the Service Layer via select_for_update() 
            # as PostgreSQL Exclude constraints cannot span multiple tables natively.
        ]

    def __str__(self) -> str:
        return f"Blackout: {self.technician} ({self.start_time} - {self.end_time})"
