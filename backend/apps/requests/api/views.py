import logging
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.pagination import LimitOffsetPagination
from django.core.exceptions import PermissionDenied
from drf_spectacular.utils import extend_schema, OpenApiResponse

from .serializers import (
    CreateRequestSerializer, UpdateRequestSerializer, AssignTechnicianSerializer, 
    DeclineAssignmentSerializer, CancelRequestSerializer, CreateQuoteSerializer, 
    CustomerQuoteActionSerializer, SubmitVerificationSerializer, 
    VerificationReviewSerializer, EscalationSerializer,
    RequestListSerializer, QuoteListSerializer
)
from .permissions import GenericRBACPermission
from apps.requests.permissions.constants import Permission

from apps.requests.services.request_service import RequestService
from apps.requests.services.assignment_service import AssignmentService
from apps.requests.services.quote_service import QuoteService
from apps.requests.services.verification_service import VerificationService
from apps.requests.services.escalation_service import EscalationService
from apps.requests.models import StateHistory

logger = logging.getLogger(__name__)

def success_response(message="Success", data=None, status_code=status.HTTP_200_OK):
    return Response({"success": True, "message": message, "data": data or {}}, status=status_code)

def error_response(message="Unexpected error", errors=None, status_code=status.HTTP_400_BAD_REQUEST):
    payload = {"success": False, "message": message}
    if errors:
        payload["errors"] = errors
    return Response(payload, status=status_code)

class StandardResultsSetPagination(LimitOffsetPagination):
    default_limit = 20
    max_limit = 100

class RequestViewSet(viewsets.ViewSet):
    permission_classes = [GenericRBACPermission]
    pagination_class = StandardResultsSetPagination
    
    rbac_action_map = {
        'list': None,
        'retrieve': None,
        'timeline': None,
        'create': Permission.REQUEST_CREATE,
        'partial_update': Permission.REQUEST_UPDATE,
        'submit': Permission.REQUEST_SUBMIT,
        'assign': Permission.REQUEST_ASSIGN,
        'accept': Permission.ASSIGNMENT_ACCEPT,
        'decline': Permission.ASSIGNMENT_DECLINE,
        'cancel': Permission.REQUEST_CANCEL,
        'escalate': Permission.REQUEST_ESCALATE,
    }

    @property
    def paginator(self):
        if not hasattr(self, '_paginator'):
            if self.pagination_class is None:
                self._paginator = None
            else:
                self._paginator = self.pagination_class()
        return self._paginator

    def paginate_queryset(self, queryset):
        if self.paginator is None:
            return None
        return self.paginator.paginate_queryset(queryset, self.request, view=self)

    def get_paginated_response(self, data, message="Success"):
        assert self.paginator is not None
        return Response({
            "success": True,
            "message": message,
            "data": data,
            "pagination": {
                "count": self.paginator.count,
                "next": self.paginator.get_next_link(),
                "previous": self.paginator.get_previous_link()
            }
        })

    def get_object(self):
        pk = self.kwargs.get('pk') or self.kwargs.get('request_pk')
        return RequestService.get_request_by_id(request_id=pk)

    @extend_schema(summary="List Requests", responses={200: RequestListSerializer(many=True)})
    def list(self, request):
        queryset = RequestService.list_requests(user=request.user)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = RequestListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data, "Requests retrieved successfully")

        serializer = RequestListSerializer(queryset, many=True)
        return success_response("Requests retrieved successfully", serializer.data)

    @extend_schema(summary="Retrieve Request", responses={200: RequestListSerializer})
    def retrieve(self, request, pk=None):
        obj = self.get_object()
        self.check_object_permissions(request, obj)
        serializer = RequestListSerializer(obj)
        return success_response("Request retrieved successfully", serializer.data)

    @extend_schema(summary="Create Request", request=CreateRequestSerializer, responses={201: OpenApiResponse(description="Created"), 400: OpenApiResponse(description="Validation Error")})
    def create(self, request):
        serializer = CreateRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("Validation failed", serializer.errors)
        try:
            result = RequestService.create_request(user=request.user, data=serializer.validated_data)
            return success_response("Request created successfully", {"id": str(result.id), "public_id": getattr(result, 'public_id', '')}, status.HTTP_201_CREATED)
        except PermissionDenied:
            return error_response("Permission denied", status_code=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            logger.error(f"Service error: {e}")
            return error_response("Unexpected error", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @extend_schema(summary="Update Request", request=UpdateRequestSerializer, responses={200: OpenApiResponse(description="Success"), 400: OpenApiResponse(description="Validation Error")})
    def partial_update(self, request, pk=None):
        obj = self.get_object()
        self.check_object_permissions(request, obj)
        serializer = UpdateRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("Validation failed", serializer.errors)
        try:
            result = RequestService.update_request(request_id=pk, user=request.user, data=serializer.validated_data)
            return success_response("Request updated successfully", {"id": str(result.id)})
        except Exception as e:
            logger.error(f"Service error: {e}")
            return error_response("Unexpected error", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @extend_schema(summary="Request Timeline", responses={200: OpenApiResponse(description="Success")})
    @action(detail=True, methods=['get'])
    def timeline(self, request, pk=None):
        obj = self.get_object()
        self.check_object_permissions(request, obj)
        data = RequestService.get_timeline(request_id=pk, user=request.user)
        return success_response("Timeline retrieved successfully", data)

    @extend_schema(summary="Submit Request", request=None, responses={200: OpenApiResponse(description="Success")})
    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        obj = self.get_object()
        self.check_object_permissions(request, obj)
        try:
            result = RequestService.submit(request_id=pk, actor=request.user)
            return success_response("Request submitted successfully", {"id": str(result.id), "status": result.status})
        except Exception as e:
            import traceback
            traceback.print_exc()
            logger.error(f"Service error: {e}")
            return error_response("Unexpected error", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @extend_schema(summary="Assign Technician", request=AssignTechnicianSerializer, responses={200: OpenApiResponse(description="Success"), 400: OpenApiResponse(description="Validation Error")})
    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        obj = self.get_object()
        self.check_object_permissions(request, obj)
        serializer = AssignTechnicianSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("Validation failed", serializer.errors)
        try:
            result = AssignmentService.assign(request_id=pk, actor=request.user, technician_id=serializer.validated_data['technician_id'])
            return success_response("Technician assigned successfully", {"id": str(result.id), "status": result.status})
        except Exception as e:
            import traceback
            traceback.print_exc()
            logger.error(f"Service error: {e}")
            return error_response("Unexpected error", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @extend_schema(summary="Accept Assignment", request=None, responses={200: OpenApiResponse(description="Success")})
    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        obj = self.get_object()
        self.check_object_permissions(request, obj)
        try:
            result = AssignmentService.accept(request_id=pk, actor=request.user)
            return success_response("Assignment accepted successfully", {"id": str(result.id), "status": result.status})
        except Exception as e:
            import traceback
            traceback.print_exc()
            logger.error(f"Service error: {e}")
            return error_response("Unexpected error", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @extend_schema(summary="Decline Assignment", request=DeclineAssignmentSerializer, responses={200: OpenApiResponse(description="Success"), 400: OpenApiResponse(description="Validation Error")})
    @action(detail=True, methods=['post'])
    def decline(self, request, pk=None):
        obj = self.get_object()
        self.check_object_permissions(request, obj)
        serializer = DeclineAssignmentSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("Validation failed", serializer.errors)
        try:
            result = AssignmentService.decline(request_id=pk, actor=request.user, reason_code=serializer.validated_data['reason_code'])
            return success_response("Assignment declined successfully", {"id": str(result.id), "status": result.status})
        except Exception as e:
            import traceback
            traceback.print_exc()
            logger.error(f"Service error: {e}")
            return error_response("Unexpected error", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @extend_schema(summary="Cancel Request", request=CancelRequestSerializer, responses={200: OpenApiResponse(description="Success"), 400: OpenApiResponse(description="Validation Error")})
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        obj = self.get_object()
        self.check_object_permissions(request, obj)
        serializer = CancelRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("Validation failed", serializer.errors)
        try:
            result = RequestService.cancel(request_id=pk, actor=request.user, reason_code=serializer.validated_data['reason_code'])
            return success_response("Request cancelled successfully", {"id": str(result.id), "status": result.status})
        except Exception as e:
            import traceback
            traceback.print_exc()
            logger.error(f"Service error: {e}")
            return error_response("Unexpected error", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @extend_schema(summary="Escalate Request", request=EscalationSerializer, responses={200: OpenApiResponse(description="Success"), 400: OpenApiResponse(description="Validation Error")})
    @action(detail=True, methods=['post'])
    def escalate(self, request, pk=None):
        obj = self.get_object()
        self.check_object_permissions(request, obj)
        serializer = EscalationSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("Validation failed", serializer.errors)
        try:
            result = EscalationService.process_escalation(request_id=pk, trigger_type=serializer.validated_data['reason'], actor=request.user)
            return success_response("Request escalated successfully", {"id": str(result.id), "status": getattr(result, 'status', 'escalated')})
        except Exception as e:
            import traceback
            traceback.print_exc()
            logger.error(f"Service error: {e}")
            return error_response("Unexpected error", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RequestQuoteViewSet(viewsets.ViewSet):
    permission_classes = [GenericRBACPermission]
    pagination_class = StandardResultsSetPagination
    
    rbac_action_map = {
        'list': None, 
        'create': Permission.QUOTE_CREATE,
        'approve': Permission.QUOTE_APPROVE,
        'reject': Permission.QUOTE_REJECT,
        'revise': Permission.QUOTE_REVISE,
        'customer_action': {
            'approve': Permission.QUOTE_APPROVE,
            'reject': Permission.QUOTE_REJECT,
            'revise': Permission.QUOTE_REVISE,
        }
    }

    @property
    def paginator(self):
        if not hasattr(self, '_paginator'):
            if self.pagination_class is None:
                self._paginator = None
            else:
                self._paginator = self.pagination_class()
        return self._paginator

    def paginate_queryset(self, queryset):
        if self.paginator is None:
            return None
        return self.paginator.paginate_queryset(queryset, self.request, view=self)

    def get_paginated_response(self, data, message="Success"):
        assert self.paginator is not None
        return Response({
            "success": True,
            "message": message,
            "data": data,
            "pagination": {
                "count": self.paginator.count,
                "next": self.paginator.get_next_link(),
                "previous": self.paginator.get_previous_link()
            }
        })

    def get_object(self):
        pk = self.kwargs.get('request_pk')
        return RequestService.get_request_by_id(request_id=pk)

    @extend_schema(summary="List Quotes", responses={200: QuoteListSerializer(many=True)})
    def list(self, request, request_pk=None):
        queryset = QuoteService.list_quotes(request_id=request_pk, user=request.user)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = QuoteListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data, "Quotes retrieved successfully")

        serializer = QuoteListSerializer(queryset, many=True)
        return success_response("Quotes retrieved successfully", serializer.data)

    @extend_schema(summary="Create Quote", request=CreateQuoteSerializer, responses={201: OpenApiResponse(description="Created"), 400: OpenApiResponse(description="Validation Error")})
    def create(self, request, request_pk=None):
        obj = self.get_object()
        self.check_object_permissions(request, obj)
        serializer = CreateQuoteSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("Validation failed", serializer.errors)
        try:
            result = QuoteService.create_quote(request_id=request_pk, actor=request.user, data=serializer.validated_data)
            return success_response("Quote created successfully", {"id": str(result.id), "version": result.version}, status.HTTP_201_CREATED)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return error_response("Unexpected error", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @extend_schema(summary="Approve Quote", request=None, responses={200: OpenApiResponse(description="Success")})
    def approve(self, request, request_pk=None):
        obj = self.get_object()
        self.check_object_permissions(request, obj)
        try:
            result = QuoteService.approve_quote(request_id=request_pk, actor=request.user)
            return success_response("Quote approved successfully", {"status": getattr(result, 'status', 'approved')})
        except Exception as e:
            import traceback
            traceback.print_exc()
            logger.error(f"Service error: {e}")
            return error_response("Unexpected error", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @extend_schema(summary="Reject Quote", request=None, responses={200: OpenApiResponse(description="Success")})
    def reject(self, request, request_pk=None):
        obj = self.get_object()
        self.check_object_permissions(request, obj)
        try:
            result = QuoteService.handle_customer_action(request_id=request_pk, actor=request.user, action_type="reject")
            return success_response("Quote rejected successfully", {"status": getattr(result, 'status', 'rejected')})
        except Exception as e:
            import traceback
            traceback.print_exc()
            logger.error(f"Service error: {e}")
            return error_response("Unexpected error", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @extend_schema(summary="Revise Quote", request=None, responses={200: OpenApiResponse(description="Success")})
    def revise(self, request, request_pk=None):
        obj = self.get_object()
        self.check_object_permissions(request, obj)
        try:
            result = QuoteService.handle_customer_action(request_id=request_pk, actor=request.user, action_type="revise")
            return success_response("Quote revision requested successfully", {"status": getattr(result, 'status', 'revision_requested')})
        except Exception as e:
            import traceback
            traceback.print_exc()
            logger.error(f"Service error: {e}")
            return error_response("Unexpected error", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @extend_schema(summary="Customer Action on Quote", request=CustomerQuoteActionSerializer, responses={200: OpenApiResponse(description="Success"), 400: OpenApiResponse(description="Validation Error")})
    def customer_action(self, request, request_pk=None):
        obj = self.get_object()
        serializer = CustomerQuoteActionSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("Validation failed", serializer.errors)
        self.check_object_permissions(request, obj)
        try:
            result = QuoteService.handle_customer_action(
                request_id=request_pk, actor=request.user,
                action_type=serializer.validated_data['action'], reason=serializer.validated_data.get('reason')
            )
            return success_response("Customer action processed successfully", {"status": getattr(result, 'status', 'processed')})
        except Exception as e:
            import traceback
            traceback.print_exc()
            logger.error(f"Service error: {e}")
            return error_response("Unexpected error", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RequestVerificationViewSet(viewsets.ViewSet):
    permission_classes = [GenericRBACPermission]
    
    rbac_action_map = {
        'submit_verification': Permission.VERIFICATION_SUBMIT,
        'review_verification': Permission.VERIFICATION_VERIFY,
    }

    def get_object(self):
        pk = self.kwargs.get('request_pk')
        return RequestService.get_request_by_id(request_id=pk)

    @extend_schema(summary="Submit Verification", request=SubmitVerificationSerializer, responses={200: OpenApiResponse(description="Success"), 400: OpenApiResponse(description="Validation Error")})
    def submit_verification(self, request, request_pk=None):
        obj = self.get_object()
        self.check_object_permissions(request, obj)
        serializer = SubmitVerificationSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("Validation failed", serializer.errors)
        try:
            result = VerificationService.submit(request_id=request_pk, actor=request.user, evidence=serializer.validated_data)
            return success_response("Verification submitted successfully", {"id": str(result.id), "status": "pending_verification"})
        except Exception as e:
            import traceback
            traceback.print_exc()
            logger.error(f"Service error: {e}")
            return error_response("Unexpected error", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @extend_schema(summary="Review Verification", request=VerificationReviewSerializer, responses={200: OpenApiResponse(description="Success"), 400: OpenApiResponse(description="Validation Error")})
    def review_verification(self, request, request_pk=None):
        obj = self.get_object()
        self.check_object_permissions(request, obj)
        serializer = VerificationReviewSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("Validation failed", serializer.errors)
        try:
            result = VerificationService.verify(
                request_id=request_pk, actor=request.user,
                action_type=serializer.validated_data['action'], notes=serializer.validated_data.get('notes')
            )
            return success_response("Verification reviewed successfully", {"id": str(getattr(result, 'id', '')), "status": getattr(result, 'status', 'reviewed')})
        except Exception as e:
            import traceback
            traceback.print_exc()
            logger.error(f"Service error: {e}")
            return error_response("Unexpected error", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
