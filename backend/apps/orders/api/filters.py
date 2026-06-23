import django_filters
from apps.orders.models import Order

class OrderFilter(django_filters.FilterSet):
    state = django_filters.CharFilter(field_name='status')
    customer_id = django_filters.UUIDFilter(field_name='customer_id')

    class Meta:
        model = Order
        fields = ['state', 'customer_id']
