from django.contrib import admin

from apps.products.models.category import *
from apps.products.models.product import Product

admin.site.register(Product)
admin.site.register(ProductCategory)
