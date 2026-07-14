from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import ValidationError as DRFValidationError
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError as DjangoValidationError
import uuid

from apps.orders.services.order_service import OrderService
from apps.orders.models import Order
from apps.orders.permissions import OrderPermissionChecker
from apps.common.permissions import Actor, Role
from apps.requests.services.request_service import RequestService
from apps.requests.models.request import RequestCategory, PriorityLevel
from .serializers import (
    OrderSerializer, OrderCreateSerializer, OrderCancelSerializer
)

from rest_framework.permissions import IsAuthenticated

def get_actor(request):
    role_val = getattr(request.user, 'role', 'customer')
    if hasattr(role_val, 'value'):
        role_val = role_val.value
    
    try:
        role = Role(str(role_val).lower())
    except ValueError:
        role = Role.CUSTOMER
        
    return Actor(id=request.user.id, role=role)

class OrderListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        actor = get_actor(request)
        if actor.role == Role.CUSTOMER:
            OrderPermissionChecker.check(actor, 'order.view_own')
            orders = Order.objects.filter(customer_id=actor.id)
        else:
            OrderPermissionChecker.check(actor, 'order.view')
            orders = Order.objects.all()
            
        state = request.query_params.get('state')
        if state:
            orders = orders.filter(status=state)
        customer_id = request.query_params.get('customer_id')
        if customer_id and actor.role != Role.CUSTOMER:
            orders = orders.filter(customer_id=customer_id)
            
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)

    def post(self, request):
        actor = get_actor(request)
        OrderPermissionChecker.check(actor, 'order.create')
        serializer = OrderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        request_id = serializer.validated_data.get('request_id')
        
        if not request_id:  
            req_data = {
                "category": RequestCategory.PRODUCT_ORDER,
                "priority": PriorityLevel.NORMAL,
                "description": "Auto-generated request for direct product order.",
                "location": {},
                "requires_technician": serializer.validated_data.get('requires_technician', False)
            }
            new_req = RequestService.create_request(user=request.user, data=req_data)
            
            # Optionally submit the request so it's not stuck in Draft
            RequestService.submit(request_id=new_req.id, actor=request.user)
            
            request_id = new_req.id
        
        try:
            order = OrderService.create_order(
                actor=actor,
                correlation_id=str(uuid.uuid4()),
                request_id=request_id,
                customer_id=actor.id,
                items_data=serializer.validated_data['items']
            )
        except DjangoValidationError as e:
            raise DRFValidationError(e.message_dict if hasattr(e, 'message_dict') else e.messages)
            
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

class OrderDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        actor = get_actor(request)
        order = get_object_or_404(Order, pk=pk)
        if actor.role == Role.CUSTOMER:
            OrderPermissionChecker.check(actor, 'order.view_own', order=order)
        else:
            OrderPermissionChecker.check(actor, 'order.view')
            
        return Response(OrderSerializer(order).data)

class OrderCancelView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        actor = get_actor(request)
        order = get_object_or_404(Order, pk=pk)
        OrderPermissionChecker.check(actor, 'order.cancel', order=order)
        
        serializer = OrderCancelSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        from django.core.exceptions import ValidationError as DjangoValidationError
        from rest_framework.exceptions import ValidationError as DRFValidationError
        try:
            order = OrderService.cancel_order(
                actor=actor,
                correlation_id=str(uuid.uuid4()),
                order_id=pk,
                cancellation_reason=serializer.validated_data['reason']
            )
        except DjangoValidationError as e:
            raise DRFValidationError(e.message_dict if hasattr(e, 'message_dict') else e.messages)
        return Response(OrderSerializer(order).data)

class OrderFulfillView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        actor = get_actor(request)
        order = get_object_or_404(Order, pk=pk)
        OrderPermissionChecker.check(actor, 'order.fulfill', order=order)
        
        from django.core.exceptions import ValidationError as DjangoValidationError
        from rest_framework.exceptions import ValidationError as DRFValidationError
        try:
            order = OrderService.fulfill_order(
                actor=actor,
                correlation_id=str(uuid.uuid4()),
                order_id=pk
            )
        except DjangoValidationError as e:
            raise DRFValidationError(e.message_dict if hasattr(e, 'message_dict') else e.messages)
        return Response(OrderSerializer(order).data)
