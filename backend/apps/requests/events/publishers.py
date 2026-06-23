import logging
from typing import Any
from .base import BaseEvent
from .types import EventName
from .contracts import (
    RequestCreatedPayload,
    RequestUpdatedPayload,
    RequestSubmittedPayload,
    RequestStatusChangedPayload,
    RequestCancelledPayload,
    QuoteCreatedPayload,
    QuoteApprovedPayload,
    QuoteRejectedPayload,
    QuoteRevisionRequestedPayload,
    QuoteExpiredPayload,
    RequestAssignedPayload,
    AssignmentAcceptedPayload,
    AssignmentDeclinedPayload,
    AssignmentTimeoutPayload,
    VerificationSubmittedPayload,
    VerificationApprovedPayload,
    VerificationRejectedPayload,
    VerificationOverriddenPayload,
    EscalationTriggeredPayload,
    EscalationResolvedPayload,
    SLAWarningPayload,
    SLABreachedPayload,
)

logger = logging.getLogger(__name__)

class DomainEventPublisher:
    """
    Central publisher for Domain Events.
    Responsibilities:
    - Instantiate the strongly-typed payload.
    - Wrap it in the BaseEvent envelope.
    - Dispatch to the underlying message broker/stream.
    """
    
    @staticmethod
    def _dispatch(event: BaseEvent) -> None:
        """
        Internal dispatcher. 
        In a real environment, this connects to Celery, Redis Streams, or Kafka.
        """
        # Strictly publishes events. No business logic.
        logger.info(f"Published Domain Event: {event.event_name}", extra=event.to_dict())

        # Bridge to WebSockets for real-time domain notifications
        try:
            from apps.websocket.services.event_bridge import WebSocketEventPublisher
            WebSocketEventPublisher.dispatch_domain_event(event)
        except Exception as e:
            logger.error(f"Failed to bridge event {event.event_name} to WebSockets: {e}")


    # --- Lifecycle Producers ---
    
    @classmethod
    def publish_request_created(cls, request_id: int, correlation_id: str, actor_id: int, customer_id: int, category: str):
        data = RequestCreatedPayload(request_id=request_id, customer_id=customer_id, category=category)
        event = BaseEvent(request_id=request_id, correlation_id=correlation_id, actor_id=actor_id, event_name=EventName.REQUEST_CREATED, data=data)
        cls._dispatch(event)

    @classmethod
    def publish_request_updated(cls, request_id: int, correlation_id: str, actor_id: int, updates: dict):
        data = RequestUpdatedPayload(request_id=request_id, updates=updates)
        event = BaseEvent(request_id=request_id, correlation_id=correlation_id, actor_id=actor_id, event_name=EventName.REQUEST_UPDATED, data=data)
        cls._dispatch(event)

    @classmethod
    def publish_request_submitted(cls, request_id: int, correlation_id: str, actor_id: int, priority: str, category: str):
        data = RequestSubmittedPayload(request_id=request_id, priority=priority, category=category)
        event = BaseEvent(request_id=request_id, correlation_id=correlation_id, actor_id=actor_id, event_name=EventName.REQUEST_SUBMITTED, data=data)
        cls._dispatch(event)

    @classmethod
    def publish_request_status_changed(cls, request_id: int, correlation_id: str, actor_id: int, prev_status: str, new_status: str):
        data = RequestStatusChangedPayload(request_id=request_id, prev_status=prev_status, new_status=new_status)
        event = BaseEvent(request_id=request_id, correlation_id=correlation_id, actor_id=actor_id, event_name=EventName.REQUEST_STATUS_CHANGED, data=data)
        cls._dispatch(event)

    @classmethod
    def publish_request_cancelled(cls, request_id: int, correlation_id: str, actor_id: int, reason_code: str):
        data = RequestCancelledPayload(request_id=request_id, actor_id=actor_id, reason_code=reason_code)
        event = BaseEvent(request_id=request_id, correlation_id=correlation_id, actor_id=actor_id, event_name=EventName.REQUEST_CANCELLED, data=data)
        cls._dispatch(event)

    # --- Quote Producers ---

    @classmethod
    def publish_quote_created(cls, request_id: int, correlation_id: str, actor_id: int, quote_id: int, version: int, amount: float):
        data = QuoteCreatedPayload(quote_id=quote_id, version=version, amount=amount)
        event = BaseEvent(request_id=request_id, correlation_id=correlation_id, actor_id=actor_id, event_name=EventName.QUOTE_CREATED, data=data)
        cls._dispatch(event)

    @classmethod
    def publish_quote_approved(cls, request_id: int, correlation_id: str, actor_id: int, quote_id: int, customer_id: int):
        data = QuoteApprovedPayload(quote_id=quote_id, request_id=request_id, customer_id=customer_id)
        event = BaseEvent(request_id=request_id, correlation_id=correlation_id, actor_id=actor_id, event_name=EventName.QUOTE_APPROVED, data=data)
        cls._dispatch(event)

    @classmethod
    def publish_quote_rejected(cls, request_id: int, correlation_id: str, actor_id: int, quote_id: int, reason_code: str):
        data = QuoteRejectedPayload(quote_id=quote_id, reason_code=reason_code)
        event = BaseEvent(request_id=request_id, correlation_id=correlation_id, actor_id=actor_id, event_name=EventName.QUOTE_REJECTED, data=data)
        cls._dispatch(event)

    @classmethod
    def publish_quote_revision_requested(cls, request_id: int, correlation_id: str, actor_id: int, quote_id: int, revision_notes: str):
        data = QuoteRevisionRequestedPayload(quote_id=quote_id, revision_notes=revision_notes)
        event = BaseEvent(request_id=request_id, correlation_id=correlation_id, actor_id=actor_id, event_name=EventName.QUOTE_REVISION_REQUESTED, data=data)
        cls._dispatch(event)

    @classmethod
    def publish_quote_expired(cls, request_id: int, correlation_id: str, actor_id: int, quote_id: int):
        data = QuoteExpiredPayload(quote_id=quote_id, request_id=request_id)
        event = BaseEvent(request_id=request_id, correlation_id=correlation_id, actor_id=actor_id, event_name=EventName.QUOTE_EXPIRED, data=data)
        cls._dispatch(event)

    # --- Assignment Producers ---

    @classmethod
    def publish_request_assigned(cls, request_id: int, correlation_id: str, actor_id: int, technician_id: int):
        data = RequestAssignedPayload(request_id=request_id, technician_id=technician_id)
        event = BaseEvent(request_id=request_id, correlation_id=correlation_id, actor_id=actor_id, event_name=EventName.REQUEST_ASSIGNED, data=data)
        cls._dispatch(event)

    @classmethod
    def publish_assignment_accepted(cls, request_id: int, correlation_id: str, actor_id: int, technician_id: int, timestamp: str):
        data = AssignmentAcceptedPayload(request_id=request_id, technician_id=technician_id, timestamp=timestamp)
        event = BaseEvent(request_id=request_id, correlation_id=correlation_id, actor_id=actor_id, event_name=EventName.ASSIGNMENT_ACCEPTED, data=data)
        cls._dispatch(event)

    @classmethod
    def publish_assignment_declined(cls, request_id: int, correlation_id: str, actor_id: int, reason_code: str):
        data = AssignmentDeclinedPayload(request_id=request_id, reason_code=reason_code)
        event = BaseEvent(request_id=request_id, correlation_id=correlation_id, actor_id=actor_id, event_name=EventName.ASSIGNMENT_DECLINED, data=data)
        cls._dispatch(event)

    @classmethod
    def publish_assignment_timeout(cls, request_id: int, correlation_id: str, actor_id: int, technician_id: int):
        data = AssignmentTimeoutPayload(request_id=request_id, technician_id=technician_id)
        event = BaseEvent(request_id=request_id, correlation_id=correlation_id, actor_id=actor_id, event_name=EventName.ASSIGNMENT_TIMEOUT, data=data)
        cls._dispatch(event)

    # --- Verification Producers ---

    @classmethod
    def publish_verification_submitted(cls, request_id: int, correlation_id: str, actor_id: int, evidence_links: list):
        data = VerificationSubmittedPayload(request_id=request_id, evidence_links=evidence_links)
        event = BaseEvent(request_id=request_id, correlation_id=correlation_id, actor_id=actor_id, event_name=EventName.VERIFICATION_SUBMITTED, data=data)
        cls._dispatch(event)

    @classmethod
    def publish_verification_approved(cls, request_id: int, correlation_id: str, actor_id: int, staff_id: int):
        data = VerificationApprovedPayload(request_id=request_id, staff_id=staff_id)
        event = BaseEvent(request_id=request_id, correlation_id=correlation_id, actor_id=actor_id, event_name=EventName.VERIFICATION_APPROVED, data=data)
        cls._dispatch(event)

    @classmethod
    def publish_verification_rejected(cls, request_id: int, correlation_id: str, actor_id: int, rework_notes: str):
        data = VerificationRejectedPayload(request_id=request_id, rework_notes=rework_notes)
        event = BaseEvent(request_id=request_id, correlation_id=correlation_id, actor_id=actor_id, event_name=EventName.VERIFICATION_REJECTED, data=data)
        cls._dispatch(event)

    @classmethod
    def publish_verification_overridden(cls, request_id: int, correlation_id: str, actor_id: int, manager_id: int, reason: str):
        data = VerificationOverriddenPayload(request_id=request_id, manager_id=manager_id, reason=reason)
        event = BaseEvent(request_id=request_id, correlation_id=correlation_id, actor_id=actor_id, event_name=EventName.VERIFICATION_OVERRIDDEN, data=data)
        cls._dispatch(event)

    # --- Escalation Producers ---

    @classmethod
    def publish_escalation_triggered(cls, request_id: int, correlation_id: str, actor_id: int, trigger_type: str):
        data = EscalationTriggeredPayload(request_id=request_id, trigger_type=trigger_type)
        event = BaseEvent(request_id=request_id, correlation_id=correlation_id, actor_id=actor_id, event_name=EventName.ESCALATION_TRIGGERED, data=data)
        cls._dispatch(event)

    @classmethod
    def publish_escalation_resolved(cls, request_id: int, correlation_id: str, actor_id: int, resolution_type: str):
        data = EscalationResolvedPayload(request_id=request_id, resolution_type=resolution_type)
        event = BaseEvent(request_id=request_id, correlation_id=correlation_id, actor_id=actor_id, event_name=EventName.ESCALATION_RESOLVED, data=data)
        cls._dispatch(event)

    # --- SLA Producers ---

    @classmethod
    def publish_sla_warning(cls, request_id: int, correlation_id: str, actor_id: int, priority: str, time_left: str):
        data = SLAWarningPayload(request_id=request_id, priority=priority, time_left=time_left)
        event = BaseEvent(request_id=request_id, correlation_id=correlation_id, actor_id=actor_id, event_name=EventName.SLA_WARNING, data=data)
        cls._dispatch(event)

    @classmethod
    def publish_sla_breached(cls, request_id: int, correlation_id: str, actor_id: int, priority: str, delay: str):
        data = SLABreachedPayload(request_id=request_id, priority=priority, delay=delay)
        event = BaseEvent(request_id=request_id, correlation_id=correlation_id, actor_id=actor_id, event_name=EventName.SLA_BREACHED, data=data)
        cls._dispatch(event)
