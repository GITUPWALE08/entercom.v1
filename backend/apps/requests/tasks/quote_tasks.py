from celery import shared_task
import logging
from typing import List

from apps.requests.services.quote_service import QuoteService
# ... (rest of imports)

@shared_task
def expire_stale_quotes_task() -> None:
    """
    Quote Expiry Monitor: Daily sweep for quotes older than 30 days.
    Ref: docs/implementation/request/request-background-jobs.md (4.1)
    """
    logger.info("Starting Quote Expiry Monitor job.")
    try:
        expired_ids = QuoteService.expire_quotes()
        if expired_ids:
            logger.info(f"Quote Expiry Monitor processed {len(expired_ids)} expired quotes: {expired_ids}")
    except Exception as e:
        logger.error(f"Quote Expiry Monitor job failed: {str(e)}")
        raise
