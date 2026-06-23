from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
import logging

logger = logging.getLogger(__name__)

class WebSocketEventPublisher:
    """
    Bridges domain events to the Django Channels WebSocket layer.
    Services and Domain Event Publishers must use this bridge 
    and never interact with Channels directly.
    """
    
    @staticmethod
    def publish(group: str, event: str, payload: dict, version: int = 1):
        """
        Publishes a structured event to a specific WebSocket group.
        """
        channel_layer = get_channel_layer()
        if not channel_layer:
            logger.warning("Channel layer not configured. Skipping websocket publish.")
            return

        message = {
            "type": "request_event",
            "event": event,
            "version": version,
            "timestamp": payload.get("timestamp", ""),
            "request_id": payload.get("request_id"),
            "payload": payload
        }
        
        try:
            async_to_sync(channel_layer.group_send)(group, message)
            logger.debug(f"Pushed {event} to group {group}")
        except Exception as e:
            logger.error(f"Failed to publish {event} to {group}: {e}")

    @classmethod
    def dispatch_domain_event(cls, event: "BaseEvent"):
        """
        Translates a BaseEvent into appropriate group routing rules 
        and publishes to all relevant groups.
        """
        # Ensure we're comparing the raw string value of the EventName enum
        event_name = getattr(event.event_name, 'value', str(event.event_name))
        req_id = event.request_id
        payload_dict = event.to_dict()
        
        # Standardize payload structure
        payload = {
            "request_id": req_id,
            "timestamp": event.timestamp,
            "data": payload_dict.get("data", {})
        }

        groups = set()
        
        # Most events go to the request group, unless specifically isolated
        if event_name != "sla.breached":
            groups.add(f"request_{req_id}")

        if event_name == "request.created":
            if hasattr(event.data, "customer_id"):
                groups.add(f"customer_{event.data.customer_id}")
                
        elif event_name == "request.assigned":
            if hasattr(event.data, "technician_id"):
                groups.add(f"technician_{event.data.technician_id}")
            # Also route to customer
            from apps.requests.models import Request
            try:
                req = Request.objects.get(pk=req_id)
                groups.add(f"customer_{req.customer_id}")
            except Exception:
                pass

        elif event_name == "quote.created":
            from apps.requests.models import Request
            try:
                req = Request.objects.get(pk=req_id)
                groups.add(f"customer_{req.customer_id}")
            except Exception:
                pass

        elif event_name == "verification.submitted":
            groups.add("staff")

        elif event_name == "escalation.triggered":
            groups.add("manager")

        elif event_name == "sla.breached":
            groups.add("manager")

        # Broadcast to all calculated groups
        for group in groups:
            cls.publish(group, event_name, payload)
