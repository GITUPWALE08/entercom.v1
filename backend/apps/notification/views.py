from rest_framework import viewsets, mixins, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import LimitOffsetPagination
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from .models import Notification, NotificationPreference
from .serializers import NotificationSerializer, NotificationPreferenceSerializer
from .services import NotificationService

class NotificationPagination(LimitOffsetPagination):
    default_limit = 20
    max_limit = 100

class NotificationViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """
    API endpoint that allows users to view and manage their notifications.
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = NotificationPagination

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user).order_by('-created_at')

    @extend_schema(responses={200: NotificationSerializer})
    @action(detail=True, methods=['post'])
    def read(self, request, pk=None):
        """Mark a notification as read."""
        notification = NotificationService.mark_as_read(pk, request.user.id)
        serializer = self.get_serializer(notification)
        return Response(serializer.data)

    @extend_schema(responses={200: NotificationSerializer})
    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """Archive a notification."""
        notification = NotificationService.archive_notification(pk, request.user.id)
        serializer = self.get_serializer(notification)
        return Response(serializer.data)

    @extend_schema(responses={200: dict})
    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        Notification.objects.filter(recipient=request.user, status=Notification.Status.UNREAD).update(
            status=Notification.Status.READ,
            read_at=timezone.now()
        )
        return Response({"status": "success"})

    @extend_schema(responses={200: dict})
    @action(detail=False, methods=['post'], url_path='archive-all')
    def archive_all(self, request):
        Notification.objects.filter(recipient=request.user).exclude(status=Notification.Status.ARCHIVED).update(
            status=Notification.Status.ARCHIVED,
            archived_at=timezone.now()
        )
        return Response({"status": "success"})

    @extend_schema(responses={200: dict})
    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        count = Notification.objects.filter(recipient=request.user, status=Notification.Status.UNREAD).count()
        return Response({"unread_count": count})


class NotificationPreferenceViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to view and edit notification preferences.
    """
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return NotificationPreference.objects.filter(user=self.request.user)
        
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
