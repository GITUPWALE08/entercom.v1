from django.db import models
from django.utils import timezone
from .exceptions import ImmutabilityViolationError

class ImmutableQuerySet(models.QuerySet):
    def update(self, *args, **kwargs):
        raise ImmutabilityViolationError()

    def delete(self, *args, **kwargs):
        raise ImmutabilityViolationError()

class ImmutableManager(models.Manager):
    def get_queryset(self):
        return ImmutableQuerySet(self.model, using=self._db)

class AuditRecord(models.Model):
    id = models.BigAutoField(primary_key=True)
    action = models.CharField(max_length=255)
    actor_id = models.CharField(max_length=255)
    actor_type = models.CharField(max_length=50)
    correlation_id = models.CharField(max_length=255)
    metadata = models.JSONField(default=dict)
    created_at = models.DateTimeField(default=timezone.now, editable=False)

    objects = ImmutableManager()

    class Meta:
        db_table = 'audit_records'
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if self.pk is not None:
            raise ImmutabilityViolationError()
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ImmutabilityViolationError()
