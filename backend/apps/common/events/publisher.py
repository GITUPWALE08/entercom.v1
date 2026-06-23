import logging

logger = logging.getLogger(__name__)

class EventPublisher:
    @staticmethod
    def publish(event):
        """
        Abstract publisher. Real implementation (Celery/Kafka) is out of scope.
        We just log the event to show it was published.
        """
        payload = event.to_dict()
        logger.info(f"Event Published: {payload['event_name']} | Correlation: {payload['correlation_id']}")
        # In a real app, send `payload` to message broker here
