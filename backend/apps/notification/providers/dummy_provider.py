from .base import EmailProvider

class DummyProvider(EmailProvider):
    """Dummy provider for testing and local development without sending actual emails."""

    def __init__(self):
        self._is_configured = True

    def validate_configuration(self) -> bool:
        return self._is_configured

    def health_check(self) -> bool:
        return self._is_configured

    def send_email(self, to_email: str, subject: str, html_body: str, plain_text_body: str, **kwargs):
        from .logging import ProviderLogger
        ProviderLogger.log_dispatch(
            provider_name="Dummy",
            to_email=to_email,
            subject=subject,
            message_id="dummy-id-12345",
            execution_time=0.01,
            success=True
        )
        return {"id": "dummy-id-12345", "status": "sent"}

    def send_template(self, to_email: str, template_name: str, context: dict, **kwargs):
        raise NotImplementedError("Dummy provider does not support templates.")
