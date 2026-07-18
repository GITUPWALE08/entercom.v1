import abc

class EmailProvider(abc.ABC):
    """Abstract base class defining the contract for email providers."""

    @abc.abstractmethod
    def send_email(self, to_email: str, subject: str, html_body: str, plain_text_body: str, **kwargs):
        """
        Send a raw email.
        kwargs designed as an extension point for: Attachments, Inline Images, Reply-To, CC, BCC, Scheduled Send, Priority, Tracking.
        """
        pass

    @abc.abstractmethod
    def send_template(self, to_email: str, template_name: str, context: dict, **kwargs):
        """Send an email using a provider-hosted template, if supported."""
        pass

    @abc.abstractmethod
    def validate_configuration(self) -> bool:
        """Validate if the required settings/environment variables are present."""
        pass

    @abc.abstractmethod
    def health_check(self) -> bool:
        """Perform a remote API ping or status check without sending an email."""
        pass
