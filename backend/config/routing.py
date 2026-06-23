from django.urls import path

from apps.websocket.consumers import SystemConsumer, RequestConsumer

websocket_urlpatterns = [
    path("ws/system/", SystemConsumer.as_asgi()),
    path("ws/requests/", RequestConsumer.as_asgi()),
]
