from django.urls import path

from . import views

urlpatterns = [
    path("", views.IndexView.as_view(), name="index"),
    path("choose/", views.ChooseView.as_view(), name="choose"),
    path("chat/room/", views.RoomView.as_view(), name="room"),
    path("chat/room/upload-image", views.FileUploadView.as_view(), name="upload_image"),
]
