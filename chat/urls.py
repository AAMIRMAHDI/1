from django.urls import path
from . import views

urlpatterns = [
    path('', views.login_view, name='login'),
    path('video-chat/', views.video_chat_view, name='video_chat'),
]