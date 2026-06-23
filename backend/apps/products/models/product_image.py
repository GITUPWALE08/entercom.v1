import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _
from .product import Product

class ProductImage(models.Model):
    """
    Stores pointers to product media.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="images"
    )
    image_url = models.URLField(max_length=1024)
    order_index = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


    class Meta:
        verbose_name = _("Product Image")
        verbose_name_plural = _("Product Images")
        ordering = ["order_index"]

    def __str__(self) -> str:
        return f"Image for {self.product.name} (Index: {self.order_index})"
