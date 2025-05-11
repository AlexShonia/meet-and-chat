from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("choose/", views.choose, name="choose"),
    path("chat/room/", views.room, name="room"),
    path("chat/room/upload-image", views.FileUploadView.as_view(), name="upload_image"),
]
