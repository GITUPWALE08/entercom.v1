from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.users.models import TechnicianApplication
from apps.users.serializers.technician import TechnicianApplicationSerializer, TechnicianApplicationCreateSerializer, TechnicianApplicationDecideSerializer
from apps.users.services.technician import TechnicianOnboardingService
from core.permissions import require_permission

class TechnicianApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = TechnicianApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['manager', 'super_admin']:
            return TechnicianApplication.objects.select_related('user').all().order_by('-created_at')
        return TechnicianApplication.objects.select_related('user').filter(user=user).order_by('-created_at')

    def create(self, request, *args, **kwargs):
        serializer = TechnicianApplicationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        app = TechnicianOnboardingService.submit_application(
            user=request.user,
            skills=serializer.validated_data.get('skills', []),
            document_urls=serializer.validated_data.get('document_urls', []),
            form_data=serializer.validated_data.get('form_data', {}),
            notes=serializer.validated_data.get('notes', '')
        )
        
        return Response(TechnicianApplicationSerializer(app).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'])
    def review(self, request, pk=None):
        require_permission(request.user, 'user.update')
        app = TechnicianOnboardingService.review_application(request.user, pk)
        return Response(TechnicianApplicationSerializer(app).data)

    @action(detail=True, methods=['patch'])
    def decide(self, request, pk=None):
        require_permission(request.user, 'user.update')
        serializer = TechnicianApplicationDecideSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        app = TechnicianOnboardingService.decide_application(
            manager=request.user,
            app_id=pk,
            status=serializer.validated_data.get('status'),
            reviewer_id=serializer.validated_data.get('reviewer_id'),
            notes=serializer.validated_data.get('notes'),
            rejection_reason=serializer.validated_data.get('rejection_reason')
        )
        return Response(TechnicianApplicationSerializer(app).data)
