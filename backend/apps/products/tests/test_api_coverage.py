import pytest
from rest_framework.test import APIClient
from rest_framework import status
import uuid

pytestmark = pytest.mark.django_db

@pytest.fixture
def api_client():
    return APIClient()

def test_category_api(api_client, staff_user, manager_user):
    # 1. Create category
    api_client.force_authenticate(user=staff_user)
    data = {"name": "Electronics", "slug": "electronics"}
    res = api_client.post('/api/v1/categories/', data)
    assert res.status_code == 201
    cat_id = res.data['id']

    # 2. List categories
    res = api_client.get('/api/v1/categories/')
    assert res.status_code == 200
    assert len(res.data) > 0

    # 3. Get category
    res = api_client.get(f'/api/v1/categories/{cat_id}/')
    assert res.status_code == 200

    # 4. Patch category
    res = api_client.patch(f'/api/v1/categories/{cat_id}/', {"name": "Gadgets"})
    assert res.status_code == 200
    assert res.data['name'] == "Gadgets"

    # 5. Archive category
    api_client.force_authenticate(user=manager_user)
    res = api_client.post(f'/api/v1/categories/{cat_id}/archive/')
    assert res.status_code == 200

def test_product_api_filters_and_detail(api_client, staff_user, category, product):
    api_client.force_authenticate(user=staff_user)
    
    # List with filters
    res = api_client.get(f'/api/v1/products/?category_id={category.id}&state=active')
    assert res.status_code == 200
    
    # Detail GET
    res = api_client.get(f'/api/v1/products/{product.id}/')
    assert res.status_code == 200
    
    # Detail PATCH
    patch_data = {"name": "Updated Name", "price": "100.00", "low_stock_threshold": 10}
    # Requires manager to update threshold
    from apps.common.permissions import Role
    staff_user.role = Role.MANAGER.value
    staff_user.save()
    
    res = api_client.patch(f'/api/v1/products/{product.id}/', patch_data)
    assert res.status_code == 200
    assert res.data['name'] == "Updated Name"

def test_product_inventory_adjust(api_client, manager_user, product):
    api_client.force_authenticate(user=manager_user)
    
    data = {"adjustment_amount": 5, "reason": "Restock"}
    res = api_client.post(f'/api/v1/products/{product.id}/inventory-adjust/', data)
    assert res.status_code == 200

def test_get_actor_unauthenticated(api_client):
    res = api_client.get('/api/v1/products/')
    # Unauthenticated should fail with 401 because of permission_classes = [IsAuthenticated]
    assert res.status_code == 401

