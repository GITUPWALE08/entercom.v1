import pytest
import uuid
from unittest.mock import patch
from apps.requests.events.publishers import DomainEventPublisher
from apps.websocket.services.event_bridge import WebSocketEventPublisher

@pytest.mark.django_db
class TestWebSocketBridge:
    @patch.object(WebSocketEventPublisher, 'publish')
    def test_bridge_routes_request_created(self, mock_publish):
        req_id = 1
        customer_id = 99
        
        DomainEventPublisher.publish_request_created(
            request_id=req_id,
            correlation_id=str(uuid.uuid4()),
            actor_id=customer_id,
            customer_id=customer_id,
            category="installation"
        )
        
        called_groups = [call.args[0] for call in mock_publish.call_args_list]
        assert f"request_{req_id}" in called_groups
        assert f"customer_{customer_id}" in called_groups

    @patch.object(WebSocketEventPublisher, 'publish')
    def test_bridge_routes_sla_breach_to_manager_only(self, mock_publish):
        req_id = 2
        
        DomainEventPublisher.publish_sla_breached(
            request_id=req_id,
            correlation_id=str(uuid.uuid4()),
            actor_id=0,
            priority="emergency",
            delay="2h"
        )
        
        called_groups = [call.args[0] for call in mock_publish.call_args_list]
        assert "manager" in called_groups
        assert f"request_{req_id}" not in called_groups

    @patch.object(WebSocketEventPublisher, 'publish')
    def test_bridge_routes_verification_to_staff(self, mock_publish):
        req_id = 3
        
        DomainEventPublisher.publish_verification_submitted(
            request_id=req_id,
            correlation_id=str(uuid.uuid4()),
            actor_id=5,
            evidence_links=["http://test.com/photo.jpg"]
        )
        
        called_groups = [call.args[0] for call in mock_publish.call_args_list]
        assert "staff" in called_groups
        assert f"request_{req_id}" in called_groups
