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
        
        from apps.notification.mapper import EventToNotificationMapper
        EventToNotificationMapper.map_and_dispatch(event)
        
        try:
            from apps.websocket.services.event_bridge import WebSocketEventPublisher
            WebSocketEventPublisher.dispatch_domain_event(event)
        except Exception as e:
            logger.error(f"Failed to bridge event to WebSockets: {e}")
