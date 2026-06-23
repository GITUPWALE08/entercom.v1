import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _
from .category import ProductCategory

class ProductStatus(models.TextChoices):
    ACTIVE = "active", _("Active")
    ARCHIVED = "archived", _("Archived")

class Product(models.Model):
    """
    The core catalog aggregate storing metadata, flexible JSON attributes,
    and real-time inventory counts.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    category = models.ForeignKey(
        ProductCategory,
        on_delete=models.PROTECT,
        related_name="products"
    )
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    attributes = models.JSONField(null=True, blank=True)
    sku = models.CharField(max_length=100, unique=True, default="PENDING")
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity_available = models.IntegerField(default=0)
    low_stock_threshold = models.IntegerField(default=0)
    status = models.CharField(
        max_length=20, 
        choices=ProductStatus.choices, 
        default=ProductStatus.ACTIVE
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Product")
        verbose_name_plural = _("Products")
        indexes = [
            models.Index(fields=["category"]),
            models.Index(fields=["status"]),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(quantity_available__gte=0),
                name="quantity_available_non_negative"
            ),
            models.CheckConstraint(
                check=models.Q(low_stock_threshold__gte=0),
                name="low_stock_threshold_non_negative"
            ),
        ]

    def __str__(self) -> str:
        return self.name
