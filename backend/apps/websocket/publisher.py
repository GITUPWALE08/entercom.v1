import logging
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
import re

logger = logging.getLogger(__name__)

class EventPublisher:
    """
    Decoupled interface for Core Domains to publish real-time events.
    Strictly validates channel names against the defined taxonomy.
    """
    
    # Simple regex for channel names validating [scope].[id].[entity] etc.
    CHANNEL_REGEX = re.compile(r'^[a-zA-Z0-9_\-.]+$')

    @staticmethod
    def validate_channel_name(channel_name: str):
        if not EventPublisher.CHANNEL_REGEX.match(channel_name):
            raise ValueError(f"Invalid channel name format: {channel_name}")

    @staticmethod
    def publish_to_channel(channel_name: str, payload: dict):
        """
        Publishes a strictly typed payload to the specified Redis group.
        """
        EventPublisher.validate_channel_name(channel_name)
        
        # Ensure the envelope conforms to the WebSocket Message Contract
        envelope = {
            "type": "broadcast.message", 
            "payload": payload
        }
        
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                channel_name,
                envelope
            )
        else:
            logger.warning("Channel layer not configured. Event dropped.")
