from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/video_chat/$', consumers.VideoChatConsumer.as_asgi()),
]