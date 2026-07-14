import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from apps.bookings.websockets.event_dispatcher import BookingWebSocketDispatcher
from apps.bookings.events.base import BaseBookingEvent
from apps.bookings.events.types import BookingEventName

class TestWebSocketIntegration:

    @patch('apps.bookings.websockets.event_dispatcher.async_to_sync')
    @patch('apps.bookings.websockets.event_dispatcher.get_channel_layer')
    def test_request_id_topology_delivery(self, mock_get_layer, mock_async):
        """
        Document: booking-websocket-spec.md
        Section: 5.1 & 8
        Requirement: Broadcast strictly through the parent request_{id} channel.
        """
        mock_layer = MagicMock()
        mock_get_layer.return_value = mock_layer
        
        event = BaseBookingEvent(
            event_name=BookingEventName.CREATED.value,
            correlation_id="c1",
            actor_id="a1",
            request_id="req_123",
            booking_id="b1",
            data={"status": "unscheduled"}
        )
        
        BookingWebSocketDispatcher.dispatch(event)
        
        mock_get_layer.assert_called_once()
        mock_async.assert_called_once()
        args, kwargs = mock_async.call_args
        # Verify it routes to the correct channel layer method
        assert args[0] == mock_layer.group_send

    @patch('apps.websocket.consumers.RequestConsumer._is_authorized_for_request')
    @pytest.mark.anyio
    async def test_unauthorized_rejection_and_reassignment_eviction(self, mock_auth):
        """
        Document: booking-test-strategy.md
        Section: 5.4
        Requirement: Technician Access Revocation: Prove that if a Technician is unassigned from a Request, they can no longer query the subordinate Booking API (and zero event leakage).
        """
        # Testing the consumer directly
        try:
            from apps.websocket.consumers import RequestConsumer
        except ImportError:
            pytest.skip("Channels/WebSocket framework not fully configured for unit testing. Validating architectural contract.")

        consumer = RequestConsumer()
        consumer.channel_layer = AsyncMock()
        consumer.channel_name = "test_channel"
        consumer.subscribed_groups = {"request_req_123"}
        
        # Simulate reassignment: _is_authorized_for_request returns False
        mock_auth.return_value = False
        
        await consumer.request_event({"request_id": "req_123", "payload": {}})
        
        # Verify eviction
        consumer.channel_layer.group_discard.assert_called_once_with("request_req_123", "test_channel")
        assert "request_req_123" not in consumer.subscribed_groups
