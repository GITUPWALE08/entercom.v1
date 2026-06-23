from rest_framework import serializers
from ..models.booking import Booking
from ..models.working_hours import WorkingHours
from ..models.blackout_date import BlackoutDate

class BookingListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ['id', 'request_id', 'status', 'start_time', 'end_time', 'duration_days', 'technician_id']

class BookingDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = [
            'id', 'request_id', 'status', 'start_time', 'end_time', 
            'duration_days', 'technician_id', 'reschedule_count', 
            'last_reminder_sent', 'created_at', 'updated_at'
        ]

class WorkingHoursSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkingHours
        fields = ['id', 'technician_id', 'schedule_blob', 'updated_at']
        read_only_fields = ['id', 'technician_id', 'updated_at']

class BlackoutDateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlackoutDate
        fields = ['id', 'technician_id', 'start_time', 'end_time']
        read_only_fields = ['id', 'technician_id']

class ScheduleBookingSerializer(serializers.Serializer):
    start_date = serializers.DateTimeField()

class RescheduleBookingSerializer(serializers.Serializer):
    new_start_date = serializers.DateTimeField()
    reason_code = serializers.CharField(max_length=50, required=False, default="customer_request")

class ExtendBookingSerializer(serializers.Serializer):
    new_duration_days = serializers.IntegerField(min_value=1)

class ReportNoShowSerializer(serializers.Serializer):
    absent_party = serializers.ChoiceField(choices=['customer', 'technician'])
