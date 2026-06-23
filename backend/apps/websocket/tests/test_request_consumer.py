import pytest
import json
from channels.testing import WebsocketCommunicator
from django.contrib.auth import get_user_model
from config.asgi import application
from apps.requests.models import Request
from rest_framework_simplejwt.tokens import AccessToken

User = get_user_model()

@pytest.mark.anyio
@pytest.mark.django_db(transaction=True)
class TestRequestConsumer:
    @pytest.fixture
    def anyio_backend(self):
        return 'asyncio'

    async def get_communicator(self, user):
        token = AccessToken.for_user(user)
        # Mocking the role_version as simplejwt requires it for auth middleware in this setup
        token['role_version'] = getattr(user, 'role_version', 1) 
        
        communicator = WebsocketCommunicator(
            application, 
            f"/ws/requests/?token={str(token)}"
        )
        return communicator

    async def test_unauthenticated_connection_rejected(self):
        communicator = WebsocketCommunicator(application, "/ws/requests/")
        connected, _ = await communicator.connect()
        assert not connected

    async def test_authenticated_connection_accepted(self):
        user = await User.objects.acreate(email="test@customer.com", role="customer", role_version=1)
        communicator = await self.get_communicator(user)
        connected, _ = await communicator.connect()
        assert connected
        await communicator.disconnect()

    async def test_subscription_to_own_request(self):
        user = await User.objects.acreate(email="owner@customer.com", role="customer", role_version=1)
        req = await Request.objects.acreate(
            customer=user, 
            category="installation", 
            description="test",
            status="draft"
        )

        communicator = await self.get_communicator(user)
        await communicator.connect()

        # Subscribe to own request
        await communicator.send_json_to({
            "action": "subscribe",
            "request_id": str(req.id)
        })
        
        response = await communicator.receive_json_from()
        assert response["success"] is True

        await communicator.disconnect()

    async def test_subscription_to_other_request_denied(self):
        owner = await User.objects.acreate(email="owner1@customer.com", role="customer", role_version=1)
        other = await User.objects.acreate(email="owner2@customer.com", role="customer", role_version=1)
        req = await Request.objects.acreate(
            customer=owner, 
            category="installation", 
            description="test",
            status="draft"
        )

        communicator = await self.get_communicator(other)
        await communicator.connect()

        # Try to subscribe to someone else's request
        await communicator.send_json_to({
            "action": "subscribe",
            "request_id": str(req.id)
        })
        
        response = await communicator.receive_json_from()
        assert response["success"] is False
        assert response["error"] == "permission_denied"

        await communicator.disconnect()

    async def test_staff_can_subscribe_to_any_request(self):
        owner = await User.objects.acreate(email="owner3@customer.com", role="customer", role_version=1)
        staff = await User.objects.acreate(email="staff@company.com", role="staff", role_version=1)
        req = await Request.objects.acreate(
            customer=owner, 
            category="installation", 
            description="test",
            status="draft"
        )

        communicator = await self.get_communicator(staff)
        await communicator.connect()

        # Staff subscribes to a customer request
        await communicator.send_json_to({
            "action": "subscribe",
            "request_id": str(req.id)
        })
        
        response = await communicator.receive_json_from()
        assert response["success"] is True

        await communicator.disconnect()
