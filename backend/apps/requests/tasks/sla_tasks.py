from celery import shared_task
import logging
from typing import List

from apps.requests.services.sla_service import SLAService

logger = logging.getLogger(__name__)

@shared_task
def monitor_sla_breaches_task() -> None:
    """
    SLA Monitor: Periodically scans active requests for SLA target breaches.
    Ref: docs/implementation/request/request-background-jobs.md (4.1)
    """
    logger.info("Starting SLA Monitor job.")
    try:
        breached_ids = SLAService.check_breaches()
        if breached_ids:
            logger.info(f"SLA Monitor detected {len(breached_ids)} breaches: {breached_ids}")
    except Exception as e:
        logger.error(f"SLA Monitor job failed: {str(e)}")
        raise
