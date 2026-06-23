from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    'payment-expiry-job': {
        'task': 'apps.payments.tasks.expire_payments_job',
        'schedule': crontab(minute='*/15'),
    }
}
