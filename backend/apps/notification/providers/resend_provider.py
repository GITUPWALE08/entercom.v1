import logging
import requests
import time
from django.conf import settings
import os
from .base import EmailProvider
from .exceptions import (
    ProviderConfigurationError, 
    ProviderConnectionError, 
    ProviderAuthenticationError, 
    ProviderRateLimitError, 
    ProviderTemporaryError,
    ProviderPermanentError
)
from .logging import ProviderLogger

logger = logging.getLogger(__name__)

class ResendProvider(EmailProvider):
    """Resend implementation of the EmailProvider contract."""
    
    BASE_URL = "https://api.resend.com"

    def __init__(self):
        self.api_key = getattr(settings, 'RESEND_API_KEY', os.environ.get('RESEND_API_KEY'))
        self.from_email = getattr(settings, 'RESEND_FROM_EMAIL', os.environ.get('RESEND_FROM_EMAIL'))

    def validate_configuration(self) -> bool:
        if not self.api_key:
            logger.error("RESEND_API_KEY is not configured.")
            return False
        if not self.from_email:
            logger.error("RESEND_FROM_EMAIL is not configured.")
            return False
        return True

    def health_check(self) -> bool:
        """Verify API key using a lightweight endpoint (e.g. domains list)."""
        if not self.validate_configuration():
            return False
            
        try:
            response = requests.get(
                f"{self.BASE_URL}/domains",
                headers={"Authorization": f"Bearer {self.api_key}"},
                timeout=5
            )
            return response.ok
        except requests.RequestException:
            return False

    def send_template(self, to_email: str, template_name: str, context: dict, **kwargs):
        raise NotImplementedError("Resend provider does not currently support provider-hosted templates.")

    def send_email(self, to_email: str, subject: str, html_body: str, plain_text_body: str, **kwargs):
        if not self.api_key:
            raise ProviderConfigurationError("RESEND_API_KEY is missing.")
            
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "from": self.from_email,
            "to": [to_email],
            "subject": subject,
            "html": html_body,
            "text": plain_text_body
        }
        
        # Strip Nones
        payload = {k: v for k, v in payload.items() if v is not None}
        
        start_time = time.time()
        try:
            response = requests.post(f"{self.BASE_URL}/emails", json=payload, headers=headers, timeout=10)
        except requests.ConnectionError as e:
            raise ProviderConnectionError(f"Failed to connect to Resend: {e}")
        except requests.Timeout as e:
            raise ProviderTemporaryError(f"Request to Resend timed out: {e}")
        except requests.RequestException as e:
            raise ProviderTemporaryError(f"Request to Resend failed: {e}")
            
        execution_time = time.time() - start_time

        if not response.ok:
            self._handle_error(response)
            
        result = response.json()
        
        ProviderLogger.log_dispatch(
            provider_name="Resend",
            to_email=to_email,
            subject=subject,
            message_id=result.get('id', 'unknown'),
            execution_time=execution_time,
            success=True
        )
        return result

    def _handle_error(self, response: requests.Response):
        try:
            error_data = response.json()
        except ValueError:
            error_data = response.text

        status = response.status_code
        error_msg = f"Resend API error: {status} - {error_data}"
        
        # Log the failure without logging bodies or keys
        ProviderLogger.log_dispatch(
            provider_name="Resend",
            to_email="unknown (failed)",
            subject="unknown",
            message_id="none",
            execution_time=0.0,
            success=False,
            error=error_msg
        )

        if status == 401 or status == 403:
            raise ProviderAuthenticationError(error_msg)
        elif status == 429:
            raise ProviderRateLimitError(error_msg)
        elif status == 400 or status == 422:
            raise ProviderPermanentError(error_msg)
        elif status >= 500:
            raise ProviderTemporaryError(error_msg)
        else:
            raise ProviderTemporaryError(error_msg)
