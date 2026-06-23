import uuid
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.contrib.postgres.constraints import ExclusionConstraint
from django.contrib.postgres.fields import RangeOperators
from django.db.models.expressions import RawSQL


class Booking(models.Model):
    """
    Sub-aggregate root representing a scheduled commitment.
    Subordinate to a Request.
    """

    class Status(models.TextChoices):
        UNSCHEDULED = "unscheduled", _("Unscheduled")
        SCHEDULED = "scheduled", _("Scheduled")
        IN_PROGRESS = "in_progress", _("In Progress")
        COMPLETED = "completed", _("Completed")
        CANCELLED = "cancelled", _("Cancelled")
        NO_SHOW = "no_show", _("No Show")

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    request = models.OneToOneField(
        "requests.Request",
        on_delete=models.CASCADE,
        related_name="booking",
        verbose_name=_("Request"),
        help_text=_("The parent Request this booking fulfills."),
    )
    technician = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="bookings",
        verbose_name=_("Technician"),
        help_text=_("Denormalized from Request.assigned_technician for DB constraints."),
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.UNSCHEDULED,
        verbose_name=_("Status"),
    )
    start_time = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_("Start Time"),
        help_text=_("Scheduled start time in UTC."),
    )
    end_time = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_("End Time"),
        help_text=_("Scheduled end time in UTC."),
    )
    started_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_("Actual Start Time"),
        help_text=_("Timestamp when the technician transitioned to in_progress."),
    )
    duration_days = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name=_("Duration (Days)"),
        help_text=_("Estimated duration in integer days."),
    )
    reschedule_count = models.PositiveSmallIntegerField(
        default=0,
        verbose_name=_("Reschedule Count"),
    )
    last_reminder_sent = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_("Last Reminder Sent"),
        help_text=_("Tracks idempotency for reminder dispatch."),
    )
    # correlation_id = models.UUIDField(
    #     null=True,
    #     blank=True,
    #     verbose_name=_("Correlation ID"),
    #     help_text=_("Links this record to the original transaction context."),
    # )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Booking")
        verbose_name_plural = _("Bookings")
        ordering = ["-created_at"]
        constraints = [
            # 5.3: Reschedule Limit Constraint
            models.CheckConstraint(
                check=models.Q(reschedule_count__lte=3),
                name="max_reschedule_limit_3",
            ),
            # 5.4: end_time must be greater than start_time
            models.CheckConstraint(
                check=models.Q(end_time__gt=models.F("start_time"))
                | models.Q(start_time__isnull=True)
                | models.Q(end_time__isnull=True),
                name="booking_end_after_start",
            ),
            # 5.3 Double-Booking Overlap Prevention
            ExclusionConstraint(
                name="prevent_technician_double_booking",
                expressions=[
                    ("technician", RangeOperators.EQUAL),
                    (RawSQL("tstzrange(start_time, end_time)", []), RangeOperators.OVERLAPS),
                ],
                condition=models.Q(status__in=["scheduled", "in_progress"]),
            ),
        ]
        indexes = [
            models.Index(fields=["status", "start_time", "end_time"]),
            models.Index(fields=["technician", "status"]),
        ]

    def __str__(self) -> str:
        return f"Booking {self.id} ({self.status})"
