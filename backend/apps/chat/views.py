from rest_framework import viewsets, status, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Conversation, Message
from .serializers import (
    ConversationListSerializer, 
    ConversationDetailSerializer, 
    ConversationCreateSerializer,
    MessageSerializer
)
from .services import ChatService
from .permissions import IsParticipantOrStaff, CanSendMessages

class ConversationViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Superadmin, admin, manager, staff see all
        if user.role in ['admin', 'manager', 'staff']:
            return Conversation.objects.all().select_related('created_by', 'assigned_staff', 'request')
            
        # Technician sees conversations linked to their assigned requests, and their own
        if user.role == 'technician':
            return Conversation.objects.filter(
                Q(participants__user=user, participants__is_active=True) |
                Q(request__assigned_to=user)
            ).distinct().select_related('created_by', 'assigned_staff', 'request')
            
        # Customers see only their participated conversations
        return Conversation.objects.filter(
            participants__user=user, 
            participants__is_active=True
        ).select_related('created_by', 'assigned_staff', 'request')

    def get_serializer_class(self):
        if self.action == 'create':
            return ConversationCreateSerializer
        if self.action == 'retrieve':
            return ConversationDetailSerializer
        return ConversationListSerializer
        
    def get_permissions(self):
        if self.action in ['retrieve', 'messages', 'read', 'assign', 'resolve']:
            return [IsAuthenticated(), IsParticipantOrStaff()]
        return super().get_permissions()

    def perform_create(self, serializer):
        conversation = ChatService.create_conversation(self.request.user, serializer.validated_data)
        serializer.instance = conversation

    @action(detail=True, methods=['get', 'post'], permission_classes=[IsAuthenticated, CanSendMessages])
    def messages(self, request, pk=None):
        conversation = self.get_object()
        
        if request.method == 'GET':
            messages = conversation.messages.select_related('sender').all()
            page = self.paginate_queryset(messages)
            if page is not None:
                serializer = MessageSerializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            serializer = MessageSerializer(messages, many=True)
            return Response(serializer.data)
            
        elif request.method == 'POST':
            body = request.data.get('body')
            if not body or len(body.strip()) == 0:
                return Response({'error': 'Message body cannot be empty'}, status=status.HTTP_400_BAD_REQUEST)
            if len(body) > 5000:
                return Response({'error': 'Message too long'}, status=status.HTTP_400_BAD_REQUEST)
                
            message = ChatService.send_message(conversation, request.user, body)
            serializer = MessageSerializer(message)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def read(self, request, pk=None):
        conversation = self.get_object()
        ChatService.mark_read(conversation, request.user)
        return Response({'status': 'marked as read'})

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        if request.user.role not in ['admin', 'manager', 'staff']:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
            
        conversation = self.get_object()
        staff_id = request.data.get('staff_id')
        
        from apps.users.models import User
        try:
            staff_user = User.objects.get(id=staff_id)
        except User.DoesNotExist:
            return Response({'error': 'Staff member not found'}, status=status.HTTP_404_NOT_FOUND)
            
        ChatService.assign_staff(conversation, staff_user, request.user)
        return Response({'status': 'assigned'})

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        if request.user.role not in ['admin', 'manager', 'staff']:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
            
        conversation = self.get_object()
        ChatService.resolve_conversation(conversation, request.user)
        return Response({'status': 'resolved'})
