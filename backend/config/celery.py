import os

from celery import Celery

os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE",
    os.getenv("DJANGO_SETTINGS_MODULE", "config.settings.production"),
)

app = Celery("entercom")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

# Propagate HTTP trace context into Celery workers (audit correlation).
import core.celery_trace  # noqa: E402, F401
