from django.shortcuts import render, redirect
from django.http import HttpRequest, HttpResponse
from django.conf import settings
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework import status
from uuid import uuid4
from .forms import UploadFileForm
from rest_framework.views import APIView
from rest_framework.parsers import FileUploadParser, MultiPartParser


def index(request: HttpRequest):
    return render(request, "index/index.html")


@api_view(["GET", "POST"])
def choose(request: HttpRequest):
    username = request.POST["username"]
    if len(username) < 1:
        return Response({"message": "Enter your username!"}, status=status.HTTP_400_BAD_REQUEST)
    request.session["username"] = username
    request.session["user_id"] = uuid4().hex

    return render(request, "chat/choose.html")


def room(request: HttpRequest):
    username = request.session.get("username")
    if not username:
        return redirect('index')
    return render(request, "chat/room.html")


class FileUploadView(APIView):
    parser_classes = (MultiPartParser,)

    def post(self, request, format=None):
        if 'filename' not in request.FILES:
            return Response({"detail": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)
            
        up_file = request.FILES['filename']
        import os

        # Save the file
        file_path = os.path.join(settings.MEDIA_ROOT, up_file.name)
        with open(file_path, 'wb+') as destination:
            for chunk in up_file.chunks():
                destination.write(chunk)

        file_url = f"{settings.MEDIA_URL}{up_file.name}"
        return Response({"file": file_url}, status=status.HTTP_201_CREATED)