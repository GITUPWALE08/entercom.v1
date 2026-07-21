import sys
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.base")
django.setup()

from apps.users.views.user import UserViewSet
from django.test import RequestFactory
from django.contrib.auth import get_user_model

User = get_user_model()
staff_user = User.objects.filter(role_assignments__role__slug__iexact="staff").first()
if not staff_user:
    staff_user = User.objects.first()

factory = RequestFactory()
request = factory.get('/api/v1/users/?role=technician')
request.user = staff_user

view = UserViewSet.as_view({'get': 'list'})
response = view(request)
response.render()

print("Status:", response.status_code)
print("Data:", response.content.decode('utf-8'))
