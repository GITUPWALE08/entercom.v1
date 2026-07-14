from rest_framework import viewsets, mixins, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.core.exceptions import ValidationError, PermissionDenied
from django.utils.dateparse import parse_date
from django.utils import timezone
from django.db.models import Q
from datetime import datetime, time
import uuid

from ..models.booking import Booking
from ..models.working_hours import WorkingHours
from ..models.blackout_date import BlackoutDate
from ..services.scheduling_service import SchedulingService
from ..services.booking_service import BookingService
from ..services.no_show_service import NoShowService
from ..services.availability_service import AvailabilityService

from apps.roles.models import UserRole
# from apps.requests.models import Request # Assuming we can filter via joins if needed

from .serializers import (
    BookingListSerializer,
    BookingDetailSerializer,
    WorkingHoursSerializer,
    BlackoutDateSerializer,
    ScheduleBookingSerializer,
    RescheduleBookingSerializer,
    ExtendBookingSerializer,
    ReportNoShowSerializer
)
from .permissions import (
    IsBookingViewer,
    CanManageWorkingHours,
    CanManageBlackouts,
    CanScheduleBooking,
    CanRescheduleBooking,
    CanExtendBooking,
    CanReportNoShow
)

from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiTypes, OpenApiResponse

@extend_schema_view(
    list=extend_schema(summary="List Bookings", description="Retrieve a list of bookings.", parameters=[
        OpenApiParameter('status', type=OpenApiTypes.STR, required=False),
        OpenApiParameter('technician_id', type=OpenApiTypes.UUID, required=False),
        OpenApiParameter('start_date', type=OpenApiTypes.DATE, required=False),
        OpenApiParameter('end_date', type=OpenApiTypes.DATE, required=False)
    ]),
    retrieve=extend_schema(summary="Retrieve Booking", description="Retrieve a specific booking by ID.")
)
class BookingViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only API for Bookings.
    Includes explicit IDOR filtering in get_queryset.
    System-only creation is bypassed here.
    """
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        role = getattr(user, 'role', '')
        
        # Staff/Managers see all
        if role in [UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.STAFF]:
            queryset = Booking.objects.all()
        # Technicians see assigned
        elif role == UserRole.TECHNICIAN:
            queryset = Booking.objects.filter(technician_id=user.id)
        # Customers see their own (Requires join to Request, assuming request__customer_id exists)
        elif role == UserRole.CUSTOMER:
            queryset = Booking.objects.filter(request__customer_id=user.id)
        else:
            queryset = Booking.objects.none()

        # Optional filters
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
            
        tech_param = self.request.query_params.get('technician_id')
        if tech_param:
            queryset = queryset.filter(technician_id=tech_param)

        start_date_param = self.request.query_params.get('start_date')
        end_date_param = self.request.query_params.get('end_date')

        if start_date_param and end_date_param:
            start_date = parse_date(start_date_param)
            end_date = parse_date(end_date_param)

            if not start_date or not end_date:
                raise ValidationError("start_date and end_date must be valid YYYY-MM-DD ISO dates.")
            
            if start_date >= end_date:
                raise ValidationError("start_date must be earlier than end_date.")

            if (end_date - start_date).days > 365:
                raise ValidationError("Date range must not exceed 365 days.")

            tz = timezone.utc
            dt_start = timezone.make_aware(datetime.combine(start_date, time.min), tz)
            dt_end = timezone.make_aware(datetime.combine(end_date, time.min), tz)

            # Exclusive boundaries: start_time > dt_start AND end_time < dt_end
            # Requirement: A booking matches when either timestamp falls within the specified range.
            queryset = queryset.filter(
                Q(start_time__gt=dt_start, start_time__lt=dt_end) |
                Q(end_time__gt=dt_start, end_time__lt=dt_end)
            )
        elif start_date_param or end_date_param:
            raise ValidationError("Both start_date and end_date are required for date filtering.")

        return queryset

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return BookingDetailSerializer
        return BookingListSerializer

    def get_permissions(self):
        if self.action == 'retrieve':
            return [IsAuthenticated(), IsBookingViewer()]
        return super().get_permissions()

    def handle_exception(self, exc):
        if isinstance(exc, PermissionDenied):
            # API Design mandates 404 for IDOR to mask existence
            return Response(status=status.HTTP_404_NOT_FOUND)
        if isinstance(exc, ValidationError):
            return Response({"error": exc.message if hasattr(exc, 'message') else str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return super().handle_exception(exc)


class BookingMutationViewSet(viewsets.ViewSet):
    """
    Mutation endpoints for Scheduling, Rescheduling, Extending, and No-Shows.
    """
    permission_classes = [IsAuthenticated]

    def get_object(self):
        try:
            return Booking.objects.get(pk=self.kwargs['pk'])
        except Booking.DoesNotExist:
            raise PermissionDenied() # Will be masked as 404

    def handle_exception(self, exc):
        if isinstance(exc, PermissionDenied):
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        if isinstance(exc, ValidationError):
            # Check for conflict messages
            err_str = str(exc).lower()
            if "conflict" in err_str or "overlap" in err_str or "available" in err_str:
                return Response({"error": exc.message if hasattr(exc, 'message') else str(exc)}, status=status.HTTP_409_CONFLICT)
            return Response({"error": exc.message if hasattr(exc, 'message') else str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return super().handle_exception(exc)

    @extend_schema(summary="Schedule Booking", request=ScheduleBookingSerializer, responses={200: BookingDetailSerializer})
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, CanScheduleBooking])
    def schedule(self, request, pk=None):
        booking = self.get_object()
        serializer = ScheduleBookingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        updated_booking = SchedulingService.schedule_booking(
            booking_id=str(booking.id),
            start_time=serializer.validated_data['start_date'],
            actor=request.user,
            correlation_id=request.headers.get("X-Correlation-ID", str(uuid.uuid4()))
        )
        return Response(BookingDetailSerializer(updated_booking).data)

    @extend_schema(summary="Reschedule Booking", request=RescheduleBookingSerializer, responses={200: BookingDetailSerializer})
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, CanRescheduleBooking])
    def reschedule(self, request, pk=None):
        booking = self.get_object()
        serializer = RescheduleBookingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        updated_booking = SchedulingService.reschedule_booking(
            booking_id=str(booking.id),
            new_start_time=serializer.validated_data['new_start_date'],
            actor=request.user,
            reason_code=serializer.validated_data.get('reason_code'),
            correlation_id=request.headers.get("X-Correlation-ID", str(uuid.uuid4()))
        )
        return Response(BookingDetailSerializer(updated_booking).data)

    @extend_schema(summary="Extend Booking", request=ExtendBookingSerializer, responses={200: BookingDetailSerializer})
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, CanExtendBooking])
    def extend(self, request, pk=None):
        booking = self.get_object()
        serializer = ExtendBookingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        updated_booking = BookingService.extend_duration(
            booking_id=str(booking.id),
            new_duration_days=serializer.validated_data['new_duration_days'],
            actor=request.user,
            correlation_id=request.headers.get("X-Correlation-ID", str(uuid.uuid4()))
        )
        return Response(BookingDetailSerializer(updated_booking).data)

    @extend_schema(summary="Report No-Show", request=ReportNoShowSerializer, responses={200: OpenApiResponse(description="Success")})
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, CanReportNoShow], url_path="no-show")
    def no_show(self, request, pk=None):
        booking = self.get_object()
        serializer = ReportNoShowSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        updated_booking = NoShowService.report_no_show(
            booking_id=str(booking.id),
            absent_party=serializer.validated_data['absent_party'],
            actor=request.user,
            correlation_id=request.headers.get("X-Correlation-ID", str(uuid.uuid4()))
        )
        return Response({
            "booking": BookingDetailSerializer(updated_booking).data,
            "cancelled_request_id": str(updated_booking.request_id)
        })


class TechnicianAvailabilityViewSet(viewsets.ViewSet):
    """
    Manages Technician Working Hours, Blackouts, and Availability Queries.
    """
    permission_classes = [IsAuthenticated]

    def handle_exception(self, exc):
        if isinstance(exc, PermissionDenied):
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        if isinstance(exc, ValidationError):
            err_str = str(exc).lower()
            if "conflict" in err_str or "overlap" in err_str or "active bookings" in err_str:
                return Response({"error": exc.message if hasattr(exc, 'message') else str(exc)}, status=status.HTTP_409_CONFLICT)
            return Response({"error": exc.message if hasattr(exc, 'message') else str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return super().handle_exception(exc)

    @extend_schema(summary="Get Technician Availability", parameters=[OpenApiParameter('start_date', type=OpenApiTypes.DATE, required=True)], responses={200: OpenApiTypes.ANY})
    @action(detail=True, methods=['get'])
    def availability(self, request, pk=None):
        """GET /api/v1/technicians/{id}/availability/"""
        technician_id = pk
        start_date_str = request.query_params.get('start_date')
        
        if not start_date_str:
            return Response({"error": "start_date is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        target_date = parse_date(start_date_str)
        if not target_date:
            return Response({"error": "Invalid date format."}, status=status.HTTP_400_BAD_REQUEST)

        slots = AvailabilityService.get_technician_availability(
            technician_id=technician_id,
            target_date=target_date,
            actor=request.user
        )
        
        # Serialize list of dicts to a standard JSON response
        formatted_slots = [{"start": s['start'].strftime('%H:%M'), "end": s['end'].strftime('%H:%M')} for s in slots]
        return Response(formatted_slots)

    @extend_schema(summary="Update Working Hours", request=WorkingHoursSerializer, responses={200: WorkingHoursSerializer})
    @action(detail=True, methods=['put', 'patch'], permission_classes=[IsAuthenticated, CanManageWorkingHours], url_path="working-hours")
    def working_hours(self, request, pk=None):
        technician_id = pk
        schedule_blob = request.data.get('schedule_blob')
        if not schedule_blob:
             return Response({"error": "schedule_blob is required."}, status=status.HTTP_400_BAD_REQUEST)
             
        working_hours = AvailabilityService.update_working_hours(
            technician_id=technician_id,
            schedule_blob=schedule_blob,
            actor=request.user,
            correlation_id=request.headers.get("X-Correlation-ID", str(uuid.uuid4()))
        )
        return Response(WorkingHoursSerializer(working_hours).data)

    @extend_schema(summary="Create Blackout Date", request=BlackoutDateSerializer, responses={201: BlackoutDateSerializer})
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, CanManageBlackouts], url_path="blackout-dates")
    def create_blackout(self, request, pk=None):
        technician_id = pk
        serializer = BlackoutDateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        blackout = AvailabilityService.create_blackout_date(
            technician_id=technician_id,
            start_time=serializer.validated_data['start_time'],
            end_time=serializer.validated_data['end_time'],
            actor=request.user,
            correlation_id=request.headers.get("X-Correlation-ID", str(uuid.uuid4()))
        )
        return Response(BlackoutDateSerializer(blackout).data, status=status.HTTP_201_CREATED)

    @extend_schema(summary="Delete Blackout Date", responses={204: OpenApiResponse(description="No Content")})
    @action(detail=True, methods=['delete'], permission_classes=[IsAuthenticated, CanManageBlackouts], url_path=r'blackout-dates/(?P<blackout_id>[^/.]+)')
    def delete_blackout(self, request, pk=None, blackout_id=None):
        AvailabilityService.delete_blackout_date(
            blackout_id=blackout_id,
            actor=request.user,
            correlation_id=request.headers.get("X-Correlation-ID", str(uuid.uuid4()))
        )
        return Response(status=status.HTTP_204_NO_CONTENT)
