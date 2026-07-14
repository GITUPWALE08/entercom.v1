from .base import *  # noqa: F403

DEBUG = False
SECRET_KEY = "test-secret-key-not-for-production"
ALLOWED_HOSTS: list[str] = ["*"]
PAYSTACK_SECRET_KEY = "sk_test_fake_secret"

# DATABASES uses the PostgreSQL configuration from base.py
# Django's test runner will automatically create a 'test_entercom' database.

CHANNEL_LAYERS = {
    "default": {"BACKEND": "channels.layers.InMemoryChannelLayer"},
}

CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]
