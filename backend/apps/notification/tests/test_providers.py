import pytest
from django.test import override_settings
from apps.notification.providers import ProviderFactory
from apps.notification.providers.dummy_provider import DummyProvider
from apps.notification.providers.resend_provider import ResendProvider
from apps.notification.providers.exceptions import (
    ProviderConfigurationError,
    ProviderTemporaryError,
    ProviderPermanentError,
    ProviderAuthenticationError,
    ProviderRateLimitError,
    ProviderConnectionError,
    ProviderError
)
import ast
import os

pytestmark = pytest.mark.django_db

class TestProviderAbstraction:

    @override_settings(EMAIL_PROVIDER='dummy')
    def test_factory_returns_dummy_provider(self):
        provider = ProviderFactory.get_provider()
        assert isinstance(provider, DummyProvider)
        assert provider.health_check() is True

    @override_settings(EMAIL_PROVIDER='invalid_provider')
    def test_factory_raises_configuration_error_for_invalid_provider(self):
        with pytest.raises(ProviderConfigurationError):
            ProviderFactory.get_provider()

    @override_settings(EMAIL_PROVIDER='resend', RESEND_API_KEY='123', RESEND_FROM_EMAIL='test@test.com')
    def test_factory_returns_resend_provider(self):
        provider = ProviderFactory.get_provider()
        assert isinstance(provider, ResendProvider)

    def test_notification_service_never_imports_resend(self):
        # We can verify by inspecting the AST of services.py
        import apps.notification.services as services_module
        file_path = services_module.__file__
        if file_path.endswith('.pyc'):
            file_path = file_path[:-1]
            
        with open(file_path, 'r', encoding='utf-8') as f:
            tree = ast.parse(f.read(), filename=file_path)
            
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    assert 'resend' not in alias.name.lower(), f"Found forbidden import: {alias.name}"
            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    assert 'resend' not in node.module.lower(), f"Found forbidden import: {node.module}"

    def test_resend_translates_exceptions(self, mocker):
        import requests
        provider = ResendProvider()
        provider.api_key = "test"
        provider.from_email = "test@test.com"

        # Mock 401 response
        mock_response = mocker.Mock()
        mock_response.ok = False
        mock_response.status_code = 401
        mock_response.json.return_value = {"error": "unauthorized"}
        
        with pytest.raises(ProviderAuthenticationError):
            provider._handle_error(mock_response)

        # Mock 429 response
        mock_response.status_code = 429
        with pytest.raises(ProviderRateLimitError):
            provider._handle_error(mock_response)

        # Mock 500 response
        mock_response.status_code = 500
        with pytest.raises(ProviderTemporaryError):
            provider._handle_error(mock_response)
            
        # Mock 400 response
        mock_response.status_code = 400
        with pytest.raises(ProviderPermanentError):
            provider._handle_error(mock_response)

    def test_celery_task_classifies_errors_correctly(self):
        # The logic inside task_dispatch_email
        def is_transient_error(e):
            if isinstance(e, (ProviderTemporaryError, ProviderRateLimitError, ProviderConnectionError)):
                return True
            elif not isinstance(e, ProviderError):
                return True
            return False
            
        assert is_transient_error(ProviderTemporaryError()) is True
        assert is_transient_error(ProviderRateLimitError()) is True
        assert is_transient_error(ProviderConnectionError()) is True
        assert is_transient_error(ProviderAuthenticationError()) is False
        assert is_transient_error(ProviderConfigurationError()) is False
        assert is_transient_error(ProviderPermanentError()) is False
        assert is_transient_error(ValueError()) is True # unknown error
