from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    'inventory-low-stock-job': {
        'task': 'apps.orders.tasks.inventory_low_stock_job',
        'schedule': crontab(minute='0'),
    }
}
