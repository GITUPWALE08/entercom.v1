from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
import uuid

from apps.payments.services.payment_service import PaymentService
from apps.payments.services.webhook_service import WebhookService
from apps.payments.models import Payment
from apps.payments.permissions import PaymentPermissionChecker, WebhookPermissions
from apps.orders.models import Order
from apps.common.permissions import Actor, Role
from .serializers import (
    PaymentSerializer, PaymentInitializeSerializer, PaymentCancelSerializer
)

def get_actor(request):
    return Actor(id=request.user.id if request.user.is_authenticated else uuid.uuid4(), role=Role.CUSTOMER)

class PaymentInitializeView(APIView):
    def post(self, request):
        actor = get_actor(request)
        PaymentPermissionChecker.check(actor, 'payment.initialize')
        serializer = PaymentInitializeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        order_id = serializer.validated_data['order_id']
        order = get_object_or_404(Order, pk=order_id)
        
        if actor.role == Role.CUSTOMER and str(order.customer_id) != str(actor.id):
            from django.core.exceptions import PermissionDenied
            raise PermissionDenied("Cannot initialize another customer's payment.")

        payment = PaymentService.initialize_payment(
            actor=actor,
            correlation_id=str(uuid.uuid4()),
            order_id=order.id,
            request_id=order.request_id,
            customer_id=order.customer_id,
            amount=order.total_amount,
            currency='NGN',
            provider_reference=str(uuid.uuid4())
        )
        return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)

class PaymentDetailView(APIView):
    def get(self, request, pk):
        actor = get_actor(request)
        payment = get_object_or_404(Payment, pk=pk)
        if actor.role == Role.CUSTOMER:
            PaymentPermissionChecker.check(actor, 'payment.view_own', payment=payment)
        else:
            PaymentPermissionChecker.check(actor, 'payment.view')
            
        return Response(PaymentSerializer(payment).data)

class PaymentCancelView(APIView):
    def post(self, request, pk):
        actor = get_actor(request)
        payment = get_object_or_404(Payment, pk=pk)
        PaymentPermissionChecker.check(actor, 'payment.cancel', payment=payment)
        
        serializer = PaymentCancelSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        payment = PaymentService.cancel_payment(
            actor=actor,
            correlation_id=str(uuid.uuid4()),
            payment_id=pk
        )
        return Response(PaymentSerializer(payment).data)

class PaystackWebhookView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        actor = Actor(id='SYSTEM', role=Role.SYSTEM)
        PaymentPermissionChecker.check(actor, WebhookPermissions.PROCESS)
        
        signature = request.headers.get('x-paystack-signature', '')
        
        WebhookService.process_webhook(
            actor=actor,
            correlation_id=str(uuid.uuid4()),
            payload=request.data,
            signature=signature,
            secret_key='SECRET',
            raw_body=request.body
        )
        return Response(status=status.HTTP_200_OK)
