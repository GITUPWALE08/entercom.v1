import pytest
from django.contrib.auth import get_user_model
from rest_framework.exceptions import NotAuthenticated
from rest_framework.permissions import AllowAny
from rest_framework.test import APIRequestFactory
from rest_framework.views import APIView

from apps.roles.permissions import FailClosedPermission

User = get_user_model()


class _ClosedView(APIView):
    permission_classes = [FailClosedPermission]


class _OpenView(APIView):
    permission_classes = [AllowAny]


@pytest.mark.django_db
class TestFailClosedPermission:
    def test_anonymous_raises_not_authenticated(self):
        request = APIRequestFactory().get("/")
        request.user = None
        perm = FailClosedPermission()
        with pytest.raises(NotAuthenticated):
            perm.has_permission(request, _ClosedView())

    def test_authenticated_denied(self):
        user = User.objects.create(email="u@example.com")
        request = APIRequestFactory().get("/")
        request.user = user
        perm = FailClosedPermission()
        assert perm.has_permission(request, _ClosedView()) is False

    def test_allow_any_view_not_fail_closed(self):
        user = User.objects.create(email="u2@example.com")
        request = APIRequestFactory().get("/")
        request.user = user
        view = _OpenView()
        for permission in view.get_permissions():
            assert permission.__class__ is AllowAny
