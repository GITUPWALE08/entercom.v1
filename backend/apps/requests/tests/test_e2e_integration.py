import pytest
import json
from unittest.mock import patch
from channels.testing import WebsocketCommunicator
from django.contrib.auth import get_user_model
from config.asgi import application
from apps.requests.models import Request, LifecycleState
from apps.requests.services.assignment_service import AssignmentService
from rest_framework_simplejwt.tokens import AccessToken
from asgiref.sync import sync_to_async

User = get_user_model()

@pytest.mark.anyio
@pytest.mark.django_db(transaction=True)
class TestServiceEventWebSocketIntegration:
    """
    End-to-End integration test proving:
    Service Call -> Domain Event -> WebSocket Broadcast
    """

    async def get_communicator(self, user):
        token = AccessToken.for_user(user)
        token['role_version'] = getattr(user, 'role_version', 1) 
        
        communicator = WebsocketCommunicator(
            application, 
            f"/ws/requests/?token={str(token)}"
        )
        return communicator

    @patch('django.db.transaction.on_commit', side_effect=lambda f: f())
    async def test_assign_tech_broadcasts_to_websocket(self, mock_on_commit):
        # 1. Setup: Customer, Technician, Staff, and a Request
        staff = await sync_to_async(User.objects.create)(
            email="staff_int@test.com", role="STAFF", role_version=1
        )
        tech = await sync_to_async(User.objects.create)(
            email="tech_int@test.com", role="TECHNICIAN", role_version=1
        )
        customer = await sync_to_async(User.objects.create)(
            email="cust_int@test.com", role="CUSTOMER", role_version=1
        )
        
        # Must be in AWAITING_ASSIGNMENT for assign_tech action
        req = await sync_to_async(Request.objects.create)(
            customer=customer,
            category="installation",
            description="Integration Test Request",
            status=LifecycleState.AWAITING_ASSIGNMENT
        )

        # 2. Connect Staff to WebSocket and Subscribe
        staff_communicator = await self.get_communicator(staff)
        connected, _ = await staff_communicator.connect()
        assert connected is True
        
        await staff_communicator.send_json_to({
            "action": "subscribe",
            "request_id": str(req.id)
        })
        response = await staff_communicator.receive_json_from()
        assert response["success"] is True

        # 3. Trigger Service Call (Staff assigns Tech)
        await sync_to_async(AssignmentService.assign)(
            request_id=req.id,
            actor=staff,
            technician_id=tech.id
        )

        # 4. Verify WebSocket receives the event
        # Event is "request.assigned" per types.py
        event = await staff_communicator.receive_json_from()
        assert event["event"] == "request.assigned"
        assert event["request_id"] == str(req.id)
        assert event["payload"]["data"]["technician_id"] == str(tech.id)

        # 5. Cleanup
        await staff_communicator.disconnect()

    @patch('django.db.transaction.on_commit', side_effect=lambda f: f())
    async def test_tech_receives_event_after_assignment(self, mock_on_commit):
        # Setup
        staff = await sync_to_async(User.objects.create)(
            email="staff_int2@test.com", role="STAFF", role_version=1
        )
        tech = await sync_to_async(User.objects.create)(
            email="tech_int2@test.com", role="TECHNICIAN", role_version=1
        )
        customer = await sync_to_async(User.objects.create)(
            email="cust_int2@test.com", role="CUSTOMER", role_version=1
        )
        
        req = await sync_to_async(Request.objects.create)(
            customer=customer,
            category="installation",
            description="Tech Observation Test",
            status=LifecycleState.AWAITING_ASSIGNMENT
        )

        # 1. Tech connects
        tech_communicator = await self.get_communicator(tech)
        await tech_communicator.connect()

        # 2. Staff assigns tech
        await sync_to_async(AssignmentService.assign)(
            request_id=req.id,
            actor=staff,
            technician_id=tech.id
        )

        # 3. Tech receives the event on their tech-specific channel
        event = await tech_communicator.receive_json_from()
        assert event["event"] == "request.assigned"

        # 4. Tech should now be able to subscribe to the specific request channel
        await tech_communicator.send_json_to({
            "action": "subscribe",
            "request_id": str(req.id)
        })
        sub_response = await tech_communicator.receive_json_from()
        assert sub_response["success"] is True

        # 5. Cleanup
        await tech_communicator.disconnect()
