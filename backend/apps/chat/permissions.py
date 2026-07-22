from rest_framework import permissions
from .models import Conversation, ConversationParticipant

class IsParticipantOrStaff(permissions.BasePermission):
    """
    Custom permission to only allow participants of a conversation or staff members to access it.
    """
    def has_object_permission(self, request, view, obj):
        # Admins, managers and staff can view all conversations
        if request.user.role in ['admin', 'manager', 'staff']:
            return True
            
        # Check if the user is a technician and the conversation is linked to a request they are assigned to
        if request.user.role == 'technician':
            if obj.request and getattr(obj.request, 'assigned_to_id', None) == request.user.id:
                return True
                
        # Finally, check if they are an active participant
        return ConversationParticipant.objects.filter(
            conversation=obj, 
            user=request.user,
            is_active=True
        ).exists()


class CanSendMessages(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # Must be an active participant or a staff member to send messages
        if obj.status == 'closed':
            return False
            
        if request.user.role in ['admin', 'manager', 'staff']:
            return True
            
        if request.user.role == 'technician':
            if obj.request and getattr(obj.request, 'assigned_to_id', None) == request.user.id:
                return True
                
        return ConversationParticipant.objects.filter(
            conversation=obj, 
            user=request.user,
            is_active=True
        ).exists()
