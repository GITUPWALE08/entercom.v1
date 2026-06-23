from django.urls import path
from .views import (
    CategoryListView, CategoryDetailView, CategoryArchiveView,
    ProductListView, ProductDetailView, ProductArchiveView, ProductInventoryAdjustView
)

urlpatterns = [
    path('categories/', CategoryListView.as_view()),
    path('categories/<uuid:pk>/', CategoryDetailView.as_view()),
    path('categories/<uuid:pk>/archive/', CategoryArchiveView.as_view()),
    
    path('products/', ProductListView.as_view()),
    path('products/<uuid:pk>/', ProductDetailView.as_view()),
    path('products/<uuid:pk>/archive/', ProductArchiveView.as_view()),
    path('products/<uuid:pk>/inventory-adjust/', ProductInventoryAdjustView.as_view()),
]
