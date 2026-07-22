from django.urls import path, re_path

from apps.websocket.consumers import SystemConsumer, RequestConsumer
from apps.chat.consumers import ChatConsumer

websocket_urlpatterns = [
    path("ws/system/", SystemConsumer.as_asgi()),
    path("ws/requests/", RequestConsumer.as_asgi()),
    re_path(r'ws/chat/(?P<conversation_id>[\w-]+)/$', ChatConsumer.as_asgi()),
]
