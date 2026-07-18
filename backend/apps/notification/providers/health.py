import logging
from .factory import ProviderFactory
from .exceptions import ProviderConfigurationError

logger = logging.getLogger(__name__)

class ProviderHealthMonitor:
    """Utility to perform health checks on configured providers without sending emails."""

    @staticmethod
    def check_system_health() -> dict:
        """
        Retrieves the active provider and validates both its local configuration
        and its remote API health.
        """
        health_status = {
            "provider": "unknown",
            "is_configured": False,
            "api_reachable": False,
            "status": "UNHEALTHY"
        }

        try:
            provider = ProviderFactory.get_provider()
            health_status["provider"] = provider.__class__.__name__
            health_status["is_configured"] = True
            
            # Perform a ping to the remote service
            is_healthy = provider.health_check()
            health_status["api_reachable"] = is_healthy
            
            if is_healthy:
                health_status["status"] = "HEALTHY"
                
        except ProviderConfigurationError as e:
            health_status["error"] = str(e)
            logger.error(f"Provider configuration failed health check: {e}")
        except Exception as e:
            health_status["error"] = "Unexpected provider failure"
            logger.exception("Unexpected error during provider health check.")

        return health_status
