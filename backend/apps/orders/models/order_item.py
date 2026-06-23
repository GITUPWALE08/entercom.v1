import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _
from .order import Order

class OrderItem(models.Model):
    """
    Represents a specific product and quantity within an Order, carrying immutable historical data.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items"
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.PROTECT,
        related_name="order_items"
    )
    quantity = models.IntegerField()
    product_name_snapshot = models.CharField(max_length=255)
    unit_price_snapshot = models.DecimalField(max_digits=10, decimal_places=2)
    line_total_snapshot = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


    class Meta:
        verbose_name = _("Order Item")
        verbose_name_plural = _("Order Items")
        constraints = [
            models.CheckConstraint(
                check=models.Q(quantity__gt=0),
                name="quantity_positive"
            ),
        ]

    def __str__(self) -> str:
        return f"{self.quantity}x {self.product_name_snapshot} (Order: {self.order_id})"
