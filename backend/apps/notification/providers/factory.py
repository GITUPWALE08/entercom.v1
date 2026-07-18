import logging
from django.conf import settings
from .base import EmailProvider
from .exceptions import ProviderConfigurationError

logger = logging.getLogger(__name__)

class ProviderFactory:
    """Resolves and instantiates the configured email provider from Django settings."""

    _providers = {}

    @classmethod
    def register_provider(cls, name: str, provider_class: type[EmailProvider]):
        cls._providers[name] = provider_class

    @classmethod
    def get_provider(cls) -> EmailProvider:
        provider_name = getattr(settings, 'EMAIL_PROVIDER', 'resend').lower()
        provider_class = cls._providers.get(provider_name)
        
        if not provider_class:
            raise ProviderConfigurationError(f"Email provider '{provider_name}' is not registered.")
            
        provider = provider_class()
        
        if not provider.validate_configuration():
            raise ProviderConfigurationError(f"Email provider '{provider_name}' is improperly configured.")
            
        return provider

# Lazy register standard providers
def _register_defaults():
    from .resend_provider import ResendProvider
    from .dummy_provider import DummyProvider
    ProviderFactory.register_provider('resend', ResendProvider)
    ProviderFactory.register_provider('dummy', DummyProvider)

_register_defaults()
