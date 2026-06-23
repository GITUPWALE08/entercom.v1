from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
import uuid

from apps.orders.services.order_service import OrderService
from apps.orders.models import Order
from apps.orders.permissions import OrderPermissionChecker
from apps.common.permissions import Actor, Role
from .serializers import (
    OrderSerializer, OrderCreateSerializer, OrderCancelSerializer
)

def get_actor(request):
    return Actor(id=request.user.id if request.user.is_authenticated else uuid.uuid4(), role=Role.CUSTOMER)

class OrderListView(APIView):
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
        
        order = OrderService.create_order(
            actor=actor,
            correlation_id=str(uuid.uuid4()),
            request_id=serializer.validated_data['request_id'],
            customer_id=actor.id,
            items_data=serializer.validated_data['items']
        )
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

class OrderDetailView(APIView):
    def get(self, request, pk):
        actor = get_actor(request)
        order = get_object_or_404(Order, pk=pk)
        if actor.role == Role.CUSTOMER:
            OrderPermissionChecker.check(actor, 'order.view_own', order=order)
        else:
            OrderPermissionChecker.check(actor, 'order.view')
            
        return Response(OrderSerializer(order).data)

class OrderCancelView(APIView):
    def post(self, request, pk):
        actor = get_actor(request)
        order = get_object_or_404(Order, pk=pk)
        OrderPermissionChecker.check(actor, 'order.cancel', order=order)
        
        serializer = OrderCancelSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        order = OrderService.cancel_order(
            actor=actor,
            correlation_id=str(uuid.uuid4()),
            order_id=pk,
            cancellation_reason=serializer.validated_data['reason']
        )
        return Response(OrderSerializer(order).data)

class OrderFulfillView(APIView):
    def post(self, request, pk):
        actor = get_actor(request)
        order = get_object_or_404(Order, pk=pk)
        OrderPermissionChecker.check(actor, 'order.fulfill', order=order)
        
        order = OrderService.fulfill_order(
            actor=actor,
            correlation_id=str(uuid.uuid4()),
            order_id=pk
        )
        return Response(OrderSerializer(order).data)
