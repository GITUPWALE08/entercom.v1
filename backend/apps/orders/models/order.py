import uuid
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _

class OrderStatus(models.TextChoices):
    CREATED = "created", _("Created")
    PENDING_PAYMENT = "pending_payment", _("Pending Payment")
    PAID = "paid", _("Paid")
    FULFILLED = "fulfilled", _("Fulfilled")
    CANCELLED = "cancelled", _("Cancelled")

class Order(models.Model):
    """
    The root financial aggregate representing a customer's confirmed intent to purchase.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    request = models.OneToOneField(
        'requests.Request',
        on_delete=models.PROTECT,
        related_name="order"
    )
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="orders"
    )
    status = models.CharField(
        max_length=50, 
        choices=OrderStatus.choices, 
        default=OrderStatus.CREATED
    )
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Order")
        verbose_name_plural = _("Orders")
        indexes = [
            models.Index(fields=["customer"]),
            models.Index(fields=["status"]),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(total_amount__gte=0),
                name="total_amount_non_negative"
            ),
        ]

    def __str__(self) -> str:
        return f"Order {self.id} for Request {self.request_id}"
