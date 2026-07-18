class ProviderError(Exception):
    """Base exception for all email provider errors."""
    pass

class ProviderConfigurationError(ProviderError):
    """Raised when the provider is misconfigured (e.g. missing keys)."""
    pass

class ProviderConnectionError(ProviderError):
    """Raised when the provider API is unreachable."""
    pass

class ProviderAuthenticationError(ProviderError):
    """Raised when the provider rejects credentials (e.g. invalid API key)."""
    pass

class ProviderRateLimitError(ProviderError):
    """Raised when the provider rate limit is exceeded."""
    pass

class ProviderTemporaryError(ProviderError):
    """Raised for transient provider errors (e.g. 5xx server errors)."""
    pass

class ProviderPermanentError(ProviderError):
    """Raised for unrecoverable errors (e.g. invalid payload or bad sender)."""
    pass
