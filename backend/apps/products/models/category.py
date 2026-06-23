import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _

class CategoryStatus(models.TextChoices):
    ACTIVE = "active", _("Active")
    ARCHIVED = "archived", _("Archived")

class ProductCategory(models.Model):
    """
    A first-class domain entity used to logically group products.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    description = models.TextField(null=True, blank=True)
    status = models.CharField(
        max_length=20, 
        choices=CategoryStatus.choices, 
        default=CategoryStatus.ACTIVE
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


    class Meta:
        verbose_name = _("Product Category")
        verbose_name_plural = _("Product Categories")

    def __str__(self) -> str:
        return self.name
