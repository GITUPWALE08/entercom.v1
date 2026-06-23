from celery import shared_task
import logging
from typing import List

from apps.requests.services.assignment_service import AssignmentService
# ... (rest of imports)

@shared_task
def monitor_assignment_timeouts_task() -> None:
    """
    Assignment Timeout Monitor: Hourly sweep for unaccepted assignments > 48h.
    Ref: docs/implementation/request/request-background-jobs.md (4.1)
    """
    logger.info("Starting Assignment Timeout Monitor job.")
    try:
        timeout_ids = AssignmentService.handle_timeout()
        if timeout_ids:
            logger.info(f"Assignment Timeout Monitor processed {len(timeout_ids)} timeouts: {timeout_ids}")
    except Exception as e:
        logger.error(f"Assignment Timeout Monitor job failed: {str(e)}")
        raise
