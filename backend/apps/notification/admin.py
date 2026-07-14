from django.contrib import admin
from .models import Notification, NotificationDelivery, NotificationPreference

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('id', 'recipient', 'category', 'event_type', 'status', 'created_at')
    list_filter = ('status', 'category', 'event_type')
    search_fields = ('recipient__email', 'title')
    readonly_fields = ('id', 'created_at')

@admin.register(NotificationDelivery)
class NotificationDeliveryAdmin(admin.ModelAdmin):
    list_display = ('id', 'notification', 'channel', 'status', 'retry_count', 'updated_at')
    list_filter = ('channel', 'status')
    search_fields = ('notification__id', 'idempotency_key')
    readonly_fields = ('id',)

@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = ('user', 'category', 'channel', 'is_enabled', 'updated_at')
    list_filter = ('channel', 'is_enabled', 'category')
    search_fields = ('user__email',)
    readonly_fields = ('id',)
