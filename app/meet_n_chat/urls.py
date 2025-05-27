from django.urls import path

from . import views

urlpatterns = [
    path("", views.IndexView.as_view(), name="index"),
    path("choose/", views.ChooseView.as_view(), name="choose"),
    path("chat/", views.ChatView.as_view(), name="chat"),
    path("chat/upload-image/", views.FileUploadView.as_view(), name="upload_image"),
    path("voice-chat/", views.VoiceChatView.as_view(), name="voice-chat"),
    path("api/google-oauth2/login/redirect/", views.GoogleLoginRedirectApi.as_view(), name="google_oauth2_login_redirect"),
    path("api/google-oauth2/login/callback/", views.GoogleLoginApi.as_view(), name="google_oauth2_login_callback"),
]