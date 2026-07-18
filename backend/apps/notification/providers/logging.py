import logging

logger = logging.getLogger('notification.providers')

class ProviderLogger:
    """Centralized logging utility for all email providers."""

    @staticmethod
    def log_dispatch(provider_name: str, to_email: str, subject: str, message_id: str, execution_time: float, success: bool = True, error: str = None):
        """
        Standardized logging format for outbound emails.
        Ensures no secrets or email bodies are logged.
        """
        status = "SUCCESS" if success else "FAILED"
        log_msg = (
            f"Email Dispatch [{status}] | "
            f"Provider: {provider_name} | "
            f"Recipient: {to_email} | "
            f"Subject: {subject} | "
            f"Message ID: {message_id} | "
            f"Exec Time: {execution_time:.3f}s"
        )
        if not success and error:
            log_msg += f" | Error: {error}"
            logger.error(log_msg)
        else:
            logger.info(log_msg)
