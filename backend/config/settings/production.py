from .base import *  # noqa: F403

DEBUG = False

if SECRET_KEY.startswith("unsafe-") or SECRET_KEY == "change-me-in-dev-only":
    raise ValueError("SECRET_KEY must be set to a strong value in production.")

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
