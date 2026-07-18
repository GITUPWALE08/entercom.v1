"""
SLAService: Monitors and enforces Service Level Agreement targets.
Ref: docs/architecture/request/request-services.md (Section 5.6)
"""
import logging
import uuid
from typing import List

from django.db import transaction
from django.utils import timezone

from apps.audit_logs.services.audit_service import log_action
from apps.requests.events.publishers import DomainEventPublisher
from apps.requests.models import LifecycleState, Request, SLAStatus
from apps.requests.services.escalation_service import EscalationService
from apps.notification.services import DispatchOrchestrator

logger = logging.getLogger(__name__)


class SLAService:
    """
    Service for monitoring SLA compliance and triggering priority bumps/escalations.
    """

    @staticmethod
    def check_breaches() -> List[str]:
        """
        Scans active requests to detect if current time exceeds sla_target_time.
        Ref: docs/implementation/request/request-service-design.md (4.7)
        """
        breached_requests = Request.objects.filter(
            sla_target_time__lt=timezone.now(),
            sla_status__in=[SLAStatus.COMPLIANT, SLAStatus.WARNING],
            status__in=[
                LifecycleState.SUBMITTED,
                LifecycleState.STAFF_REVIEW,
                LifecycleState.AWAITING_QUOTE,
                LifecycleState.AWAITING_CUSTOMER_APPROVAL,
                LifecycleState.AWAITING_PAYMENT,
                LifecycleState.AWAITING_ASSIGNMENT,
                LifecycleState.ASSIGNED,
                LifecycleState.IN_PROGRESS,
                LifecycleState.PENDING_VERIFICATION,
            ],
        )

        processed_ids = []
        for request in breached_requests:
            try:
                with transaction.atomic():
                    req = Request.objects.select_for_update().get(pk=request.id)

                    req.sla_status = SLAStatus.BREACHED
                    # Architecture rule: Escalation automatically increases priority
                    priority_map = {
                        "low": "normal",
                        "normal": "high",
                        "high": "urgent",
                        "urgent": "emergency",
                    }
                    req.priority = priority_map.get(req.priority, req.priority)
                    req.save()

                    EscalationService.process_escalation(
                        request_id=req.id, trigger_type="SLA_BREACH"
                    )

                    # CORRECTION: Fixed audit label from 'sla.breached' to 'sla_breach_detected'
                    log_action(
                        action="sla.breached",
                        actor=None,
                        resource_type="request",
                        resource_id=str(req.id),
                        reason=f"Target {req.sla_target_time} exceeded",
                    )

                    DomainEventPublisher.publish_sla_breached(
                        request_id=req.id,
                        correlation_id=str(uuid.uuid4()),
                        actor_id=0,
                        priority=req.priority,
                        delay="N/A",
                    )

                    # [DEFERRED] Non-MVP event
                    # transaction.on_commit(lambda r=req: DispatchOrchestrator.dispatch_event(
                    #     event_type="sla_breached",
                    #     recipient_id=r.customer_id,
                    #     resource_type="request",
                    #     resource_id=str(r.id),
                    #     category="alerts",
                    #     title="SLA Breached",
                    #     message=f"Request {r.public_id} has breached SLA.",
                    #     context={"priority": r.priority},
                    #     is_system_critical=True,
                    # ))

                    processed_ids.append(str(req.id))
            except Exception as e:
                logger.error(f"Failed SLA breach for request {request.id}: {str(e)}")
                continue

        return processed_ids
