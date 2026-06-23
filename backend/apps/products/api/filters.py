import django_filters
from apps.products.models import Product

class ProductFilter(django_filters.FilterSet):
    category_id = django_filters.UUIDFilter(field_name='category_id')
    state = django_filters.CharFilter(field_name='status')

    class Meta:
        model = Product
        fields = ['category_id', 'state']
