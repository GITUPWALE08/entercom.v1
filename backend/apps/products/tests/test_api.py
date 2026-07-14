import pytest
from rest_framework.test import APIClient
from rest_framework import status
import uuid

pytestmark = pytest.mark.django_db

@pytest.fixture
def api_client():
    return APIClient()

def test_test_prod_023_get_api_v1_products(api_client, staff_user, product):
    """
    Inventory:
        TEST-PROD-023
    Rule:
        GET /api/v1/products/
    """
    api_client.force_authenticate(user=staff_user)
    
    response = api_client.get('/api/v1/products/')
    
    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) > 0
    assert response.data[0]['id'] == str(product.id)

def test_test_prod_024_post_api_v1_products(api_client, staff_user, category):
    """
    Inventory:
        TEST-PROD-024
    Rule:
        POST /api/v1/products/
    """
    api_client.force_authenticate(user=staff_user)
    
    data = {
        "category": str(category.id),
        "name": "API Prod",
        "price": "99.99",
        "sku": "SKU-API",
        "quantity_available": 10
    }
    
    response = api_client.post('/api/v1/products/', data=data, format='json')
    
    assert response.status_code == status.HTTP_201_CREATED
    assert response.data['name'] == "API Prod"
    assert response.data['price'] == "99.99"

def test_test_prod_025_post_api_v1_products_id_archive(api_client, manager_user, product):
    """
    Inventory:
        TEST-PROD-025
    Rule:
        POST /api/v1/products/{id}/archive/
    """
    # Requires Manager for archive
    api_client.force_authenticate(user=manager_user)
    
    response = api_client.post(f'/api/v1/products/{product.id}/archive/')
    
    assert response.status_code == status.HTTP_200_OK
    
    product.refresh_from_db()
    from apps.products.models.product import ProductStatus
    assert product.status == ProductStatus.ARCHIVED

def test_test_prod_026_inventory_view_customer_masked(api_client, customer_user, product):
    """
    Inventory:
        TEST-PROD-026
    Rule:
        GET /api/v1/products/ masks inventory for Customers
    """
    api_client.force_authenticate(user=customer_user)
    
    # Set actual quantity to 42
    product.quantity_available = 42
    product.save()
    
    response = api_client.get('/api/v1/products/')
    
    assert response.status_code == status.HTTP_200_OK
    data = response.data[0]
    
    # Masked value should be 1 since stock is > 0
    assert data['quantity_available'] == 1
    assert data['low_stock_threshold'] is None

def test_test_prod_027_inventory_view_staff_unmasked(api_client, staff_user, product):
    """
    Inventory:
        TEST-PROD-027
    Rule:
        GET /api/v1/products/ exposes inventory for Staff
    """
    api_client.force_authenticate(user=staff_user)
    
    # Set actual quantity to 42
    product.quantity_available = 42
    product.low_stock_threshold = 5
    product.save()
    
    response = api_client.get('/api/v1/products/')
    
    assert response.status_code == status.HTTP_200_OK
    data = response.data[0]
    
    # Real values exposed
    assert data['quantity_available'] == 42
    assert data['low_stock_threshold'] == 5
