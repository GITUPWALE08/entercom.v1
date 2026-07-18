import logging
from .services import DispatchOrchestrator
from apps.requests.models import Request

logger = logging.getLogger(__name__)

class EventToNotificationMapper:
    @staticmethod
    def map_and_dispatch(event):
        try:
            event_name = getattr(event, 'event_name', None)
            if hasattr(event_name, 'value'):
                event_name = event_name.value
            
            data = getattr(event, 'data', {})
            if hasattr(data, 'to_dict'):
                data = data.to_dict()
            elif hasattr(data, '__dict__'):
                data = vars(data)
                
            import uuid
            def sanitize_for_json(obj):
                if isinstance(obj, dict):
                    return {k: sanitize_for_json(v) for k, v in obj.items()}
                elif isinstance(obj, list):
                    return [sanitize_for_json(v) for v in obj]
                elif isinstance(obj, uuid.UUID):
                    return str(obj)
                return obj
                
            data = sanitize_for_json(data)

            # Determine resource_type and resource_id
            resource_id = getattr(event, 'request_id', data.get('request_id'))
            resource_type = "request"
            if "booking" in event_name or "availability" in event_name:
                resource_type = "booking"
                resource_id = getattr(event, 'booking_id', data.get('booking_id'))
            elif "order" in event_name:
                resource_type = "order"
                resource_id = data.get('order_id')
            elif "payment" in event_name or "webhook" in event_name:
                resource_type = "payment"
                resource_id = data.get('payment_id')

            recipient_id = None
            category = "updates"
            title = event_name.replace('.', ' ').title()
            message = f"New event: {event_name}"
            is_critical = False

            if event_name == "request.created":
                recipient_id = data.get('customer_id')
                message = f"Your request #{resource_id} has been created."
            elif event_name == "request.assigned":
                recipient_id = data.get('technician_id')
                title = "New Assignment"
                message = f"You have been assigned to request #{resource_id}."
                category = "alerts"
            elif event_name == "quote.created":
                try:
                    req = Request.objects.get(pk=resource_id)
                    recipient_id = req.customer_id
                except:
                    pass
                title = "Quote Ready"
                message = "Your quote is ready for review."
                category = "alerts"
                is_critical = True
            elif event_name == "quote.expired":
                try:
                    req = Request.objects.get(pk=resource_id)
                    recipient_id = req.customer_id
                except:
                    pass
                title = "Quote Expired"
                message = "Your quote has expired."
            elif event_name == "payment.initialized":
                from apps.orders.models import Order
                try:
                    order = Order.objects.get(pk=data.get('order_id'))
                    recipient_id = order.customer_id
                except:
                    pass
                title = "Payment Required"
                message = f"Payment of {data.get('amount')} {data.get('currency')} is required."
                category = "alerts"
                is_critical = True
            elif event_name == "payment.paid":
                from apps.orders.models import Order
                try:
                    order = Order.objects.get(pk=data.get('order_id'))
                    recipient_id = order.customer_id
                except:
                    pass
                title = "Payment Successful"
                message = f"Your payment has been received successfully."
            elif event_name == "booking.scheduled":
                try:
                    req = Request.objects.get(pk=data.get('request_id'))
                    recipient_id = req.customer_id
                except:
                    pass
                title = "Booking Scheduled"
                message = f"Your service has been scheduled for {data.get('start_time')}."
                is_critical = True
            elif event_name == "booking.rescheduled":
                try:
                    req = Request.objects.get(pk=data.get('request_id'))
                    recipient_id = req.customer_id
                except:
                    pass
                title = "Booking Rescheduled"
                message = f"Your service has been rescheduled to {data.get('new_start_time')}."
                is_critical = True
            elif event_name == "verification.approved":
                try:
                    req = Request.objects.get(pk=resource_id)
                    recipient_id = req.customer_id
                except:
                    pass
                title = "Verification Approved"
                message = "Your verification has been approved."
            elif event_name == "booking.reminder.sent":
                try:
                    req = Request.objects.get(pk=data.get('request_id'))
                    recipient_id = req.customer_id
                except:
                    pass
                title = "Booking Reminder"
                message = "This is a reminder for your upcoming booking."
                is_critical = True
                category = "alerts"
                event_name = "booking_reminder"
            elif event_name == "quote.approved":
                try:
                    req = Request.objects.get(pk=resource_id)
                    recipient_id = data.get('technician_id') # Usually notify staff
                except:
                    pass
                title = "Quote Approved"
                message = "A quote has been approved."
            elif event_name == "request.declined":
                recipient_id = data.get('customer_id')
                title = "Assignment Declined"
                message = "Your assignment was declined."
            elif event_name == "booking.completed" or event_name == "job.completed":
                try:
                    req = Request.objects.get(pk=data.get('request_id'))
                    recipient_id = req.customer_id
                except:
                    pass
                title = "Job Completed"
                message = "Your service job has been completed successfully."

            if recipient_id:
                DispatchOrchestrator.dispatch_event(
                    event_type=event_name,
                    recipient_id=recipient_id,
                    context=data,
                    resource_type=resource_type,
                    resource_id=resource_id,
                    category=category,
                    title=title,
                    message=message,
                    is_system_critical=is_critical
                )
        except Exception as e:
            logger.error(f"Failed to map event {getattr(event, 'event_name', 'Unknown')}: {e}")
