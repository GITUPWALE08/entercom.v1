import uuid
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class WorkingHours(models.Model):
    """
    Configuration entity defining technician baseline capacity.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    technician = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="working_hours",
        verbose_name=_("Technician"),
    )
    schedule_blob = models.JSONField(
        verbose_name=_("Schedule Data"),
        help_text=_("JSON blob defining active days and UTC start/end times."),
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Working Hours")
        verbose_name_plural = _("Working Hours")

    def __str__(self) -> str:
        return f"Working Hours for {self.technician}"
