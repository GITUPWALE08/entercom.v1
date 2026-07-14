from django.contrib import admin
from apps.orders.models.order import Order
from apps.orders.models.order_item import OrderItem

admin.site.register([Order, OrderItem])